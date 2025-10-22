import express, { Request, Response, NextFunction } from 'express';
import AuthController from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../validators/auth.validator';
import { authMiddleware } from '../middlewares/auth.middleware';

interface AuthRequest extends Request {
  user?: { id: string; name: string };
}

const router = express.Router();
const controller = new AuthController();

router.post('/register', validateRegister, (req: Request, res: Response, next: NextFunction) =>
  controller.registerUser(req, res, next)
);

router.post('/login', validateLogin, (req: Request, res: Response, next: NextFunction) =>
  controller.loginUser(req, res, next)
);

router.delete('/:id', (req: Request, res: Response, next: NextFunction) =>
  controller.deleteUser(req, res, next)
);

// protected ping route
router.get('/ping', authMiddleware, (req: Request, res: Response) => {
  const user = (req as AuthRequest).user ?? null;
  res.json({ message: 'pong', user });
});

export default router;
