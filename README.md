# Overview

InstantRunoffBot is a Discord chat bot that allows you to hold [instant runoff elections](https://en.wikipedia.org/wiki/Instant-runoff_voting) in your Discord channels. All you have to do is list all your candidates, decorate the messages with some reactions so the bot can parse them, have your users react to them with their ordered preferences, and then just set the bot free. The bot will quickly run an instant runoff election and tell you which candidate wins and also show you its work!

# Usage

## To run an election
1. Enter some kind of "start" message into your channel. e.g. "What movie should we watch next week?"
    - The content of the message isn't important.
    - Add the `:beginner:` reaction (🔰) to mark that it's the start message.
2. List each of your candidates as separate messages.
    - Add a checkmark reaction to each candidate. e.g. `:white_check_mark:` (✅).
    - The bot will trim all non-alphanumeric characters from the starts and ends so dress the text up however you would like.
    - Who sends the message isn't important so you can have your users nominate their own candidates too.
3. Have all of your voters react to each candidate with their preference order.
    - Use the `:one:`, `:two:`, `:three:` etc. reactions (1️⃣, 2️⃣, 3️⃣) to mark the user's first, second, third etc. preferences.
    - `:zero:` (0️⃣) counts as the user's tenth option
    - Having more than 10 candidates is supported, but having a voter rank more than 10 options is not.
    - Voters may stop ranking once they no longer care about the ordering of the remaining candidates.
    - Voters voting twice on the same candidate, or voting the same rank on multiple candidates will be detected and will cause an error message.
4. Once all votes are in, optionally run the `!vote audit` command.
    - `!vote audit` will have the bot parse the election and parrot it back in chat.
    - If the bot detects any voting errors, they will be displayed at this time.
5. Once you wish to run the election, use the `!vote tabulate` command.
    - If you define a role with the name `ElectionAdmin`, the bot will enforce only users with that role can run this command.
    - If the role `ElectionAdmin` is not defined in your server, the bot will allow anyone to run this command.
    - The bot will run an instant runoff election and narrow down the candidates to a single winner.
    - The bot will tell you every step it takes and then display the winner.
    - The bot will mark the winning candidate with a `:trophy:` reaction (🏆).
    - The bot will mark the starting message with a `:checkered_flag:` reaction (🏁) to mark the election as complete.
6. The `!vote reset` command will reset the most recent election so that it can be run again.
    - This command also requires the `ElectionAdmin` role if it exists in your server.
7. The `!vote help` command will print usage commands.

## How instant runoff voting is handled
1. If there are currently any candidates with a majority of the remaining #1 votes, that candidate wins.
2. If there is no candidate with a majority of the remaining #1 votes, the bot will pick one or more candidates to remove:
    1. If there is a single candidate that has the least number of #1 votes, the bot will eliminate that candidate.
    2. If there are multiple candidates tied with the least number of #1 votes, and the sum of their votes is lower than the next highest top vote winner, they are all removed.
    3. If this is not the case, a random candidate with the lowest number of #1 votes is removed.
5. Once the bot has removed a loser(s), the bot will defragment all the voters' remaining votes to make sure every voter's votes are promoted.
6. Loop to step 1.

# Development

## Create a new Discord application and bot
1. Head to [Discord's developer portal](https://discord.com/developers/applications).
2. Click on the "New Application" button.
3. Enter a name and optionally select a team (if you want the bot to belong to one). Then confirm the pop-up window by clicking the "Create" button.
4. Selecting the "Bot" tab in the left pane.
5. Click the "Add Bot" button on the right and confirm the pop-up window by clicking "Yes, do it!".
6. On this page, note the bot's Auth Token that can be copied and used in a following step.
7. Select the "OAuth2" tab in the left pane.
8. On this page, note the bot's Client ID that can be copied and used in a following step.

## Add bot to server
You can add the bot to your server navigating to this link: https://discord.com/oauth2/authorize?scope=bot%20applications.commands&permissions=68672&client_id=CLIENTID. Replace the client_id parameter with your own Client ID.

The value of 68672 for permissions corresponds with 0x10C40:
- 0x40 (Add reactions) |
- 0x400 (Read messages) |
- 0x800 (Send messages) |
- 0x10000 (Read message history)

which is the minimal set of permissions required for the bot to work properly.

## Set up
1. Clone repo.
2. Copy ".env.sample" to ".env" and insert your bot's Auth Token.
3. Install Node.js from https://nodejs.org.
4. Run "npm install" from source root.

## Run
1. Run "npm run start" from source root.

## Debug
1. Run "npm run start:watch" from source root.
2. Open "chrome://inspect/" in Chrome.
3. Click "Open dedicated DevTools for Node".

## NPM Scripts
- "build": Builds TypeScript to transcompile to JavaScript.
- "start": Builds TypeScript and runs built JavaScript with Node.
- "build:dev": Builds TypeScript and runs TSLint check.
- "start:dev": Starts TS Node with inspector against source.
- "build:watch": Runs Nodemon to call build:dev and watch source for changes.
- "start:watch": Runs Nodemon to call start:dev and watch source for changes.

## Documentation
The vast bulk of the interesting bot things are handled by the Discord.js package. Documentation on Discord.js can be found [here](https://discordjs.guide).

## Contribution
If you have issues or pull requests you would like me to consider, feel free to open them and I will do my best to handle them.
