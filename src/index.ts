import { Client, Message, PartialMessage } from 'discord.js';
import authData from './auth-data';

const client = new Client();

client.on('ready', () => {
    console.log('Connected');

    if (client.user == null) {
        console.warn("Client user is null.");
    } else {
        console.log('Logged in as: ' + client.user.tag);
    }
});

client.on('message', (message: Message | PartialMessage) => {
    // We haven't opted into partials so this should bever be partial
    // but we need the type check.
    if (message.partial) {
        return;
    }

    const content = message.content;
    // Check for leading '!'
    if (content.substring(0, 1) !== '!') {
        return;
    }

    let args = content.substring(1).split(' ');
    const cmd = args[0];
    args = args.splice(1);

    switch (cmd) {
        // !ping
        case 'ping':
            message.reply('Pong!');
            break;
    }
});

client.login(authData.token);