export type IChat = {
    _id: string,
    user: string,
    otherUser: string,
    lastMessage: {
        message: string,
        createdAt: Date
    },
    createdAt: Date,
}