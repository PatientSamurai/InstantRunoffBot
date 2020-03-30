# Usage

To run an election:
1. Enter some kind of "start" message into your channel.
    - The content of the message isn't important.
    - Add the :beginner: reaction (🔰) to mark that it's the start message.
2. List each of your candidates as separate messages.
    - Add a checkmark reaction to each candidate. e.g. :white_check_mark: (✅).
    - The bot will trim all non-alphanumeric characters from the starts and ends so dress the text up however you would like.
3. Have all of your voters react to each candidate with their preference order.
    - Use the :one:, :two:, :three: etc. reactions to mark the user's first, second, third etc. preferences.
    - :zero: counts as the user's tenth option
    - Having more than 10 candidates is supported, but having a voter rank more than 10 options is not.
    - Voters may stop ranking once they no longer care about the ordering of the remaining candidates.
    - Voters voting twice on the same candidate, or voting the same rank on multiple candidates will be detected and will cause an error message.
4. Once all votes are in, optionally run the '!vote audit' command.
    - '!vote audit' will have the bot parse the election and parrot it back in chat.
    - If the bot detects any voting errors, they will be displayed at this time.
5. Once you wish to run the tabulation, use the '!vote tabulate' command.
    - If you define a role with the name 'ElectionAdmin', the bot will enforce only users with that role can run this command.
    - If the role 'ElectionAdmin' is not defined in your server, the bot will allow anyone to run this command.
    - The bot will run an instant runoff election, and narrow down the candidates to a single winner.
    - The bot will tell you every step it takes and then display the winner.
    - The bot will mark the winning candidate with a :trophy: reaction (🏆).
    - The bot will mark the starting message with a :checkered_flag: reaction (🏁) to mark the election as complete.
6. The '!vote reset' command will reset the most recent election so that it can be run again.
    - This command also requires the 'ElectionAdmin' role if it exists.
7. The '!vote help' command will print usage commands.

How instant runoff voting is handled:
1. If there are currently any candidates with a majority of the remaining votes, that candidate wins.
2. If there is no candidate with a majority of the votes, the bot will pick a candidate to remove.
3. If there is a single candidate that has the least number of #1 votes, the bot will eliminate that candidate.
4. If there are multiple candidates with the least number of #1 votes, the bot will compute a "preference score" for each candidate:
    - A person who voted that candidate "last" this gives the candidate 1 point.
    - If a person voted that candidate "second to last" this gives the candidate 2 points.
    - etc.
5. If there's a single candidate with the lowest score, the bot will eliminate that candidate.
6. If there are multiple candidates tied for the lowest score, the bot will eliminate a random one of those candidates.
7. Once the bot has removed a loser, the bot will defragment all the voters' remaining votes to make sure every voter's votes are promoted.
8. Repeat step 1.

# Development

Set up:
1. Clone repo.
2. Copy "src/auth-data.ts.sample" to "src/auth-data.ts" and insert bot secret.
3. Install Node.js from https://nodejs.org.
4. Run "npm install" from source root.

Run:
1. Run "npm run start" from source root.

Debug:
1. Run "npm run test" from source root.
2. Open "chrome://inspect/" in Chrome.
3. Click "Open dedicated DevTools for Node".

NPM Scripts:
- "build": Calls TypeScript to transcompile to JavaScript.
- "start": Builds TypeScript and runs built JavaScript with Node.
- "build:dev": Builds TypeScript and runs static TSLint check.
- "start:dev": Starts TS Node with inspector against source.
- "build:watch": Runs Nodemon to call build:dev and watch source for changes.
- "start:watch": Runs Nodemon to start:dev and watch source for changes.