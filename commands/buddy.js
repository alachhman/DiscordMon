const Discord = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'buddy',
    display: '>buddy',
    description: 'Show your team, or edit it.',
    async execute(message, args, client, db) {
        if(isNaN(args[0])) return message.channel.send("To set a buddy, use `>buddy` followed by the id of the pokemon you want to set!");
        const snapshot = await db.collection('users').doc(message.author.id).get().then((doc) => {
            return {id: doc.id, ...doc.data()}
        });
        if(args[0] > snapshot.latest) return message.channel.send("Enter the ID of a pokemon you actually have");
        snapshot.buddy = args[0];
        db.collection('users').doc(message.author.id).set(snapshot);
        const embed = new Discord.MessageEmbed()
            .setTitle("Buddy Updated To ID:[" + args[0] + "]")
            .addField("How do I see my buddy?", `>view buddy`)
            .setThumbnail(message.author.avatarURL())
            .setColor("#46ff19");
        message.channel.send({embed})
    }
};

