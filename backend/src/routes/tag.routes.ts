import express from 'express';

// Middlewares
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

// Validators
import { validateCreateTag, validateUpdateTag } from '../validators/tag.validator';

// Controller
import TagController from '../controllers/tag.controller';

const router = express.Router({ mergeParams: true });
const controller = new TagController();

router.post('/', authMiddleware, permissionMiddleware, validateCreateTag, (req, res, next) => controller.createTag(req, res, next));
router.patch('/:tagId', authMiddleware, permissionMiddleware, validateUpdateTag, (req, res, next) => controller.updateTag(req, res, next));
router.delete('/:tagId', authMiddleware, permissionMiddleware, (req, res, next) => controller.deleteTag(req, res, next));

router.post('/attach/:tagId/:cardId', authMiddleware, permissionMiddleware, (req, res, next) => controller.assignTagToCard(req, res, next));
router.post('/detach/:tagId/:cardId', authMiddleware, permissionMiddleware, (req, res, next) => controller.removeTagFromCard(req, res, next));

export default router;
