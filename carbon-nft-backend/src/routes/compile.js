const express = require('express');
const { compileContract } = require('../services/compiler');

const router = express.Router();

// POST /api/compile - Compile Solidity contract
router.post('/', async (req, res) => {
  try {
    const { sourceCode } = req.body;

    if (!sourceCode) {
      return res.status(400).json({
        success: false,
        error: 'Source code is required'
      });
    }

    const result = await compileContract(sourceCode);
    
    res.json(result);
  } catch (error) {
    console.error('Compilation error:', error);
    res.status(500).json({
      success: false,
      error: 'Compilation failed',
      message: error.message
    });
  }
});

module.exports = router;