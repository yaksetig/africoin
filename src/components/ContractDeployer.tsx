import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContract } from '@/hooks/useContract';
import { Loader2, CheckCircle, Code, Rocket } from 'lucide-react';
import { ethers } from 'ethers';

interface ContractDeployerProps {
  signer: ethers.Signer | null;
  onContractDeployed: (address: string, abi: any[]) => void;
}

export const ContractDeployer: React.FC<ContractDeployerProps> = ({
  signer,
  onContractDeployed,
}) => {
  const [sourceCode, setSourceCode] = useState('');
  const [existingAddress, setExistingAddress] = useState('');
  const [useExisting, setUseExisting] = useState(false);
  
  const { contractState, compileAndDeploy, setContractInfo } = useContract();

  const handleDeploy = async () => {
    if (!signer) return;
    
    const result = await compileAndDeploy(sourceCode, signer);
    if (result.success) {
      onContractDeployed(result.contractAddress!, result.abi!);
    }
  };

  const handleUseExisting = () => {
    if (!existingAddress) return;
    
    // Use the ABI from the current codebase
    const defaultABI = [
      // Add the basic ERC721 ABI methods needed for minting
      {
        "inputs": [{"name": "to", "type": "address"}, {"name": "uri", "type": "string"}],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "to", "type": "address"}, {"name": "uris", "type": "string[]"}],
        "name": "batchMint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    setContractInfo(existingAddress, defaultABI);
    onContractDeployed(existingAddress, defaultABI);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {contractState.contractAddress ? (
            <CheckCircle className="h-5 w-5 text-primary" />
          ) : (
            <Rocket className="h-5 w-5" />
          )}
          Smart Contract Setup
        </CardTitle>
        <CardDescription>
          Deploy a new contract or use an existing one
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {contractState.contractAddress ? (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Contract Ready</h4>
            <p className="text-sm font-mono break-all">
              {contractState.contractAddress}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="deploy-new"
                  checked={!useExisting}
                  onChange={() => setUseExisting(false)}
                  className="h-4 w-4"
                />
                <Label htmlFor="deploy-new">Deploy New Contract</Label>
              </div>
              
              {!useExisting && (
                <div className="space-y-4 pl-6">
                  <div>
                    <Label htmlFor="source-code">Solidity Source Code</Label>
                    <Textarea
                      id="source-code"
                      placeholder="Paste your Solidity contract source code here..."
                      value={sourceCode}
                      onChange={(e) => setSourceCode(e.target.value)}
                      className="h-32 font-mono text-sm"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleDeploy}
                    disabled={!signer || !sourceCode || contractState.isCompiling || contractState.isDeploying}
                    className="w-full"
                  >
                    {contractState.isCompiling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Compiling...
                      </>
                    ) : contractState.isDeploying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Code className="mr-2 h-4 w-4" />
                        Compile & Deploy Contract
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="use-existing"
                  checked={useExisting}
                  onChange={() => setUseExisting(true)}
                  className="h-4 w-4"
                />
                <Label htmlFor="use-existing">Use Existing Contract</Label>
              </div>
              
              {useExisting && (
                <div className="space-y-4 pl-6">
                  <div>
                    <Label htmlFor="contract-address">Contract Address</Label>
                    <Input
                      id="contract-address"
                      placeholder="0x..."
                      value={existingAddress}
                      onChange={(e) => setExistingAddress(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleUseExisting}
                    disabled={!existingAddress}
                    className="w-full"
                  >
                    Use This Contract
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};