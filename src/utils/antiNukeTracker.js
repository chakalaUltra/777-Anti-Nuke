const config = require('../config');

const actionCache = new Map();

function getKey(guildId, userId, eventType) {
    return `${guildId}-${userId}-${eventType}`;
}

function trackAction(guildId, userId, eventType) {
    const key = getKey(guildId, userId, eventType);
    const now = Date.now();
    const eventConfig = config.antiNukeEvents[eventType];
    
    if (!eventConfig) return { triggered: false, count: 0 };
    
    if (!actionCache.has(key)) {
        actionCache.set(key, []);
    }
    
    const actions = actionCache.get(key);
    
    const validActions = actions.filter(timestamp => now - timestamp < eventConfig.time);
    validActions.push(now);
    
    actionCache.set(key, validActions);
    
    setTimeout(() => {
        const current = actionCache.get(key);
        if (current) {
            const filtered = current.filter(t => Date.now() - t < eventConfig.time);
            if (filtered.length === 0) {
                actionCache.delete(key);
            } else {
                actionCache.set(key, filtered);
            }
        }
    }, eventConfig.time + 1000);
    
    return {
        triggered: validActions.length >= eventConfig.limit,
        count: validActions.length,
        limit: eventConfig.limit
    };
}

function clearActions(guildId, userId) {
    for (const [key] of actionCache) {
        if (key.startsWith(`${guildId}-${userId}`)) {
            actionCache.delete(key);
        }
    }
}

module.exports = {
    trackAction,
    clearActions
};
