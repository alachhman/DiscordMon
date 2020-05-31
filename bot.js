

const fs = require('fs');
const Discord = require('discord.js');
const {prodToken, stagingToken, environment} = require('./auth.json');
const client = new Discord.Client();
require('dotenv/config');
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
})

let db = admin.firestore();

client.on('message', async (message) => {
    db.collection('guilds').doc(message.guild.id).get().then((q) => {
    if(q.exists){
        prefix = q.data().prefix;
    }
}).then(() => {

        if (message.content === 'thanks bud' && message.author.id === antnee) {
            message.reply("no problem fam");
            return;
        }
        if (message.author.bot) return;
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
    })

});




client.on('guildCreate', async gData => {
    await db.collection('guilds').doc(gData.id).set({
        'guildID': gData.id,
        'guildName': gData.name,
        'guildOwner': gData.owner.user.username,
        'guildOwner': gData.owner.id,
        'guildMemberCount': gData.memberCount,
        'prefix': '!'
    });
});

client.login(token);
