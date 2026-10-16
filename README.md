<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:ffffff,100:29b6f6&height=180&section=header&text=Discord%20Bot&fontSize=45&fontColor=01579b&fontAlignY=35&animation=fadeIn&desc=Self-hosted%20%7C%20Full%20featured&descAlignY=58&descSize=18&descColor=01579b" />

<img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=600&size=22&pause=1000&color=29B6F6&center=true&vCenter=true&width=520&lines=Moderation+%7C+Tickets+%7C+Clans;Economy+%7C+Levels+%7C+Auto+Setup;Built+with+discord.js" alt="typing" />

<img src="https://i.pinimg.com/736x/8b/75/07/8b750705f5ffb1b8c0684c58744378ac.jpg" width="360" />

<br/>

![Node.js](https://img.shields.io/badge/Node.js-18%2B-29b6f6?style=for-the-badge&logo=node.js&logoColor=white)
![discord.js](https://img.shields.io/badge/discord.js-v14-29b6f6?style=for-the-badge&logo=discord&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-database-29b6f6?style=for-the-badge&logo=mongodb&logoColor=white)

</div>

<br/>

<div align="center">

### 🐾 A full-featured Discord bot with prefix `&` and slash commands.

</div>

## 🎮 What it does

- **Moderation** — ban, kick, timeout, warnings, jail, softban, and more.
- **Economy & levels** — real balances, daily rewards, XP, and profile/rank cards generated live.
- **Clans** — create, manage, and track clans with roles and voice-time stats.
- **Tickets & apply panels** — support tickets and staff applications with buttons and logs.
- **Auto roles, verification, temp voice, counters, auto reply** — configurable through `&setup`.
- **Premium features** — subscriptions, themes, and extra tools for premium servers.

## 💙 Highlights

- **Self-hosted, full control** — your data, your MongoDB, your bot token.
- **Open source** — every command is a readable file you can change.
- **Actively developed** — real logic (economy, clans, moderation, channel locks...) keeps landing.

## 🐟 Setup

1. Install Node.js 18 or newer.
2. `npm install`
3. Have a MongoDB server ready (local `mongod` or a free Atlas cluster).
4. Copy `.env.example` to `.env` and fill in the values (bot token, MongoDB URI, webhooks...).
5. In the Discord Developer Portal, enable **Message Content Intent** and **Server Members Intent** for your bot.
6. Invite the bot with the `bot` scope and permissions to send messages, embed links, attach files, add reactions, read message history, and manage roles.
7. `npm start`

## 🧩 Adding to the bot

| Adding | Where | Picked up by |
| --- | --- | --- |
| Prefix command | `commands/<category>/<name>.js` exporting `name` + `execute` | `utils/runtime/loader.js` |
| Slash command | `slash/<category>/<name>.js` with a `ROWS` table, then `npm run deploy` | `utils/runtime/loader.js` |
| Event listener | `events/<name>.js` exporting `name` + `execute` | `utils/runtime/loader.js` |
| Button / modal / select panel | its file in `handlers/<feature>/`, plus one entry in that folder's `index.js` `routes` | `handlers/interactionRouter.js` |
| Logic shared by `&cmd` and `/cmd` | `services/<area>.js`; both commands call it | — |

Rules that keep new code from breaking old code:

- **Write the logic once.** If a prefix and a slash command do the same thing, the work lives in `services/`, and both just parse their input and call it (see `services/moderation.js`).
- **Give every customId its own prefix.** The tests fail if two routes claim the same ID.
- **Don't spread modules into a barrel** (`{ ...a, ...b }`). Use `mergeExports` from `utils/runtime/mergeExports.js`, which refuses clashing names.
- **Build panels from a table, don't paste recorded JSON.** A page of buttons is a list of `[id, label, description]` rows and a function that turns them into components (see `PAGES` in `commands/setup/setup.js`). Adding a button is then one line.
- **Load heavy libraries on first use**, not at the top of a file that every command imports (see `utils/render/canvas.js`).

Before every commit run:

```
npm run check
```

It runs ESLint and the tests in `test/`. They need no token and no database, and they check that every file loads, names are unique, every slash command points at a command that exists, no two routes clash, and every `path.join(__dirname, ...)` file exists.

> 🐾 Actively developed — may still have bugs.

<div align="center">
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:ffffff,100:29b6f6&height=120&section=footer" />
</div>
