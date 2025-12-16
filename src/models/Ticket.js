const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    ticketNumber: { type: Number, required: true },
    channelId: { type: String, required: true },
    
    openerId: { type: String, required: true },
    openerTag: { type: String, default: null },
    
    status: { type: String, enum: ['open', 'closed', 'deleted'], default: 'open' },
    
    claimedBy: { type: String, default: null },
    claimedByTag: { type: String, default: null },
    claimedAt: { type: Date, default: null },
    
    closedBy: { type: String, default: null },
    closedByTag: { type: String, default: null },
    closedAt: { type: Date, default: null },
    
    deletedBy: { type: String, default: null },
    deletedByTag: { type: String, default: null },
    deletedAt: { type: Date, default: null },
    
    addedMembers: [{ type: String }],
    
    answers: [{
        question: String,
        answer: String
    }],
    
    transcriptUrl: { type: String, default: null }
}, { timestamps: true });

ticketSchema.index({ guildId: 1, ticketNumber: 1 }, { unique: true });
ticketSchema.index({ guildId: 1, channelId: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
