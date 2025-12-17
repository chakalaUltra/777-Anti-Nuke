const { Client, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');
const { loadCommands } = require('./src/handlers/commandHandler');
const { loadEvents } = require('./src/handlers/eventHandler');
const { createDashboard } = require('./src/dashboard/server');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildWebhooks
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember
    ]
});

async function start() {
    console.log('Starting Anti-Nuke Bot...');
    
    try {
        await mongoose.connect(process.env.MongoDB);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
    
    loadCommands(client);
    loadEvents(client);
    
    const dashboard = createDashboard(client);
    const PORT = 5000;
    dashboard.listen(PORT, '0.0.0.0', () => {
        console.log(`Dashboard running on http://0.0.0.0:${PORT}`);
    });
    
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('Failed to login:', error);
        process.exit(1);
    }
}

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

start();
