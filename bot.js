const fs = require('fs');
const Discord = require('discord.js');
const {prodToken, stagingToken, environment, prefix} = require('./auth.json');
const client = new Discord.Client();
const dotenv = require('dotenv/config');
const Pokedex = require('pokedex-promise-v2');
const P = new Pokedex();
const {getEmoji} = require("./Helpers/Helpers");

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
//import settings

const token = process.env.TOKEN;
const owner = process.env.OWNER;

//firebase
const firebase = require('firebase/app');
const FieldValue = require('firebase-admin').firestore.FieldValue;
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');
const {generateIVSummary} = require("./Helpers/Helpers");
const {generateSpaces} = require("./Helpers/Helpers");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

client.once('ready', async () => {
    console.log(`Bot is running on ${client.guilds.cache.size} servers`);
    await client.user.setActivity('[>help]');
    if (environment === "production") {
        await db.collection('guilds').get().then(x => {
            x.forEach(y => {
                updateGuild(x, "hasSpawn", false)
            })
        })
    }
});

client.on('message', async (message) => {
    if (message.channel instanceof Discord.DMChannel) return;
    if (message.content.includes('thanks bud')) {
        message.reply("no problem fam");
        return;
    }
    if (message.author.bot) {
        return;
    }
    if (Math.random() < 0.15) {
        let channel = await db.collection('guilds').doc(message.guild.id).get().then(x => x.data());
        if (!channel.hasSpawn) {
            let designatedChannel = channel.designatedChannel;
            console.log(designatedChannel);
            if (designatedChannel === "0") {
                message.channel.send("Use `>enable` to designate a channel for the bot to play.")
            } else {
                await spawnPokemon(message, designatedChannel);
            }
        }
    }
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    if (!client.commands.has(command)) return;
    try {
        client.commands.get(command).execute(message, args, client, db);
    } catch (error) {
        console.error(error);
        message.reply('Cannot run command!');
    }
});

client.on('guildCreate', async gData => {
    await generateGuild(gData);
});

client.login(environment === "production" ? prodToken : stagingToken);

/**
 * A function that will generate a random pokemon, display the pokemon in a designated channel, then run a message
 * collector which waits for a user to say the pokemon's name. Once the pokemon is caught, it's added to the user's
 * fire store pokemon collection, and another pokemon is able to be spawned in this server.
 * @param message               Discord message object for the message that spawned a pokemon.
 * @param designatedChannel     The channel that the >enable command has been used in.
 * @returns                     {Promise<void>}
 */
