import { Client, Message, PartialMessage, GuildMember, Role } from 'discord.js';
import { Election } from './election';
import { Candidate } from './candidate';

export class Bot {
    constructor(public client: Client) {
        client.on('ready', this.onReady.bind(this));
        client.on('message', this.onMessageAsync.bind(this));
    }

    onReady(): void {
        console.log('Connected');

        if (this.client.user == null) {
            console.warn("Client user is null.");
        } else {
            console.log('Logged in as: ' + this.client.user.tag);
        }
    }

    async onMessageAsync(message: Message | PartialMessage): Promise<void> {
        // We haven't opted into partials so this should bever be partial
        // but we need the type check.
        if (message.partial) {
            console.warn('Partial message received.');
            return;
        }

        try {
            const content: string = message.content;

            // Check for leading '!'
            if (content.substring(0, 1) !== '!') {
                return;
            }

            let args: string[] = content.substring(1).split(' ');
            const cmd: string = args[0];
            args = args.splice(1);

            switch (cmd) {
                // !ping
                case 'ping':
                    await message.reply('Pong!');
                    break;
                // !audit
                case 'audit':
                    const election: Election = await Election.CreateAsync(message);
                    let reply: string = 'election looks to be in order. Candidates:';
                    for (const candidate of election.candidates) {
                        reply += '\n  - ' + candidate.name;

                        if (candidate.votes.size > 0) {
                            reply += '\n      ';
                        }

                        for (const [voter, oridnal] of candidate.votes) {
                            reply += voter + '=>' + (oridnal + 1) + ' ';
                        }
                    }
                    await message.reply(reply);
                    break;
            }
        } catch (err) {
            try {
                await message.reply('Error: ' + err.message);
            } catch (err2) {
                console.warn('Error sending error: ' + err2.message);
                console.warn('Original error: ' + err.message);
            }
        }
    }

    memberHasRole(message: Message, roleName: string): boolean {
        if (message.member == null) {
            console.warn('message received with null member.');
            return false;
        }

        const user: GuildMember = message.member;

        if (user.roles.cache.find((role: Role) => role.name === roleName) != null) {
            return true;
        }

        if (user.guild.roles.cache.find((role: Role) => role.name === roleName) == null) {
            console.warn('Tried to search for role "' + roleName + '" on user but role does not exist in server. Defaulting to true.');
            return true;
        }

        return false;
    }
}