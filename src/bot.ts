import { Client, Message, PartialMessage, GuildMember, Role } from 'discord.js';
import { Election } from './election';

export class Bot {
    constructor(public client: Client) {
        client.on('ready', this.onReady.bind(this));
        client.on('message', this.onMessageAsync.bind(this));
    }

    private onReady(): void {
        console.log('Connected');

        if (this.client.user == null) {
            console.warn("Client user is null.");
        } else {
            console.log('Logged in as: ' + this.client.user.tag);
        }
    }

    private async onMessageAsync(message: Message | PartialMessage): Promise<void> {
        // We haven't opted into partials so this should bever be partial
        // but we need the type check.
        if (message.partial) {
            console.warn('Partial message received.');
            return;
        }

        try {
            const content: string = message.content;
            let args: string[] = content.split(' ');

            // Check for leading '!vote'
            if (args.length === 0 || args[0] !== '!vote') {
                return;
            }

            // Remove the '!vote' sentinal
            args = args.splice(1);

            let cmd: string = 'help';
            if (args.length > 0) {
                cmd = args[0];
                args = args.splice(1);
            }

            switch (cmd) {
                // !vote audit
                case 'audit':
                    {
                        const election: Election = await Election.CreateAsync(message);
                        let reply: string = 'Election looks to be in order.\n';
                        reply += election.summarizeState(true /* includeVoters */);
                        await message.reply(reply);
                        break;
                    }
                // !vote tabulate
                case 'tabulate':
                    {
                        // For this command we require permissions so let's check for those
                        this.checkMemberHasRole(message, Election.AdminRoleName);

                        const election: Election = await Election.CreateAsync(message);
                        election.performElection();
                        break;
                    }
                case 'reset':
                    {
                        // For this command we require permissions so let's check for those
                        this.checkMemberHasRole(message, Election.AdminRoleName);

                        if (this.client.user == null) {
                            throw new Error('Bot user not set.');
                        }

                        await Election.resetElectionAsync(message, this.client.user.id);
                        await message.reply('Most recent election is now in un-tabulated state.');
                        break;
                    }
                default:
                    {
                        await message.reply('Unrecognized command.')
                    }
                case 'help':
                    {
                        await message.reply(this.helpText());
                    }
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

    private checkMemberHasRole(message: Message, roleName: string): void {
        if (message.member == null) {
            throw new Error('Message received with null member.');
        }

        const user: GuildMember = message.member;

        if (user.roles.cache.find((role: Role) => role.name === roleName) != null) {
            return;
        }

        if (user.guild.roles.cache.find((role: Role) => role.name === roleName) == null) {
            console.warn('Tried to search for role "' + roleName + '" on user but role does not exist in server. Defaulting to true.');
            return;
        }

        throw new Error('This server requires the role "' + Election.AdminRoleName + '" to run this command.');
    }

    private helpText(): string {
        let text: string = 'Usage:\n';
        text += '- "!vote help": Prints out this text.\n';
        text += '- "!vote audit": Performs an audit, but does not run the tabulation.\n';
        text += '- "!vote tabulate": Performs the election process on the most recent election.\n';
        text += '      This command may require the "' + Election.AdminRoleName + '" role if your server has it defined.\n';
        text += '- "!vote reset": Resets the most recent election, removing any bot created reactions.\n';
        text += '      This command may require the "' + Election.AdminRoleName + '" role if your server has it defined.\n';
        text += 'See https://github.com/PatientSamurai/InstantRunoffBot for detailed usage information.'

        return text;
    }
}