spawnPokemon = async (message, designatedChannel) => {
    /**
     * Creates a reference to the guild's firebase Doc
     */
    let guild = await db.collection('guilds').doc(message.guild.id).get().then((doc) => {
        return {id: doc.id, ...doc.data()}
    });

    /**
     * Update guild collection: hasSpawn = true
     */
    guild = await updateGuild(guild, "hasSpawn", true);

    try {
        /**
         * Take's the designatedChannel parameter and finds the discord Object reference for it.
         */
        let channelRef = message.guild.channels.cache.find(x => x.id === designatedChannel);

        /**
         * Generating a random number to be used in the pokeApi GET request
         * @type {number}
         */
        let pkmn = Math.round(Math.random() * 1000) - 36;
        if (pkmn < 1) {
            pkmn = Math.abs(pkmn);
        }

        /**
         * The pokeApi GET request which takes in the random number generated above.
         */
        let data;
        await P.getPokemonByName(pkmn, function (response, error) {
            if (!error) {
                data = response;
            } else {
                console.log(error);
            }
        });

        /**
         * The data returned by the pokeApi GET request is then passed through the generatePKMN() function which will
         * trim and mutate the data to be consumable by firestore. After this is done, the resulting data is used to
         * create the first embed sent to the designated channel whose discord channel object reference was found
         * earlier. This is the first user facing step of this function.
         */
        let generatedPKMNData = await generatePKMN(data);
        const embed = new Discord.MessageEmbed()
            .addField("Encounter!", 'A wild ' + await getEmoji(data.forms[0].name, client) + ' has appeared!')
            .setColor("#3a50ff")
            .setImage(generatedPKMNData.sprite);
        channelRef.send({embed});

        /**
         * A message collector is created in the active channel, and is assigned a filter that only allows the collector
         * to take in messages that are equal to the spawned pokemon name and are from non-bot accounts.
         */
        const filter = m => (m.content.toUpperCase() === data.forms[0].name.toUpperCase() && !m.author.bot);
        const collector = channelRef.createMessageCollector(filter, {time: 600000});

        /**
         * As soon as the message collector above is created, a timeout function is set which will trigger after 5
         * minutes have passed. When this timeout is triggered, it will send a new discord embed that reminds the
         * channel that there is an existing spawn by displaying the same information as the first embed, with some
         * added explanation as to how to catch the pokemon.
         */
        let reminder = setTimeout(async (data, client) => {
            const embed = new Discord.MessageEmbed()
                .addField("Reminder!", 'A wild ' + await getEmoji(data.forms[0].name, client) + ' is still waiting to be caught!')
                .setColor("#3a50ff")
                .setImage(generatedPKMNData.sprite)
                .setFooter("To catch a pokemon just type its name, for a hint mouse over the emote.");
            channelRef.send({embed});
        }, 300000, data, client);

        /**
         * Event hook for the message collector that will execute every time the collector's "collect" event is fired.
         * In this implementation, when the name of the pokemon is said even once, the collector's stop event is fired.
         */
        collector.on('collect', m => {
            console.log(m.author.username + " caught " + m.content);
            collector.stop();
        });

        /**
         * Event hook for the message collector that will execute every time the collector's "end" event is fired.
         * This hook will handle the brunt of the work done in this function including adding the pokemon data to the
         * collected user's pokemon collection in firestore, and making sure the channel and all it's data in fire store
         * are in default states so that another pokemon can potentially spawn.
         */
        collector.on('end', async collected => {
            let user = await db
                .collection('users')
                .doc(collected.first().author.id)
                .get().then(x => {
                    return {id: x.id, ...x.data()}
                });

            /**
             * Because the end event has been fired, there is no longer a need for the reminder timeout, so it ends.
             */
            clearInterval(reminder);

            /**
             * This if statement serves as a way to tell whether or not someone has actually caught the pokemon. If
             * collected.size > 0, then that means the pokemon has been caught, otherwise, the pokemon has not.
             */
            if (collected.size > 0) {

                /**
                 * The following code takes the firestore document of the person who caught the pokemon, and then stores
                 * the size of their pokemon collection. This is used later to generate the pokemon's id and user's
                 * latest pokemon firestore variable.
                 */
                let size = 0;
                await db.collection('users')
                    .doc(collected.first().author.id)
                    .collection('pokemon')
                    .get().then(async snap => {
                        size = snap.size + 1;
                    });

                /**
                 * The pokemon's data is added to the pokemon collection of the user.
                 */
                await db.collection('users').doc(collected.first().author.id).collection('pokemon').doc(size.toString()).set({
                    'pokeID': size,
                    'pokeName': data.forms[0].name,
                    'pokeNickname': data.forms[0].name,
                    'pokeApiEntry': data.forms[0].url,
                    'level': generatedPKMNData.level,
                    'nature': generatedPKMNData.nature,
                    'ivs': generatedPKMNData.ivs,
                    'stats': generatedPKMNData.stats,
                    'type': generatedPKMNData.types,
                    'sprite': generatedPKMNData.sprite,
                    'shiny': generatedPKMNData.shiny
                });

                /**
                 * An embed is sent to the designated channel to notify the users who caught the pokemon.
                 */
                const embed = new Discord.MessageEmbed()
                    .setTitle(collected.first().author.username + ' has caught the ' + data.forms[0].name + '!')
                    .setColor("#38b938")
                    .setThumbnail(collected.first().author.avatarURL())
                    .setImage(generatedPKMNData.sprite);
                let out = "```" + generateSpaces("LV." + generatedPKMNData.level, 6) + "| IV:" + generateSpaces(generateIVSummary(generatedPKMNData.ivs), 5) + "| " + generatedPKMNData.nature[0] + "```";
                embed.addField("Info:", out);
                channelRef.send({embed});

                /**
                 * Handle Coins
                 */

                const snapshot = await db.collection('users').doc(collected.first().author.id).get().then((doc) => {
                    return {id: doc.id, ...doc.data()}
                })

                let dollarSnap;

                if(isNaN(snapshot.pDollar)){
                    dollarSnap = parseInt(generatedPKMNData.level * 2)
                }
                else dollarSnap = parseInt(snapshot.pDollar + (generatedPKMNData.level * 2))


                /**
                 * The firestore document of the user who caught the pokemon is updated to increment the latest variable
                 */
                await db.collection('users').doc(collected.first().author.id).set({
                    'userId': collected.first().author.id,
                    'userName': collected.first().author.username,
                    'latest': size,
                    'pDollar' : dollarSnap
                }, {merge: true});

                /**
                 * Handling level up
                 */
                if(user.hasOwnProperty("buddy")){
                    if(user.buddy !== "0"){
                        let buddyData = await db
                            .collection('users')
                            .doc(collected.first().author.id)
                            .collection('pokemon')
                            .doc(user.buddy)
                            .get().then(x => x.data());
                        if(buddyData.level < 100){
                            let num = await randomNum(buddyData.level + (generatedPKMNData.level - buddyData.level));
                            const isLevelUp = (num + buddyData.level) > buddyData.level * 1.5;
                            // console.log("isLevelUp: " + isLevelUp + " : " + (num + buddyData.level) + " vs " + (buddyData.level * 1.5));
                            if(isLevelUp){
                                await levelUp(collected.first().author, buddyData, channelRef);
                            }
                        }
                    }
                }
            } else {

                /**
                 * If no one catches the pokemon, an embed is sent to notify that the pokemon is no longer available.
                 */
                const embed = new Discord.MessageEmbed()
                    .setTitle('The wild ' + data.forms[0].name + ' got away...')
                    .setColor("#dd2222")
                    .setImage(generatedPKMNData.sprite);
                channelRef.send({embed});
            }

            /**
             * Regardless of whether or not someone catches the pokemon, the guild's firestore document is updated
             * to hasSpawn = false, so that another pokemon is able to spawn.
             */
            guild = await updateGuild(guild, "hasSpawn", false);
        });

        /**
         * At the very end of this function is another call to set hasSpawn = false inside of an error catch. The reason
         * for this is because if an error occurs inside the try brackets, the guild's hasSpawn would otherwise be stuck
         * on true, meaning no pokemon would spawn.
         */
    } catch (e) {
        guild = await updateGuild(guild, "hasSpawn", false);
        console.error(e);
    }
};

