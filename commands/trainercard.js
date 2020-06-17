const Discord = require('discord.js');

module.exports = {
    name: 'trainercard',
    display: '>trainercard',
    description: 'View Your TrainerCard',

    async execute(message, args, client, db) {



        const { createCanvas, loadImage } = require('canvas')
        const canvas = createCanvas(1000, 300)
        const ctx = canvas.getContext('2d')

// Write "Awesome!"
        ctx.font = '30px Impact'
        ctx.rotate(0.0)
        ctx.fillText('fucking test', 50, 100)

// Draw line under text
        var text = ctx.measureText('fuckign test')
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.beginPath()
        ctx.lineTo(50, 102)
        ctx.lineTo(50 + text.width, 102)
        ctx.stroke()

// Draw cat with lime helmet
        loadImage('assets/trainercard/diyah.png').then((image) => {
            ctx.drawImage(image, 200, 200, 200, 200)

            console.log(canvas.toDataURL())
          //  message.channel.send(canvas.toDataURL());
        })






    }
};
