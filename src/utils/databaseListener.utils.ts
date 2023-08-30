import { ChatModel } from "@schemas/chat.schema.js";
import mongoose from "mongoose";

async function parseStream(change: any) {

    const { operationType } = change

    if (operationType === 'insert') {

        const collection = change.ns.coll
        const document = change.fullDocument

        if (collection === 'messages_cb') {
            await ChatModel.updateOne({ _id: document.chat }, {
                $set: {
                    lastMessage: {
                        message: document.message,
                        createdAt: document.createdAt
                    }
                }
            }).lean().exec()
        }

    }

    if (operationType === 'update') {

        //const documentId = change.documentKey._id.toString()
        //const updatedFields = change.updateDescription.updatedFields
        //const collection = change.ns.coll

    }

}

function setupListener() {
    const db = mongoose.connection
    db.once('open', () => {
        const streamCollection = db.watch()
        streamCollection.on('change', (change) => {
            parseStream(change)
        })
    })
}

export { setupListener }