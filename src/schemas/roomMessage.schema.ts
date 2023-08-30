import { IRoomMessage } from '@interfaces/roomMessage.interface'
import { Schema, model } from 'mongoose'

const RoomMessageSchema = new Schema<IRoomMessage>({
    room: {
        type: String,
        index: true,
    },
    unix: {
        type: Number,
        index: true,
    },
    user: String,
    message: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const RoomMessageModel = model<IRoomMessage>('roommessages_cb', RoomMessageSchema)
export { RoomMessageModel }