export type IWithdraw = {
    _id: string,
    user: string,
    amountTokens: number,
    amountUSD: number,
    paid: boolean,
    receiver: {
        provider: string, // Cash App, Zelle, Apple Pay
        data: string, // phone number / username
    },
    createdAt: Date,
}