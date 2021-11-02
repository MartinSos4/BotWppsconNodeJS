const ytdl = require('ytdl-core');
const ytSearch = require ('yt-search');


const queue = new Map();

module.exports = {
    name: 'play' ,
    aliases: ['Skip', 'stop'],
    cooldown: 0,
    description: 'EnanoBot',
    async execute(message,args, cmd, client, Discord){



        const voice_channel = message.member.voice.channel;
        if(!voice_channel) return message.channel.send('Sos tarado o que? Tenes que estar en un canal para ejecutar esto puto!');
        const permissions = voice_channel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT')) return message.channel.send('Anda pa casa que no tenes permisos por puto.');
        if (!permissions.has('SPEAK')) return message.channel.send('You dont have the correct permissins');

        const server_queue = queue.get(message.guild.id);

        if (cmd === 'play'){
            if (!args.length) return message.channel.send('Viste que adivino no soy... esta bien que sea un bot del enano pero hasta ahí nomas. PONE UNA CANCIÓN DOWN!!');
            let song = {};

            if (ytdl.validateURL(args[0])) {
                const song_info = await ytdl.getInfo(args[0]);
                song = { title: song_info.videoDetails.title, url: song_info.videoDetails.video_url }
            } else {
                const video_finder = async (query) => {
                    const videoResult = await ytSearch(query);
                    return (videoResult.videos.length > 1 ) ? video_result.videos[0] : null;

                }
                const video = await video_finder (args.join(' '));
                if (video){
                    song = { title: video.title, url: video.url }
                } else {
                    message.channel.send ('Que mierda me pasaste, esto no funciona! De seguro fue Rodrigo por lo nabo.');

                }
            }
            if (!server_queue){

                const queue_constructor = {
                    voice_channel: voice_channel,
                    text_channel: message.channel,
                    connection: null,
                    songs: []
                }
                queue.set(message.guild.id, queue_constructor);
                queue_constructor.songs.push(song);
    
                try {
                    const connection = await voice_channel.join();
                    queue_constructor.connection = connection;
                    video_player(message.guild, queue_constructor.songs[0]);
                } catch(err) {
                    queue.delete(message.guild.id);
                    message.channel.send('Uy lrpm hubo un error en la conexión y bueno que esperaban de un bot del enano!');
                    throw err;
                }
            } else {
                server_queue.songs.push(song);
                return message.channel.send(`**${song.title}** Al fin agregaste algo puto!`);
    
            }
        }
        else if(cmd === 'skip') skip_song(message, server_queue);
        else if(cmd === 'stop') stop_song(message, server_queue);
    }
 
}

const video_player = async (guild, song) => {
    const song_queue = queue.get(guild.id);

    if (!song) {
        song_queue.voice_channel.leave();
        queue.delete(guild.id);
        return;
    }
    const stream = ytdl(song.url, { filter: 'audioonly'});
    song_queue.connection.play(stream, { seek: 0, volume: 0.5 })
    .on('finish', () => {
        song_queue.song.shift();
        video_player(guild, song_queue.songs[0]);
    });
    await song_queue.text_channel.send(`Ahora estamos escuchando el temaiken **${song.title}** PD: si lo puso Rodrigo es una verga, pero como estoy programado para reproducir todo, no hay de otra. Sorry gente`);
}
const skip_song = (message, server_queue) => {
    if (!message.member.voice.channel) return message.channel.send('Tu madre lo va a ejecutar este comando anda para un canal pelotudo!');
    if(!server_queue){
        return message.channel.send(`Lamento que tengas memoria de pez pero se te acabaron las canciones en la lista 😔`);
    }
    server_queue.connection.dispatcher.end();
}

const stop_song = (message, server_queue) => {
    if (!message.member.voice.channel) return message.channel.send('Tu madre lo va a ejecutar este comando anda para un canal pelotudo!');
    server_queue.songs = [];
    server_queue.connection.dispatcher.end();
}
