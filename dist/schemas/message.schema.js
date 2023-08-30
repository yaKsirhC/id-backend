import { Schema, model } from "mongoose";
const MessageSchema = new Schema({
    chat: {
        type: String,
        index: true
    },
    user: String,
    message: String,
    seen: Boolean,
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const MessageModel = model('messages_cb', MessageSchema);
export { MessageModel };
