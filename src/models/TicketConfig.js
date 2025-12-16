const mongoose = require('mongoose');

const ticketConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    
    panelChannelId: { type: String, default: null },
    panelMessageId: { type: String, default: null },
    panelTitle: { type: String, default: 'Support Tickets' },
    panelDescription: { type: String, default: 'Click the button below to create a support ticket.' },
    panelColor: { type: String, default: '#5865F2' },
    
    askQuestions: { type: Boolean, default: false },
    questions: [{ type: String }],
    
    ticketCategoryId: { type: String, default: null },
    closedCategoryId: { type: String, default: null },
    
    logChannelId: { type: String, default: null },
    
    supportRoles: [{ type: String }],
    pingSupportOnCreate: { type: Boolean, default: true },
    
    welcomeMessage: { type: String, default: 'Welcome to the ticket channel. Please be patient till the Support Team arrives!' },
    
    dmTranscript: { type: Boolean, default: false },
    
    ticketCounter: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('TicketConfig', ticketConfigSchema);
