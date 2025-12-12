module.exports = {
    defaultPrefix: '?',
    emojis: {
        turned_on: '<:Turned_on:1449091870759190600>',
        turned_off: '<:Turned_off:1449091868787871970>',
        approved: '<:Approved:1449091866912882859>',
        loading: '<:1000069122:1449091864887169045>',
        x_: '<:X_:1449091863461232731>',
        redoing: '<:Redoing:1449091861426733106>',
        searching: '<:Searching:1449091859866718339>',
        document_approved: '<:Document_Approved:1449091858285334641>',
        user_member: '<:UserMember:1449091856871854081>',
        configure_settings: '<:ConfigureSettings:1449091787560845332>',
        notification: '<:Notification:1449091728274620598>',
        pin: '<:Pin:1449091687010926664>',
        note: '<:Note:1449091647802445985>',
        important: '<:Important:1449091597445628060>',
        alarm: '<:Alarm:1449091207836991498>',
        info: '<:Info:1449091151276806196>',
        question: '<:Question:1449091072625082522>'
    },
    colors: {
        success: 0x00FF00,
        error: 0xFF0000,
        warning: 0xFFFF00,
        info: 0x0099FF,
        antinuke: 0xFF4500,
        mod: 0x5865F2
    },
    antiNukeEvents: {
        channelCreate: { limit: 3, time: 10000 },
        channelDelete: { limit: 3, time: 10000 },
        roleCreate: { limit: 3, time: 10000 },
        roleDelete: { limit: 3, time: 10000 },
        memberBan: { limit: 5, time: 10000 },
        memberKick: { limit: 5, time: 10000 },
        webhookCreate: { limit: 2, time: 10000 },
        memberRoleUpdate: { limit: 10, time: 10000 }
    }
};
