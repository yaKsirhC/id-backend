export type IMessage = {
    _id: string,
    chat: string,
    user: string,
    message: string,
    seen: boolean,
    createdAt: Date,
}