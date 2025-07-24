import { uploadMetadataToIPFS as uploadMetadataAPI, type CarbonCreditData } from './api';

export interface IPFSUploadResult {
  success: boolean;
  ipfsHash?: string;
  tokenURI?: string;
  error?: string;
  serialNumber?: string;
}

export { type CarbonCreditData };

export async function uploadMetadataToIPFS(
  carbonCreditDataList: CarbonCreditData[]
): Promise<IPFSUploadResult[]> {
  return await uploadMetadataAPI(carbonCreditDataList);
}

