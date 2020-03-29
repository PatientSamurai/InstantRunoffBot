import { Client } from 'discord.js';
import { Bot } from './bot';
import authData from './auth-data';

const client = new Client();
const bot = new Bot(client);

client.login(authData.token);