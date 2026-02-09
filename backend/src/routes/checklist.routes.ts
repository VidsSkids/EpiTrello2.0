import express from 'express';

// Middlewares
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

// Validators
import { validateChecklistCreate, validateChecklistItemCreate, validateChecklistItemUpdate, validateChecklistUpdate } from '../validators/checklist.validator';

// Controllers
import CheckListController from '../controllers/checklist.controller';

const router = express.Router({ mergeParams: true });
const controller = new CheckListController();

router.post('/', authMiddleware, validateChecklistCreate, permissionMiddleware, (req, res, next) => controller.createChecklist(req, res, next));
router.patch('/:checklistId', authMiddleware, validateChecklistUpdate, permissionMiddleware, (req, res, next) => controller.updateChecklist(req, res, next));
router.delete('/:checklistId', authMiddleware, permissionMiddleware, (req, res, next) => controller.deleteChecklist(req, res, next));

router.post('/:checklistId/items', authMiddleware, validateChecklistItemCreate, permissionMiddleware, (req, res, next) => controller.createChecklistItem(req, res, next));
router.patch('/:checklistId/items/:itemId', authMiddleware, validateChecklistItemUpdate, permissionMiddleware, (req, res, next) => controller.updateChecklistItem(req, res, next));
router.delete('/:checklistId/items/:itemId', authMiddleware, permissionMiddleware, (req, res, next) => controller.deleteChecklistItem(req, res, next));

export default router;
