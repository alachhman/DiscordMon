const fs = require('fs');
const Discord = require('discord.js');
const {prefix, prodToken, stagingToken, environment} = require('./auth.json');
const client = new Discord.Client();
const Pokedex = require('pokedex-promise-v2');
const P = new Pokedex();

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', async () => {
    console.log(`Bot is running on ${client.guilds.cache.size} servers`);
    await client.user.setActivity('ligma');
});

client.on('message', async (message) => {
    if (message.content.includes('thanks bud')) {
        message.reply("no problem fam");
        return;
    }

    if(message.author.bot){return;}

    if (Math.random() < 0.1) {
        await spawnPokemon(message);
    }

    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    if (!client.commands.has(command)) return;
    try {
        client.commands.get(command).execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('Cannot run command!');
    }
});

client.login(environment === "production" ? prodToken : stagingToken);

spawnPokemon = async (message) => {
    let pkmn = Math.round(Math.random() * 1000) - 36;
    if(pkmn < 1){pkmn = Math.abs(pkmn);}
    console.log(pkmn);
    let data;
    await P.getPokemonByName(pkmn, function(response, error) { // with callback
        if(!error) {
            console.dir(response, {depth: 10});
            data = response;
        } else {
            console.log(error);
        }
    });

    const embed = new Discord.MessageEmbed()
        .setTitle('A wild ' + data.forms[0].name + ' has appeared!')
        .setColor("#3a50ff")
        .setImage(data.sprites.front_default);
    await message.channel.send({embed});
};
