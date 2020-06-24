const Discord = require('discord.js');
const axios = require('axios');
const Pokedex = require('pokedex-promise-v2');
const P = new Pokedex();

module.exports = {
    name: 'evolve',
    display: '>evolve',
    description: 'DEBUG',
    async execute(message, args, client, db) {
        let pkmn = await db.collection('users')
            .doc(message.author.id)
            .collection('pokemon')
            .doc(args[0]).get().then(x => x.data());
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
        message.channel.send("pulling data for " + pkmn.pokeName);
        // console.dir(evolutionChain.data, {depth: 10})
        console.dir(findPokemonInChain(evolutionChain.data.chain, pkmn.pokeName), {depth: 10})
    }
};

function findPokemonInChain(chain, name) {
    let found = false;
    let currTier = chain.evolves_to;
    while (!found) {
        for(let path of currTier){
            if(path.species.name === name){
                return path
            } else{
                currTier = path.evolves_to;
            }
        }
    }
}
