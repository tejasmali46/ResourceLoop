import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

// Protect all user administration endpoints with ADMIN requirement
router.use(authenticate, requireRoles('ADMIN'));

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
