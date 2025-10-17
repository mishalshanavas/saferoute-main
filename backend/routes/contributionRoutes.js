const express = require('express');
const router = express.Router();
const {
  createContribution,
  getAllContributions,
  getContributionById,
  getContributionsByType,
  getNearbyContributions,
  updateContributionStatus,
  deleteContribution,
  voteContribution,
  getStatistics
} = require('../controllers/contributionController');

// Create new contribution
router.post('/', createContribution);

// Get all contributions
router.get('/', getAllContributions);

// Get statistics
router.get('/statistics', getStatistics);

// Get nearby contributions
router.get('/nearby', getNearbyContributions);

// Get contributions by type
router.get('/type/:type', getContributionsByType);

// Get contribution by ID
router.get('/:id', getContributionById);

// Update contribution status
router.patch('/:id/status', updateContributionStatus);

// Vote on contribution
router.post('/:id/vote', voteContribution);

// Delete contribution
router.delete('/:id', deleteContribution);

module.exports = router;
