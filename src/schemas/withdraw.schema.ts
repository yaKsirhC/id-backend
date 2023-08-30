import { IWithdraw } from '@interfaces/withdraw.interface'
import { Schema, model } from 'mongoose'

const WithdrawSchema = new Schema<IWithdraw>({
    user: {
        type: String,
        index: true,
    },
    amountTokens: Number,
    amountUSD: Number,
    paid: Boolean,
    receiver: {
        provider: String,
        data: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const WithdrawModel = model<IWithdraw>('withdrawals_cb', WithdrawSchema)
export { WithdrawModel }