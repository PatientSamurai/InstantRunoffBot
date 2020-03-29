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
  - "test": Runs Nodemon to start:dev and auto watch source for changes.