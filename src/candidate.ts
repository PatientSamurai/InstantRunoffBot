import {  Message } from 'discord.js';

export class Candidate {
    readonly name: string;
    readonly message: Message;

    constructor(message: Message) {
        this.message = message;
        this.name = this.trimName();
    }

    trimName(): string {
        const first: number = this.message.content.search(/\w/);
        const last: number = this.message.content.search(/\w[^\w]*$/);
        if (first === -1 || last === -1) {
            throw new Error('Message has no parsable candidate name: "' + this.message.content + '"');
        }

        return this.message.content.substr(first, last - first + 1);
    }
}