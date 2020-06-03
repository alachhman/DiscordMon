const Discord = require('discord.js');

module.exports = {
    name: 'start',
    display: 'start',
    description: 'sets person that typed command as a user`',
    async execute(message, args, client, db) {
        const userFile = db.collection('users').doc(message.author.id);
        userFile.get().then(async (docData) => {
                if (docData.exists) {
                    message.channel.send("<@" + message.author + ">" + " is already a trainer");
                } else {
                    await db.collection('users').doc(message.author.id).set({
                        'userId': message.author.id,
                        'userName': message.author.username
                    });
                    message.channel.send("Welcome To DiscordMon");
                }
            }
        )
    }
};
