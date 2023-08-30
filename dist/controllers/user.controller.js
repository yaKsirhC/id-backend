import { StreamModel } from "../schemas/stream.schema.js";
import { UserModel } from "../schemas/user.schema.js";
import { WithdrawModel } from "../schemas/withdraw.schema.js";
import joi from "joi";
// get user
async function getUserController(req, res) {
    try {
        const user = req.user;
        return res.status(200).send({
            user
        });
    } catch (err) {
        return res.status(500).send({
            message: 'Something went wrong'
        });
    }
}
function calculateAverageDuration(totalDuration, streamCount) {
    if (streamCount === 0) {
        return '0h0m';
    }
    const averageSeconds = totalDuration / streamCount;
    const hours = Math.floor(averageSeconds / 3600);
    const minutes = Math.floor(averageSeconds % 3600 / 60);
    return `${hours}h${minutes}m`;
}
function calculateAverageTokens(totalTokens, streamCount) {
    if (streamCount === 0) {
        return '0';
    }
    const averageTokens = totalTokens / streamCount;
    return averageTokens.toFixed(0);
}
// get livestreams
async function getLivestreamsController(req, res) {
    try {
        const streams = await StreamModel.find({
            user: req.user._id.toString()
        }).sort({
            _id: -1
        }).limit(7).lean().exec();
        let totalDuration = 0;
        let totalTokens = 0;
        for (const stream of streams){
            totalDuration += stream.seconds;
            totalTokens += stream.tokens;
        }
        const averageDuration = calculateAverageDuration(totalDuration, streams.length);
        const averageTokens = calculateAverageTokens(totalTokens, streams.length);
        return res.status(200).send({
            streams,
            averageDuration,
            averageTokens
        });
    } catch (err) {
        return res.status(500).send({
            message: 'Something went wrong'
        });
    }
}
// get withdraws
async function getWithdrawalsController(req, res) {
    try {
        const streams = await WithdrawModel.find({
            user: req.user._id.toString()
        }).sort({
            _id: -1
        }).limit(7).lean().exec();
        return res.status(200).send({
            withdrawals: streams
        });
    } catch (err) {
        return res.status(500).send({
            message: 'Something went wrong'
        });
    }
}
// create withdraw
async function createWithdrawalController(req, res) {
    try {
        const validation = joi.object({
            amount: joi.number().min(4000).max(999999).required(),
            provider: joi.string().required(),
            receiver: joi.string().required()
        });
        const { error , value  } = validation.validate(req.body);
        if (error) return res.status(400).send({
            message: 'Invalid request'
        });
        const data = value;
        if (req.user.balance < data.amount) return res.status(400).send({
            message: 'You do not have enough balance'
        });
        const update = await UserModel.findOneAndUpdate({
            _id: req.user._id
        }, {
            $inc: {
                balance: -data.amount
            }
        }).lean().exec();
        if (!update) return res.status(500).send({
            message: 'Not possible to request withdrawal'
        });
        const withdraw = await WithdrawModel.create({
            amountTokens: data.amount,
            amountUSD: data.amount * 0.025,
            paid: false,
            receiver: {
                provider: data.provider,
                data: data.receiver
            },
            user: req.user._id.toString()
        });
        if (!withdraw) {
            await UserModel.updateOne({
                _id: req.user._id
            }, {
                $inc: {
                    balance: data.amount
                }
            }).lean().exec();
            return res.status(500).send({
                message: 'Not possible to request withdrawal'
            });
        }
        return res.status(200).send({
            message: 'Withdrawal request successful',
            withdraw
        });
    } catch (err) {
        console.log(err);
        return res.status(500).send({
            message: 'Something went wrong'
        });
    }
}
export { getUserController, getLivestreamsController, getWithdrawalsController, createWithdrawalController };
