const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://africoin.up.railway.app/api';

export interface CompilationResult {
  abi: any[];
  bytecode: string;
  success: boolean;
  errors: string[];
}

export interface IPFSUploadResult {
  success: boolean;
  ipfsHash?: string;
  tokenURI?: string;
  error?: string;
  serialNumber?: string;
}

export interface CarbonCreditData {
  serialNumber: string;
  projectName?: string;
  country?: string;
  methodology?: string;
  vintage?: string;
  volume?: string;
}

export async function compileContract(sourceCode: string): Promise<CompilationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sourceCode }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      abi: [],
      bytecode: '',
      success: false,
      errors: [error instanceof Error ? error.message : 'Network error'],
    };
  }
}

export async function uploadMetadataToIPFS(
  carbonCreditDataList: CarbonCreditData[]
): Promise<IPFSUploadResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/ipfs/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ carbonCreditDataList }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    return carbonCreditDataList.map(item => ({
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      serialNumber: item.serialNumber,
    }));
  }
}