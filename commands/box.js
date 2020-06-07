const Discord = require('discord.js');
const {getEmoji, generateSpaces, generateIVSummary, paginationEmbed} = require("../Helpers/Helpers");

module.exports = {
    name: 'box',
    display: '>box',
    description: 'shows list of all pokemon',
    async execute(message, args, client, db) {
        let snapshot = await db.collection('users').doc(message.author.id).collection('pokemon').get().then((querySnapshot) => {
            return querySnapshot.docs.map((doc) => {
                return {id: doc.id, ...doc.data()}
            });
        });

        let filtered;
        if (args[0] !== undefined) {
            if (args[0] === "shiny") {
                filtered = snapshot.filter(x => {
                    if (x.hasOwnProperty("shiny")) {
                        if (x.shiny) {
                            return x;
                        }
                    } else {
                        return false;
                    }
                })
            }else{
                filtered = snapshot.filter(x => x.pokeName.toLocaleUpperCase() === args[0].toLocaleUpperCase())
            }
        } else {
            filtered = snapshot;
        }

        let embeds = [];
        let i, j, tempArray, chunk = 6;
        for (i = 0, j = filtered.length; i < j; i += chunk) {
            tempArray = filtered.slice(i, i + chunk);
            let embed = new Discord.MessageEmbed()
                .setTitle(message.author.username + "'s Pokemon")
                .setThumbnail(message.author.avatarURL())
                .setColor("#049024");
            tempArray.forEach(x => {
                let out = "```" + generateSpaces("LV." + x.level, 6) + "| IV:" + generateSpaces(generateIVSummary(x.ivs), 5) + "| " + x.nature[0] + "```";
                let title = " **" + x.pokeName + " ID: [" + x.id + "]**";
                if(x.hasOwnProperty("shiny")){
                    if(x.shiny){
                        title += "✨";
                    }
                }
                embed.addField(
                    getEmoji(x.pokeName, client) + title, out)
                }
            );
            embeds.push(embed)
        }
        if(embeds.length > 0){
            await paginationEmbed(message, embeds);
        } else {
            let embed = new Discord.MessageEmbed()
                .setTitle("Sorry, nothing to display!")
                .addField("Why not?", `Try catching some pokemon!`)
                .setThumbnail(message.author.avatarURL())
                .setColor("#ff2620");
            message.channel.send({embed});
        }

        // console.log(snapshot)
    }
};
