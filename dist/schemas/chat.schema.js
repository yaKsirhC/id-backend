import { Schema, model } from "mongoose";
const ChatSchema = new Schema({
    user: {
        type: String,
        index: true
    },
    otherUser: {
        type: String,
        index: true
    },
    lastMessage: {
        message: String,
        createdAt: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const ChatModel = model('chats_cb', ChatSchema);
export { ChatModel };
