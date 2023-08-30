import { Schema, model } from 'mongoose'
import { IEvent } from '../interfaces/event.interface'

const EventSchema = new Schema<IEvent>({
    user: {
        type: String,
        index: true,
    },
    amount: {
        type: Number,
        index: true,
    },
    username: String,
    event: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const EventModel = model<IEvent>('events_cb', EventSchema)
export { EventModel }