import { Message, TextChannel, Collection, Snowflake } from 'discord.js';
import { Candidate } from './candidate';

interface ParsedElectionData {
    startingMessage: Message;
    candidates: Candidate[];
}

export class Election {
    public static readonly AdminRoleName: string = 'ElectionAdmin';

    private static readonly MaxMessages: number = 100;
    private static readonly ElectionStartReaction: string = '🔰'; // :beginner:
    private static readonly CandidateReactions: string[] = ['☑️', '✔️', '✅']; // :ballot_box_with_check:, :heavy_check_mark:, :white_check_mark:
    private static readonly LoserCandidateReaction: string = '❌'; // :x:
    private static readonly WinnerCandidateReaction: string = '🏆'; // :trophy:
    private static readonly ElectionFinishedReaction: string = '🏁'; // :checkered_flag:

    readonly commandMessage: Message;
    readonly channel: TextChannel;
    startingMessage: Message | null; // Never null after initialization
    candidates: Candidate[];
    voterCount: number;
    log: string;

    private constructor(commandMessage: Message) {
        if (!(commandMessage.channel instanceof TextChannel)) {
            throw new Error('Elections cannot be held in DMs.');
        }

        this.commandMessage = commandMessage;
        this.channel = commandMessage.channel;
        this.startingMessage = null;
        this.candidates = [];
        this.voterCount = 0;
        this.log = '';
    }

    static async CreateAsync(commandMessage: Message): Promise<Election> {
        const election = new Election(commandMessage);
        await election.initializeAsync();
        return election;
    }

    summarizeState(includeVoters: boolean): string {
        let state: string = 'Candidates:';
        for (const candidate of this.candidates) {
            state += '\n- ' + candidate.name + '\n';

            if (includeVoters) {
                if (candidate.votes.size === 0) {
                    state += '    <No votes>';
                    continue;
                }

                state += '   ';
                for (const [voter, oridnal] of candidate.votes) {
                    state += ' ' + voter + '=>' + (oridnal + 1);
                }
            } else {
                state += '   ';
                for (let voteOrdinal: number = 0; voteOrdinal < this.candidates.length; ++voteOrdinal) {
                    state += ' ' + (voteOrdinal + 1) + ':' + candidate.voteCount(voteOrdinal);
                }
            }
        }

        return state;
    }

    async performElection(): Promise<void> {
        this.logLine('Starting election state:');
        this.logLine(this.summarizeState(false /* includeVoters */));

        let winner: Candidate | undefined = this.findWinner();
        while (winner === undefined) {
            const loser: Candidate = this.pickLoser();
            await loser.message.react(Election.LoserCandidateReaction);
            this.candidates = this.candidates.filter((candidate: Candidate) => candidate !== loser);
            this.fixVoteValues();
            this.logLine('\nNew election state:');
            this.logLine(this.summarizeState(false /* includeVoters */));
            winner = this.findWinner();
        };

        await this.startingMessage!.reply(this.log);
        await winner.message.react(Election.WinnerCandidateReaction);
        await this.startingMessage!.react(Election.ElectionFinishedReaction);
    }

    static async resetElectionAsync(commandMessage: Message, botUserId: Snowflake): Promise<void> {
        const messages: Collection<Snowflake, Message> = await commandMessage.channel.messages.fetch({ limit: Election.MaxMessages });

        let startingMessage: Message | null = null;
        const candidates: Message[] = [];

        for (const [id, message] of messages) {
            if (this.messageIsStartingMessage(message)) {
                startingMessage = message;
                break;
            } else if (this.messageIsCandidate(message)) {
                candidates.push(message);
            }
        }

        if (startingMessage == null) {
            throw new Error('Could not find election start message in "' + Election.MaxMessages + '" messages.');
        }

        if (this.messageIsFinishedStartingMessage(startingMessage)) {
            await Election.removeReactionAsync(startingMessage, Election.ElectionFinishedReaction, botUserId);
        }

        for (const candidate of candidates) {
            if (Election.messageIsLoserCandidate(candidate)) {
                await Election.removeReactionAsync(candidate, Election.LoserCandidateReaction, botUserId);
            }

            if (Election.messageIsWinnerCandidate(candidate)) {
                await Election.removeReactionAsync(candidate, Election.WinnerCandidateReaction, botUserId);
            }
        }
    }

    private static async removeReactionAsync(message: Message, reactionEmoji: string, botUserId: Snowflake) {
        await message.reactions.cache.get(reactionEmoji)?.users.remove(botUserId);
    }

    private async initializeAsync(): Promise<void> {
        const data: ParsedElectionData = await this.parseChannelMessagesAsync();
        this.startingMessage = data.startingMessage;
        this.candidates = data.candidates;

        const fixedVoters: string[] = this.fixVoteValues();
        if (fixedVoters.length > 0) {
            await this.commandMessage.reply("Warning: Initial votes had gaps for these voters: " + fixedVoters.join(' '));
        }
    }

