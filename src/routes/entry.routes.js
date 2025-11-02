const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entry.controller');
const { authenticateToken } = require('../middleware/auth');
const {
    validateEntry,
    validateUpdateEntry,
    validatePagination,
    validateExport
} = require('../middleware/validation');

// Debug: Check if controller methods are available

/**
 * @route   POST /api/entries
 * @desc    Submit new entry with Cloudinary URLs
 * @access  Private
 */
router.post(
    '/',
    authenticateToken,
    validateEntry,  // Hanya validateEntry saja, tidak perlu validateEntryWithUrls
    entryController.submitEntry
);

/**
 * @route   GET /api/entries
 * @desc    Get all entries with pagination and filters
 * @access  Private
 */
router.get(
    '/',
    authenticateToken,
    validatePagination,
    entryController.getEntries
);

/**
 * @route   GET /api/entries/recent
 * @desc    Get recent entries
 * @access  Private
 */
router.get(
    '/recent',
    authenticateToken,
    entryController.getRecentEntries
);

/**
 * @route   GET /api/entries/statistics
 * @desc    Get statistics
 * @access  Private
 */
router.get(
    '/statistics',
    authenticateToken,
    entryController.getStatistics
);

/**
 * @route   GET /api/entries/earnings
 * @desc    Get user earnings/omset (Rp 500 per entry)
 * @access  Private
 */
router.get(
    '/earnings',
    authenticateToken,
    entryController.getUserEarnings
);

/**
 * @route   GET /api/entries/export
 * @desc    Export entries to CSV or Excel
 * @access  Private
 */
router.get(
    '/export',
    authenticateToken,
    validateExport,
    entryController.exportEntries
);

/**
 * @route   PUT /api/entries/:id
 * @desc    Update entry status or notes
 * @access  Private
 */
router.put(
    '/:id',
    authenticateToken,
    validateUpdateEntry,
    entryController.updateEntry
);

/**
 * @route   DELETE /api/entries/:id
 * @desc    Delete entry
 * @access  Private
 */
router.delete(
    '/:id',
    authenticateToken,
    entryController.deleteEntry
);


module.exports = router;