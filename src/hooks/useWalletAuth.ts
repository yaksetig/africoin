import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  WalletAuthSession, 
  authenticateWallet, 
  getStoredSession, 
  clearSession,
  isAuthenticated 
} from '@/lib/wallet-auth';
import { useToast } from '@/hooks/use-toast';

export interface UseWalletAuthReturn {
  session: WalletAuthSession | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authenticate: (signer: ethers.Signer) => Promise<void>;
  logout: () => void;
}

export function useWalletAuth(): UseWalletAuthReturn {
  const [session, setSession] = useState<WalletAuthSession | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  // Load existing session on mount
  useEffect(() => {
    const existingSession = getStoredSession();
    setSession(existingSession);
  }, []);

  const authenticate = async (signer: ethers.Signer) => {
    setIsAuthenticating(true);
    try {
      const newSession = await authenticateWallet(signer);
      setSession(newSession);
      toast({
        title: "Authentication Successful",
        description: "Your wallet has been authenticated successfully.",
      });
    } catch (error) {
      console.error('Authentication failed:', error);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Failed to authenticate wallet",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    clearSession();
    setSession(null);
    toast({
      title: "Logged Out",
      description: "Your wallet session has been cleared.",
    });
  };

  return {
    session,
    isAuthenticated: isAuthenticated(),
    isAuthenticating,
    authenticate,
    logout,
  };
}