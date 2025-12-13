function isWhitelistedForCategory(guildData, executorId, executorRoles, category, isBot = false) {
    const globalWhitelisted = guildData.antiNuke.whitelistedUsers || [];
    if (globalWhitelisted.includes(executorId)) return true;
    
    if (isBot) {
        const whitelistedBots = guildData.antiNuke.whitelistedBots || [];
        if (whitelistedBots.includes(executorId)) return true;
    }
    
    const categoryWhitelist = guildData.antiNuke.categoryWhitelist;
    if (!categoryWhitelist) return false;
    
    const allWhitelist = categoryWhitelist.all || { users: [], roles: [] };
    if (allWhitelist.users?.includes(executorId)) return true;
    if (executorRoles && allWhitelist.roles?.some(roleId => executorRoles.includes(roleId))) return true;
    
    const catWhitelist = categoryWhitelist[category];
    if (!catWhitelist) return false;
    
    if (catWhitelist.users?.includes(executorId)) return true;
    if (executorRoles && catWhitelist.roles?.some(roleId => executorRoles.includes(roleId))) return true;
    
    return false;
}

function isBlacklistedForCategory(guildData, executorId, executorRoles, category, isBot = false) {
    const globalBlacklisted = guildData.antiNuke.blacklistedUsers || [];
    if (globalBlacklisted.includes(executorId)) return true;
    
    if (isBot) {
        const blacklistedBots = guildData.antiNuke.blacklistedBots || [];
        if (blacklistedBots.includes(executorId)) return true;
    }
    
    const categoryBlacklist = guildData.antiNuke.categoryBlacklist;
    if (!categoryBlacklist) return false;
    
    const allBlacklist = categoryBlacklist.all || { users: [], roles: [] };
    if (allBlacklist.users?.includes(executorId)) return true;
    if (executorRoles && allBlacklist.roles?.some(roleId => executorRoles.includes(roleId))) return true;
    
    const catBlacklist = categoryBlacklist[category];
    if (!catBlacklist) return false;
    
    if (catBlacklist.users?.includes(executorId)) return true;
    if (executorRoles && catBlacklist.roles?.some(roleId => executorRoles.includes(roleId))) return true;
    
    return false;
}

module.exports = {
    isWhitelistedForCategory,
    isBlacklistedForCategory
};
