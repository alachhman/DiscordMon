const Discord = require('discord.js');

module.exports = {
    name: 'start',
    display: '>start',
    description: 'Sets you as a trainer',
    /**
     *  Function that takes the message parameter's author, and uses it's id property to check the firestore database to
     *  see if they have an existing document if they are it send a message to the channel they sent the message containing
     *  "User is already a trainer." and if not it says the user as a trainer and writes their discord ID, discord user name,
     *  and sets their latest value to 0 to the firestore database. Then it send a message to the channel the user used the
     *  command in that contains "Welcome to namepending"
     * @param message
     * @param args
     * @param client
     * @param db
     * @returns {Promise<void>}
     */
    async execute(message, args, client, db) {
        const userFile = db.collection('users').doc(message.author.id);
        userFile.get().then(async (docData) => {
                if (docData.exists) {
                    message.channel.send("<@" + message.author + ">" + " is already a trainer");
                } else {
                    await db.collection('users').doc(message.author.id).set({
                        'userId': message.author.id,
                        'userName': message.author.username,
                        'latest': "0"
                    });
                    message.channel.send("Welcome To DiscordMon");
                }
            }
        )
    }
};
