const AsciiTable = require('ascii-table');

module.exports = {
    /**
     * Function used to generate stats that are accurate to the actual pokemon games. By taking in a base stats, the iv, the
     * level, and nature of a pokemon, those values can be passed into a formula that outputs a game-accurate stat.
     * @param stats                     An array of stats passed from generatePKMN().
     * @param statToGen                 The specific stat that will be output from this function.
     * @param ivs                       The iv object of the pokemon to be generated.
     * @param level                     The level of the pokemon to be generated.
     * @param nature                    The nature of the pokemon to be generated.
     * @returns {Promise<number>}       Resolves to a number accurate to the pokemon's stat.
     */
    generateStat: async (stats, statToGen, ivs, level, nature) => {
        let bs = 0;

        let natureFactor = 1;
        if (nature[1] === statToGen) {
            natureFactor = 1.1;
        } else if (nature[2] === statToGen) {
            natureFactor = 0.9;
        }

        for (let stat of stats) {
            if (stat.stat.name !== statToGen) continue;
            bs = stat.base_stat;
        }
        if (statToGen === "hp") {
            return Math.floor((2 * bs + ivs[statToGen] + 0) * level / 100 + level + 10);
        } else {
            return Math.floor(Math.floor((2 * bs + ivs[statToGen] + 0) * level / 100 + 5) * natureFactor)
        }
    },
    getEmoji: (string, client) => {
        return "<:" + string + ":" + emojiMapping[string] + ">";
    },
    generateSpaces: (string, maxChar) => {
        let out = "" + string;
        if (string.length < maxChar) {
            for (let x = 0; x < (maxChar - string.length); x++) {
                out += " ";
            }
        }
        return out;
    },
    generateIVSummary: (ivs) => {
        let sum = 0;
        for (let iv in ivs) {
            sum += ivs[iv];
        }
        return (Math.floor(sum / 186 * 100)) + "%";
    },
    generateStatTable: (stats, ivs, nature, iv, bst) => {
        console.log(stats);
        console.log(ivs);
        let table = new AsciiTable("BST: " + bst + " IVS: " + iv);
        table
            .setBorder('│', '─', '■', '■')
            .setHeading("Stats", "Value", "IV")
            .addRow("HP", stats.hp, ivs.hp)
            .addRow(isBoonBane("ATK", nature), stats.atk, ivs.attack)
            .addRow(isBoonBane("DEF", nature), stats.def, ivs.defense)
            .addRow(isBoonBane("SPATK", nature), stats.spatk, ivs['special-attack'])
            .addRow(isBoonBane("SPDEF", nature), stats.spdef, ivs['special-defense'])
            .addRow(isBoonBane("SPD", nature), stats.speed, ivs.speed);
        return "```" + table.toString() + "```";
    },
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
            reaction.users.remove(msg.author);
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
                curPage.reactions.removeAll();
                curPage.edit(pages[page].setFooter("Re-search to see the other pages again."));
            }
        );
        return curPage;
    },
    getColor: (type) => {
        let elementColor;
        switch (type.toLowerCase()) {
            case 'normal':
                elementColor = "#ffffff";
                break;
            case 'fire':
                elementColor = "#ff0000";
                break;
            case 'water':
                elementColor = "#4286f4";
                break;
            case 'electric':
                elementColor = "#fffa00";
                break;
            case 'grass':
                elementColor = "#1daf0f";
                break;
            case 'ice':
                elementColor = "#00ffe5";
                break;
            case 'fighting':
                elementColor = "#7a3b3b";
                break;
            case 'poison':
                elementColor = "#9a06aa";
                break;
            case 'ground':
                elementColor = "#351818";
                break;
            case 'flying':
                elementColor = "#a2c1c1";
                break;
            case 'psychic':
                elementColor = "#b56cab";
                break;
            case 'bug':
                elementColor = "#87c69f";
                break;
            case 'rock':
                elementColor = "#9e7356";
                break;
            case 'ghost':
                elementColor = "#65558c";
                break;
            case 'dragon':
                elementColor = "#00487f";
                break;
            case 'dark':
                elementColor = "#23021e";
                break;
            case 'steel':
                elementColor = "#6b6b6b";
                break;
            case 'fairy':
                elementColor = "#ffb7d7";
                break;
        }
        return elementColor;
    }
};

