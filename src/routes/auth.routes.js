const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken, rateLimiter } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
    '/register',
    rateLimiter(10, 60 * 60 * 1000), // 10 requests per hour
    validateRegister,
    authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
    '/login',
    rateLimiter(20, 15 * 60 * 1000), // 20 requests per 15 minutes
    validateLogin,
    authController.login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
    '/refresh-token',
    authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
    '/logout',
    authenticateToken,
    authController.logout
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
    '/profile',
    authenticateToken,
    authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
    '/profile',
    authenticateToken,
    authController.updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
    '/change-password',
    authenticateToken,
    authController.changePassword
);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset
 * @access  Public
 */
router.post(
    '/request-password-reset',
    rateLimiter(5, 60 * 60 * 1000), // 5 requests per hour
    authController.requestPasswordReset
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
    '/reset-password',
    authController.resetPassword
);

/**
 * @route   GET /api/auth/check-username
 * @desc    Check if username is available
 * @access  Public
 */
router.get(
    '/check-username',
    authController.checkUsername
);

/**
 * @route   GET /api/auth/check-email
 * @desc    Check if email is available
 * @access  Public
 */
router.get(
    '/check-email',
    authController.checkEmail
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token (health check)
 * @access  Private
 */
router.get(
    '/verify',
    authenticateToken,
    authController.verifyToken
);

module.exports = router;