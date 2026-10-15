# Barktooth Trade Bot

A Discord bot for Magic: The Gathering players to share the cards they're looking for.
Card names are checked against [Scryfall](https://scryfall.com), and profiles are stored in Firebase Firestore.

## Commands

| Command | What it does |
|---|---|
| `/createprofile [collection] [tradebinder]` | Create your profile, optionally with links to your collection and trade binder |
| `/addcards [cards]` | Add cards to your list. Type names separated by `;`, or leave empty to paste a longer list |
| `/removecard <card>` | Remove one card (autocompletes from your list) |
| `/updatelist` | Edit your whole list in a text box (one card per line; saving it empty clears the list) |
| `/tradelist [user]` | Show your list, or another user's |
| `/updatelinks [collection] [tradebinder]` | Change your links |
| `/tradelinks [user]` | Show your links, or another user's |

Pasted lists may include bullets and quantities (`2x Sol Ring`); these are stripped.
Names Scryfall doesn't recognize are skipped, with a "did you mean" suggestion when there is one.
Each user is limited to 5 commands per 10 seconds.

## Setup

You need [Node.js](https://nodejs.org) 20 or newer.

1. `npm install`
2. Create a Discord application and bot at the [Developer Portal](https://discord.com/developers/applications), then invite it to your server with the `bot` and `applications.commands` scopes.
3. Create a Firebase project with Firestore enabled, and download a service account key (Project settings → Service accounts).
4. Copy `config.example.json` to `config.json` and fill it in. This file is only read by the deploy scripts and is git-ignored.

### Environment variables (used by `index.js`)

| Variable | Contents |
|---|---|
| `CONFIG` | JSON like `{"token": "your-discord-bot-token"}` |
| `SERVICE_ACCOUNT_KEY` | The whole Firebase service account JSON, as one line |

PowerShell example for running locally:

```powershell
$env:CONFIG = '{"token":"YOUR_TOKEN"}'
$env:SERVICE_ACCOUNT_KEY = Get-Content serviceAccountKey.json -Raw
npm start
```

Never commit `config.json` or `serviceAccountKey.json`.

### Registering slash commands

Run this whenever you add or change a command's definition:

```bash
node deploy-commands.js          # one server (appears instantly, good for testing; needs guildId)
node deploy-commands-global.js   # every server (can take up to an hour)
```

### Deploying

The `Procfile` defines a `worker` process (`node index.js`) for Heroku-style hosts. Set the two environment variables above in your host's settings.

## Development

```bash
npm test
```

Tests use Node's built-in test runner and live in `test/`. GitHub Actions runs them, plus a syntax check, on every push and pull request.

### Project layout

- `index.js`: starts the bot, loads commands, routes slash commands, modals and autocomplete, applies the rate limit
- `commands/tradeCommands/`: one file per slash command. A command exports `data` and `execute`, and may also export `autocomplete`, or `modalId` and `modalSubmit` for text-box forms
- `db/users.js`: all Firestore access
- `helperFunctions/`: card list parsing, embeds, Scryfall checks, URL validation, rate limiting

### Data

Each profile is a document in the `users` collection, keyed by Discord user id:
`cards` (array of names), `collectionUrl`, `tradebinderUrl`, `createdAt`, `updatedAt`.
Older profiles with `highPrio`/`lowPrio` are merged into `cards` automatically.
