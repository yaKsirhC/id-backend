import { Schema, model } from "mongoose";
const WithdrawSchema = new Schema({
    user: {
        type: String,
        index: true
    },
    amountTokens: Number,
    amountUSD: Number,
    paid: Boolean,
    receiver: {
        provider: String,
        data: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const WithdrawModel = model('withdrawals_cb', WithdrawSchema);
export { WithdrawModel };
