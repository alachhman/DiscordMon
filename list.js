const Discord = require('discord.js');

module.exports = {
    name: 'list',
    display: 'list',
    description: 'shows list of all pokemon',
    async execute(message, args, client, db) {

        db.collection('users').doc(message.author.id).collection('pokemon')
            .orderBy("pokeName")
    }
}
