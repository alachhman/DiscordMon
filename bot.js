const fs = require('fs');
const Discord = require('discord.js');
const {prodToken, stagingToken, environment} = require('./auth.json');
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
let prefix;
const token = process.env.TOKEN;
const owner = process.env.OWNER;

//firebase
const firebase = require('firebase/app');
const FieldValue = require('firebase-admin').firestore.FieldValue;
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

client.once('ready', async () => {
    console.log(`Bot is running on ${client.guilds.cache.size} servers`);
    await client.user.setActivity('sugma');
});

client.on('message', async (message) => {
    db.collection('guilds').doc(message.guild.id).get().then(async (q) => {
        if (q.exists) {
            prefix = q.data().prefix;

            if (message.content.includes('thanks bud')) {
                message.reply("no problem fam");
                return;
            }

            if (message.author.bot) {
                return;
            }

            if (Math.random() < 0.1 && !await db.collection('guilds').doc(message.guild.id).get().then(x => x._fieldsProto.hasSpawn.booleanValue)) {
                await spawnPokemon(message);
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
        }
    });
});

client.on('guildCreate', async gData => {
    await updateGuild(gData, "guildID", gData.id);
});

client.login(environment === "production" ? prodToken : stagingToken);

spawnPokemon = async (message) => {
    await updateGuild(message.guild, "hasSpawn", true);

    let pkmn = Math.round(Math.random() * 1000) - 36;
    if (pkmn < 1) {
        pkmn = Math.abs(pkmn);
    }
    console.log(pkmn);
    let data;
    await P.getPokemonByName(pkmn, function (response, error) { // with callback
        if (!error) {
            data = response;
        } else {
            console.log(error);
        }
    });
    try {
        console.log(data.forms[0].name);
        const embed = new Discord.MessageEmbed()
            .addField("Encounter!",'A wild ' + await getEmoji(data.forms[0].name, client) + ' has appeared!')
            .setColor("#3a50ff")
            .setImage(data.sprites.front_default);
        await message.channel.send({embed});
    } catch (e) {
        await updateGuild(message.guild, "hasSpawn", false);
        console.error(e);
        return;
    }

    const filter = m => m.content.toUpperCase() === data.forms[0].name.toUpperCase();
    const collector = message.channel.createMessageCollector(filter, {time: 15000});

    collector.on('collect', m => {
        console.log(`Collected ${m.content}`);
        collector.stop();
    });

    collector.on('end', async collected => {
        if (collected.size > 0) {
            let size = 0;
            await db.collection('users')
                .doc(collected.first().author.id)
                .collection('pokemon')
                .get().then(async snap => {
                size = snap.size + 1;
            });
            let generatedPKMNData = await generatePKMN(data);
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
                'sprite': generatedPKMNData.sprite
            });
            const embed = new Discord.MessageEmbed()
                .setTitle(collected.first().author.username + ' has caught the ' + data.forms[0].name + '!')
                .setColor("#38b938")
                .setThumbnail(collected.first().author.avatarURL())
                .setImage(data.sprites.front_default);
            await message.channel.send({embed});
            await db.collection('users').doc(message.author.id).set({
                'userId': message.author.id,
                'userName': message.author.username,
                'latest': size
            });
        }
        await updateGuild(message.guild, "hasSpawn", false);
        message.channel.send("*DEBUG:* message collector end");
    });
};


/**
 * @returns {Promise<void>}
 */
updateGuild = async (guild, keyToChange, newValue) => {
    let options = {
        'guildID': guild.id,
        'guildName': guild.name,
        'guildOwnerUserName': guild.owner.user.username,
        'guildOwner': guild.owner.id,
        'guildMemberCount': guild.memberCount,
        'hasSpawn': false,
        'prefix': '>'
    };
    for (let key in options) {
        if (!options.hasOwnProperty(key)) return;
        if (key === keyToChange) {
            options[key] = newValue;
        }
    }
    db.collection('guilds').doc(guild.id).set(options);
};

generatePKMN = async (pkmn) => {
    let level = await randomNum(60);
    let nature = natures[await randomNum(natures.length)-1];
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
        sprite: pkmn.sprites.front_default
    };
};

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

randomNum = async (max) => {
    return Math.floor(Math.random() * Math.floor(max)) + 1;
};

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
