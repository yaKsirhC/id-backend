import { Schema, model } from 'mongoose'
import { IStream } from '../interfaces/stream.interface'

const StreamSchema = new Schema<IStream>({
    user: {
        type: String,
        index: true,
    },
    tokens: Number,
    seconds: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const StreamModel = model<IStream>('streams_cb', StreamSchema)
export { StreamModel }