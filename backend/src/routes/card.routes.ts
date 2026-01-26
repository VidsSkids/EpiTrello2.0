import express from 'express';

// Middlewares
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

// Validators
import { validateCardCreate, validateCardUpdate, validateCardReorder } from '../validators/card.validator';

// Controller
import CardController from '../controllers/card.controller';

// Routers
import CheckListRoute from './checklist.routes';

const router = express.Router({ mergeParams: true });
const controller = new CardController();

router.post('/', authMiddleware, validateCardCreate, permissionMiddleware, (req, res, next) => controller.create(req, res, next));
router.patch('/:cardId', authMiddleware, validateCardUpdate, permissionMiddleware, (req, res, next) => controller.update(req, res, next));
router.delete('/:cardId', authMiddleware, permissionMiddleware, (req, res, next) => controller.delete(req, res, next));

router.post('/:cardId/toggleDone', authMiddleware, permissionMiddleware, (req, res, next) => controller.toggleDone(req, res, next));
router.patch('/:cardId/reorder', authMiddleware, validateCardReorder, permissionMiddleware, (req, res, next) => controller.reorder(req, res, next));

router.use('/:cardId/checklists', authMiddleware, permissionMiddleware, CheckListRoute);

export default router;
