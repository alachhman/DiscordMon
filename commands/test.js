const Discord = require('discord.js');

module.exports = {
    name: 'test',
    display: 'test',
    description: 'test`',
    async execute(message, args, client, db) {
        await db.collection('guilds').doc(message.guild.id).get().then(async snap=>{
            console.dir(snap._fieldsProto.hasSpawn.booleanValue.valueOf());
            await message.channel.send("check your console.")
        })
    }
};
