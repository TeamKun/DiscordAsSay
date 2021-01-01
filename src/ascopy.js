const Discord = require('discord.js')
const url = require('url')

module.exports = function (client) {
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`)

        client.api.applications(client.user.id).commands.post({
            data: {
                name: "ascopy",
                description: "他人のメッセージをそっくりコピーできます。",
                content: "AsCopy",
                options: [
                    {
                        name: "url",
                        description: "メッセージURL",
                        type: 3,
                        required: true,
                    }
                ]
            }
        })

        client.ws.on('INTERACTION_CREATE', async interaction => {
            const command = interaction.data.name.toLowerCase()

            if (command === 'ascopy') {
                const channel = await client.channels.fetch(interaction.channel_id)
                const {ok, reason} = await ascopy(channel, interaction.data.options[0].value)

                client.api.interactions(interaction.id, interaction.token).callback.post({
                    data: ok
                        ? {
                            type: 2
                        }
                        : {
                            type: 4,
                            data: {
                                content: '❌ ' + reason
                            }
                        }
                })
            }
        })
    })

    async function ascopy(channel, argUrl) {
        if (!channel.guild.me.permissionsIn(channel).has(Discord.Permissions.FLAGS.MANAGE_WEBHOOKS))
            return {ok: false, reason: "このチャンネルでは /ascopy は使用できません (Webhook権限の設定)"}

        const cUrl = argUrl
        if (cUrl === null)
            return {ok: false, reason: "メッセージURLを指定してください"}
        const cPath = url.parse(cUrl).path
        if (cPath === null)
            return {ok: false, reason: "メッセージURLが不正です"}
        const cMatch = cPath.match(/^\/channels\/(\d+)\/(\d+)\/(\d+)/)
        if (cMatch === null)
            return {ok: false, reason: "メッセージURLが不正です"}
        const [_, cGuildId, cChannelId, cMessageId] = cMatch
        const cChannel = await client.channels.fetch(cChannelId)
        if (cChannel == null)
            return {ok: false, reason: "Botが取得できないチャンネルのメッセージです"}
        const cMessage = await cChannel.messages.fetch(cMessageId)
        if (cMessage == null)
            return {ok: false, reason: "メッセージがみつからない、または削除されています"}

        let username = cMessage.member?.displayName ?? cMessage.author.username
        if (cMessage.author.bot)
            username += ' [Bot]'

        const message = {
            content: cMessage.content,
            username,
            avatarURL: cMessage.author.avatarURL(),
            embeds: cMessage.embeds,
            files: Array.from(cMessage.attachments, ([key, e]) => {
                return {
                    name: e.name,
                    attachment: e.attachment,
                }
            })
        }
        const hooks = await channel.fetchWebhooks()
        const assayHooks = hooks.filter(e => e.name === 'AsSay')
        if (assayHooks.size <= 0)
            return {ok: false, reason: "このチャンネルでは /ascopy は使用できません (Webhookの設定)"}
        assayHooks.forEach(e => e.send(message))

        return {ok: true}
    }
}