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
- Timeout duration configuration (uses Discord's native timeout feature)
- Automatic logging

### Moderation Commands
- ban, kick, mute (timeout), unmute
- unban, warn, warnings, delwarn
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
│   │   ├── moderation/        # Moderation commands
│   │   └── settings/          # Settings and permission commands
│   ├── events/                # Discord event handlers
│   ├── handlers/              # Command and event loaders
│   ├── models/                # MongoDB schemas
│   └── utils/                 # Utility functions
```

## Environment Variables Required
- `DISCORD_TOKEN` - Discord bot token
- `CLIENT_ID` - Discord application client ID
- `MongoDB` - MongoDB connection string

## Commands

### Prefix Commands
Default prefix is `?` (can be changed with `?setprefix` command)

### Slash Commands
All commands are now available as both prefix commands and slash commands!
Type `/` in Discord to see all available slash commands.

## Command Categories

### Anti-Nuke Commands
- `antinuke [on/off]` - Toggle anti-nuke protection
- `antinuke-whitelist <add/remove/list> <category> [user/role]` - Category-specific whitelist for users/roles
- `antinuke-blacklist <add/remove/list> <category> [user/role]` - Category-specific blacklist for users/roles
- `antinuke-botwhitelist <add/remove/list> [botId]`
- `antinuke-botblacklist <add/remove/list> [botId]`

**Whitelist/Blacklist Categories:** bans, kicks, roles, channels, webhooks, emojis, all

### AutoMod Commands
- `automod [on/off]` - Toggle automod
- `blockedwords <add/remove/list> [word] [action] [duration]`

### Moderation Commands
- `ban <user> [reason]`
- `kick <user> [reason]`
- `mute <user> [duration] [reason]` - Uses Discord's native timeout feature
- `unmute <user> [reason]` - Removes Discord timeout
- `unban <userId> [reason]`
- `warn <user> [reason]`
- `warnings [user]`
- `delwarn <user> [number|all]`
- `purge <amount> [user]`
- `slowmode <duration|off>`
- `lock [channel] [reason]`
- `unlock [channel] [reason]`
- `userinfo [user]`
- `serverinfo`

### Settings Commands
- `settings` - View all settings
- `setprefix <prefix>` - Change prefix
- `perm-add <role> <command|*>` - Add command permission to role
- `perm-remove <role> <command|all>` - Remove command permission
- `help [command]` - View all commands or get info on a specific command

## Recent Changes
- December 13, 2025: Updated whitelist/blacklist commands to support both users AND roles with category-specific controls (bans, kicks, roles, channels, webhooks, emojis, all)
- December 12, 2025: Added slash command support for all commands
- December 12, 2025: Updated mute/unmute to use Discord's native timeout feature instead of mute roles
- December 12, 2025: Initial bot creation with full anti-nuke and automod features

## User Preferences
- Slash commands preferred over prefix commands
- Uses Discord's native timeout for muting instead of mute roles