isBoonBane = (stat, nature) => {
    let out = stat;
    switch (stat) {
        case "ATK":
            if (nature[1] === "attack") {
                out += "   ↑"
            } else if (nature[2] === "attack") {
                out += "   ↓"
            }
            break;
        case "DEF":
            if (nature[1] === "defense") {
                out += "   ↑"
            } else if (nature[2] === "defense") {
                out += "   ↓"
            }
            break;
        case "SPATK":
            if (nature[1] === "special-attack") {
                out += " ↑"
            } else if (nature[2] === "special-attack") {
                out += " ↓"
            }
            break;
        case "SPDEF":
            if (nature[1] === "special-defense") {
                out += " ↑"
            } else if (nature[2] === "special-defense") {
                out += " ↓"
            }
            break;
        case "SPD":
            if (nature[1] === "speed") {
                out += "   ↑"
            } else if (nature[2] === "speed") {
                out += "   ↓"
            }
            break;
    }
    return out;
};

const emojiMapping = {
    "bug": "617968167620313108",
    "dark": "617968229863784448",
    "dragon": "617968266383458314",
    "electric": "617968291218194432",
    "fairy": "617968315394162725",
    "fighting": "617968336495575050",
    "fire": "617968361787359243",
    "flying": "617968383744540675",
    "ghost": "617968404376322048",
    "grass": "617968425125412866",
    "ground": "617968451612311583",
    "ice": "617968478808309771",
    "normal": "617968506524401679",
    "poison": "617968534986686477",
    "psychic": "617968557766213633",
    "rock": "617968594982273024",
    "steel": "617968618399072266",
    "water": "617968638883790858",
    "physical": "617968661663186945",
    "special": "617968684534857734",
    "status effect": "617968708320624652",
    "star": "617978374614286360",
    'alomomola': '717876158993137725',
    'anorith': '717876159014240289',
    'altaria': '717876159043469424',
    'aipom': '717876159051858011',
    'barboach': '717876159060115478',
    'absol': '717876159064440843',
    'aron': '717876159077023815',
    'aerodactyl': '717876159152652349',
    'bergmite': '717876159177687062',
    'axew': '717876159181881425',
    'banette': '717876159190270085',
    'bellsprout': '717876159265898537',
    'alakazam': '717876159274287165',
    'articuno': '717876159278481429',
    'barbaracle': '717876159341264941',
    'accelgor': '717876159349522442',
    'avalugg': '717876159366430751',
    'abra': '717876159366561842',
    'aggron': '717876159370756176',
    'beautifly': '717876159399985194',
    'ampharos': '717876159408373800',
    'aegislash': '717876159408504884',
    'aromatisse': '717876159412699147',
    'bayleef': '717876159421087755',
    'azurill': '717876159425019996',
    'ambipom': '717876159429476352',
    'arceus': '717876159437602937',
    'arcanine': '717876159454511134',
    'amoonguss': '717876159475613726',
    'araquanid': '717876159475613776',
    'bastiodon': '717876159475613816',
    'armaldo': '717876159479545956',
    'audino': '717876159487934484',
    'arbok': '717876159487934624',
    'beheeyem': '717876159492259851',
    'beedrill': '717876159504842826',
    'bagon': '717876159508906107',
    'baltoy': '717876159513231401',
    'azumarill': '717876159517556746',
    'basculin': '717876159521488966',
    'amaura': '717876159525683321',
    'ariados': '717876159530008657',
    'aurorus': '717876159538266192',
    'archen': '717876159546654785',
    'azelf': '717876159576277013',
    'bewear': '717876159580340256',
    'beldum': '717876159580471407',
    'archeops': '717876159614025768',
    'bellossom': '717876159651774494',
    'beartic': '717876159739854848',
    'blissey': '717876595410599997',
    'binacle': '717876595418857553',
    'budew': '717876595431571518',
    'bibarel': '717876595460669513',
    'carbink': '717876595473383526',
    'bonsly': '717876595477577839',
    'bidoof': '717876595486097479',
    'charizard': '717876595494355015',
    'cacturne': '717876595498680372',
    'celesteela': '717876595536167004',
    'blastoise': '717876595553206293',
    'breloom': '717876595578109964',
    'bisharp': '717876595582566421',
    'carnivine': '717876595599212555',
    'cacnea': '717876595607601203',
    'cherrim': '717876595641024674',
    'chesnaught': '717876595658064005',
    'charmeleon': '717876595729367061',
    'charmander': '717876595745882143',
    'blacephalon': '717876595758727189',
    'blitzle': '717876595762659348',
    'bouffalant': '717876595779567677',
    'carracosta': '717876595783893045',
    'bronzor': '717876595792281671',
    'bruxish': '717876595796344841',
    'buneary': '717876595800408124',
    'butterfree': '717876595809058846',
    'brionne': '717876595809058907',
    'braixen': '717876595817185290',
    'bunnelby': '717876595817185370',
    'braviary': '717876595821641838',
    'buizel': '717876595833962577',
    'chansey': '717876595834093629',
    'boldore': '717876595838418967',
    'bounsweet': '717876595846545418',
    'bronzong': '717876595850739793',
    'cherubi': '717876595851001886',
    'castform': '717876595859128390',
    'blaziken': '717876595859390534',
    'caterpie': '717876595867516968',
    'buzzwole': '717876595867779082',
    'burmy': '717876595876036628',
    'cascoon': '717876595880362035',
    'chandelure': '717876595905527919',
    'celebi': '717876595909591060',
    'camerupt': '717876595909591150',
    'bulbasaur': '717876595951665232',
    'carvanha': '717876595964248204',
    'charjabug': '717876596022837258',
    'chatot': '717876596106854481',
    'cofagrigus': '717876995186360373',
    'croagunk': '717876995207200809',
    'chespin': '717876995211395144',
    'deino': '717876995223978077',
    'cosmoem': '717876995224109077',
    'combusken': '717876995270377534',
    'cubone': '717876995295281183',
    'clamperl': '717876995316514907',
    'cottonee': '717876995320578099',
    'chingling': '717876995337355285',
    'conkeldurr': '717876995416916009',
    'croconaw': '717876995429498982',
    'dartrix': '717876995446538311',
    'crustle': '717876995450470515',
    'clawitzer': '717876995454795808',
    'chikorita': '717876995513385053',
    'cleffa': '717876995517579294',
    'clauncher': '717876995530162208',
    'cloyster': '717876995534356581',
    'cradily': '717876995534618664',
    'chimchar': '717876995542876200',
    'delcatty': '717876995547201548',
    'clefable': '717876995559653397',
    'cobalion': '717876995559653466',
    'crabominable': '717876995568173147',
    'chinchou': '717876995576299612',
    'clefairy': '717876995576430634',
    'cutiefly': '717876995576430643',
    'cinccino': '717876995576430714',
    'cryogonal': '717876995580624967',
    'cranidos': '717876995584688218',
    'decidueye': '717876995588882492',
    'combee': '717876995589013515',
    'cosmog': '717876995593207818',
    'dedenne': '717876995593207910',
    'crawdaunt': '717876995597271172',
    'claydol': '717876995597402174',
    'crabrawler': '717876995601596497',
    'corphish': '717876995601727539',
    'cyndaquil': '717876995605921902',
    'corsola': '717876995610116150',
    'cresselia': '717876995626893372',
    'cubchoo': '717876995630825483',
    'darumaka': '717876995630825543',
    'deerling': '717876995635150948',
    'comfey': '717876995639214100',
    'crobat': '717876995668705330',
    'darmanitan': '717876995672768582',
    'darkrai': '717876995840802846',
    'chimecho': '717876996012769350',
    'ditto': '717877455351709727',
    'donphan': '717877455393783860',
    'dewott': '717877455431401545',
    'drifblim': '717877455443984446',
    'deoxys': '717877455452373104',
    'druddigon': '717877455469412384',
    'elekid': '717877455477538917',
    'diancie': '717877455485927435',
    'dustox': '717877455490252842',
    'dwebble': '717877455494447116',
    'diggersby': '717877455502966932',
    'eevee': '717877455511093249',
    'dusknoir': '717877455527870467',
    'drapion': '717877455607693333',
    'dragonair': '717877455683321969',
    'delphox': '717877455716614164',
    'dewgong': '717877455733391380',
    'dhelmise': '717877455737847808',
    'electabuzz': '717877455737847819',
    'dratini': '717877455754494053',
    'delibird': '717877455754494063',
    'dewpider': '717877455763013632',
    'drilbur': '717877455767076874',
    'drampa': '717877455767076934',
    'doduo': '717877455775596574',
    'dragonite': '717877455787917353',
    'dialga': '717877455792111658',
    'drowzee': '717877455796306051',
    'dodrio': '717877455808888913',
    'eelektrik': '717877455809151047',
    'drifloon': '717877455813345320',
    'duosion': '717877455829991494',
    'dusclops': '717877455829991524',
    'ekans': '717877455838380042',
    'emolga': '717877455838511124',
    'dugtrio': '717877455842443334',
    'diglett': '717877455846768780',
    'eelektross': '717877455850831912',
    'empoleon': '717877455863414902',
    'elgyem': '717877455871934475',
    'emboar': '717877455880192030',
    'ducklett': '717877455880192090',
    'electivire': '717877455880323092',
    'dunsparce': '717877455884386334',
    'electrode': '717877455884517506',
    'doublade': '717877455892774982',
    'duskull': '717877455960014889',
    'durant': '717877456085843988',
    'dragalge': '717877456169861210',
    'electrike': '717877457864360067',
    'ferroseed': '717877790548164649',
    'gengar': '717877790573330485',
    'fearow': '717877790594039870',
    'feebas': '717877790627856445',
    'fomantis': '717877790740840539',
    'floatzel': '717877790745034763',
    'espeon': '717877790791434251',
    'farfetchd': '717877790820663358',
    'finneon': '717877790837571665',
    'fennekin': '717877790854348801',
    'exeggutor': '717877790887772201',
    'excadrill': '717877790896160778',
    'entei': '717877790896291840',
    'espurr': '717877790896291860',
    'exeggcute': '717877790900486194',
    'exploud': '717877790904418374',
    'escavalier': '717877790904680529',
    'ferrothorn': '717877790929846323',
    'feraligatr': '717877790929846333',
    'gabite': '717877790988566579',
    'gastrodon': '717877791005081660',
    'froakie': '717877791013601290',
    'fletchinder': '717877791017795664',
    'galvantula': '717877791034703882',
    'furfrou': '717877791055675434',
    'flygon': '717877791122522173',
    'giratina': '717877791143493734',
    'fraxure': '717877791156207667',
    'gastly': '717877791168921631',
    'forretress': '717877791193825321',
    'florges': '717877791286231061',
    'foongus': '717877791294750721',
    'garchomp': '717877791302877215',
    'flareon': '717877791311396914',
    'gardevoir': '717877791332237313',
    'flabebe': '717877791336693780',
    'gallade': '717877791340625971',
    'fletchling': '717877791340757112',
    'garbodor': '717877791345082368',
    'girafarig': '717877791345082478',
    'frogadier': '717877791361597530',
    'gigalith': '717877791378636830',
    'geodude': '717877791386894436',
    'furret': '717877791391088640',
    'frillish': '717877791395283025',
    'flaaffy': '717877791399346266',
    'genesect': '717877791412191253',
    'gible': '717877791424774217',
    'froslass': '717877791437357146',
    'floette': '717877791542083634',
    'gogoat': '717878149840633958',
    'gyarados': '717878149916000378',
    'gurdurr': '717878149945229405',
    'gothita': '717878149991628852',
    'haxorus': '717878150004080734',
    'grotle': '717878150033309778',
    'gloom': '717878150046023712',
    'guzzlord': '717878150083641496',
    'glaceon': '717878150109069375',
    'herdier': '717878150109069395',
    'hariyama': '717878150117326861',
    'hippopotas': '717878150125846549',
    'heatmor': '717878150134235247',
    'hippowdon': '717878150146818101',
    'gothitelle': '717878150180110427',
    'gligar': '717878150184435845',
    'goldeen': '717878150188498975',
    'grumpig': '717878150188630018',
    'hitmonchan': '717878150188630058',
    'goomy': '717878150201344163',
    'greninja': '717878150251413515',
    'gorebyss': '717878150259933262',
    'glalie': '717878150260064396',
    'golett': '717878150268190730',
    'golisopod': '717878150272385104',
    'golurk': '717878150272647208',
    'gothorita': '717878150272647228',
    'golduck': '717878150276710490',
    'gourgeist': '717878150276841592',
    'grimer': '717878150280773783',
    'golbat': '717878150281035916',
    'goodra': '717878150289162354',
    'glameow': '717878150293487746',
    'growlithe': '717878150314459146',
    'gumshoos': '717878150314590338',
    'grubbin': '717878150331236372',
    'happiny': '717878150335430696',
    'groudon': '717878150335561818',
    'graveler': '717878150339493908',
    'haunter': '717878150339625031',
    'gulpin': '717878150339756113',
    'gliscor': '717878150348013609',
    'heatran': '717878150356402256',
    'hawlucha': '717878150360727642',
    'grovyle': '717878150368854016',
    'heliolisk': '717878150377242645',
    'granbull': '717878150390087700',
    'golem': '717878150394282005',
    'helioptile': '717878150612123688',
    'heracross': '717878150620774480',
    'hoopa': '717878481425399840',
    'kecleon': '717878481438113823',
    'komala': '717878481442045997',
    'jumpluff': '717878481475731588',
    'igglybuff': '717878481496834119',
    'kakuna': '717878481500897293',
    'jynx': '717878481513611307',
    'incineroar': '717878481517805570',
    'houndour': '717878481551360051',
    'hitmontop': '717878481555292172',
    'jirachi': '717878481555423250',
    'hydreigon': '717878481584652384',
    'kricketot': '717878481614143510',
    'kyogre': '717878481618337793',
    'keldeo': '717878481639309323',
    'kabuto': '717878481664475207',
    'huntail': '717878481664606379',
    'karrablast': '717878481702355035',
    'kabutops': '717878481710612491',
    'hoppip': '717878481714675782',
    'klinklang': '717878481723064381',
    'illumise': '717878481731715132',
    'infernape': '717878481735909426',
    'honchkrow': '717878481739972639',
    'horsea': '717878481740103751',
    'hoothoot': '717878481744167042',
    'hypno': '717878481744298034',
    'honedge': '717878481756749875',
    'ivysaur': '717878481769332747',
    'kadabra': '717878481769332798',
    'inkay': '717878481777721365',
    'joltik': '717878481786109952',
    'houndoom': '717878481786109992',
    'hitmonlee': '717878481790435359',
    'kangaskhan': '717878481794629682',
    'klefki': '717878481807081492',
    'kartana': '717878481815470150',
    'kricketune': '717878481819533343',
    'jellicent': '717878481828053073',
    'klang': '717878481832116234',
    'krookodile': '717878481832247366',
    'koffing': '717878481836441640',
    'jolteon': '717878481844699137',
    'jigglypuff': '717878481853087804',
    'krokorok': '717878481857544192',
    'kingdra': '717878481865670745',
    'krabby': '717878481865932831',
    'klink': '717878481874321489',
    'kingler': '717878481957945444',
    'kirlia': '717878482016665611',
    'lombre': '717878843624521790',
    'lopunny': '717878843670528052',
    'larvitar': '717878843674853447',
    'leavanny': '717878843704344667',
    'lunala': '717878843712471082',
    'latias': '717878843742093411',
    'linoone': '717878843754545264',
    'lugia': '717878843783905432',
    'loudred': '717878843796619325',
    'magcargo': '717878843804876811',
    'leafeon': '717878843821523026',
    'lanturn': '717878843825848411',
    'lickilicky': '717878843829911564',
    'luvdisc': '717878843838562405',
    'lotad': '717878843851145238',
    'litleo': '717878843855077448',
    'machop': '717878843859271691',
    'landorus': '717878843867922464',
    'ledyba': '717878843913928705',
    'ledian': '717878843930706001',
    'lunatone': '717878843947483147',
    'machoke': '717878843997945857',
    'lampent': '717878844006072330',
    'kyurem': '717878844010397787',
    'lileep': '717878844022980628',
    'litwick': '717878844031369216',
    'liepard': '717878844035563590',
    'litten': '717878844039888996',
    'magikarp': '717878844052209755',
    'lillipup': '717878844052471808',
    'lairon': '717878844056404118',
    'lickitung': '717878844064792606',
    'luxio': '717878844077375538',
    'luxray': '717878844077506600',
    'lurantis': '717878844085895289',
    'lilligant': '717878844089958420',
    'lumineon': '717878844090089482',
    'magby': '717878844090089512',
    'magneton': '717878844094152814',
    'lapras': '717878844094414929',
    'lycanroc': '717878844098478120',
    'magearna': '717878844102672404',
    'magmar': '717878844106866758',
    'lucario': '717878844106866808',
    'magmortar': '717878844115386418',
    'larvesta': '717878844123512922',
    'latios': '717878844127969310',
    'machamp': '717878844148678817',
    'ludicolo': '717878844174106644',
    'magnemite': '717878844228370432',
    'mareanie': '717879221078327338',
    'mantine': '717879221136916481',
    'minun': '717879221158019173',
    'mamoswine': '717879221183053885',
    'maractus': '717879221208219669',
    'meditite': '717879221208350772',
    'meowstic': '717879221242036315',
    'manaphy': '717879221258682440',
    'mimikyu': '717879221279522937',
    'mothim': '717879221287911436',
    'mudbray': '717879221300756501',
    'marowak': '717879221304688732',
    'mismagius': '717879221321728061',
    'metang': '717879221367734293',
    'metapod': '717879221430648894',
    'makuhita': '717879221430779975',
    'mareep': '717879221472460820',
    'mankey': '717879221480980500',
    'manectric': '717879221485043864',
    'magnezone': '717879221497757736',
    'mewtwo': '717879221497888879',
    'mantyke': '717879221506277396',
    'milotic': '717879221510340679',
    'medicham': '717879221514403850',
    'masquerain': '717879221518860328',
    'meowth': '717879221523054602',
    'mightyena': '717879221526986812',
    'moltres': '717879221531443200',
    'monferno': '717879221531443230',
    'mawile': '717879221535506442',
    'misdreavus': '717879221539569716',
    'metagross': '717879221539831878',
    'marshadow': '717879221544026142',
    'marill': '717879221547958362',
    'mienshao': '717879221552152606',
    'malamar': '717879221552283698',
    'miltank': '717879221552414810',
    'minccino': '717879221556478058',
    'mesprit': '717879221560541225',
    'mienfoo': '717879221577580589',
    'mandibuzz': '717879221585707078',
    'minior': '717879221590163516',
    'melmetal': '717879221590163546',
    'meganium': '717879221598421022',
    'marshtomp': '717879221598552115',
    'meltan': '717879221602746398',
    'meloetta': '717879221627781140',
    'mew': '717879221627781200',
    'morelull': '717879221661335633',
    'mudkip': '717879222994993223',
    'ninetales': '717879620061626452',
    'nidoking': '717879620095180841',
    'oddish': '717879620103569480',
    'noibat': '717879620124409938',
    'paras': '717879620136861817',
    'munna': '717879620145512491',
    'nidorino': '717879620149706836',
    'nidorina': '717879620174741525',
    'nihilego': '717879620178935830',
    'pansage': '717879620179066963',
    'pangoro': '717879620187324477',
    'omanyte': '717879620208296050',
    'nidoqueen': '717879620233592904',
    'oshawott': '717879620296245270',
    'oricorio': '717879620296376361',
    'pancham': '717879620300570726',
    'noctowl': '717879620330061925',
    'palpitoad': '717879620346839113',
    'palossand': '717879620355096617',
    'murkrow': '717879620367548518',
    'nincada': '717879620367679539',
    'muk': '717879620409622569',
    'nosepass': '717879620430594199',
    'parasect': '717879620434657281',
    'passimian': '717879620443045889',
    'patrat': '717879620464017510',
    'munchlax': '717879620493508668',
    'natu': '717879620501766184',
    'oranguru': '717879620501766195',
    'ninjask': '717879620501897278',
    'noivern': '717879620505960458',
    'naganadel': '717879620506091550',
    'onix': '717879620510285934',
    'necrozma': '717879620518805595',
    'omastar': '717879620518805615',
    'mudsdale': '717879620531257384',
    'musharna': '717879620539777034',
    'persian': '717879620548165693',
    'pachirisu': '717879620552097852',
    'pansear': '717879620552359968',
    'octillery': '717879620573200445',
    'nuzleaf': '717879620577263636',
    'palkia': '717879620581589115',
    'pelipper': '717879620581720144',
    'phanpy': '717879620585783317',
    'petilil': '717879620594040962',
    'numel': '717879620598366290',
    'panpour': '717879620606754946',
    'pawniard': '717879620623400990',
    'phantump': '717879620623663161',
    'piloswine': '717880086946119703',
    'popplio': '717880086979936347',
    'quagsire': '717880086984130651',
    'raticate': '717880086996451363',
    'purugly': '717880087000776715',
    'pidgey': '717880087000907819',
    'pheromosa': '717880087013359618',
    'psyduck': '717880087017553961',
    'poliwag': '717880087021617193',
    'pignite': '717880087055302749',
    'pumpkaboo': '717880087059365959',
    'regigigas': '717880087088726018',
    'quilava': '717880087101440022',
    'regice': '717880087126736947',
    'probopass': '717880087130931231',
    'pikipek': '717880087139057777',
    'pikachu': '717880087151771681',
    'pineco': '717880087176937483',
    'qwilfish': '717880087214817331',
    'quilladin': '717880087223074827',
    'pichu': '717880087244046376',
    'poipole': '717880087248109609',
    'phione': '717880087256498237',
    'pupitar': '717880087256760322',
    'pidgeotto': '717880087269212210',
    'pidgeot': '717880087281664080',
    'porygon2': '717880087290183683',
    'plusle': '717880087290314852',
    'poliwhirl': '717880087298572338',
    'primarina': '717880087311024129',
    'porygon': '717880087315349615',
    'poliwrath': '717880087323738183',
    'poochyena': '717880087323738193',
    'politoed': '717880087340646421',
    'ralts': '717880087348904016',
    'rayquaza': '717880087357292585',
    'raikou': '717880087361486909',
    'pinsir': '717880087373938728',
    'pyroar': '717880087378395198',
    'piplup': '717880087386652742',
    'rapidash': '717880087399235625',
    'rampardos': '717880087403298816',
    'pyukumuku': '717880087436853258',
    'purrloin': '717880087449698315',
    'rattata': '717880087499898980',
    'primeape': '717880087521001564',
    'ponyta': '717880087525195806',
    'prinplup': '717880087571071088',
    'raichu': '717880087671865394',
    'pidove': '717880088376508436',
    'shaymin': '717880360280784989',
    'sableye': '717880360318533683',
    'roselia': '717880360339374081',
    'regirock': '717880360347893803',
    'remoraid': '717880360351957143',
    'registeel': '717880360360214549',
    'seadra': '717880360394031206',
    'seaking': '717880360406351963',
    'sawk': '717880360406614088',
    'samurott': '717880360435843123',
    'servine': '717880360435843144',
    'sceptile': '717880360473460757',
    'scraggy': '717880360482111531',
    'rhyperior': '717880360486043809',
    'roggenrola': '717880360490500188',
    'seel': '717880360494563330',
    'scyther': '717880360507015280',
    'sandshrew': '717880360528248903',
    'seismitoad': '717880360536506430',
    'sewaddle': '717880360536637452',
    'sandslash': '717880360591032341',
    'rufflet': '717880360607678585',
    'reshiram': '717880360624455771',
    'ribombee': '717880360637300758',
    'riolu': '717880360658141237',
    'rhydon': '717880360670724198',
    'sealeo': '717880360674787360',
    'reuniclus': '717880360687501412',
    'rhyhorn': '717880360691695646',
    'shedinja': '717880360695759081',
    'relicanth': '717880360695890001',
    'salandit': '717880360699953303',
    'salazzle': '717880360721186867',
    'roserade': '717880360729575454',
    'scrafty': '717880360737833020',
    'rowlet': '717880360742158347',
    'salamence': '717880360754479144',
    'sentret': '717880360754479174',
    'sandygast': '717880360758935602',
    'rockruff': '717880360762867722',
    'scizor': '717880360767062036',
    'seedot': '717880360771387402',
    'sharpedo': '717880360771387492',
    'seviper': '717880360771518554',
    'scolipede': '717880360779907113',
    'rotom': '717880360784101426',
    'scatterbug': '717880360788295740',
    'serperior': '717880360788295780',
    'sawsbuck': '717880360792490165',
    'sandile': '717880360796422234',
    'skorupi': '717880754465538161',
    'skiddo': '717880754482315285',
    'shellos': '717880754482446499',
    'shuppet': '717880754499223584',
    'skrelp': '717880754519932955',
    'slurpuff': '717880754524127253',
    'spewpa': '717880754603819060',
    'skitty': '717880754620596256',
    'snivy': '717880754670928096',
    'simipour': '717880754713001986',
    'shiftry': '717880754729779261',
    'spoink': '717880754742231091',
    'simisage': '717880754742362114',
    'shiinotic': '717880754755076160',
    'shelmet': '717880754767396875',
    'spinarak': '717880754767527957',
    'solgaleo': '717880754796888085',
    'slaking': '717880754826379315',
    'shellder': '717880754855608340',
    'simisear': '717880754872516628',
    'shinx': '717880754872516639',
    'shroomish': '717880754880643143',
    'shuckle': '717880754880774144',
    'shelgon': '717880754880774154',
    'spinda': '717880754880905237',
    'slowpoke': '717880754885099541',
    'silcoon': '717880754897682432',
    'skarmory': '717880754901876846',
    'skuntank': '717880754910134318',
    'silvally': '717880754910265434',
    'sigilyph': '717880754914328657',
    'skiploom': '717880754922586183',
    'slowbro': '717880754926911549',
    'shieldon': '717880754939363449',
    'smoochum': '717880754943819796',
    'slowking': '717880754947751946',
    'spiritomb': '717880754947751947',
    'snorunt': '717880754956140574',
    'spearow': '717880754960334858',
    'sliggoo': '717880754977374268',
    'slugma': '717880754989957141',
    'smeargle': '717880755006472192',
    'sneasel': '717880755006734376',
    'snorlax': '717880755019186176',
    'solosis': '717880755027443823',
    'slakoth': '717880755031769088',
    'snubbull': '717880755040026684',
    'snover': '717880755052740618',
    'spheal': '717880755123912784',
    'solrock': '717880755136757851',
    'stunfisk': '717881117557915701',
    'stakataka': '717881117658710035',
    'teddiursa': '717881117734076507',
    'stoutland': '717881117755179119',
    'taillow': '717881117763567658',
    'sunflora': '717881117793058837',
    'throh': '717881117801447537',
    'stantler': '717881117805379675',
    'staraptor': '717881117847453757',
    'swellow': '717881117851779104',
    'terrakion': '717881117872619554',
    'stufful': '717881117876682853',
    'tentacool': '717881117906174014',
    'tangrowth': '717881117914431519',
    'starly': '717881117914431610',
    'surskit': '717881117922820188',
    'swinub': '717881117922951249',
    'sunkern': '717881117935403090',
    'sudowoodo': '717881117939597373',
    'togekiss': '717881117939859468',
    'torchic': '717881117944053841',
    'staravia': '717881117947985991',
    'stunky': '717881117960831077',
    'swadloon': '717881117964763247',
    'steenee': '717881117981540413',
    'staryu': '717881117985996880',
    'steelix': '717881117994123274',
    'squirtle': '717881117998317628',
    'starmie': '717881118015356938',
    'torkoal': '717881118044454983',
    'swanna': '717881118048911451',
    'suicune': '717881118052843570',
    'sylveon': '717881118052843611',
    'tentacruel': '717881118065426453',
    'swablu': '717881118065557514',
    'togedemaru': '717881118090723348',
    'swoobat': '717881118094786600',
    'timburr': '717881118094917662',
    'swirlix': '717881118099111956',
    'spritzee': '717881118099243079',
    'tepig': '717881118103437362',
    'tangela': '717881118115889162',
    'thundurus': '717881118119952405',
    'tirtouga': '717881118124146768',
    'talonflame': '717881118140923935',
    'togetic': '717881118145118248',
    'togepi': '717881118187192350',
    'tauros': '717881118241849364',
    'swampert': '717881118241849384',
    'swalot': '717881118275141812',
    'ursaring': '717881401013174286',
    'vibrava': '717881401051054081',
    'trubbish': '717881401080283190',
    'vespiquen': '717881401084739637',
    'toxicroak': '717881401088802927',
    'tympole': '717881401109905462',
    'unfezant': '717881401134809119',
    'torterra': '717881401155911762',
    'venonat': '717881401185402902',
    'volcarona': '717881401189335063',
    'trapinch': '717881401189335173',
    'tyrantrum': '717881401260900395',
    'unown': '717881401269026847',
    'tyrogue': '717881401281609730',
    'vivillon': '717881401298518027',
    'tyranitar': '717881401310969967',
    'victini': '717881401327747083',
    'tornadus': '717881401348718712',
    'toucannon': '717881401357238272',
    'victreebel': '717881401365495960',
    'tranquill': '717881401365626890',
    'volbeat': '717881401374146601',
    'toxapex': '717881401382404127',
    'virizion': '717881401386598410',
    'tropius': '717881401403244657',
    'trevenant': '717881401407569991',
    'venomoth': '717881401407570001',
    'tsareena': '717881401420021840',
    'vanillite': '717881401420021891',
    'torracat': '717881401424216074',
    'turtwig': '717881401424216184',
    'tynamo': '717881401432866836',
    'trumbeak': '717881401432866906',
    'vanilluxe': '717881401440993290',
    'turtonator': '717881401441255474',
    'typhlosion': '717881401449512970',
    'vanillish': '717881401453707286',
    'volcanion': '717881401461964810',
    'vigoroth': '717881401461964870',
    'venusaur': '717881401462226944',
    'vaporeon': '717881401466421318',
    'vileplume': '717881401470353499',
    'venipede': '717881401487392818',
    'uxie': '717881401499713556',
    'umbreon': '717881401512427563',
    'totodile': '717881401512558613',
    'tyrunt': '717881401545982062',
    'vikavolt': '717881401546113134',
    'treecko': '717881401562628126',
    'voltorb': '717881402640826368',
    'whismur': '717881686502670408',
    'zeraora': '717881686523641938',
    'wailmer': '717881686540419134',
    'xerneas': '717881686549069865',
    'wailord': '717881686549069956',
    'zweilous': '717881686573973556',
    'whimsicott': '717881686590881884',
    'wishiwashi': '717881686620110900',
    'zapdos': '717881686653665351',
    'weavile': '717881686678831105',
    'wurmple': '717881686708191233',
    'woobat': '717881686716579852',
    'wobbuffet': '717881686716710965',
    'zoroark': '717881686762848277',
    'vullaby': '717881686766911519',
    'weedle': '717881686775300097',
    'zubat': '717881686800597026',
    'weezing': '717881686821699745',
    'wormadam': '717881686834282528',
    'wartortle': '717881686842540032',
    'whirlipede': '717881686846865470',
    'weepinbell': '717881686851059842',
    'vulpix': '717881686859317309',
    'wigglytuff': '717881686876094554',
    'wimpod': '717881686876225566',
    'yungoos': '717881686880288788',
    'walrein': '717881686888546354',
    'yanma': '717881686893002782',
    'xurkitree': '717881686905585716',
    'zebstrika': '717881686909648936',
    'yamask': '717881686909648976',
    'wooper': '717881686913712170',
    'yanmega': '717881686913974322',
    'zorua': '717881686918037615',
    'zangoose': '717881686918168626',
    'wynaut': '717881686926295130',
    'zekrom': '717881686939140117',
    'watchog': '717881686947397673',
    'yveltal': '717881686951460996',
    'zigzagoon': '717881686955655278',
    'xatu': '717881686964175029',
    'wingull': '717881686981083186',
    'zygarde': '717881687018569778',
    'whiscash': '717881687287267338',
};
