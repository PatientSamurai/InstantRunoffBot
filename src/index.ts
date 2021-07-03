import { Client } from 'discord.js';
import { Bot } from './bot';
import * as dotenv from 'dotenv';

const client = new Client();
const bot = new Bot(client);

// Load the bot token
const botTokenEnvironmentKey: string = 'BOT_TOKEN';
let token: string | undefined = process.env[botTokenEnvironmentKey];
if (!token) {
    console.log(`No bot token found in environment variable ${botTokenEnvironmentKey}.`);

    // Fall back the .env file now
    dotenv.config();
    token = process.env[botTokenEnvironmentKey];

    if (!token) {
        console.error('Bot token not found in .env file either.');
    }
}

client.login(token);