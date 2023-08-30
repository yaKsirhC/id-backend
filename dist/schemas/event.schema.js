import { Schema, model } from "mongoose";
const EventSchema = new Schema({
    user: {
        type: String,
        index: true
    },
    amount: {
        type: Number,
        index: true
    },
    username: String,
    event: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const EventModel = model('events_cb', EventSchema);
export { EventModel };
