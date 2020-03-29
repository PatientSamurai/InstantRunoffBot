import { Client, Message, PartialMessage, GuildMember, Role } from 'discord.js';

export class Bot {
    private readonly AdminRoleName = 'ElectionAdmin';

    constructor(public client: Client) {
        client.on('ready', this.onReady.bind(this));
        client.on('message', this.onMessage.bind(this));
    }

    onReady(): void {
        console.log('Connected');

        if (this.client.user == null) {
            console.warn("Client user is null.");
        } else {
            console.log('Logged in as: ' + this.client.user.tag);
        }
    }

    onMessage(message: Message | PartialMessage): void {
        // We haven't opted into partials so this should bever be partial
        // but we need the type check.
        if (message.partial) {
            console.warn('Partial message received.');
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
                message.reply('Pong!' + this.hasRole(message.member, this.AdminRoleName));
                break;
        }
    }

    hasRole(user: GuildMember | null, roleName: string): boolean {
        if (user == null) {
            return false;
        }

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