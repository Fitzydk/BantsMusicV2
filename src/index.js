const prefix = ".";
const { MessageEmbed, Client, Intents, Guild, DiscordAPIError, Message, User } = require("discord.js");
const discordVoice = require("@discordjs/voice")
const allIntents = new Intents(32767);

const fs = require("fs")

const client = new Client({ 
    intents: allIntents,

});
const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify")

var loopSong = 0;

client.DisTube = new DisTube(client, {
    emitNewSongOnly: true,
    leaveOnFinish: false,
    emitAddSongWhenCreatingQueue: false,
    updateYouTubeDL: false,
    leaveOnStop: false,
    plugins: [new SpotifyPlugin()]
});



require("dotenv").config();


client.on("ready", () => {
    console.log(`We have logged in as: ${client.user.tag}.`)
});


client.on("messageCreate", async message => {
    if (message.content.startsWith(prefix)) {
        let args = message.content.slice(prefix.length).split(' ');
        let command = args.shift().toLowerCase();

        var ArgsString = ""
        
        for(let i = 0; i < args.length; i++){
            ArgsString = ArgsString + args[i] + " "
        }

        var ArgsStringLength = ArgsString.length - 1
        ArgsString = ArgsString.substr(0, ArgsStringLength)

        const VoiceChannel = message.member.voice.channel;
        const queue = client.DisTube.getQueue(VoiceChannel);


        if(command == "play"){
            message.reply("**🔍 Searching for `" + ArgsString + "` 🔎**");

            client.DisTube.search(ArgsString, 0, 1, 'video', false)
                .then((all) => {
                    waitPlaySong(all[0].name);
                })

            function waitPlaySong(songNamePlay){
                client.DisTube.playVoiceChannel(VoiceChannel, ArgsString, {textChannel: message.channel, member: message.author});
                try{
                    if(queue.length == 0){
                        return message.reply("**▶ Playing `" + songNamePlay + "` now ▶**");
                    }
                    else{
                        return message.reply(`**✅ Added \`${songNamePlay}\` to the queue ✅**`);
                        
                    }
                }
                catch{}
                return message.reply("**▶ Playing `" + songNamePlay + "` now ▶**");
            }
        }

        else if(command == "playadv"){
            if(args[0] != undefined){
                client.DisTube.search(ArgsString, 0, 1, 'video', false)
                    .then((all) => {
                        waitPlaySongAdvanced(all);
                    })

                function waitPlaySongAdvanced(all){
                    const jsonsongs = [];
                    for(i = 0; i < all.length; i++){
                        var pushJSON = `{"index": ${i}, "name": "${all[i].name}", "url": "${all[i].url}"}`
                        jsonsongs.push(JSON.parse(pushJSON))
                        
                    }
                    
                    craftEmbedChoice(jsonsongs)
                }

                async function craftEmbedChoice(jsonsongs){
                    await message.channel.send({embeds: [new MessageEmbed()
                        .setTitle(`${ArgsString} : Query`)
                        .setDescription(`${jsonsongs.map((jsonsongs) => `\n**${jsonsongs.index + 1}**. ${jsonsongs.name}`)}`)
                    ]})

                    message.channel.send("**Enter the number which represents the song above (1-10): **");

                    const filter = m => m.author.id == message.author.id
                    message.channel.awaitMessages({filter, max: 1, time: 30_000, errors :['time']})
                            .then(collected => {
                                var UserIndexSong = Number(collected.first().content)
                                var songAdv = jsonsongs[UserIndexSong - 1]

                                client.DisTube.playVoiceChannel(VoiceChannel, songAdv.url, {textChannel: message.channel, member: message.author});
                                try{
                                    if(queue.length == 0){
                                        return message.reply("**▶ Playing `" + songAdv.name + "` now ▶**");
                                    }
                                    else{
                                        return message.reply(`**✅ Added \`${songAdv.name}\` to the queue ✅**`);
                                    }
                                }
                                catch{}
                                return message.reply("**▶ Playing `" + songAdv.name + "` now ▶**");
                            });
                    }
                }
                else{
                    return message.reply("**Please enter a song name after the `.playadv` command!**")
                }
            }


        switch (command){
            case "join":
                const connectionCheck = discordVoice.getVoiceConnection(message.guild.id)
                if(!message.member.voice.channel){ 
                    return message.channel.send("**🔴 Please connect to a voice channel 🔴**")
                }
                else if(!connectionCheck){
                    const connection = discordVoice.joinVoiceChannel({
                        channelId: message.member.voice.channel.id,
                        guildId: message.guild.id,
                        adapterCreator: message.guild.voiceAdapterCreator,
                    });
                    message.channel.send(`**💨 I have joined ${message.member.voice.channel} 💨**`)
                    break;
                }
                else if(message.guild.me.voice.channelId == message.member.voice.channel.id){
                    return message.channel.send(`**⚠ I am already in <#${message.guild.me.voice.channelId}> ⚠**`)
                }
                else if(message.guild.me.voice.channelId != message.member.voice.channel.id){
                    connectionCheck.destroy();
                    const connection = discordVoice.joinVoiceChannel({
                        channelId: message.member.voice.channel.id,
                        guildId: message.guild.id,
                        adapterCreator: message.guild.voiceAdapterCreator,
                    });
                    return message.channel.send(`**🚸 I have moved to ${message.member.voice.channel} 🚸**`)
                }
                break;

            case "ping":
                message.reply(`**The bots ping is:** ${Math.round(client.ws.ping)}ms`);
                break;
            case "disconnect":
                const connection = discordVoice.getVoiceConnection(message.guild.id)
                connection.destroy()
                message.channel.send(`👋 **I have left ${message.member.voice.channel}, GoodBye** 👋`)
                break;
            case "pause":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }
                try{
                    queue.pause(VoiceChannel);
                    return message.reply("**⏸ Paused `" + queue.songs[0].name + "` ⏸**")
                }
                catch(err){
                    return message.channel.send(err);
                }
            case "skip":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }
                var skippable = false;
                var songNum = 0;
                for(let i = 0; i < queue.songs.length; i++){
                    songNum++
                }
                
                if(songNum <= 1){
                    skippable = false;
                }
                else{
                    skippable = true;
                }

                if(skippable){
                    queue.skip(VoiceChannel);
                    message.channel.send("** ⏩ Skipped `"+ queue.songs[0].name +"` ⏩ **")
                    return message.reply("** ❓ Now playing `"+ queue.songs[1].name +"` ❓ **")
                }
                else{
                    return message.reply("** ⚠ You need more than one song in order to skip, please use `.stop` ⚠**")
                }

            case "jump":
                let jumpNum = parseInt(args[0])
                let successful = false;
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }

                if(jumpNum == 0){
                    return message.reply("** `0` wont work bro **")
                }

                try{
                    let successful = true;
                    message.reply("**❓ Now playing: `" + queue.songs[jumpNum].name +"` ❓**")
                }
                catch{
                    let successful = false;
                    return message.reply("**Invalid song jump**")
                }                
                return client.DisTube.jump(VoiceChannel, jumpNum)

            case "stop":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }
                queue.stop(VoiceChannel);
                return message.reply("**🛑 Stopped `"+ queue.songs[0].name +"` 🛑**");
            case "np":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }
                else{
                    message.reply("**❓ Now playing ❓**")
                    return message.channel.send({embeds: [new MessageEmbed()
                        .setColor("RED")
                        .setTitle(`${queue.songs[0].name}`)
                        .setImage(`${queue.songs[0].thumbnail}`)
                        .setFooter(`${queue.songs[0].url}          ${queue.songs[0].formattedDuration}(${queue.songs[0].duration}s) `)
                    ]});
                }

            case "resume":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }
                queue.resume(VoiceChannel)
                return message.reply("** ⏯ Resumed `" + queue.songs[0].name + "` ⏯**")

            case "volume":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }
                var vol = ArgsString
                queue.setVolume(Number(vol), VoiceChannel)
                return message.reply("** 🔊 Set volume to `" + vol + "%` 🔊**")

            case "queue":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }
                return message.reply({embeds: [new MessageEmbed()
                .setColor("PURPLE")
                .setDescription(`${queue.songs.map(
                    (song, id) => `\n**${id + 1}**. ${song.name} - \`${song.formattedDuration}\``)}`)
                ]});

            case "getvideo":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }
                return message.reply(`**Song Video: \`${queue.songs[0].formats[0].url}\` **`)

            case "loop":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }

                if (loopSong == 0){
                    let mode = client.DisTube.setRepeatMode(message, 1)
                    mode = mode ? mode == 2 ? "Repeat queue" : "Repeat song" : "Off";
                    message.channel.send("Set repeat mode to `" + mode + "`");
                    return loopSong = 1
                }
                else if (loopSong == 1){
                    let mode = client.DisTube.setRepeatMode(message, 2)
                    mode = mode ? mode == 2 ? "Repeat queue" : "Repeat song" : "Off";
                    message.channel.send("Set repeat mode to `" + mode + "`");
                    return loopSong = 2
                }

                else if (loopSong == 2){
                    let mode = client.DisTube.setRepeatMode(message, 0)
                    mode = mode ? mode == 2 ? "Repeat queue" : "Repeat song" : "Off";
                    message.channel.send("Set repeat mode to `" + mode + "`");
                    return loopSong = 0
                }
                return 0;

            case "shuffle":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }
                client.DisTube.shuffle(VoiceChannel);
                message.reply("**Queue has been shuffled**")
                return message.channel.send({embeds: [new MessageEmbed()
                    .setColor("PURPLE")
                    .setDescription(`${queue.songs.map(
                        (song, id) => `\n**${id + 1}**. ${song.name} - \`${song.formattedDuration} (${song.duration}s)\``)}`)
                    ]});

            case "seek":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }
                if (args[0] == ""){
                    return message.reply("**You must give a time to go to!**")
                }
                else{
                    return client.DisTube.seek(message, Number(args[0]));
                }

            case "addrelated":
                if(queue == undefined){
                    return message.reply("** Queue is empty! **")
                }
                client.DisTube.addRelatedSong(VoiceChannel);
                return message.reply("**Added relevant songs to queue!**")
                
        }
        

    }
  });

(async () => { 
    client.login(process.env.token)
})();
