import { Router } from "express";
import { register, login , refresh} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authenticate, (req, res) => {
  res.status(200).json({ message: "Access granted to protected route", user: req.user });
})

export default router;  
