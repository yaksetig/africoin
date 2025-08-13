import { useState, useEffect } from 'react';
import { getSavedContracts, saveContract, deleteContract } from '@/lib/wallet-auth';
import { useToast } from '@/hooks/use-toast';

export interface SavedContract {
  id: string;
  owner_address: string;
  label: string | null;
  contract_address: string;
  abi: any;
  network: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseSavedContractsReturn {
  contracts: SavedContract[];
  isLoading: boolean;
  saveNewContract: (address: string, abi: any[], label?: string, network?: string) => Promise<void>;
  deleteExistingContract: (contractId: string) => Promise<void>;
  refreshContracts: () => Promise<void>;
}

export function useSavedContracts(isAuthenticated: boolean): UseSavedContractsReturn {
  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadContracts = async () => {
    if (!isAuthenticated) {
      setContracts([]);
      return;
    }

    setIsLoading(true);
    try {
      const savedContracts = await getSavedContracts();
      setContracts(savedContracts);
    } catch (error) {
      console.error('Failed to load contracts:', error);
      toast({
        title: "Failed to Load Contracts",
        description: "Could not load your saved contracts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveNewContract = async (
    address: string, 
    abi: any[], 
    label?: string, 
    network?: string
  ) => {
    try {
      await saveContract(address, abi, label, network);
      await loadContracts(); // Refresh the list
      toast({
        title: "Contract Saved",
        description: `Contract ${label || address} has been saved successfully.`,
      });
    } catch (error) {
      console.error('Failed to save contract:', error);
      toast({
        title: "Failed to Save Contract",
        description: error instanceof Error ? error.message : "Could not save contract",
        variant: "destructive",
      });
    }
  };

  const deleteExistingContract = async (contractId: string) => {
    try {
      await deleteContract(contractId);
      await loadContracts(); // Refresh the list
      toast({
        title: "Contract Deleted",
        description: "Contract has been removed from your saved contracts.",
      });
    } catch (error) {
      console.error('Failed to delete contract:', error);
      toast({
        title: "Failed to Delete Contract",
        description: error instanceof Error ? error.message : "Could not delete contract",
        variant: "destructive",
      });
    }
  };

  // Load contracts when authentication status changes
  useEffect(() => {
    loadContracts();
  }, [isAuthenticated]);

  return {
    contracts,
    isLoading,
    saveNewContract,
    deleteExistingContract,
    refreshContracts: loadContracts,
  };
}