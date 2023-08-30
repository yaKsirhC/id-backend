import { createWithdrawalController, getLivestreamsController, getUserController, getWithdrawalsController } from "../controllers/user.controller.js";
import { isAuth } from "../middlewares/isAuth.js";
import { Router } from "express";
const router = Router();
export default router;
router.get('/me', isAuth, getUserController);
router.get('/streams', isAuth, getLivestreamsController);
router.get('/withdrawals', isAuth, getWithdrawalsController);
router.post('/withdraw', isAuth, createWithdrawalController);
