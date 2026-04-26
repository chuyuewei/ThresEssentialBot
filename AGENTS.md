# ThresEssentialBot - English Version

## Project Overview
Discord.js v14 moderation bot with slash commands, event handling, and logging.

## Development Commands

```bash
# Start bot (production)
npm start

# Start with file watching (dev)
npm run dev

# Deploy slash commands to Discord
npm run deploy
```

**Important**: `deploy-commands.js` currently deploys to a specific guild (dev mode). For production, uncomment the global registration route and comment out the guild-specific one.

## Required Environment Variables
Create `.env` file with:
- `DISCORD_TOKEN` - Bot token
- `CLIENT_ID` - Application ID
- `GUILD_ID` - Test server ID (for dev deployment)

## Architecture

### Command Structure
- Commands organized by category: `src/commands/{category}/`
- Each command file must export:
  - `data` - SlashCommandBuilder instance
  - `execute(interaction)` - Async handler function
- Commands loaded dynamically via `src/handlers/commandHandler.js`

### Event Structure
- Events in `src/events/`
- Each event file must export:
  - `name` - Discord.js event name (or Events enum)
  - `once` - Boolean (true for one-time events like 'ready')
  - `execute(...args)` - Async handler
- Events loaded dynamically via `src/handlers/eventHandler.js`

### Key Files
- `src/index.js` - Entry point, client setup, module loading
- `config.js` - Bot configuration (colors, emojis, moderation settings, log channel)
- `src/utils/logger.js` - Custom logger with colored output

### Discord.js Configuration
- Intents: Guilds, GuildMembers, GuildMessages, GuildModeration, MessageContent
- Partials: Message, Channel, GuildMember
- Commands stored in `client.commands` Collection

## Conventions

### Logging
Use `Logger.info()`, `Logger.success()`, `Logger.warn()`, `Logger.error()` instead of console.log.

### Embeds
Use `EmbedBuilder` from discord.js. Reference colors from `config.bot.*Color`.

### Error Handling
All async operations should have try-catch. Use `.catch(() => {})` for non-critical Discord API calls (like sending to log channels).

### Log Channel
Bot logs to channel named in `config.logs.channelName` (default: 'mod-logs'). Check `config.logs.enabled` before sending.

## Adding Features

### New Command
1. Create file in appropriate category: `src/commands/{category}/{name}.js`
2. Export `data` (SlashCommandBuilder) and `execute(interaction)`
3. Run `npm run deploy` to register with Discord

### New Event
1. Create file: `src/events/{eventName}.js`
2. Export `name`, `once`, and `execute(...args)`
3. Events auto-load on bot restart

## Data Storage
- `data/` directory for persistent data (ignored by git except structure)
- Currently uses SQLite database with Sequelize ORM
- Database file: `data/database.sqlite`
- Models: Users, Warnings, Votes, Reports, Events, Levels, Tickets, etc.

## Level System
- 5-tier rank system: Initiate → Operative → Specialist → Veteran → Elite
- Automatic role assignment on level up
- XP-based progression with configurable rates
- Use `/setupranks` for quick setup
- See `RANKS_GUIDE.md` for detailed setup instructions

## Ticket System
- Full ticket management system with create/close/transcript
- Automatic channel creation for each ticket
- Support role assignment and user management
- Use `/ticket setup` to configure the system
- See `SYSTEMS_GUIDE.md` for detailed usage

## Prefix System
- Automatic nickname prefix based on roles
- Configurable prefix position (before/after)
- Auto-apply on join and role change
- Use `/prefixconfig` to manage prefixes
- Example: Chinese users get [CN] prefix automatically
