const axios = require('axios');

function createNFTMetadata(item) {
  // Handle different possible field names from CSV
  const serialNumber = item.serialNumber || item.SerialNumber || item['Serial Number'] || 'Unknown';
  const projectName =
    item.projectName ||
    item.ProjectName ||
    item['Project Name'] ||
    item.ProjectID ||
    item['Project ID'] ||
    'N/A';
  const country =
    item.country ||
    item.Country ||
    item.GeographicCoordinates ||
    item['Geographic Coordinates'] ||
    'N/A';
  const methodology = item.methodology || item.Methodology || 'N/A';
  const vintage =
    item.vintage ||
    item.Vintage ||
    item.VintageYear ||
    item['Vintage Year'] ||
    'N/A';
  const volume =
    item.volume ||
    item.Volume ||
    item.CarbonQuantity ||
    item['Carbon Quantity'] ||
    '1 tCO2e';

  return {
    name: `Carbon Credit NFT - Serial: ${serialNumber}`,
    description:
      'A tokenized carbon credit representing verified environmental impact.',
    image:
      'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    attributes: [
      {
        trait_type: 'Serial Number',
        value: serialNumber,
      },
      {
        trait_type: 'Project Name',
        value: projectName,
      },
      {
        trait_type: 'Country/Location',
        value: country,
      },
      {
        trait_type: 'Methodology',
        value: methodology,
      },
      {
        trait_type: 'Vintage',
        value: vintage,
      },
      {
        trait_type: 'Volume',
        value: volume,
      },
    ],
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
