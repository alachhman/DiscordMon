const Discord = require('discord.js');

module.exports = {
    name: 'setprefix',
    display: '>setprefix',
    description: 'Change your server prefix',
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
