import express from 'express';
import ColumnController from '../controllers/column.controller';
import { validateColumnCreate, validateColumnReorder } from '../validators/column.validator';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

import CardRouter from './card.routes';

const router = express.Router({ mergeParams: true });
const controller = new ColumnController();

router.post('/', authMiddleware, validateColumnCreate, permissionMiddleware, (req, res, next) => controller.create(req, res, next));
router.patch('/:columnId', authMiddleware, validateColumnCreate, permissionMiddleware, (req, res, next) => controller.update(req, res, next));
router.patch('/:columnId/reorder', authMiddleware, validateColumnReorder, permissionMiddleware, (req, res, next) => controller.reorder(req, res, next));
router.delete('/:columnId', authMiddleware, permissionMiddleware, (req, res, next) => controller.delete(req, res, next));

router.use('/:columnId/cards', CardRouter);

export default router;
