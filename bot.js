const fs = require('fs');
const Discord = require('discord.js');
const {prefix, prodToken, stagingToken, environment} = require('./auth.json');
const client = new Discord.Client();

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.on('message', async (message) => {
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
        client.commands.get(command).execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('Cannot run command!');
    }
});

client.login(environment === "production" ? prodToken : stagingToken);
