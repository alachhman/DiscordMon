const Discord = require('discord.js');


module.exports = {
    name: 'help',
    display: '>help',
    description: 'Messages user the commands of the bot',
    async execute(message, args, client, db) {
        const embed = new Discord.MessageEmbed()
            .setColor("#049024")
            .setTitle("Command List")
            .setFooter(
                'NOTE\n' +
                '=====\n' +
                'This bot is currently a work in progress with only two developers: An🗡nee#0777 and speralta#0935, for any suggestions, criticism, or inquiries dm one of the two accounts mentioned above.')
        client.commands.forEach( x => {
           embed.addField(
               x.display, x.description, true
           )
            }
        )
        message.author.send(embed)
        }
};