    private async parseChannelMessagesAsync(): Promise<ParsedElectionData> {
        const messages: Collection<Snowflake, Message> = await this.commandMessage.channel.messages.fetch({ limit: Election.MaxMessages });

        let startingMessage: Message | null = null;
        const candidates: Candidate[] = [];

        for (const [id, message] of messages) {
            if (Election.messageIsStartingMessage(message)) {
                if (Election.messageIsFinishedStartingMessage(message)) {
                    // This is a finished election so we should ignore it
                    throw new Error('Most recent election is already finished.');
                }

                startingMessage = message;
                break;
            } else if (Election.messageIsCandidate(message)) {
                candidates.push(await Candidate.CreateAsync(message));
            }
        }

        if (startingMessage == null) {
            throw new Error('Could not find election start message in "' + Election.MaxMessages + '" messages.');
        } else if (candidates.length === 0) {
            throw new Error('Could not find any candidates after the election start.');
        }

        return { startingMessage, candidates: candidates.reverse() };
    }

    private static messageIsStartingMessage(message: Message): boolean {
        return message.reactions.cache.has(Election.ElectionStartReaction);
    }

    private static messageIsFinishedStartingMessage(message: Message): boolean {
        return message.reactions.cache.has(Election.ElectionFinishedReaction);
    }

    private static messageIsCandidate(message: Message): boolean {
        for (const candidateEmoji of Election.CandidateReactions) {
            if (message.reactions.cache.has(candidateEmoji)) {
                return true;
            }
        }

        return false;
    }

    private static messageIsLoserCandidate(message: Message): boolean {
        return message.reactions.cache.has(Election.LoserCandidateReaction);
    }

    private static messageIsWinnerCandidate(message: Message): boolean {
        return message.reactions.cache.has(Election.WinnerCandidateReaction);
    }

    // Returns if any changes were made
    private fixVoteValues(): string[] {
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

        // Remember how many voters are left with votes
        this.voterCount = checkedVoters.size;
        return fixedVoters;
    }

    private findWinner(): Candidate | undefined {
        const neededVotes: number = Math.floor(this.voterCount / 2.0) + 1;

        let winner: Candidate | undefined;
        if (this.candidates.length === 1) {
            // This can technically happen if there are no voters
            winner = this.candidates[0];
            this.logLine('As the last remaining candidate, "' + winner.name + '" wins!');
        } else {
            winner = this.candidates.find((candidate: Candidate) => candidate.voteCount(0) >= neededVotes);
            if (winner !== undefined) {
                this.logLine('With a majority of ' + winner.voteCount(0) + ' of the remaining ' + this.voterCount + ' top rank votes, "' + winner.name + '" wins!');
            }
        }

        return winner;
    }

    private pickLoser(): Candidate {
        // First figure out the current lowest value for number of #1 votes any candidate has
        let lowestTopVotes: number = this.voterCount; // This is the highest possible value
        for (const candidate of this.candidates) {
            lowestTopVotes = Math.min(lowestTopVotes, candidate.voteCount(0));
        }

        // Now pull out all candidates that have the lowest #1 votes and remember their "preference score"
        const lowestTopVotesCandidates: Map<Candidate, number> = new Map();
        this.candidates.forEach((candidate: Candidate) => {
            if (candidate.voteCount(0) === lowestTopVotes) {
                // Calculate this candidate's "score".
                // Someone not voting for the candidate, gives the candidate 0 points.
                // Someone ranking the candidate last of all the remaining candidates gives the candidate 1 point.
                // Someone ranking the candidate second to last gives the candidate 2 points.
                // etc. etc
                let score: number = 0;
                for (let ordinal: number = 0; ordinal < this.candidates.length; ++ordinal) {
                    score += (this.candidates.length - ordinal) * candidate.voteCount(ordinal);
                }

                lowestTopVotesCandidates.set(candidate, score);
            }
        });

        // If we only have one candidate that has the lowest number of top votes, that's our loser
        if (lowestTopVotesCandidates.size === 1) {
            const loser: Candidate = lowestTopVotesCandidates.keys().next().value;
            this.logLine('Eliminating candidate with lowest number of top votes: ' + loser.name);
            return loser;
        }

        // Let's log the state of things
        this.logLine('Multiple candidates are tied for lowest number of top votes. Calculating preference scores:');
        let scoreText: string = '';
        lowestTopVotesCandidates.forEach((score: number, candidate: Candidate) => scoreText += '  "' + candidate.name + '": ' + score);
        this.logLine(scoreText);

        // Figure out what the lowest score is
        let lowestScore = this.candidates.length * this.voterCount; // This is the highest possible score
        lowestTopVotesCandidates.forEach((score: number) => lowestScore = Math.min(lowestScore, score));

        // Pull out all the lowest scorers
        const lowestScorers: Candidate[] = [];
        lowestTopVotesCandidates.forEach((score: number, candidate: Candidate) => { if (score === lowestScore) { lowestScorers.push(candidate); } });

        // See if there's an obvious single loser
        if (lowestScorers.length === 1) {
            const loser: Candidate = lowestScorers[0];
            this.logLine('Eliminating candidate with lowest preference score: ' + loser.name);
            return loser;
        }

        // Looks like something must be eliminated by pure random chance...
        { // Put in a block to keep using the 'loser' name
            const loser: Candidate = lowestScorers[Math.floor(Math.random() * lowestScorers.length)];
            this.logLine('Multiple candidates are tied for lowest score. Eliminating a tied candidate at random: ' + loser.name);
            return loser;
        }
    }

    private logLine(line: string) {
        if (this.log.length > 0) {
            this.log += '\n';
        }

        this.log += line;
    }
}