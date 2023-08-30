import { IUser } from "@interfaces/user.interface.js"
import { ChatModel } from "@schemas/chat.schema.js"
import { EventModel } from "@schemas/event.schema.js"
import { MessageModel } from "@schemas/message.schema.js"
import { RoomMessageModel } from "@schemas/roomMessage.schema.js"
import { StreamModel } from "@schemas/stream.schema.js"
import { UserModel } from "@schemas/user.schema.js"
import { closeBrowser, launchBrowser, updateTimestamp } from "./browser.utils.js"
import { getCache } from "./cache.utils.js"
import { validateToken } from "./token.utils.js"
import { validateString } from "./validateText.utils.js"
import { assignVideoProcessToUser, closeVideoProcess, streamVideo } from './video.utils.js'
import crypto from 'crypto'

const streamingUsers = new Map<string, { initialBalance: number, balance: number, privateBalance: number, initStreamTimestamp: number }>()

const sendSocketMessage = (room: string, message: any) => {
    global.io.sockets.in(room).emit('data', message)
}

const handleSocket = async (socket: any) => {

    try {

        const { collection, token, username, streamKey } = socket.handshake.query

        if (token) {

            const { decoded, valid } = validateToken(token, false)
            if (!valid || !decoded) return

            const { id } = decoded
            const user = await UserModel.findOne({ _id: id }).lean().exec()
            if (!user) return

            if (collection === 'stream') {
                assignVideoProcessToUser(user._id.toString(), user.account_streamKey)
                socket.join(`stream-${user.account_username}`)
            }

        } else {

            if (collection === 'extension') {

                await UserModel.updateOne({ "account_username": username }, {
                    $set: {
                        "account_streamKey": streamKey
                    }
                }).lean().exec()

                socket.join(`extension-${username}`)

            }

        }


    } catch (err) {
        return
    }

}

