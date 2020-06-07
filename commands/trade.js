const Discord = require('discord.js');


module.exports = {
    name: 'trade',
    display: '>trade "@user"',
    description: 'Trades pokemon with the person you @',
    async execute(message, args, client, db) {
        let pokeOne = 0;
        let pokeTwo = 0;
        if (isNaN(args[0])) {
            message.channel.send("Enter the ID of a pokemon, the person you want to trade with, and try again.");
        } else if (message.mentions.users.first().id === message.author.id) {
            message.channel.send("You cannot trade with yourself.")
        } else if (message.mentions.users.first()) {

            const filter = (reaction, user) => {
                return ['✅', '❎'].includes(reaction.emoji.name) && user.id === message.mentions.users.first().id;
            };
            const vFilter = (reaction, user) => {
                return ['✅', '❎'].includes(reaction.emoji.name) && (user.id === message.mentions.users.first().id || user.id === message.author.id);
            };
            const mFilter = m => (isNaN(m[0]) && m.author.id === message.mentions.users.first().id);


            const snapshot = await db
                .collection('users')
                .doc(message.author.id)
                .collection('pokemon')
                .doc(args[0])
                .get()
                .then((querySnapshot) => {
                    return {id: querySnapshot.id, ...querySnapshot.data()}
                });

            message.channel.send("<@" + message.mentions.users.first().id + ">" + " Would you like to trade for this").then(async (x) => {
                sendEmbed(snapshot, message);
                await x.react('✅');
                await x.react('❎');
                x.awaitReactions(filter, {max: 1, time: 10000, errors: ['time']})
                    .then(collected => {
                        const reaction = collected.first();

                        if (reaction.emoji.name === '✅') {
                            message.reply("<@" + message.mentions.users.first().id + ">" + ' accepted the trade ' + "\n" + "<@" + message.mentions.users.first().id + ">" + " Choose a Pokemon").then((x) => {
                                message.channel.awaitMessages(mFilter, {max: 1, time: 30000, errors: ['time']})
                                    .then(async collected => {
                                        const tradeReply = collected.first().content.split(/ +/);
                                        if(isNaN(parseInt(tradeReply[0]))) return;
                                        pokeOne = args[0];
                                        pokeTwo = tradeReply[0];
                                        const snapshot = await db
                                            .collection('users')
                                            .doc(message.mentions.users.first().id)
                                            .collection('pokemon')
                                            .doc(tradeReply[0])
                                            .get()
                                            .then((querySnapshot) => {
                                                return {id: querySnapshot.id, ...querySnapshot.data()}
                                            });

                                        message.channel.send("<@" + message.mentions.users.first().id + ">" + "'s Trade Offer")
                                        sendEmbed(snapshot, collected.first());
                                        message.channel.send("Do you both accept the trade").then(async (z) => {
                                            await z.react('✅');
                                            await z.react('❎');
                                            z.awaitReactions(vFilter, {
                                                max: 2,
                                                maxEmojis: 2,
                                                time: 10000,
                                                errors: ['time']
                                            })
                                                .then(collected => {
                                                    let declined = true;
                                                    collected.forEach(t => {
                                                        if (t.emoji.name === '❎') {
                                                            declined = false
                                                        }
                                                    });
                                                    if (declined) {
                                                        message.channel.send("successful trade!")
                                                        swapPokemon(message.author.id, message.mentions.users.first().id, pokeOne, pokeTwo, db);
                                                    } else {
                                                        message.channel.send("<@" + message.mentions.users.first().id + ">" + ' Trade Cancelled');
                                                    }
                                                })
                                        })
                                        //    sendEmbed(snapshot, collected.first());
                                    })
                            })

                        } else if (reaction.emoji.name === '❎') {
                            message.channel.send("<@" + message.mentions.users.first().id + ">" + ' Trade Cancelled');
                        }
                    })
                    .catch(collected => {
                        x.reply('Trade Cancelled.');
                    });
            })
        } else message.channel.send("no mentions")
    }
};

/*
>trade 12 @An🗡nee

get pokemon id

>accept somehow and insert the pokemon you want to trade with

get verification, get pokemon id for pokemon number 2

>first person accepts

swap documents and ID values for the pokemon
*/

swapPokemon = async(userOne, userTwo, pokeOne, pokeTwo, db) => {
    let pokeOneData = await db
        .collection('users')
        .doc(userOne)
        .collection('pokemon')
        .doc(pokeOne)
        .get()
        .then((querySnapshot) => {
            return {id: querySnapshot.id, ...querySnapshot.data()}
        });
    let pokeTwoData = await db
        .collection('users')
        .doc(userTwo)
        .collection('pokemon')
        .doc(pokeTwo)
        .get()
        .then((querySnapshot) => {
            return {id: querySnapshot.id, ...querySnapshot.data()}
        });

    let temp = pokeOneData.pokeID;
    pokeOneData.pokeID = pokeTwoData.pokeID;
    pokeTwoData.pokeID = temp;

    let temper = pokeOneData.id;
    pokeOneData.id = pokeTwoData.id;
    pokeTwoData.id = temp;

    await db.collection('users').doc(userOne).collection('pokemon').doc(pokeTwoData.pokeID.toString()).set(pokeTwoData);
    await db.collection('users').doc(userTwo).collection('pokemon').doc(pokeOneData.pokeID.toString()).set(pokeOneData);
};
