import { Client } from 'discord.js';
import { Bot } from './bot';
import * as dotenv from 'dotenv';

const client = new Client();
const bot = new Bot(client);

// Load the bot token
const botTokenEnvironmentKey: string = 'BOT_TOKEN';
dotenv.config();
const token: string | undefined = process.env[botTokenEnvironmentKey];
if (!token) {
    console.error(`Bot token not found in environment variable or .env file under ${botTokenEnvironmentKey}.`);
}

client.login(token);