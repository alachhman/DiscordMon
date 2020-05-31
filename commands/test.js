const Discord = require('discord.js');

module.exports = {
    name: 'test',
    display: 'test',
    description: 'test`',
    async execute(message, args, client) {
        message.channel.send("```jason test```")
    }
};
