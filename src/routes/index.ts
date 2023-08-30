import { Express, Request, Response } from "express";
import authRoute from './auth.route.js'
import userRoute from './user.route.js'
import adminRoute from './admin.route.js'
import { UserModel } from "@schemas/user.schema.js";
import { validateUserID } from "@utils/browser.utils.js";

const setupRouter = (app: Express) => {
    app.use('/auth', authRoute)
    app.use('/user', userRoute)
    app.use('/admin', adminRoute)
    app.post('/verified', async (req: Request, res: Response) => {
        try {

            const { id } = req.body
            if (!id) return res.status(400).send({ message: 'Not possible' })

            const user = await UserModel.findOne({ _id: id }).lean().exec()
            if (!user) return res.status(500).send({ message: 'Something went wrong' })

            validateUserID(user)

            return res.status(200).send({ message: 'Alright' })

        } catch (err) {
            return res.status(500).send({ message: 'Something went wrong' })
        }
    })
}

export { setupRouter }