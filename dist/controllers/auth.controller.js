import { UserModel } from "../schemas/user.schema.js";
import { generateToken, validateToken } from "../utils/token.utils.js";
import joi from "joi";
// login
async function loginController(req, res) {
    try {
        const validation = joi.object({
            token: joi.string().required()
        });
        const { error , value  } = validation.validate(req.body);
        if (error) return res.status(400).send({
            message: 'Bad request'
        });
        const { token  } = value;
        const user = await UserModel.findOne({
            token
        }, {
            account: 0
        }).lean().exec();
        if (!user) return res.status(400).send({
            message: 'Token not found'
        });
        const tokenQ = generateToken(false, user._id.toString());
        const refreshTokenQ = generateToken(true, user._id.toString());
        return res.status(200).send({
            user,
            token: tokenQ,
            refreshToken: refreshTokenQ
        });
    } catch (err) {
        return res.status(500).send({
            message: 'Not possible to sign in'
        });
    }
}
// refresh token
async function refreshController(req, res) {
    try {
        const validation = joi.object({
            refreshToken: joi.string().required()
        });
        const { error , value  } = validation.validate(req.body);
        if (error) return res.status(400).send({
            message: 'Invalid request'
        });
        const { refreshToken  } = value;
        const { decoded , valid  } = validateToken(refreshToken, true);
        if (!(valid && decoded)) return res.status(500).send({
            message: 'Invalid token'
        });
        const { id  } = decoded;
        const user = await UserModel.findOne({
            _id: id
        }).lean().exec();
        if (!user) return res.status(500).send({
            message: 'Token is not valid'
        });
        const token = generateToken(false, user._id.toString());
        const refreshTokenQ = generateToken(true, user._id.toString());
        return res.status(200).send({
            token,
            refreshToken: refreshTokenQ
        });
    } catch (err) {
        return res.status(500).send({
            message: 'Not possible to refresh token'
        });
    }
}
export { loginController, refreshController };
