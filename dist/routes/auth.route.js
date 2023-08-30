import { loginController, refreshController } from "../controllers/auth.controller.js";
import { Router } from "express";
const router = Router();
export default router;
router.post('/login', loginController);
router.post('/refresh', refreshController);
