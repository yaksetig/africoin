const express = require('express');
const { uploadMetadataToPinata } = require('../services/ipfs');

const router = express.Router();

// POST /api/ipfs/upload - Upload metadata to IPFS via Pinata
router.post('/upload', async (req, res) => {
  try {
    const { carbonCreditDataList } = req.body;

    if (!carbonCreditDataList || !Array.isArray(carbonCreditDataList)) {
      return res.status(400).json({
        success: false,
        error: 'carbonCreditDataList is required and must be an array'
      });
    }

    const results = await uploadMetadataToPinata(carbonCreditDataList);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({
      success: false,
      error: 'IPFS upload failed',
      message: error.message
    });
  }
});

module.exports = router;