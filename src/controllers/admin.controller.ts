import { UserModel } from "@schemas/user.schema.js"
import { Request, Response } from "express"
import joi from 'joi'
import crypto from 'crypto'
import { EventModel } from "@schemas/event.schema.js"
import { WithdrawModel } from "@schemas/withdraw.schema.js"
import { StreamModel } from "@schemas/stream.schema.js"

async function createController(req: Request, res: Response) {
    try {

        const validation = joi.object({
            username: joi.string().required(),
            password: joi.string().required(),
            identifier: joi.string().required(),
            name: joi.string().required(),
            email: joi.string().email().required(),
        })

        const { error, value } = validation.validate(req.body)
        if (error) return res.status(400).send({ message: 'Bad request' })
        const { username, password, identifier, name, email } = value
        const token = crypto.randomUUID()

        const acc = await UserModel.create({
            identifier,
            admin: false,
            token,
            balance: 0,
            account_username: username,
            account_password: password,
            email,
            name,
            verified: false,
            verifying: false,
            verifyAgain: false,
            verifiedAmount: 0
        })

        if (!acc) return res.status(500).send({ message: 'Not possible to create account' })
        return res.status(200).send({ account: acc })

    } catch (err) {
        return res.status(500).send({ message: 'Something went wrong' })
    }
}

async function handleInit() {

    const admin = await UserModel.findOne({ admin: true }).lean().exec()
    if (!admin) {
        const token = crypto.randomUUID()
        await UserModel.create({
            admin: true,
            token,
        })
    }

}

handleInit()

// get accounts
async function getAccountsController(_: Request, res: Response) {
    try {

        let accs = []

        const accounts = await UserModel.find({ admin: false }).sort({ _id: -1 }).lean().exec()

        for (const a of accounts) {

            let totalMade = 0
            let lastStreamed: any = 'Never'

            const stream = await StreamModel.findOne({ user: a._id.toString() }).sort({ _id: -1 }).lean().exec()
            if (stream) {
                lastStreamed = stream.createdAt
            }

            const amount = await EventModel.aggregate([
                {
                    $match: {
                        user: a._id.toString()
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ])

            if (amount.length > 0) {
                totalMade = amount[0].totalAmount
            }

            accs.push({
                ...a,
                totalMade,
                lastStreamed
            })

        }

        return res.status(200).send({ accounts: accs })

    } catch (err) {
        return res.status(500).send({ message: 'Something went wrong' })
    }
}

// get withdrawals
async function getWithdrawalsController(req: Request, res: Response) {
    try {

        let ww = []
        const withdrawals = await WithdrawModel.find({}).sort({ _id: -1 }).lean().exec()

        for (const w of withdrawals) {
            const user = await UserModel.findOne({ _id: w.user }).lean().exec()
            ww.push({
                ...w,
                user
            })
        }

        return res.status(200).send({ withdrawals: ww })

    } catch (err) {
        return res.status(500).send({ message: 'Something went wrong' })
    }
}

// update withdraw status
async function updateWithdrawalController(req: Request, res: Response) {
    try {

        const { id } = req.body
        if (!id) return res.status(500).send({ message: 'ID is missing' })

        const update = await WithdrawModel.findOneAndUpdate({ _id: id }, {
            $set: {
                paid: true
            }
        }).lean().exec()

        if (!update) return res.status(500).send({ message: 'Something went wrong' })

        return res.status(200).send({ message: 'Updated' })

    } catch (err) {
        return res.status(500).send({ message: 'Not possible to update withdrawal' })
    }
}

// get analytics
async function getAnalyticsController(req: Request, res: Response) {
    try {

        const currentDate = new Date(); // Get the current date and time
        const sevenDaysAgo = new Date();
        const thirtyDaysAgo = new Date();
        sevenDaysAgo.setDate(currentDate.getDate() - 7);
        thirtyDaysAgo.setDate(currentDate.getDate() - 30);

        let promises = []

        promises.push(
            StreamModel.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: sevenDaysAgo
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$tokens' }
                    }
                }
            ])
        )
        promises.push(
            StreamModel.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: thirtyDaysAgo
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$tokens' }
                    }
                }
            ])
        )

        promises.push(
            StreamModel.aggregate([
                {
                    $match: {
                        createdAt: {
                            $lte: currentDate
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$tokens' }
                    }
                }
            ])
        )

        let stats: any[] = []

        const results = await Promise.all(promises)

        results.forEach((r, i) => {
            stats.push({
                tokens: r[0].totalAmount || 0,
                days: i === 0 ? '7d' : i === 1 ? '30d' : 'alltime'
            })
        })

        return res.status(200).send({ stats })

    } catch (err) {
        return res.status(200).send({ stats: [{ tokens: 0, days: '7d' }, { tokens: 0, days: '30d' }, { tokens: 0, days: 'alltime' }] })
    }
}

export {
    createController,
    getAccountsController,
    getWithdrawalsController,
    updateWithdrawalController,
    getAnalyticsController
}