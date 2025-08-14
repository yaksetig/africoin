import { ethers } from 'ethers';

export interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

export async function deployContract(
  abi: any[],
  bytecode: string,
  signer: ethers.Signer,
  constructorArgs: any[] = []
): Promise<DeploymentResult> {
  try {
    const factory = new ethers.ContractFactory(abi, bytecode, signer);

    // Deploy the contract
    const contract = await factory.deploy(...constructorArgs);
    
    // Wait for the deployment transaction to be mined
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    
    return {
      success: true,
      contractAddress,
      transactionHash: contract.deploymentTransaction()?.hash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error',
    };
  }
}