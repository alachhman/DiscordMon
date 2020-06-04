const Discord = require('discord.js');
const {getEmoji} = require("../Helpers/Helpers");

module.exports = {
    name: 'list',
    display: 'list',
    description: 'shows list of all pokemon',
    async execute(message, args, client, db) {
        const snapshot = await db.collection('users').doc(message.author.id).collection('pokemon').get().then((querySnapshot) => {
            return querySnapshot.docs.map((doc) => {
                return {id: doc.id, ...doc.data()}
            });
        });
        // let pokeArray = [];
        // snapshot.forEach(x =>
        //     getEmoji(x.pokeName, client) +
        //     generateSpaces("LV." + x.level, 6) + "|"
        // );
        let embedStart = new Discord.MessageEmbed()
            .setTitle(message.author.username + "'s Pokemon")
            .setThumbnail(message.author.avatarURL())
            .setColor("#3a50ff");
        snapshot.forEach(x => embedStart.addField(
            getEmoji(x.pokeName, client) + " ***" + x.pokeName + "***",
            "```" + generateSpaces("LV." + x.level, 6) + "| " + x.nature[0] + "```"));
        message.channel.send(embedStart);
        console.log(snapshot)
    }
};

generateSpaces = (string, maxChar) => {
    let out = "" + string;
    if (string.length < maxChar) {
        for(let x = 0; x < (maxChar - string.length); x++){
            out += " ";
        }
    }
    return out;
};
