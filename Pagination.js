const Discord = require('discord.js');

module.exports = {
    paginationEmbed: async function (msg, pages, emojiList = ['⏪', '⏩'], timeout = 120000) {
        if (!msg && !msg.channel) throw new Error('Channel is inaccessible.');
        if (!pages) throw new Error('Pages are not given.');
        if (emojiList.length !== 2) throw new Error('Need two emojis.');
        let page = 0;
        const curPage = await msg.channel.send(pages[page].setFooter(`Page ${page + 1} / ${pages.length}`));
        for (const emoji of emojiList) await curPage.react(emoji);
        const reactionCollector = curPage.createReactionCollector(
            (reaction, user) => emojiList.includes(reaction.emoji.name) && !user.bot,
            {time: timeout}
        );
        reactionCollector.on('collect', reaction => {
            reaction.remove(msg.author);
            switch (reaction.emoji.name) {
                case emojiList[0]:
                    page = page > 0 ? --page : pages.length - 1;
                    break;
                case emojiList[1]:
                    page = page + 1 < pages.length ? ++page : 0;
                    break;
                default:
                    break;
            }
            curPage.edit(pages[page].setFooter(`Page ${page + 1} / ${pages.length}`));
        });
        reactionCollector.on('end', function () {
                curPage.clearReactions();
                curPage.edit(pages[page].setFooter("Re-search to see the other pages again."));
            }
        );
        return curPage;
    },
};

/*
no
it takes in the message the user used to call the command
so in your case >box
so to use this function you need to create an array of discord embeds
and pass that through this function as the pages input
https://discordjs.guide/popular-topics/embeds.html#embed-preview
 */
