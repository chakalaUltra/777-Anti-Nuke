const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const MongoStore = require('connect-mongo').default;
const path = require('path');
const cookieParser = require('cookie-parser');

const Guild = require('../models/Guild');
const TicketConfig = require('../models/TicketConfig');

function createDashboard(client) {
    const app = express();

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.use(session({
        secret: process.env.SESSION_SECRET || 'your-secret-key-here',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ 
            mongoUrl: process.env.MongoDB,
            ttl: 14 * 24 * 60 * 60
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            secure: false
        }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    const callbackURL = process.env.REPLIT_DEPLOYMENT 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/auth/discord/callback`
        : `http://localhost:5000/auth/discord/callback`;

    if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
        passport.use(new DiscordStrategy({
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: process.env.CALLBACK_URL || callbackURL,
            scope: ['identify', 'guilds']
        }, (accessToken, refreshToken, profile, done) => {
            profile.accessToken = accessToken;
            return done(null, profile);
        }));
    }

    app.use((req, res, next) => {
        res.locals.user = req.user;
        res.locals.client = client;
        next();
    });

    function isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) return next();
        res.redirect('/login');
    }

    async function hasGuildAccess(req, res, next) {
        const guildId = req.params.guildId;
        const userGuilds = req.user.guilds || [];
        
        const guild = userGuilds.find(g => g.id === guildId);
        if (!guild) {
            return res.redirect('/dashboard?error=no_access');
        }

        const permissions = BigInt(guild.permissions);
        const ADMINISTRATOR = BigInt(0x8);
        const MANAGE_GUILD = BigInt(0x20);

        if ((permissions & ADMINISTRATOR) !== ADMINISTRATOR && 
            (permissions & MANAGE_GUILD) !== MANAGE_GUILD) {
            return res.redirect('/dashboard?error=no_permission');
        }

        const botGuild = client.guilds.cache.get(guildId);
        if (!botGuild) {
            return res.redirect('/dashboard?error=bot_not_in_guild');
        }

        req.guildData = { guild, botGuild };
        next();
    }

    app.get('/', (req, res) => {
        if (req.isAuthenticated()) {
            return res.redirect('/dashboard');
        }
        res.render('index', { client });
    });

    app.get('/login', (req, res) => {
        if (req.isAuthenticated()) {
            return res.redirect('/dashboard');
        }
        res.render('login');
    });

    app.get('/auth/discord', passport.authenticate('discord'));

    app.get('/auth/discord/callback', 
        passport.authenticate('discord', { failureRedirect: '/login' }),
        (req, res) => {
            res.redirect('/dashboard');
        }
    );

    app.get('/logout', (req, res) => {
        req.logout(() => {
            res.redirect('/');
        });
    });

    app.get('/dashboard', isAuthenticated, async (req, res) => {
        const userGuilds = req.user.guilds || [];
        
        const guildsWithBot = userGuilds.filter(guild => {
            const permissions = BigInt(guild.permissions);
            const ADMINISTRATOR = BigInt(0x8);
            const MANAGE_GUILD = BigInt(0x20);
            
            const hasPermission = (permissions & ADMINISTRATOR) === ADMINISTRATOR || 
                                 (permissions & MANAGE_GUILD) === MANAGE_GUILD;
            
            return hasPermission;
        }).map(guild => {
            const botGuild = client.guilds.cache.get(guild.id);
            return {
                ...guild,
                hasBot: !!botGuild,
                memberCount: botGuild ? botGuild.memberCount : null
            };
        });

        res.render('dashboard', { guilds: guildsWithBot, client });
    });

    app.get('/dashboard/:guildId', isAuthenticated, hasGuildAccess, async (req, res) => {
        const { botGuild } = req.guildData;
        
        let guildSettings = await Guild.findOne({ guildId: botGuild.id });
        if (!guildSettings) {
            guildSettings = await Guild.create({ guildId: botGuild.id });
        }

        let ticketConfig = await TicketConfig.findOne({ guildId: botGuild.id });

        const textChannels = botGuild.channels.cache
            .filter(c => c.type === 0)
            .map(c => ({ id: c.id, name: c.name }));

        const categories = botGuild.channels.cache
            .filter(c => c.type === 4)
            .map(c => ({ id: c.id, name: c.name }));

        const roles = botGuild.roles.cache
            .filter(r => !r.managed && r.id !== botGuild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => ({ id: r.id, name: r.name, color: r.hexColor }));

        res.render('guild', { 
            guild: botGuild, 
            guildSettings, 
            ticketConfig,
            textChannels,
            categories,
            roles,
            client
        });
    });

    app.get('/dashboard/:guildId/logs', isAuthenticated, hasGuildAccess, async (req, res) => {
        const { botGuild } = req.guildData;
        
        let guildSettings = await Guild.findOne({ guildId: botGuild.id });
        if (!guildSettings) {
            guildSettings = await Guild.create({ guildId: botGuild.id });
        }

        const textChannels = botGuild.channels.cache
            .filter(c => c.type === 0)
            .map(c => ({ id: c.id, name: c.name }));

        res.render('logs', { 
            guild: botGuild, 
            guildSettings,
            textChannels,
            client
        });
    });

    app.get('/dashboard/:guildId/tickets', isAuthenticated, hasGuildAccess, async (req, res) => {
        const { botGuild } = req.guildData;
        
        let ticketConfig = await TicketConfig.findOne({ guildId: botGuild.id });

        const textChannels = botGuild.channels.cache
            .filter(c => c.type === 0)
            .map(c => ({ id: c.id, name: c.name }));

        const categories = botGuild.channels.cache
            .filter(c => c.type === 4)
            .map(c => ({ id: c.id, name: c.name }));

        const roles = botGuild.roles.cache
            .filter(r => !r.managed && r.id !== botGuild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => ({ id: r.id, name: r.name, color: r.hexColor }));

        res.render('tickets', { 
            guild: botGuild, 
            ticketConfig,
            textChannels,
            categories,
            roles,
            client
        });
    });

    app.get('/dashboard/:guildId/moderation', isAuthenticated, hasGuildAccess, async (req, res) => {
        const { botGuild } = req.guildData;
        
        let guildSettings = await Guild.findOne({ guildId: botGuild.id });
        if (!guildSettings) {
            guildSettings = await Guild.create({ guildId: botGuild.id });
        }

        const textChannels = botGuild.channels.cache
            .filter(c => c.type === 0)
            .map(c => ({ id: c.id, name: c.name }));

        const roles = botGuild.roles.cache
            .filter(r => !r.managed && r.id !== botGuild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => ({ id: r.id, name: r.name, color: r.hexColor }));

        res.render('moderation', { 
            guild: botGuild, 
            guildSettings,
            textChannels,
            roles,
            client
        });
    });

    app.post('/api/guild/:guildId/logs', isAuthenticated, hasGuildAccess, async (req, res) => {
        try {
            const { botGuild } = req.guildData;
            const { logType, channelId } = req.body;

            let guildSettings = await Guild.findOne({ guildId: botGuild.id });
            if (!guildSettings) {
                guildSettings = await Guild.create({ guildId: botGuild.id });
            }

            if (!guildSettings.logChannels) {
                guildSettings.logChannels = {};
            }

            guildSettings.logChannels[logType] = channelId || null;
            guildSettings.markModified('logChannels');
            await guildSettings.save();

            res.json({ success: true });
        } catch (error) {
            console.error('Error updating logs:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/guild/:guildId/tickets', isAuthenticated, hasGuildAccess, async (req, res) => {
        try {
            const { botGuild } = req.guildData;
            const config = req.body;

            let ticketConfig = await TicketConfig.findOne({ guildId: botGuild.id });
            
            if (ticketConfig) {
                Object.assign(ticketConfig, {
                    panelChannelId: config.panelChannelId,
                    panelTitle: config.panelTitle,
                    panelDescription: config.panelDescription,
                    panelColor: config.panelColor,
                    askQuestions: config.askQuestions === 'true' || config.askQuestions === true,
                    questions: config.questions || [],
                    ticketCategoryId: config.ticketCategoryId,
                    closedCategoryId: config.closedCategoryId,
                    logChannelId: config.logChannelId,
                    supportRoles: config.supportRoles || [],
                    pingSupportOnCreate: config.pingSupportOnCreate === 'true' || config.pingSupportOnCreate === true,
                    welcomeMessage: config.welcomeMessage,
                    dmTranscript: config.dmTranscript === 'true' || config.dmTranscript === true
                });
            } else {
                ticketConfig = new TicketConfig({
                    guildId: botGuild.id,
                    ...config,
                    askQuestions: config.askQuestions === 'true' || config.askQuestions === true,
                    pingSupportOnCreate: config.pingSupportOnCreate === 'true' || config.pingSupportOnCreate === true,
                    dmTranscript: config.dmTranscript === 'true' || config.dmTranscript === true
                });
            }

            await ticketConfig.save();
            res.json({ success: true });
        } catch (error) {
            console.error('Error updating ticket config:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/guild/:guildId/tickets/send-panel', isAuthenticated, hasGuildAccess, async (req, res) => {
        try {
            const { botGuild } = req.guildData;
            
            let ticketConfig = await TicketConfig.findOne({ guildId: botGuild.id });
            if (!ticketConfig) {
                return res.status(400).json({ success: false, error: 'Ticket system not configured' });
            }

            const panelChannel = botGuild.channels.cache.get(ticketConfig.panelChannelId);
            if (!panelChannel) {
                return res.status(400).json({ success: false, error: 'Panel channel not found' });
            }

            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

            const panelEmbed = new EmbedBuilder()
                .setTitle(ticketConfig.panelTitle)
                .setDescription(ticketConfig.panelDescription)
                .setColor(ticketConfig.panelColor)
                .setFooter({ text: 'Click the button below to create a ticket' });

            const createButton = new ButtonBuilder()
                .setCustomId('ticket_create')
                .setLabel('Create Ticket')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫');

            const row = new ActionRowBuilder().addComponents(createButton);

            const panelMessage = await panelChannel.send({ embeds: [panelEmbed], components: [row] });
            ticketConfig.panelMessageId = panelMessage.id;
            await ticketConfig.save();

            res.json({ success: true });
        } catch (error) {
            console.error('Error sending ticket panel:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/guild/:guildId/settings', isAuthenticated, hasGuildAccess, async (req, res) => {
        try {
            const { botGuild } = req.guildData;
            const { prefix } = req.body;

            let guildSettings = await Guild.findOne({ guildId: botGuild.id });
            if (!guildSettings) {
                guildSettings = await Guild.create({ guildId: botGuild.id });
            }

            if (prefix) {
                guildSettings.prefix = prefix;
            }

            await guildSettings.save();
            res.json({ success: true });
        } catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return app;
}

module.exports = { createDashboard };
