import {  Message, MessageReaction, Collection, Snowflake, User } from 'discord.js';

export class Candidate {
    private static VoteReactions: string[] =
        ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '0️⃣']; // :one:, :two:, :three:, :four:, :five:, :six:, :seven:, :eight:, :nine:, :zero:

    readonly name: string;
    readonly message: Message;
    votes: Map<string, number>; // <user tag, zero-based vote oridnal>

    private constructor(message: Message) {
        this.message = message;
        this.name = this.trimName();
        this.votes = new Map();
    }

    static async CreateAsync(message: Message): Promise<Candidate> {
        const candidate = new Candidate(message);
        await candidate.initializeAsync();
        return candidate;
    }

    voteCount(ordinal: number): number {
        let count: number = 0;
        this.votes.forEach((votedOrdinal: number) => { if (votedOrdinal === ordinal) { ++count; } });
        return count;
    }

    private trimName(): string {
        const first: number = this.message.content.search(/\w/);
        const last: number = this.message.content.search(/\w[^\w]*$/);
        if (first === -1 || last === -1) {
            throw new Error('Message has no parsable candidate name: "' + this.message.content + '"');
        }

        return this.message.content.substr(first, last - first + 1);
    }

    private async initializeAsync(): Promise<void> {
        for (let i: number = 0; i < Candidate.VoteReactions.length; ++i) {
            const reaction: MessageReaction | undefined = this.message.reactions.cache.get(Candidate.VoteReactions[i]);
            if (reaction === undefined) {
                continue;
            }

            const users: Collection<Snowflake, User> = await reaction.users.fetch({ limit: 100 });

            for (const [id, user] of users) {
                if (this.votes.has(user.tag)) {
                    throw new Error('User "' + user.tag + '" voted more than once for "' + this.name + '".');
                }

                this.votes.set(user.tag, i);
            }
        }
    }
}