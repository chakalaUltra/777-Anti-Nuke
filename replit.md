# Anti-Nuke Discord Bot

## Overview
A comprehensive Discord anti-nuke and auto-moderation bot with full protection against server nuking, automated moderation, logging, and customizable permissions system.

## Features

### Anti-Nuke Protection
- Detects mass channel creation/deletion
- Detects mass role creation/deletion
- Detects mass bans/kicks
- Detects webhook spam
- Notifies server owner via DMs
- Auto-bans nukers and blacklisted bots

### Auto-Moderation
- Blocked words system with customizable actions (warn, mute, kick, ban)
- Mute duration configuration
- Automatic logging

### Moderation Commands
- ban, kick, mute, unmute, unban
- warn, warnings, delwarn
- purge, slowmode, lock, unlock
- userinfo, serverinfo

### Permission System
- Default: Admin permission required
- Dangerous commands: Role must be above bot
- Custom role permissions via perm-add/perm-remove

### Logging
- Moderation logs
- Deleted/Edited message logs
- Anti-nuke alerts
- AutoMod logs

## Project Structure
```
├── index.js                    # Main entry point
├── src/
│   ├── config.js              # Bot configuration and custom emojis
│   ├── commands/
│   │   ├── antinuke/          # Anti-nuke commands
│   │   ├── automod/           # AutoMod commands
│   │   ├── logs/              # Log configuration commands
│   │   ├── moderation/        # Moderation commands
│   │   └── settings/          # Settings and permission commands
│   ├── events/                # Discord event handlers
│   ├── handlers/              # Command and event loaders
│   ├── models/                # MongoDB schemas
│   └── utils/                 # Utility functions
```

## Environment Variables Required
- `BOT_TOKEN` - Discord bot token
- `CLIENT_ID` - Discord application client ID
- `MongoDB` - MongoDB connection string

## Default Prefix
`?` (can be changed with `?setprefix` command)

## Command Categories

### Anti-Nuke Commands
- `?antinuke [on/off]` - Toggle anti-nuke protection
- `?antinuke-whitelist <add/remove/list> [user]`
- `?antinuke-blacklist <add/remove/list> [user]`
- `?antinuke-botwhitelist <add/remove/list> [botId]`
- `?antinuke-botblacklist <add/remove/list> [botId]`

### AutoMod Commands
- `?automod [on/off]` - Toggle automod
- `?blockedwords <add/remove/list> [word] [action] [duration]`

### Moderation Commands
- `?ban <user> [reason]`
- `?kick <user> [reason]`
- `?mute <user> [duration] [reason]`
- `?unmute <user> [reason]`
- `?unban <userId> [reason]`
- `?warn <user> [reason]`
- `?warnings [user]`
- `?delwarn <user> [number|all]`
- `?purge <amount> [user]`
- `?slowmode <duration|off>`
- `?lock [channel] [reason]`
- `?unlock [channel] [reason]`
- `?userinfo [user]`
- `?serverinfo`

### Settings Commands
- `?settings` - View all settings
- `?setprefix <prefix>` - Change prefix
- `?perm-add <role> <command|*>` - Add command permission to role
- `?perm-remove <role> <command|all>` - Remove command permission

### Log Commands
- `?logs` - View all log channels
- `?logs <type> add #channel` - Set log channel
- `?logs <type> remove` - Disable log type

## Recent Changes
- December 12, 2025: Initial bot creation with full anti-nuke and automod features
