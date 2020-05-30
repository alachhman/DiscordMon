const Discord = require('discord.js');

module.exports = {
    name: 'test',
    display: 'test',
    description: 'test`',
    async execute(message, args, client) {
        await message.channel.send("Command Given: `" + message.content + "`")
    }
};