levelUp = async (user, buddyData, channelRef) => {
    let buddy = buddyData;
    buddy.level = buddy.level += 1;
    let temp = buddy.stats;
    let data;
    await P.getPokemonByName(buddy.pokeName, function (response, error) {
        if (!error) {
            data = response;
        } else {
            console.log(error);
        }
    });
    buddy.stats = {
        hp: await generateStat(data.stats, "hp", buddy.ivs, buddy.level, buddy.nature),
        atk: await generateStat(data.stats, "attack", buddy.ivs, buddy.level, buddy.nature),
        def: await generateStat(data.stats, "defense", buddy.ivs, buddy.level, buddy.nature),
        spatk: await generateStat(data.stats, "special-attack", buddy.ivs, buddy.level, buddy.nature),
        spdef: await generateStat(data.stats, "special-defense", buddy.ivs, buddy.level, buddy.nature),
        speed: await generateStat(data.stats, "speed", buddy.ivs, buddy.level, buddy.nature)
    };
    await db.collection('users')
        .doc(user.id)
        .collection('pokemon')
        .doc(buddy.pokeID.toString())
        .set(buddy);
    const embed = new Discord.MessageEmbed()
        .setTitle(user.username + "'s " + buddy.pokeName + " has leveled up!")
        .addField('Level Up!', "LV " + (buddy.level - 1) + " → " + buddy.level)
        .addField('HP', temp.hp + " → " + buddy.stats.hp, true)
        .addField('ATK', temp.atk + " → " + buddy.stats.atk, true)
        .addField('DEF', temp.def + " → " + buddy.stats.def, true)
        .addField('SPATK', temp.spatk + " → " + buddy.stats.spatk, true)
        .addField('SPDEF', temp.spdef + " → " + buddy.stats.spdef, true)
        .addField('SPEED', temp.speed + " → " + buddy.stats.speed, true)
        .setThumbnail(buddy.sprite)
        .setColor("#38b938");
    channelRef.send({embed})
};

