import { supabase } from '@/integrations/supabase/client';
import { ethers } from 'ethers';

export interface WalletAuthSession {
  sessionToken: string;
  walletAddress: string;
  expiresAt: number;
}

const SESSION_STORAGE_KEY = 'wallet_auth_session';

// Store session in localStorage
export function storeSession(session: WalletAuthSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

// Get session from localStorage
export function getStoredSession(): WalletAuthSession | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored) as WalletAuthSession;
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    
    return session;
  } catch {
    clearSession();
    return null;
  }
}

// Clear session from localStorage
export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

// Check if user has valid session
export function isAuthenticated(): boolean {
  const session = getStoredSession();
  return session !== null;
}

// Get authorization header for API calls
export function getAuthHeader(): Record<string, string> {
  const session = getStoredSession();
  if (!session) {
    throw new Error('No valid session found');
  }
  
  return {
    'Authorization': `Bearer ${session.sessionToken}`
  };
}

// Authenticate with wallet signature
export async function authenticateWallet(signer: ethers.Signer): Promise<WalletAuthSession> {
  const walletAddress = await signer.getAddress();
  
  // Step 1: Get nonce
  const { data: nonceData, error: nonceError } = await supabase.functions.invoke('wallet-auth/nonce', {
    body: { walletAddress }
  });
  
  if (nonceError || !nonceData.nonce) {
    throw new Error('Failed to get authentication nonce');
  }
  
  // Step 2: Sign message
  const message = nonceData.message;
  const signature = await signer.signMessage(message);
  
  // Step 3: Verify signature and get session token
  const { data: authData, error: authError } = await supabase.functions.invoke('wallet-auth/verify', {
    body: {
      walletAddress,
      signature,
      nonce: nonceData.nonce
    }
  });
  
  if (authError || !authData.sessionToken) {
    throw new Error('Failed to authenticate wallet signature');
  }
  
  const session: WalletAuthSession = {
    sessionToken: authData.sessionToken,
    walletAddress: walletAddress.toLowerCase(),
    expiresAt: Date.now() + (authData.expiresIn * 1000)
  };
  
  storeSession(session);
  return session;
}

// Save contract to user's collection
export async function saveContract(
  contractAddress: string, 
  abi: any[], 
  label?: string, 
  network?: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('contracts', {
    method: 'POST',
    headers: getAuthHeader(),
    body: {
      contractAddress,
      abi,
      label,
      network
    }
  });
  
  if (error) {
    throw new Error('Failed to save contract');
  }
}

// Get user's saved contracts
export async function getSavedContracts(): Promise<any[]> {
  const { data, error } = await supabase.functions.invoke('contracts', {
    method: 'GET',
    headers: getAuthHeader()
  });
  
  if (error) {
    throw new Error('Failed to load saved contracts');
  }
  
  return data.contracts || [];
}

// Delete a saved contract
export async function deleteContract(contractId: string): Promise<void> {
  const { error } = await supabase.functions.invoke(`contracts/${contractId}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  
  if (error) {
    throw new Error('Failed to delete contract');
  }
}