import express from 'express';
import ColumnController from '../controllers/column.controller';
import { validateColumnCreate, validateColumnReorder } from '../validators/column.validator';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router({ mergeParams: true });

router.post('/', authMiddleware, validateColumnCreate, (req, res, next) => ColumnController.create(req, res, next));
router.patch('/:columnId', authMiddleware, validateColumnCreate, (req, res, next) => ColumnController.update(req, res, next));
router.patch('/:columnId/reorder', authMiddleware, validateColumnReorder, (req, res, next) => ColumnController.reorder(req, res, next));
router.delete('/:columnId', authMiddleware, (req, res, next) => ColumnController.delete(req, res, next));

export default router;
