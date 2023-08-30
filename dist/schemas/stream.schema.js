import { Schema, model } from "mongoose";
const StreamSchema = new Schema({
    user: {
        type: String,
        index: true
    },
    tokens: Number,
    seconds: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const StreamModel = model('streams_cb', StreamSchema);
export { StreamModel };
