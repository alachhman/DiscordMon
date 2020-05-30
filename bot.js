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

client.once('ready', async () => {
    console.log(`Bot is running on ${client.guilds.cache.size} servers`);
    await client.user.setActivity('ligma');
});

client.on('message', async (message) => {
    if (message.content.includes('thanks bud')) {
        message.reply("no problem fam");
        return;
    }
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
