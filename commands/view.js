const Discord = require('discord.js');
const {getEmoji, generateSpaces, generateIVSummary, paginationEmbed, generateStatTable, getColor} = require("../Helpers/Helpers");

module.exports = {
    name: 'view',
    display: '>view',
    description: 'View a pokemon\'s info.',
    async execute(message, args, client, db) {
        if (args[0] === "latest") {
            const latest = await db
                .collection('users')
                .doc(message.author.id)
                .get()
                .then((querySnapshot) => {
                    return {id: querySnapshot.id, ...querySnapshot.data()}
                });
            if (latest.latest === 0) {
                await message.channel.reply("Try catching a pokemon first.");
                return;
            }
            const snapshot = await db
                .collection('users')
                .doc(message.author.id)
                .collection('pokemon')
                .doc(latest.latest.toString())
                .get()
                .then((querySnapshot) => {
                    return {id: querySnapshot.id, ...querySnapshot.data()}
                });
            sendEmbed(snapshot, message);
            return;
        }
        if (args[0].isNaN) {
            message.channel.send("Enter the ID of a pokemon and try again.");
        } else {
            const snapshot = await db
                .collection('users')
                .doc(message.author.id)
                .collection('pokemon')
                .doc(args[0])
                .get()
                .then((querySnapshot) => {
                    return {id: querySnapshot.id, ...querySnapshot.data()}
                });
            sendEmbed(snapshot, message);
        }
    }
};

sendEmbed = (snapshot, message) => {
    const typing = snapshot.type.map(x => getEmoji(x)).join("");
    const iv = generateIVSummary(snapshot.ivs);
    let bst = 0;
    for (let stat in snapshot.stats) {
        bst += snapshot.stats[stat];
    }
    const embed = new Discord.MessageEmbed()
        .setAuthor(message.author.username + "'s " + snapshot.pokeName, "https://www.serebii.net/pokedex-sm/icon/" + snapshot.pokeApiEntry.replace('https://pokeapi.co/api/v2/pokemon-form/', '').replace("/", '') + ".png")
        .setThumbnail(snapshot.sprite)
        .addField("Level", snapshot.level, true)
        .addField("Type", typing, true)
        .addField("Nature", snapshot.nature[0], true)
        .addField("Stats", generateStatTable(snapshot.stats, snapshot.ivs, snapshot.nature, iv, bst))
        .setColor(getColor(snapshot.type[0]));
    message.channel.send({embed});
    console.log(snapshot);
};

getDocSize = async (db, author) => {
    let size = 0;
    await db.collection('users')
        .doc(author.id)
        .collection('pokemon')
        .get().then(async snap => {
            size = snap.size + 1;
        });
    return size;
};
