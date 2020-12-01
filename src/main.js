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

    const userId = parsed.reader.getUserID();
    if (userId === null)
        return;

    const user = await client.users.fetch(userId);
    if (user === null)
        return;
    if (user.bot)
        return;
    const member = await msg.guild.members.resolve(user);

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