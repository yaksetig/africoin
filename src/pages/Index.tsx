import React, { useState, useCallback } from 'react';
import { Upload, FileText, Coins, CheckCircle, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { WalletConnect } from "@/components/WalletConnect";
import { FileUpload } from "@/components/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { ethers } from 'ethers';

// Contract ABI for tokenization
const TOKENIZE_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "string", "name": "_symbol", "type": "string"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_to", "type": "address"},
      {"internalType": "string", "name": "_tokenURI", "type": "string"}
    ],
    "name": "mint",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual contract address

interface DataRow {
  [key: string]: any;
}

interface TokenMetadata {
  name: string;
  description: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: any;
  }>;
}

export default function Index() {
  const [currentStep, setCurrentStep] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<DataRow[]>([]);
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [mintingProgress, setMintingProgress] = useState(0);
  const [isMinting, setIsMinting] = useState(false);
  const [mintedTokens, setMintedTokens] = useState<Array<{id: number, hash: string}>>([]);

  const { toast } = useToast();

  const steps = [
    { title: 'Connect Wallet', icon: Coins },
    { title: 'Upload File', icon: Upload },
    { title: 'Preview Data', icon: FileText },
    { title: 'Configure Collection', icon: CheckCircle },
    { title: 'Mint Tokens', icon: Coins }
  ];

  const handleWalletConnect = useCallback((address: string) => {
    setWalletAddress(address);
    setWalletConnected(true);
    setCurrentStep(1);
    toast({
      title: "Wallet Connected",
      description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
    });
  }, [toast]);

  const handleWalletDisconnect = useCallback(() => {
    setWalletAddress(null);
    setWalletConnected(false);
    setCurrentStep(0);
    toast({
      title: "Wallet Disconnected",
      description: "Please connect your wallet to continue.",
    });
  }, [toast]);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      let data: DataRow[] = [];
      
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: DataRow = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      }

      setUploadedData(data);
      setCurrentStep(2);
      toast({
        title: "File Processed",
        description: `Successfully loaded ${data.length} records.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Processing File",
        description: "Failed to parse the uploaded file. Please check the format.",
      });
    }
  }, [toast]);

  const handleRowSelection = (rowIndex: number) => {
    setSelectedRows(prev => 
      prev.includes(rowIndex)
        ? prev.filter(i => i !== rowIndex)
        : [...prev, rowIndex]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === uploadedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(uploadedData.map((_, index) => index));
    }
  };

  const handleProceedToCollection = () => {
    if (selectedRows.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data Selected",
        description: "Please select at least one row to proceed.",
      });
      return;
    }
    setCurrentStep(3);
  };

  const handleMintTokens = async () => {
    if (!walletAddress || !collectionName || !collectionSymbol || selectedRows.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please ensure all fields are filled and data is selected.",
      });
      return;
    }

    setIsMinting(true);
    setCurrentStep(4);
    setMintingProgress(0);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, TOKENIZE_CONTRACT_ABI, signer);

      const selectedData = selectedRows.map(index => uploadedData[index]);
      
      for (let i = 0; i < selectedData.length; i++) {
        const row = selectedData[i];
        
        // Create metadata for the NFT
        const metadata: TokenMetadata = {
          name: `${collectionName} #${i + 1}`,
          description: `Token from ${collectionName} collection`,
          attributes: Object.entries(row).map(([key, value]) => ({
            trait_type: key,
            value: value
          }))
        };

        // In a real implementation, you would upload metadata to IPFS
        const tokenURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

        // Mint the token
        const tx = await contract.mint(walletAddress, tokenURI);
        const receipt = await tx.wait();
        
        setMintedTokens(prev => [...prev, { id: i + 1, hash: receipt.hash }]);
        setMintingProgress(((i + 1) / selectedData.length) * 100);
      }

      toast({
        title: "Minting Complete",
        description: `Successfully minted ${selectedData.length} tokens!`,
      });
    } catch (error) {
      console.error('Minting error:', error);
      toast({
        variant: "destructive",
        title: "Minting Failed",
        description: "Failed to mint tokens. Please try again.",
      });
    } finally {
      setIsMinting(false);
    }
  };

  const exportSelectedData = () => {
    const selectedData = selectedRows.map(index => uploadedData[index]);
    const ws = XLSX.utils.json_to_sheet(selectedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selected Data");
    XLSX.writeFile(wb, "selected_tokenization_data.xlsx");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Data Tokenization Platform
            </h1>
            <p className="text-muted-foreground text-lg">
              Transform your data into blockchain tokens with ease
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={index} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                      ${isActive 
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : isCompleted 
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted bg-background text-muted-foreground'
                      }
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`
                        w-16 h-0.5 ml-4 transition-all
                        ${index < currentStep ? 'bg-primary' : 'bg-muted'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-card rounded-xl shadow-lg p-8">
            {/* Step 0: Connect Wallet */}
            {currentStep === 0 && (
              <div className="text-center space-y-6">
                <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
                <p className="text-muted-foreground">
                  Connect your MetaMask wallet to start tokenizing your data
                </p>
                <WalletConnect
                  onConnect={handleWalletConnect}
                  onDisconnect={handleWalletDisconnect}
                  connected={walletConnected}
                  currentAddress={walletAddress}
                />
              </div>
            )}

            {/* Step 1: Upload File */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">Upload Your Data</h2>
                  <p className="text-muted-foreground">
                    Upload a CSV or Excel file containing the data you want to tokenize
                  </p>
                </div>
                <FileUpload onFileUpload={handleFileUpload} />
              </div>
            )}

            {/* Step 2: Preview Data */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-semibold">Preview Your Data</h2>
                    <p className="text-muted-foreground">
                      Select the rows you want to tokenize ({selectedRows.length} selected)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
                    >
                      {selectedRows.length === uploadedData.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={exportSelectedData}
                      className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                      disabled={selectedRows.length === 0}
                    >
                      <Download className="w-4 h-4 inline mr-1" />
                      Export Selected
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedRows.length === uploadedData.length}
                              onChange={handleSelectAll}
                              className="rounded border-border"
                            />
                          </th>
                          {uploadedData.length > 0 && Object.keys(uploadedData[0]).map(key => (
                            <th key={key} className="p-3 text-left font-medium">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedData.map((row, index) => (
                          <tr
                            key={index}
                            className={`
                              border-b hover:bg-muted/50 cursor-pointer
                              ${selectedRows.includes(index) ? 'bg-primary/5' : ''}
                            `}
                            onClick={() => handleRowSelection(index)}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(index)}
                                onChange={() => handleRowSelection(index)}
                                className="rounded border-border"
                              />
                            </td>
                            {Object.values(row).map((value, valueIndex) => (
                              <td key={valueIndex} className="p-3 text-sm">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleProceedToCollection}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    disabled={selectedRows.length === 0}
                  >
                    Proceed to Collection Setup
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Configure Collection */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">Configure Your Collection</h2>
                  <p className="text-muted-foreground">
                    Set up your NFT collection details
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Collection Name</label>
                    <input
                      type="text"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg bg-background"
                      placeholder="Enter collection name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Collection Symbol</label>
                    <input
                      type="text"
                      value={collectionSymbol}
                      onChange={(e) => setCollectionSymbol(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg bg-background"
                      placeholder="Enter collection symbol (e.g., DATA)"
                    />
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Collection Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedRows.length} tokens will be minted
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleMintTokens}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    disabled={!collectionName || !collectionSymbol}
                  >
                    Start Minting
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Minting Progress */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">Minting Your Tokens</h2>
                  <p className="text-muted-foreground">
                    {isMinting ? 'Processing your tokens...' : 'Minting completed!'}
                  </p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{Math.round(mintingProgress)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${mintingProgress}%` }}
                        />
                      </div>
                    </div>
                    
                    {mintedTokens.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Minted Tokens</h3>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {mintedTokens.map((token) => (
                            <div key={token.id} className="flex justify-between text-sm">
                              <span>Token #{token.id}</span>
                              <span className="text-muted-foreground font-mono text-xs">
                                {token.hash.slice(0, 8)}...
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!isMinting && mintingProgress === 100 && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setCurrentStep(0);
                        setUploadedData([]);
                        setSelectedRows([]);
                        setCollectionName('');
                        setCollectionSymbol('');
                        setMintingProgress(0);
                        setMintedTokens([]);
                      }}
                      className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                      Start New Project
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}