import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContract } from '@/hooks/useContract';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useSavedContracts } from '@/hooks/useSavedContracts';
import { Loader2, CheckCircle, Code, Rocket, Save, Trash2, Download } from 'lucide-react';
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
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [baseTokenURI, setBaseTokenURI] = useState('');
  const [maxSupply, setMaxSupply] = useState('');
  const [mintPrice, setMintPrice] = useState('');
  const [existingAddress, setExistingAddress] = useState('');
  const [useExisting, setUseExisting] = useState(false);
  const [useSaved, setUseSaved] = useState(false);
  const [selectedSavedContract, setSelectedSavedContract] = useState('');
  const [contractLabel, setContractLabel] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  
  const { contractState, compileAndDeploy, setContractInfo } = useContract();
  const { session, isAuthenticated, isAuthenticating, authenticate } = useWalletAuth();
  const { contracts, isLoading, saveNewContract, deleteExistingContract } = useSavedContracts(isAuthenticated);

  const handleAuthenticateWallet = async () => {
    if (!signer) return;
    await authenticate(signer);
  };

  const handleDeploy = async () => {
    if (!signer) return;
    const constructorArgs = [
      name,
      symbol,
      baseTokenURI,
      maxSupply ? BigInt(maxSupply) : 0n,
      mintPrice ? ethers.parseEther(mintPrice) : 0n,
    ];

    const result = await compileAndDeploy(sourceCode, signer, constructorArgs);
    if (result.success) {
      onContractDeployed(result.contractAddress!, result.abi!);
      
      // Show save form after successful deployment if authenticated
      if (isAuthenticated) {
        setShowSaveForm(true);
      }
    }
  };

  const handleSaveCurrentContract = async () => {
    if (!contractState.contractAddress || !contractState.abi || !isAuthenticated) return;
    
    await saveNewContract(
      contractState.contractAddress,
      contractState.abi,
      contractLabel || undefined,
      'ethereum' // Default network
    );
    
    setShowSaveForm(false);
    setContractLabel('');
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

  const handleUseSavedContract = () => {
    const selected = contracts.find(c => c.id === selectedSavedContract);
    if (!selected) return;
    
    setContractInfo(selected.contract_address, selected.abi);
    onContractDeployed(selected.contract_address, selected.abi);
  };

  const handleDeleteSavedContract = async (contractId: string) => {
    await deleteExistingContract(contractId);
    if (selectedSavedContract === contractId) {
      setSelectedSavedContract('');
    }
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
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Contract Ready</h4>
              <p className="text-sm font-mono break-all">
                {contractState.contractAddress}
              </p>
            </div>
            
            {showSaveForm && isAuthenticated && (
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">Save Contract</h4>
                <div>
                  <Label htmlFor="contract-label">Label (optional)</Label>
                  <Input
                    id="contract-label"
                    placeholder="e.g., My Carbon NFT Contract"
                    value={contractLabel}
                    onChange={(e) => setContractLabel(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveCurrentContract} size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    Save Contract
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSaveForm(false)} 
                    size="sm"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Wallet Authentication Section */}
            {!isAuthenticated && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">Wallet Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Authenticate your wallet to save and manage contracts across sessions.
                </p>
                <Button 
                  onClick={handleAuthenticateWallet}
                  disabled={!signer || isAuthenticating}
                  size="sm"
                  variant="outline"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Authenticate Wallet'
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="deploy-new"
                  checked={!useExisting && !useSaved}
                  onChange={() => {
                    setUseExisting(false);
                    setUseSaved(false);
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="deploy-new">Deploy New Contract</Label>
              </div>
              
              {!useExisting && !useSaved && (
                <div className="space-y-4 pl-6">
                  <div>
                    <Label htmlFor="contract-name">Name</Label>
                    <Input
                      id="contract-name"
                      placeholder="Token Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contract-symbol">Symbol</Label>
                    <Input
                      id="contract-symbol"
                      placeholder="SYM"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="base-token-uri">Base Token URI</Label>
                    <Input
                      id="base-token-uri"
                      placeholder="https://example.com/metadata/"
                      value={baseTokenURI}
                      onChange={(e) => setBaseTokenURI(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max-supply">Max Supply</Label>
                      <Input
                        id="max-supply"
                        type="number"
                        placeholder="1000"
                        value={maxSupply}
                        onChange={(e) => setMaxSupply(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mint-price">Mint Price (ETH)</Label>
                      <Input
                        id="mint-price"
                        type="number"
                        placeholder="0.01"
                        value={mintPrice}
                        onChange={(e) => setMintPrice(e.target.value)}
                      />
                    </div>
                  </div>
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

            {/* Saved Contracts Section */}
            {isAuthenticated && contracts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="use-saved"
                    checked={useSaved}
                    onChange={() => {
                      setUseSaved(true);
                      setUseExisting(false);
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="use-saved">Use Saved Contract</Label>
                </div>
                
                {useSaved && (
                  <div className="space-y-4 pl-6">
                    <div>
                      <Label htmlFor="saved-contract">Saved Contracts</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={selectedSavedContract} 
                          onValueChange={setSelectedSavedContract}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a saved contract" />
                          </SelectTrigger>
                          <SelectContent>
                            {contracts.map((contract) => (
                              <SelectItem key={contract.id} value={contract.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>
                                    {contract.label || `Contract ${contract.contract_address.slice(0, 8)}...`}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteSavedContract(contract.id);
                                    }}
                                    className="ml-2 h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedSavedContract && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          {contracts.find(c => c.id === selectedSavedContract)?.contract_address}
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={handleUseSavedContract}
                      disabled={!selectedSavedContract}
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Use This Contract
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="use-existing"
                  checked={useExisting}
                  onChange={() => {
                    setUseExisting(true);
                    setUseSaved(false);
                  }}
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