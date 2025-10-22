import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

class AuthController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    async registerUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await this.userService.createUser(req.body);
            res.status(201).json({ message: 'User registered successfully', user });
        } catch (err: unknown) {
            next(err);
        }
    }

    async loginUser(req: Request, res: Response, next: NextFunction) {
        try {
            const {token, id} = await this.userService.validateUser(req.body);
            // set JWT in Authorization header for client convenience
            if (typeof token === 'string') {
                res.setHeader('Authorization', `Bearer ${token}`);
            }
            res.status(200).json({ message: 'Login successful', token, id });
        } catch (err: unknown) {
            next(err);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            await this.userService.deleteUser(req.params.id);
            res.status(204).send();
        } catch (err: unknown) {
            next(err);
        }
    }
}

export default AuthController;
