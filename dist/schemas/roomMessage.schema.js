import { Schema, model } from "mongoose";
const RoomMessageSchema = new Schema({
    room: {
        type: String,
        index: true
    },
    unix: {
        type: Number,
        index: true
    },
    user: String,
    message: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const RoomMessageModel = model('roommessages_cb', RoomMessageSchema);
export { RoomMessageModel };
