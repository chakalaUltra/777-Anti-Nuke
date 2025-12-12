module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);
        console.log(`Serving ${client.guilds.cache.size} servers`);
        
        client.user.setPresence({
            activities: [{ name: '?help | Anti-Nuke Protection', type: 3 }],
            status: 'online'
        });
    }
};