/**
 * Function that takes in a discord guild object and writes it's data to the firestore database.
 * @param guild                 Discord guild object.
 * @returns {Promise<void>}
 */
generateGuild = async (guild) => {
    let options = {
        'guildID': guild.id,
        'guildName': guild.name,
        'guildOwnerUserName': guild.owner.user.username,
        'guildOwner': guild.owner.id,
        'guildMemberCount': guild.memberCount,
        'hasSpawn': false,
        'prefix': '>',
        'designatedChannel': 0
    };
    db.collection('guilds').doc(guild.id).set(options);
};

/**
 * Function that takes in a discord guild document from the firestore database. The keys of the firestore data is then
 * looped through until a key whose name is equal to the input parameter keyToChange is found. The value of the key is
 * then changed to the value of the input variable newValue, and the guild's entry in firestore is updated to be the new
 * version of the document, after the key value is swapped. This function is used throughout this file in order to set
 * the hasSpawn boolean, however can be used to change any of the values from the firestore document.
 * @param guild                 The discord guild snapshot from firestore.
 * @param keyToChange           The object key that is to be changed.
 * @param newValue              The value that will replace the existing value in the keyToChange.
 * @returns {Promise<void>}     Resolves to void.
 */
updateGuild = async (guild, keyToChange, newValue) => {
    for (let key in guild) {
        if (!guild.hasOwnProperty(key)) return guild;
        if (key === keyToChange) {
            guild[key] = newValue;
        }
    }
    db.collection('guilds').doc(guild.id).set(guild);
    return guild;
};

/**
 * Generates a new pokemon object that is consumable by firestore. This object consists of:
 * - Level: random number from 1-60.
 * - nature: array of strings pulled by entering a random number into the natures map.
 * - shiny: boolean determining shiny status. Current odds are 1/80.
 * - ivs: object of numbers where value can be 1-31.
 * - stats: object of numbers generated in the generateStat() function by passing through base stats, iv, nature, level.
 * - type: the type of the pokemon from the pokeApi data.
 * - sprite: the sprite of the pokemon from the pokeApi data.
 * @param pkmn      Pokemon data from pokeapi GET request.
 * @returns         pokemon Object consumable by firestore.
 */
