const fs = require('fs');
const Discord = require('discord.js');
const {prodToken, stagingToken, environment} = require('./auth.json');
const client = new Discord.Client();
const dotenv = require('dotenv/config');
const Pokedex = require('pokedex-promise-v2');
const P = new Pokedex();

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
    await db.collection('guilds').doc(gData.id).set({
        'guildID': gData.id,
        'guildName': gData.name,
        'guildOwner': gData.owner.user.username,
        'guildOwner': gData.owner.id,
        'guildMemberCount': gData.memberCount,
        'hasSpawn': false,
        'prefix': '>'
    });
});


client.login(environment === "production" ? prodToken : stagingToken);

spawnPokemon = async (message) => {
    let pkmn = Math.round(Math.random() * 1000) - 36;
    if (pkmn < 1) {
        pkmn = Math.abs(pkmn);
    }
    console.log(pkmn);
    let data;
    await P.getPokemonByName(pkmn, function (response, error) { // with callback
        if (!error) {
            //console.dir(response, {depth: 10});
            data = response;
        } else {
            console.log(error);
        }
    });
    console.log(data.forms[0].name);
    const embed = new Discord.MessageEmbed()
        .setTitle('A wild ' + data.forms[0].name + ' has appeared!')
        .setColor("#3a50ff")
        .setImage(data.sprites.front_default);
    await message.channel.send({embed});

    db.collection('guilds').doc(message.guild.id).set({
        'guildID': message.guild.id,
        'guildName': message.guild.name,
        'guildOwner': message.guild.owner.user.username,
        'guildOwner': message.guild.owner.id,
        'guildMemberCount': message.guild.memberCount,
        'hasSpawn': true,
        'prefix': '>'
    });

    const filter = m => m.content.toUpperCase() === data.forms[0].name.toUpperCase();
    const collector = message.channel.createMessageCollector(filter, {time: 15000});

    collector.on('collect', m => {
        console.log(`Collected ${m.content}`);
        collector.stop();
    });

    collector.on('end', async collected => {
        if(collected.size > 0){
            let size = 0;
            db.collection('users')
                .doc(collected.first().author.id)
                .collection('pokemon')
                .get().then(async snap => {
                size = snap.size + 1;
                const sizeS = size.toString();
                await db.collection('users').doc(collected.first().author.id).collection('pokemon').doc(sizeS).set({
                    'pokeID': size,
                    'pokeName': data.forms[0].name,
                    'pokeNickname': data.forms[0].name,
                    'pokeApiEntry': data.forms[0].url
                });
                message.channel.send(collected.first().author.username + " has caught the pokemon!");
            });
        }
        db.collection('guilds').doc(message.guild.id).set({
            'guildID': message.guild.id,
            'guildName': message.guild.name,
            'guildOwner': message.guild.owner.user.username,
            'guildOwner': message.guild.owner.id,
            'guildMemberCount': message.guild.memberCount,
            'hasSpawn': false,
            'prefix': '>'
        });
        message.channel.send("*DEBUG:* message collector end");
    })
};


/**
 * work in progress function **IGNORE**
 * @returns {Promise<void>}
 */
updateGuild = async () => {
    let options = {
        'guildID': message.guild.id,
        'guildName': message.guild.name,
        'guildOwner': message.guild.owner.user.username,
        'guildOwner': message.guild.owner.id,
        'guildMemberCount': message.guild.memberCount,
        'hasSpawn': false,
        'prefix': '>'
    };
    db.collection('guilds').doc(message.guild.id).set(options);
};
