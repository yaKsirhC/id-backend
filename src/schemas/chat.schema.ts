import { IChat } from '@interfaces/chat.interface'
import { Schema, model } from 'mongoose'

const ChatSchema = new Schema<IChat>({
    user: {
        type: String,
        index: true,
    },
    otherUser: {
        type: String,
        index: true,
    },
    lastMessage: {
        message: String,
        createdAt: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const ChatModel = model<IChat>('chats_cb', ChatSchema)
export { ChatModel }