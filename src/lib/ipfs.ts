export interface IPFSUploadResult {
  success: boolean;
  ipfsHash?: string;
  tokenURI?: string;
  error?: string;
}

export interface CarbonCreditData {
  serialNumber: string;
  carbonQuantity?: string;
  projectID?: string;
  vintageYear?: string;
  geographicCoordinates?: string;
  [key: string]: any;
}

export async function uploadMetadataToIPFS(
  carbonCreditDataList: CarbonCreditData[],
  pinataApiKey?: string,
  pinataSecretKey?: string
): Promise<IPFSUploadResult[]> {
  // If we have Pinata keys, use them directly
  if (pinataApiKey && pinataSecretKey) {
    return uploadToPinataDirectly(carbonCreditDataList, pinataApiKey, pinataSecretKey);
  }
  
  // Otherwise, try to use Supabase Edge Function
  return uploadViaSupabase(carbonCreditDataList);
}

async function uploadToPinataDirectly(
  carbonCreditDataList: CarbonCreditData[],
  apiKey: string,
  secretKey: string
): Promise<IPFSUploadResult[]> {
  const results: IPFSUploadResult[] = [];
  
  for (const item of carbonCreditDataList) {
    try {
      const metadata = createNFTMetadata(item);
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': secretKey,
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      results.push({
        success: true,
        ipfsHash: data.IpfsHash,
        tokenURI: `ipfs://${data.IpfsHash}`,
      });
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return results;
}

async function uploadViaSupabase(carbonCreditDataList: CarbonCreditData[]): Promise<IPFSUploadResult[]> {
  try {
    // This would call the Supabase Edge Function
    // For now, return an error indicating Supabase is needed
    return carbonCreditDataList.map(() => ({
      success: false,
      error: 'Supabase integration required for IPFS uploads. Please connect to Supabase or provide Pinata API keys.',
    }));
  } catch (error) {
    return carbonCreditDataList.map(() => ({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
  }
}

function createNFTMetadata(item: CarbonCreditData) {
  return {
    name: `Carbon Credit NFT #${item.serialNumber}`,
    description: `A unique carbon credit NFT representing offset from project ${item.projectID || 'N/A'}.`,
    image: 'ipfs://QmYourDefaultImageHashHere', // Replace with actual default image
    attributes: [
      { trait_type: 'Serial Number', value: item.serialNumber },
      { trait_type: 'Carbon Quantity (Tons)', value: item.carbonQuantity || 'N/A' },
      { trait_type: 'Project ID', value: item.projectID || 'N/A' },
      { trait_type: 'Vintage Year', value: item.vintageYear || 'N/A' },
      { trait_type: 'Geographic Coordinates', value: item.geographicCoordinates || 'N/A' },
    ],
  };
}
