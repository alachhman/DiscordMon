const Discord = require('discord.js');

module.exports = {
    name: 'list',
    display: 'list',
    description: 'shows list of all pokemon',
    async execute(message, args, client, db) {
        const snapshot = db.collection('users').doc(message.author.id).collection('pokemon').get().then((querySnapshot) => {
            const tempDoc = querySnapshot.docs.map((doc) => {
                return { id: doc.id, ...doc.data() }
            })
            let pokeArray = tempDoc.map(x=>x.pokeName);
            let pokeString = pokeArray.join("\n");
            message.channel.send("```"+pokeString+"```")
        })
    }
};
