import express from 'express';
import ProjectController from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateCreateProject, validateInvite, validateChangeRole } from '../validators/project.validator';

import ColumnRouter from './column.routes';
import TagRoute from './tag.routes';

const router = express.Router();
const controller = new ProjectController();

router.post('/', authMiddleware, validateCreateProject, (req, res, next) => controller.create(req, res, next));
router.get('/', authMiddleware, (req, res, next) => controller.getAllProjects(req, res, next));
router.get('/invitations', authMiddleware, (req, res, next) => controller.getInvitations(req, res, next));
router.get('/sent', authMiddleware, (req, res, next) => controller.getSentInvitations(req, res, next));
router.get('/:id', authMiddleware, (req, res, next) => controller.getProject(req, res, next));
router.delete('/:id', authMiddleware, (req, res, next) => controller.deleteProject(req, res, next));
router.post('/:id/invite', authMiddleware, validateInvite, (req, res, next) => controller.invite(req, res, next));
router.post('/:id/accept', authMiddleware, (req, res, next) => controller.accept(req, res, next));
router.post('/:id/decline', authMiddleware, (req, res, next) => controller.decline(req, res, next));
router.post('/:id/revokeInvitation', authMiddleware, (req, res, next) => controller.revokeInvitation(req, res, next));
router.post('/:id/remove/:memberId', authMiddleware, (req, res, next) => controller.removeMember(req, res, next));
router.post('/:id/leave', authMiddleware, (req, res, next) => controller.leaveProject(req, res, next));
router.patch('/:id/members/:memberId/role', authMiddleware, validateChangeRole, (req, res, next) => controller.changeRole(req, res, next));

router.use('/:projectId/columns', ColumnRouter);
router.use('/:projectId/tags', TagRoute);

export default router;
