import express from 'express';
import ProjectController from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateCreateProject, validateInvite, validateChangeRole } from '../validators/project.validator';

import ColumnRouter from './column.routes';

const router = express.Router();

router.post('/', authMiddleware, validateCreateProject, (req, res, next) => ProjectController.create(req, res, next));
router.get('/', authMiddleware, (req, res, next) => ProjectController.getAllProjects(req, res, next));
router.get('/invitations', authMiddleware, (req, res, next) => ProjectController.getInvitations(req, res, next));
router.get('/sent', authMiddleware, (req, res, next) => ProjectController.getSentInvitations(req, res, next));
router.get('/:id', authMiddleware, (req, res, next) => ProjectController.getProject(req, res, next));
router.delete('/:id', authMiddleware, (req, res, next) => ProjectController.deleteProject(req, res, next));
router.post('/:id/invite', authMiddleware, validateInvite, (req, res, next) => ProjectController.invite(req, res, next));
router.post('/:id/accept', authMiddleware, (req, res, next) => ProjectController.accept(req, res, next));
router.post('/:id/decline', authMiddleware, (req, res, next) => ProjectController.decline(req, res, next));
router.post('/:id/revokeInvitation', authMiddleware, (req, res, next) => ProjectController.revokeInvitation(req, res, next));
router.post('/:id/remove/:memberId', authMiddleware, (req, res, next) => ProjectController.removeMember(req, res, next));
router.post('/:id/leave', authMiddleware, (req, res, next) => ProjectController.leaveProject(req, res, next));
router.patch('/:id/members/:memberId/role', authMiddleware, validateChangeRole, (req, res, next) => ProjectController.changeRole(req, res, next));

router.use('/:projectId/columns', ColumnRouter);

export default router;
