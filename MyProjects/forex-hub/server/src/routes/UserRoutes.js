import express from 'express';
import { register, login, getProfile, updateSettings, deposit, withdraw, purchaseCourse } from '../controllers/UserController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/settings', protect, updateSettings);
router.post('/deposit', protect, deposit);
router.post('/withdraw', protect, withdraw);
router.post('/purchase-course', protect, purchaseCourse);

export default router;
