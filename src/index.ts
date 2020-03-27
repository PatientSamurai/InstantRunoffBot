import { Client } from 'discord.js';
import AuthData from './auth-data';

const bot = new Client();

bot.on('ready', () => {
    console.log('Connected');
    console.log('Logged in as: ' + bot.user.tag);
});

bot.on('message', message => {
    var content = message.content;
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (content.substring(0, 1) == '!') {
        var args = content.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                message.reply('Pong!');
                break;
            // Just add any case commands if you want to..
         }
     }
});

bot.login(AuthData.token);