const Discord = require('discord.js');

module.exports = {
    name: 'start',
    display: 'start',
    description: 'sets person that typed command as a user`',
    async execute(message, args, client, db) {

        await db.collection('users').doc(message.author.id).set({
            'userID': message.author.id,
            'userName' : message.author.username,
        })
        message.channel.send("Welcome To DiscordMon");
    }
};
