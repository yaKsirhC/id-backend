import { Schema, model } from "mongoose";
const UserSchema = new Schema({
    token: {
        type: String,
        index: true
    },
    identifier: String,
    admin: Boolean,
    balance: Number,
    name: String,
    verified: Boolean,
    verifyAgain: Boolean,
    verifying: Boolean,
    lastVerified: Number,
    verifiedAmount: Number,
    email: String,
    account_username: String,
    account_password: String,
    account_streamKey: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const UserModel = model('users_cb', UserSchema);
export { UserModel };
