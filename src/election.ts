import { Message, TextChannel, Collection, Snowflake } from 'discord.js';
import { Candidate } from './candidate';

interface ParsedElectionData {
    startingMessage: Message;
    candidates: Candidate[];
}

export class Election {
    public static readonly AdminRoleName = 'ElectionAdmin';

    private static readonly MaxMessages: number = 100;
    private static readonly ElectionStartReaction: string = '🔰'; // :beginner:
    private static readonly CandidateReactions: string[] = ['☑️', '✔️', '✅']; // :ballot_box_with_check:, :heavy_check_mark:, :white_check_mark:
    private static readonly ElectionFinishedReaction: string = '🏁'; // :checkered_flag:

    readonly commandMessage: Message;
    readonly channel: TextChannel;
    readonly startingMessage: Message;
    readonly candidates: Candidate[];

    constructor(commandMessage: Message, channelMessages: Collection<Snowflake, Message>) {
        if (!(commandMessage.channel instanceof TextChannel)) {
            throw new Error('Elections cannot be held in DMs.');
        }

        this.commandMessage = commandMessage;
        this.channel = commandMessage.channel;
        const data: ParsedElectionData = this.parseChannelMessages(channelMessages);
        this.startingMessage = data.startingMessage;
        this.candidates = data.candidates;
    }

    static async CreateElection(commandMessage: Message): Promise<Election> {
        const channelMessages: Collection<Snowflake, Message> = await commandMessage.channel.messages.fetch({ limit: Election.MaxMessages });
        return new Election(commandMessage, channelMessages);
    }

    parseChannelMessages(messages: Collection<Snowflake, Message>): ParsedElectionData {
        let startingMessage: Message | null = null;
        const candidates: Candidate[] = [];

        for (const [id, message] of messages) {
            if (this.messageIsStartingMessage(message)) {
                startingMessage = message;
                // console.log('Starting message: ' + message.content);
                break;
            } else if (this.messageIsCandidate(message)) {
                candidates.push(new Candidate(message));
                // console.log('Candidate: ' + candidates[candidates.length - 1].name);
            }
        }

        if (startingMessage == null) {
            throw new Error('Could not find election start message in "' + Election.MaxMessages + '" messages.');
        } else if (candidates.length === 0) {
            throw new Error('Could not find any candidates in "' + Election.MaxMessages + '" messages.');
        }

        return { startingMessage, candidates: candidates.reverse() };
    }

    messageIsStartingMessage(message: Message): boolean {
        return message.reactions.cache.has(Election.ElectionStartReaction);
    }

    messageIsCandidate(message: Message): boolean {
        for (const candidateEmoji of Election.CandidateReactions) {
            if (message.reactions.cache.has(candidateEmoji)) {
                return true;
            }
        }

        return false;
    }
}