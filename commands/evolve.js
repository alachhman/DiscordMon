const Discord = require('discord.js');
const axios = require('axios');
const Pokedex = require('pokedex-promise-v2');
const P = new Pokedex();
const {generateStat, getEmoji} = require("./../Helpers/Helpers");

module.exports = {
    name: 'evolve',
    display: '>evolve',
    description: 'DEBUG',
    async execute(message, args, client, db) {
        try {
            const pkmn = await db.collection('users')
                .doc(message.author.id)
                .collection('pokemon')
                .doc(args[0]).get().then(x => x.data());
            let temp = {...pkmn};
            let data;
            await P.getPokemonByName(pkmn.pokeName, function (response, error) {
                if (!error) {
                    data = response;
                } else {
                    console.log(error);
                }
            });
            const species = await axios.get(data.species.url);
            const evolutionChain = await axios.get(species.data.evolution_chain.url);
            const evoData = await findPokemonInChain(evolutionChain.data.chain, pkmn.pokeName);
            console.dir(evoData, {depth: 10});
            if (evoData.evolves_to[0].evolution_details[0].trigger.name === "level-up") {
                if (evoData.evolves_to[0].evolution_details[0].min_level <= pkmn.level) {
                    const newPKMN = await evolvePKMN(pkmn, evoData.evolves_to[0].species.name);
                    const embed = new Discord.MessageEmbed()
                        .setTitle(message.author.username + "'s " + temp.pokeName + " has evolved into " + newPKMN.pokeName + "!")
                        .addField('Evolve!', await getEmoji(temp.pokeName, client) + " → " + await getEmoji(newPKMN.pokeName, client))
                        .addField('HP', temp.stats.hp + " → " + newPKMN.stats.hp, true)
                        .addField('ATK', temp.stats.atk + " → " + newPKMN.stats.atk, true)
                        .addField('DEF', temp.stats.def + " → " + newPKMN.stats.def, true)
                        .addField('SPATK', temp.stats.spatk + " → " + newPKMN.stats.spatk, true)
                        .addField('SPDEF', temp.stats.spdef + " → " + newPKMN.stats.spdef, true)
                        .addField('SPEED', temp.stats.speed + " → " + newPKMN.stats.speed, true)
                        .setThumbnail(newPKMN.sprite)
                        .setColor("#38b938");
                    message.channel.send({embed});
                    await db.collection('users')
                        .doc(message.author.id)
                        .collection('pokemon')
                        .doc(args[0]).set(newPKMN)
                } else {
                    const embed = new Discord.MessageEmbed()
                        .setTitle("Cannot Evolve yet")
                        .addField("Level up your pokemon.", "This pokemon needs to be level " + evoData.evolves_to[0].evolution_details[0].min_level + " to evolve, and it is currently level " + pkmn.level)
                        .setThumbnail(pkmn.sprite);
                    message.channel.send({embed});
                }
            } else {
                const embed = new Discord.MessageEmbed()
                    .setTitle("Cannot Evolve yet")
                    .addField("Evolution method not yet supported", "This pokemon's evolution method is not yet coded.")
                    .setThumbnail(pkmn.sprite);
                message.channel.send({embed});
            }
        } catch (e) {
            console.log(e)
        }
    }
};

async function evolvePKMN(pkmnData, newName) {
    let newPKMN = pkmnData;
    let data;
    await P.getPokemonByName(newName, function (response, error) {
        if (!error) {
            data = response;
        } else {
            console.log(error);
        }
    });
    newPKMN.stats = {
        hp: await generateStat(data.stats, "hp", pkmnData.ivs, pkmnData.level, pkmnData.nature),
        atk: await generateStat(data.stats, "attack", pkmnData.ivs, pkmnData.level, pkmnData.nature),
        def: await generateStat(data.stats, "defense", pkmnData.ivs, pkmnData.level, pkmnData.nature),
        spatk: await generateStat(data.stats, "special-attack", pkmnData.ivs, pkmnData.level, pkmnData.nature),
        spdef: await generateStat(data.stats, "special-defense", pkmnData.ivs, pkmnData.level, pkmnData.nature),
        speed: await generateStat(data.stats, "speed", pkmnData.ivs, pkmnData.level, pkmnData.nature)
    };
    newPKMN.sprite = (pkmnData.shiny) ? data.sprites.front_shiny : data.sprites.front_default;
    newPKMN.pokeName = newName;
    newPKMN.type = data.types.map(x => x.type.name);
    return newPKMN;
}

async function findPokemonInChain(chain, name) {
    let found = false;
    let currTier = chain.evolves_to;
    if(chain.species.name === name){
        return chain
    }
    console.log(currTier);
    while (!found) {
        for (let path of currTier) {
            if (path.species.name === name) {
                return path
            } else {
                currTier = path.evolves_to;
            }
        }
    }
}

