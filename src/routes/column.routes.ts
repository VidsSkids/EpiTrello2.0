import express from 'express';
import ColumnController from '../controllers/column.controller';
import { validateColumnCreate, validateColumnReorder } from '../validators/column.validator';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

const router = express.Router({ mergeParams: true });

router.post('/', authMiddleware, validateColumnCreate, permissionMiddleware, (req, res, next) => ColumnController.create(req, res, next));
router.patch('/:columnId', authMiddleware, validateColumnCreate, permissionMiddleware, (req, res, next) => ColumnController.update(req, res, next));
router.patch('/:columnId/reorder', authMiddleware, validateColumnReorder, permissionMiddleware, (req, res, next) => ColumnController.reorder(req, res, next));
router.delete('/:columnId', authMiddleware, permissionMiddleware, (req, res, next) => ColumnController.delete(req, res, next));

export default router;
