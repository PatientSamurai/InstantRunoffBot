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
    startingMessage: Message | null; // Never null after initialization
    candidates: Candidate[];

    private constructor(commandMessage: Message) {
        if (!(commandMessage.channel instanceof TextChannel)) {
            throw new Error('Elections cannot be held in DMs.');
        }

        this.commandMessage = commandMessage;
        this.channel = commandMessage.channel;
        this.startingMessage = null;
        this.candidates = [];
    }

    static async CreateAsync(commandMessage: Message): Promise<Election> {
        const election = new Election(commandMessage);
        await election.initializeAsync();
        return election;
    }

    async initializeAsync(): Promise<void> {
        const data: ParsedElectionData = await this.parseChannelMessagesAsync();
        this.startingMessage = data.startingMessage;
        this.candidates = data.candidates;

        const fixedVoters: string[] = this.fixVoteValues();
        if (fixedVoters.length > 0) {
            await this.commandMessage.reply("Warning: Initial votes had gaps for these voters: " + fixedVoters.join(' '));
        }
    }

    async parseChannelMessagesAsync(): Promise<ParsedElectionData> {
        const messages: Collection<Snowflake, Message> = await this.commandMessage.channel.messages.fetch({ limit: Election.MaxMessages });

        let startingMessage: Message | null = null;
        const candidates: Candidate[] = [];

        for (const [id, message] of messages) {
            if (this.messageIsStartingMessage(message)) {
                startingMessage = message;
                // console.log('Starting message: ' + message.content);
                break;
            } else if (this.messageIsCandidate(message)) {
                candidates.push(await Candidate.CreateAsync(message));
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

    // Returns if any changes were made
    fixVoteValues(): string[] {
        const fixedVoters: string[] = new Array();

        // We only need to check everyone once so let's keep a set of voters we've already checked
        const checkedVoters: Set<string> = new Set();

        for (let i = 0; i < this.candidates.length; ++i) {
            for (const [voter, oridnal] of this.candidates[i].votes) {
                if (checkedVoters.has(voter)) {
                    continue;
                }

                checkedVoters.add(voter);

                // We now have a voter to check so let's see which values they've voted for
                const votedOrdinals: (Candidate | null)[] = new Array(this.candidates.length);
                votedOrdinals.fill(null);
                for (let j = i; j < this.candidates.length; ++j) {
                    const vote: number | undefined = this.candidates[j].votes.get(voter);
                    if (vote !== undefined) {
                        // This voter has voted for this candidate, let's track it
                        votedOrdinals[vote] = this.candidates[j];
                    }
                }

                // Now we have all the oridnals the voter has voted for.
                // Let's see if there are any gaps, and fix them
                for (let j = 0; j < votedOrdinals.length; ++j) {
                    if (votedOrdinals[j] == null) {
                        // The voter didn't have a vote for this position,
                        // let's see if they have a lower candidate to promote
                        for (let k = j + 1; k < votedOrdinals.length; ++k) {
                            if (votedOrdinals[k] != null) {
                                // Let's promote the 'k' vote to the 'j' vote!
                                votedOrdinals[k]!.votes.set(voter, j);
                                votedOrdinals[j] = votedOrdinals[k];
                                votedOrdinals[k] = null;
                                fixedVoters.push(voter);
                                break;
                            }
                        }
                    }
                }
            }
        }

        return fixedVoters;
    }
}