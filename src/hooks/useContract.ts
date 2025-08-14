import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { compileContract } from '@/lib/contract-compiler';
import { deployContract } from '@/lib/contract-deployer';
import { useToast } from '@/hooks/use-toast';

export interface ContractState {
  contractAddress: string | null;
  abi: any[] | null;
  isDeploying: boolean;
  isCompiling: boolean;
}

export function useContract() {
  const [contractState, setContractState] = useState<ContractState>({
    contractAddress: null,
    abi: null,
    isDeploying: false,
    isCompiling: false,
  });
  
  const { toast } = useToast();

  const compileAndDeploy = useCallback(async (
    sourceCode: string,
    signer: ethers.Signer,
    constructorArgs: any[] = []
  ) => {
    try {
      // Compile contract
      setContractState(prev => ({ ...prev, isCompiling: true }));
      toast({
        title: "Compiling Contract",
        description: "Compiling smart contract...",
      });

      const { abi, bytecode } = await compileContract(sourceCode);

      setContractState(prev => ({
        ...prev,
        isCompiling: false,
        abi,
        isDeploying: true
      }));

      toast({
        title: "Contract Compiled",
        description: "Deploying to blockchain...",
      });

      // Deploy contract
      const deploymentResult = await deployContract(
        compilationResult.abi,
        compilationResult.bytecode,
        signer,
        constructorArgs
      );

      if (!deploymentResult.success) {
        throw new Error(`Deployment failed: ${deploymentResult.error}`);
      }

      setContractState(prev => ({
        ...prev,
        isDeploying: false,
        contractAddress: deploymentResult.contractAddress!,
      }));

      toast({
        title: "Contract Deployed!",
        description: `Contract address: ${deploymentResult.contractAddress}`,
      });

      return {
        success: true,
        contractAddress: deploymentResult.contractAddress!,
        abi,
      };
    } catch (error) {
      setContractState(prev => ({
        ...prev,
        isCompiling: false,
        isDeploying: false,
      }));

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }, [toast]);

  const setContractInfo = useCallback((address: string, abi: any[]) => {
    setContractState({
      contractAddress: address,
      abi,
      isDeploying: false,
      isCompiling: false,
    });
  }, []);

  return {
    contractState,
    compileAndDeploy,
    setContractInfo,
  };
}