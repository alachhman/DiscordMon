const Discord = require('discord.js');
const {getEmoji, generateSpaces, generateIVSummary, paginationEmbed} = require("../Helpers/Helpers");

module.exports = {
    name: 'enable',
    display: '>enable',
    description: 'Enables pokemon spawning',
    async execute(message, args, client, db) {
        if (message.author.id === message.guild.owner.id) {
            let snapshot = await db.collection('guilds').doc(message.guild.id).get().then((doc) => {
                return {id: doc.id, ...doc.data()}
            });
            snapshot.designatedChannel = message.channel.id;
            db.collection('guilds').doc(message.guild.id).set(snapshot);
            message.channel.send("Play Channel Updated!");
        }
        else message.channel.send("Command Limited to Discord Owner")
    }
};

