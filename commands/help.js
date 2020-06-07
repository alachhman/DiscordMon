const Discord = require('discord.js');

module.exports = {
    name: 'help',
    display: '>help',
    description: 'Messages user the commands of the bot',
    /**
     *  Function that send the user that used the command a private message embed of every command and what it does to their inbox.
     *  It does this by accessing every commands through client.commands, and for each command it adds an embed field containing
     *  the display or "name" of function and description.
     * @param message
     * @param args
     * @param client
     * @param db
     * @returns {Promise<void>}
     */
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