generatePKMN = async (pkmn) => {
    let level = await randomNum(60);
    let nature = natures[await randomNum(natures.length) - 1];
    let shiny = (await randomNum(400) > 395);
    let ivs = {
        "hp": await randomNum(31),
        "attack": await randomNum(31),
        "defense": await randomNum(31),
        "special-attack": await randomNum(31),
        "special-defense": await randomNum(31),
        "speed": await randomNum(31),
    };
    let stats = {
        hp: await generateStat(pkmn.stats, "hp", ivs, level, nature),
        atk: await generateStat(pkmn.stats, "attack", ivs, level, nature),
        def: await generateStat(pkmn.stats, "defense", ivs, level, nature),
        spatk: await generateStat(pkmn.stats, "special-attack", ivs, level, nature),
        spdef: await generateStat(pkmn.stats, "special-defense", ivs, level, nature),
        speed: await generateStat(pkmn.stats, "speed", ivs, level, nature)
    };
    let types = pkmn.types.map(x => x.type.name);
    return {
        level: level,
        nature: nature,
        ivs: ivs,
        stats: stats,
        types: types,
        sprite: (shiny) ? pkmn.sprites.front_shiny : pkmn.sprites.front_default,
        shiny: shiny
    };
};

/**
 * Function used to generate stats that are accurate to the actual pokemon games. By taking in a base stats, the iv, the
 * level, and nature of a pokemon, those values can be passed into a formula that outputs a game-accurate stat.
 * @param stats                     An array of stats passed from generatePKMN().
 * @param statToGen                 The specific stat that will be output from this function.
 * @param ivs                       The iv object of the pokemon to be generated.
 * @param level                     The level of the pokemon to be generated.
 * @param nature                    The nature of the pokemon to be generated.
 * @returns {Promise<number>}       Resolves to a number accurate to the pokemon's stat.
 */
generateStat = async (stats, statToGen, ivs, level, nature) => {
    let bs = 0;

    let natureFactor = 1;
    if (nature[1] === statToGen) {
        natureFactor = 1.1;
    } else if (nature[2] === statToGen) {
        natureFactor = 0.9;
    }

    for (let stat of stats) {
        if (stat.stat.name !== statToGen) continue;
        bs = stat.base_stat;
    }
    if (statToGen === "hp") {
        return Math.floor((2 * bs + ivs[statToGen] + 0) * level / 100 + level + 10);
    } else {
        return Math.floor(Math.floor((2 * bs + ivs[statToGen] + 0) * level / 100 + 5) * natureFactor)
    }
};

/**
 * Generates a random number whose floor is 0 and ceiling is designated by the max parameter.
 * @param max                       The ceiling for the rng roll.
 * @returns {Promise<number>}       A number from 0-max.
 */
randomNum = async (max) => {
    return Math.floor(Math.random() * Math.floor(max)) + 1;
};

/**
 * A 2d array containing the name of every pokemon nature along with it's boon ([1]) and bane ([2]).
 * @type {string[][]}
 */
const natures = [
    ['Hardy', 'None', 'None'],
    ['Lonely', 'attack', 'defense'],
    ['Brave', 'attack', 'speed'],
    ['Adamant', 'attack', 'special-attack'],
    ['Naughty', 'attack', 'special-defense'],
    ['Docile', 'None', 'None'],
    ['Bold', 'defense', 'attack'],
    ['Relaxed', 'defense', 'speed'],
    ['Impish', 'defense', 'special-attack'],
    ['Lax', 'defense', 'special-defense'],
    ['Serious', 'None', 'None'],
    ['Timid', 'speed', 'attack'],
    ['Hasty', 'speed', 'defense'],
    ['Jolly', 'speed', 'special-attack'],
    ['Naive', 'speed', 'special-defense'],
    ['Bashful', 'None', 'None'],
    ['Modest', 'special-attack', 'attack'],
    ['Mild', 'special-attack', 'defense'],
    ['Quiet', 'special-attack', 'speed'],
    ['Rash', 'special-attack', 'special-defense'],
    ['Quirky', 'None', 'None'],
    ['Calm', 'special-defense', 'attack'],
    ['Gentle', 'special-defense', 'defense'],
    ['Sassy', 'special-defense', 'speed'],
    ['Careful', 'special-defense', 'special-attack']
];
