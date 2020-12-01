const Discord = require('discord.js');
const Parser = require('discord-command-parser');
const config = require('config');
const axios = require('axios');

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

    const webhook = config.webhooks[msg.channel.id];
    if (webhook === undefined)
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

    await axios.post(webhook, {
        content: message,
        username: member?.displayName ?? user.username,
        avatar_url: user.avatarURL()
    })
});

client.login(config.token);