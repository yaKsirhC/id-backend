import { createController, getAccountsController, getAnalyticsController, getWithdrawalsController, updateWithdrawalController } from "@controllers/admin.controller.js";
import { isAdmin } from "@middlewares/isAdmin.js";
import { isAuth } from "@middlewares/isAuth.js";
import { Router } from "express";
const router = Router()
export default router

router.get('/accounts', isAuth, isAdmin, getAccountsController)
router.post('/create', isAuth, isAdmin, createController)
router.get('/withdrawals', isAuth, isAdmin, getWithdrawalsController)
router.get('/analytics', isAuth, isAdmin, getAnalyticsController)
router.post('/withdraw', isAuth, isAdmin, updateWithdrawalController)