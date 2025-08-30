const express = require('express');
const router = express.Router();

// Simple test endpoint to verify backend is running the current code
router.get('/test', (req, res) => {
  res.json({
    message: 'Backend test endpoint working',
    timestamp: new Date().toISOString(),
    version: '2.0-debug'
  });
});

module.exports = router;
