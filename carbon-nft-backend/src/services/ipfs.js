const axios = require('axios');

function createNFTMetadata(item) {
  return {
    name: `Carbon Credit NFT - Serial: ${item.serialNumber}`,
    description: "A tokenized carbon credit representing verified environmental impact.",
    image: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    attributes: [
      {
        trait_type: "Serial Number",
        value: item.serialNumber
      },
      {
        trait_type: "Project Name", 
        value: item.projectName || "N/A"
      },
      {
        trait_type: "Country",
        value: item.country || "N/A"
      },
      {
        trait_type: "Methodology",
        value: item.methodology || "N/A"
      },
      {
        trait_type: "Vintage",
        value: item.vintage || "N/A"
      },
      {
        trait_type: "Volume",
        value: item.volume || "1 tCO2e"
      }
    ]
  };
}

async function uploadMetadataToPinata(carbonCreditDataList) {
  const PINATA_API_KEY = process.env.PINATA_API_KEY;
  const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata API credentials not configured in environment variables');
  }

  const results = [];

  for (const item of carbonCreditDataList) {
    try {
      const metadata = createNFTMetadata(item);
      
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: metadata,
          pinataMetadata: {
            name: `carbon-credit-${item.serialNumber}.json`
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY
          }
        }
      );

      const ipfsHash = response.data.IpfsHash;
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      results.push({
        success: true,
        ipfsHash,
        tokenURI,
        serialNumber: item.serialNumber
      });
    } catch (error) {
      console.error(`Failed to upload metadata for ${item.serialNumber}:`, error.message);
      results.push({
        success: false,
        error: error.message,
        serialNumber: item.serialNumber
      });
    }
  }

  return results;
}

module.exports = {
  uploadMetadataToPinata
};