const handleSocketMessage = async (message: any) => {

    try {

        const { token } = message

        if (!token) {

            if (!message.extension) return

            const { event, data, username } = message.extension

            let user: IUser

            const cached = await getCache(username)
            if (!cached.success) {
                const userDoc = await UserModel.findOne({ "account_username": username }).lean().exec()
                if (!userDoc) return
                user = userDoc
            } else {
                user = cached.doc
            }

            if (event === 'account:balance') {

                const newBalance = Number(data.balance)

                const doc = streamingUsers.get(user._id.toString())
                if (doc) {

                    const diff = newBalance - doc.balance

                    sendSocketMessage(`stream-${username}`, {
                        event: 'suite:tokens',
                        data: {
                            amount: diff
                        }
                    })

                    if (newBalance < doc.balance) return

                    let obj = {
                        balance: Number(newBalance),
                        initialBalance: doc.initialBalance,
                        initStreamTimestamp: doc.initStreamTimestamp,
                        privateBalance: diff
                    }

                    streamingUsers.set(user._id.toString(), obj)

                }

            }

            if (event === 'extension:ready') {

                sendSocketMessage(`stream-${username}`, {
                    event: 'suite:ready'
                })

            }

            if (event === 'room:status') {

                sendSocketMessage(`stream-${username}`, {
                    event: 'room:status',
                    data: {
                        status: data.status === 'public' ? 'Public' : data.status === 'private' ? 'Private' : data.status
                    }
                })

            }

            if (event === 'room:tip') {

                const tip = await EventModel.create({
                    amount: Number(data.amount),
                    event: 'tip',
                    user: user._id.toString(),
                    username: data.from_username,
                })

                const doc = streamingUsers.get(user._id.toString())
                if (doc) {
                    let obj = {
                        balance: doc.balance + Number(data.amount),
                        initialBalance: doc.initialBalance,
                        initStreamTimestamp: doc.initStreamTimestamp,
                        privateBalance: doc.privateBalance,
                    }
                    streamingUsers.set(user._id.toString(), obj)
                }

                sendSocketMessage(`stream-${username}`, {
                    event: 'room:tip',
                    data: {
                        id: tip._id.toString(),
                        amount: data.amount,
                        user: data.from_username,
                        message: data.message
                    }
                })

            }

            if (event === 'room:private') {
                sendSocketMessage(`stream-${username}`, {
                    event: 'room:private',
                    data: {
                        requested: true
                    }
                })
            }

            if (event === 'room:message') {

                const validMessage = validateString(data.message)
                if (!validMessage) return

                sendSocketMessage(`stream-${username}`, {
                    event: 'room:message',
                    data: {
                        id: crypto.randomUUID(),
                        message: data.message,
                        user: data.from_user.username === user.account_username ? 'me' : data.from_user.username
                    }
                })

                const document = await RoomMessageModel.create({
                    room: user._id.toString(),
                    message: data.message,
                    unix: Math.floor(Date.now() / 1000),
                    user: data.from_user.username === user.account_username ? 'me' : data.from_user.username
                })

            }

            if (event === 'room:notice') {
                sendSocketMessage(`stream-${username}`, {
                    event: 'room:notice',
                    data: {
                        message: data.messages[0],
                    }
                })
            }

            if (event === 'user:message') {

                const validMessage = validateString(data.message)
                if (!validMessage) return

                let chatId: any = null

                const otherUser = data.other_user
                const chat = await ChatModel.findOne({ user: user._id.toString(), otherUser }).lean().exec()

                if (!chat) {
                    const document = await ChatModel.create({
                        user: user._id.toString(),
                        otherUser
                    })
                    chatId = document._id.toString()
                } else {
                    chatId = chat._id.toString()
                }

                sendSocketMessage(`stream-${username}`, {
                    event: 'user:message',
                    data: {
                        id: crypto.randomUUID(),
                        message: data.message,
                        otherUser: data.other_user,
                        sender: data.from_user.username,
                    }
                })

                const message = await MessageModel.create({
                    chat: chatId,
                    user: data.from_user.username === user.account_username ? 'me' : data.from_user.username,
                    message: data.message,
                    seen: data.from_user.username === user.account_username ? true : false
                })

            }

        } else {

            const { decoded, valid } = validateToken(token, false)
            if (!(valid && decoded)) return

            const { id } = decoded

            let user: IUser

            const cached = await getCache(id)
            if (!cached.success) {
                const userDoc = await UserModel.findOne({ _id: id }).lean().exec()
                if (!userDoc) return
                user = userDoc
            } else {
                user = cached.doc
            }

            if (!message.stream) return

            const { event, data } = message.stream

            if (event === 'stream:start') {

                const userDocument = await UserModel.findOne({ _id: id }).lean().exec()
                if (!userDocument) return

                const { success } = await launchBrowser(user._id.toString(), user.account_username, user.account_password)

                if (!success) {
                    sendSocketMessage(`stream-${user.account_username}`, {
                        event: 'suite:restart'
                    })
                } else {
                    sendSocketMessage(`stream-${user.account_username}`, {
                        event: 'suite:ready'
                    })
                }

                const doc = streamingUsers.get(user._id.toString())
                if (!doc) {
                    streamingUsers.set(user._id.toString(), { initialBalance: userDocument.balance, balance: userDocument.balance, privateBalance: 0, initStreamTimestamp: Math.floor(Date.now() / 1000) })
                }

                let roomMessages = []
                let privateMessages = []

                const timestamp = (Math.floor(Date.now() / 1000) - 1800)
                const roomMsgs = await RoomMessageModel.find({ room: user._id.toString(), unix: { $gte: timestamp } }).sort({ _id: -1 }).limit(50).lean().exec()

                roomMessages = roomMsgs.reverse()

                const chats = await ChatModel.find({ user: user._id.toString() }).lean().exec()

                for (const c of chats) {
                    const messages = await MessageModel.find({ chat: c._id.toString() }).sort({ _id: -1 }).limit(50).lean().exec()
                    const unseenAmount = messages.filter(e => e.seen === false).length
                    privateMessages.push({
                        chat: c,
                        unseenAmount,
                        messages: messages.reverse()
                    })
                }

                sendSocketMessage(`stream-${user.account_username}`, {
                    event: 'suite:messages',
                    data: {
                        roomMessages,
                        privateMessages,
                    }
                })

            }

            if (event === 'suite:seen') {
                const chat = data.chat
                await MessageModel.updateMany({ chat }, {
                    $set: {
                        seen: true
                    }
                }).lean().exec()
            }

            if (event === 'stream:stop') {
                handleUserStoppedStreaming(user._id.toString())
            }

            if (event === 'stream:message') {
                sendSocketMessage(`extension-${user.account_username}`, {
                    event: 'room:message',
                    data: {
                        message: data.message
                    }
                })
            }

            if (event === 'stream:private') {
                sendSocketMessage(`extension-${user.account_username}`, {
                    event: 'user:message',
                    data: {
                        message: data.message,
                        toUser: data.toUser
                    }
                })
            }

            if (event === 'stream:accept-private') {
                sendSocketMessage(`extension-${user.account_username}`, {
                    event: 'room:accept-private',
                    data: {
                        accept: true
                    }
                })
            }

            if (event === 'stream:ping') {
                updateTimestamp(user._id.toString())
            }

            if (event === 'stream:video') {
                streamVideo(data.video, user._id.toString())
            }

        }

    } catch (err) {
        return
    }

}

const handleUserStoppedStreaming = async (userId: string) => {

    closeBrowser(userId)
    closeVideoProcess(userId)

    const doc = streamingUsers.get(userId)
    if (doc) {

        await StreamModel.create({
            seconds: Math.floor(Date.now() / 1000) - doc.initStreamTimestamp,
            tokens: doc.balance - doc.initialBalance,
            user: userId,
        })

        if (doc.privateBalance > 0) {
            await EventModel.create({
                amount: doc.privateBalance,
                event: 'Private Show',
                user: userId
            })
        }

        await UserModel.updateOne({ _id: userId }, {
            $set: {
                balance: doc.balance
            }
        }).lean().exec()

        streamingUsers.delete(userId)
    }

}

export {
    handleSocket,
    handleSocketMessage,
    handleUserStoppedStreaming
}