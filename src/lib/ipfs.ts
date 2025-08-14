import { uploadMetadataToIPFS as uploadMetadataAPI, type CarbonCreditData } from './api';

// Key used for storing IPFS upload results in localStorage
const IPFS_UPLOADS_KEY = 'ipfsUploadResults';

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

// Persist successful IPFS upload results to localStorage
export function saveIPFSResults(results: IPFSUploadResult[]): void {
  if (typeof window === 'undefined') return;
  const existing = loadIPFSResults();
  const merged = [...existing];
  for (const r of results) {
    if (r.tokenURI && !merged.some((e) => e.tokenURI === r.tokenURI)) {
      merged.push(r);
    }
  }
  window.localStorage.setItem(IPFS_UPLOADS_KEY, JSON.stringify(merged));
}

// Retrieve previously stored IPFS upload results
export function loadIPFSResults(): IPFSUploadResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(IPFS_UPLOADS_KEY);
    return raw ? (JSON.parse(raw) as IPFSUploadResult[]) : [];
  } catch {
    return [];
  }
}

// Remove a specific tokenURI from storage after successful mint
export function removeIPFSResult(tokenURI: string): void {
  if (typeof window === 'undefined') return;
  const remaining = loadIPFSResults().filter((r) => r.tokenURI !== tokenURI);
  window.localStorage.setItem(IPFS_UPLOADS_KEY, JSON.stringify(remaining));
}

// Clear all persisted IPFS upload results
export function clearIPFSResults(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(IPFS_UPLOADS_KEY);
}

