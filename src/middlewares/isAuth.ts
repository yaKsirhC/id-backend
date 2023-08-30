import { UserModel } from "@schemas/user.schema.js"
import { validateToken } from "@utils/token.utils.js"
import { NextFunction, Request, Response } from "express"

export async function isAuth(req: Request, res: Response, next: NextFunction) {

    const { token } = req.headers
    if (!token) return res.status(401).send({ message: 'Token not provided' })
    const parsedToken = String(token).replace(/^Bearer\s/, "")
    const { decoded, valid } = validateToken(parsedToken, false)
    if (!(valid && decoded)) return res.status(500).send({ message: 'Token is not valid' })
    const { id } = decoded
    const user = await UserModel.findOne({ _id: id }, { account_password: 0, account_username: 0, account_streamKey: 0 }).lean().exec()
    if (!user) return res.status(500).send({ message: 'Something went wrong' })
    req.user = user
    return next()

}