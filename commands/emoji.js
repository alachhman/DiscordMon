const Discord = require('discord.js');
const fs = require('fs');
const { Image } = require('image-js');

module.exports = {
    name: 'emoji',
    display: 'emoji',
    description: 'for dev use only',
    async execute(message, args, client, db) {
        for(let emoji of message.guild.emojis.cache.array()){
            console.log("\'" + emoji.name + "\' : \'" + emoji.id + "\',")
        }
    }
};

