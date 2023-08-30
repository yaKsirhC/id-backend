export type IRoomMessage = {
    _id: string,
    room: string,
    user: string,
    message: string,
    unix: number,
    createdAt: Date,
}