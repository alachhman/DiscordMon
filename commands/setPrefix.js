module.exports.run = async (message, args, client, db) => {
    if (args.length === 0){
        message.channel.send("Missing Prefix");
    }else if (args.length ===1){
        let nPrexis =  args[0];

        db.collection('guilds').doc(message.guild.id).update({
            'prefix' : nPrefix
        }).then(() => {
            message.channel.send(`[prefix updated] : new prefix ${nPrefix}`)
        });


    }
}

module.exports.help = {
    name:"setPrefix"
}
