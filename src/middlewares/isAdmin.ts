import { NextFunction, Request, Response } from "express"

export async function isAdmin(req: Request, res: Response, next: NextFunction) {

    if (!req.user.admin) return res.status(500).send({ message: 'You can not do that' })
    return next()

}