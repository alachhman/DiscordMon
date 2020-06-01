const Discord = require('discord.js');

module.exports = {
    name: 'start',
    display: 'start',
    description: 'sets person that typed command as a user`',
    async execute(message, args, client, db) {
        const userFile = db.collection('users').doc(message.author.id);
        userFile.get().then( async (docData) => {
            if(docData.exists){
                message.channel.send("<@"+ message.author + ">" + " is already a trainer");
            } else{
                await db.collection('users').doc(message.author.id).set({
                    'userId': message.author.id,
                    'userName': message.author.username
                });
                message.channel.send("Welcome To DiscordMon");
            }
            }
        )
    }
};
/*var doc = firestore.collection('some_collection').doc('some_doc');
  doc.get().then((docData) => {
    if (docData.exists) {
      // document exists (online/offline)
    } else {
      // document does not exist (only on online)
    }
  }).catch((fail) => {
    // Either
    // 1. failed to read due to some reason such as permission denied ( online )
    // 2. failed because document does not exists on local storage ( offline )
  });

 */
