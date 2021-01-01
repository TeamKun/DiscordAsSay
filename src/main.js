const Discord = require('discord.js');
const Parser = require('discord-command-parser');
const config = require('config');
const url = require('url');

const prefix = "/";
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    const parsed = Parser.parse(msg, prefix);
    if (!parsed.success)
        return;
    if (parsed.command !== 'as' && parsed.command !== 'ascopy')
        return

    if (!msg.guild.me.permissionsIn(msg.channel).has(Discord.Permissions.FLAGS.MANAGE_WEBHOOKS))
        return;

    let message

    if (parsed.command === 'ascopy') {
        const cUrl = parsed.reader.getString()
        if (cUrl === null)
            return
        const cPath = url.parse(cUrl).path
        if (cPath === null)
            return
        const cMatch = cPath.match(/^\/channels\/(\d+)\/(\d+)\/(\d+)/)
        if (cMatch === null)
            return
        const [_, cGuildId, cChannelId, cMessageId] = cMatch
        const cChannel = await client.channels.fetch(cChannelId)
        if (cChannel == null)
            return
        const cMessage = await cChannel.messages.fetch(cMessageId)
        if (cMessage == null)
            return

        if (cMessage.author.bot)
            return;

        message = {
            content: cMessage.content,
            username: cMessage.member?.displayName ?? cMessage.author.username,
            avatarURL: cMessage.author.avatarURL(),
            nonce: msg.id,
            embeds: cMessage.embeds,
            files: Array.from(cMessage.attachments, ([key, e]) => {
                return {
                    name: e.name,
                    attachment: e.attachment,
                }
            })
        }
    } else {
        const userStr = parsed.reader.getString(true);
        const userId = parsed.reader.getUserID();

        let user = null
        let member = null
        if (userId != null)
            user = await client.users.fetch(userId);
        if (user == null) {
            const members = await msg.guild.members.fetch();
            member = members.find(e => e.user.tag === userStr);
            if (member == null)
                member = members.find(e => e.displayName === userStr);
            if (member == null)
                member = members.find(e => e.user.username === userStr);
        }
        if (user != null)
            member = await msg.guild.members.resolve(user);
        else if (member != null)
            user = member.user;

        if (user === null)
            return;
        if (user.bot)
            return;

        const content = parsed.reader.getRemaining()
        if (content === null)
            return

        message = {
            content,
            username: member?.displayName ?? user.username,
            avatarURL: user.avatarURL(),
            nonce: msg.id
        }
    }

    const hooks = await msg.channel.fetchWebhooks();
    hooks.filter(e => e.name === 'AsSay').forEach(e => {
        e.send(message);
    });
});

client.login(config.token);