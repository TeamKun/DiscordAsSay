const Discord = require('discord.js');
const Parser = require('discord-command-parser');
const config = require('config');

const prefix = "/";
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    const parsed = Parser.parse(msg, prefix);
    if (!parsed.success)
        return;
    if (parsed.command !== 'as')
        return

    if (!msg.guild.me.permissionsIn(msg.channel).has(Discord.Permissions.FLAGS.MANAGE_WEBHOOKS))
        return;

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

    const message = parsed.reader.getRemaining()
    if (message === null)
        return;

    const hooks = await msg.channel.fetchWebhooks();
    hooks.filter(e => e.name === 'AsSay').forEach(e => {
        e.send({
            content: message,
            username: member?.displayName ?? user.username,
            avatarURL: user.avatarURL(),
            nonce: msg.id
        });
    });
});

client.login(config.token);