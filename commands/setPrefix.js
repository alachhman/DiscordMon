const Discord = require('discord.js');

module.exports = {
    name: 'setprefix',
    display: '>setprefix',
    description: 'Change your server prefix',
    /**
     * Function that takes the users message and checks if the input is empty, if it is empty a message is sent to the channel saying "missing prefix".
     * If the users message is 1 character long it checks if the author of the message matches the owner of the server they are currently on, if not
     * it messages the channel saying "Command Limited to Discord Owner". If the user that sent the message is the server owner, it changes the
     * prefix from what it is in the firestore database to what the user messaged.
     * @param message
     * @param args
     * @param client
     * @param db
     * @returns {Promise<void>}
     */
    async execute(message, args, client, db) {
        if (args.length === 0){
            message.channel.send("Missing Prefix");
        }else if (args.length ===1) {
            if (message.author.id === message.guild.owner.id) {
                let nPrefix = args[0];

                db.collection('guilds').doc(message.guild.id).update({
                    'prefix': nPrefix
                }).then(() => {
                    message.channel.send(`[prefix updated] : new prefix ${nPrefix}`)
                });
            }
            else message.channel.send("Command Limited to Discord Owner")
        }
    }
};
