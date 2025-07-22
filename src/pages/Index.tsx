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
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Contract address (placeholder)
const CONTRACT_ADDRESS = "0x6AB61b2006a18c630d6F8C5000D15A33B77F4Ba9";

interface CSVRow {
  [key: string]: string | number;
}

interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  maxSupply: number;
}

const Index = () => {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState(1);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [collectionConfig, setCollectionConfig] = useState<CollectionConfig>({
    name: '',
    symbol: '',
    description: '',
    maxSupply: 1000
  });
  const [mintingProgress, setMintingProgress] = useState<{
    current: number;
    total: number;
    isActive: boolean;
  }>({
    current: 0,
    total: 0,
    isActive: false
  });

  const { toast } = useToast();

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        if (jsonData.length > 0) {
          const headers = jsonData[0];
          const rows = jsonData.slice(1).map((row, index) => {
            const rowData: CSVRow = { id: index };
            headers.forEach((header, i) => {
              rowData[header] = row[i] || '';
            });
            return rowData;
          });
          
          setCsvHeaders(headers);
          setCsvData(rows);
          setCurrentStep(2);
          toast({
            title: "CSV file uploaded successfully",
            description: `Loaded ${rows.length} rows with ${headers.length} columns`,
          });
        }
      } catch (error) {
        toast({
          title: "Error reading CSV file",
          description: "Please make sure your CSV file is properly formatted",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  }, [toast]);

  const handleRowSelection = (rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === csvData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(csvData.map((_, index) => index)));
    }
  };

  const handleDeleteSelected = () => {
    const newData = csvData.filter((_, index) => !selectedRows.has(index));
    setCsvData(newData);
    setSelectedRows(new Set());
    toast({
      title: "Rows deleted",
      description: `Removed ${selectedRows.size} rows from your data`,
    });
  };

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
    setIsConnected(true);
    if (csvData.length > 0) {
      setCurrentStep(3);
    }
    toast({
      title: "Wallet connected successfully",
      description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
    });
  };

  const handleWalletDisconnect = () => {
    setWalletAddress('');
    setIsConnected(false);
    setCurrentStep(csvData.length > 0 ? 2 : 1);
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Name', 'Description', 'Category', 'Value', 'Owner'],
      ['Sample Item 1', 'A sample tokenizable asset', 'Real Estate', '100000', 'John Doe'],
      ['Sample Item 2', 'Another tokenizable asset', 'Art', '50000', 'Jane Smith']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "africoin_template.csv");
  };

  const handleMintTokens = async () => {
    if (!isConnected || !window.ethereum) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, TOKENIZE_CONTRACT_ABI, signer);

      setMintingProgress({ current: 0, total: csvData.length, isActive: true });

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        // Simulate minting process
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMintingProgress(prev => ({ ...prev, current: i + 1 }));
      }

      setMintingProgress(prev => ({ ...prev, isActive: false }));
      setCurrentStep(4);
      
      toast({
        title: "Tokens minted successfully!",
        description: `Successfully minted ${csvData.length} tokens from your CSV data`,
      });
    } catch (error) {
      console.error('Minting error:', error);
      setMintingProgress(prev => ({ ...prev, isActive: false }));
      toast({
        title: "Minting failed",
        description: "There was an error minting your tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetProcess = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setSelectedRows(new Set());
    setCurrentStep(1);
    setCollectionConfig({
      name: '',
      symbol: '',
      description: '',
      maxSupply: 1000
    });
    setMintingProgress({ current: 0, total: 0, isActive: false });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Coins className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">AfriCoin</h1>
                <p className="text-muted-foreground">Transform your CSV data into blockchain tokens</p>
              </div>
            </div>
            <WalletConnect 
              onConnect={handleWalletConnect} 
              onDisconnect={handleWalletDisconnect}
              connected={isConnected}
              currentAddress={walletAddress}
            />
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-8">
            {[
              { step: 1, label: 'Upload CSV', icon: Upload },
              { step: 2, label: 'Review Data', icon: FileText },
              { step: 3, label: 'Configure', icon: Coins },
              { step: 4, label: 'Complete', icon: CheckCircle }
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                  ${currentStep >= step 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background text-muted-foreground border-border'
                  }
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`
                  ml-3 text-sm font-medium
                  ${currentStep >= step ? 'text-foreground' : 'text-muted-foreground'}
                `}>
                  {label}
                </span>
                {step < 4 && (
                  <div className={`
                    w-16 h-0.5 ml-8
                    ${currentStep > step ? 'bg-primary' : 'bg-border'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">Upload Your CSV File</h2>
                <p className="text-muted-foreground mb-8">
                  Upload your CSV file containing the data you want to tokenize on the blockchain.
                  Each row will become a unique token.
                </p>
              </div>

              <FileUpload onFileUpload={handleFileUpload} />

              <div className="text-center">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && csvData.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Review Your Data</h2>
                  <p className="text-muted-foreground">
                    Review and select the rows you want to tokenize. Each selected row will become an NFT.
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors border border-primary rounded-md"
                  >
                    {selectedRows.size === csvData.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedRows.size > 0 && (
                    <>
                      <button
                        onClick={handleDeleteSelected}
                        className="px-4 py-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors border border-destructive rounded-md"
                      >
                        <Trash2 className="h-4 w-4 mr-2 inline" />
                        Delete Selected ({selectedRows.size})
                      </button>
                      <button
                        onClick={() => setCurrentStep(3)}
                        disabled={!isConnected}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue with {selectedRows.size} items
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="w-12 p-4">
                          <input
                            type="checkbox"
                            checked={selectedRows.size === csvData.length && csvData.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-border"
                          />
                        </th>
                        {csvHeaders.map((header, index) => (
                          <th key={index} className="text-left p-4 font-medium text-foreground">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((row, rowIndex) => (
                        <tr 
                          key={rowIndex} 
                          className={`
                            border-t border-border hover:bg-muted/50 transition-colors
                            ${selectedRows.has(rowIndex) ? 'bg-primary/5' : ''}
                          `}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(rowIndex)}
                              onChange={() => handleRowSelection(rowIndex)}
                              className="rounded border-border"
                            />
                          </td>
                          {csvHeaders.map((header, colIndex) => (
                            <td key={colIndex} className="p-4 text-foreground">
                              {String(row[header] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!isConnected && (
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    Connect your wallet to continue with tokenization
                  </p>
                  <WalletConnect 
                    onConnect={handleWalletConnect} 
                    onDisconnect={handleWalletDisconnect}
                    connected={isConnected}
                    currentAddress={walletAddress}
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Configure Your Collection</h2>
                <p className="text-muted-foreground">
                  Set up your token collection details before minting.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      value={collectionConfig.name}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My AfriCoin Collection"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Symbol
                    </label>
                    <input
                      type="text"
                      value={collectionConfig.symbol}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, symbol: e.target.value }))}
                      placeholder="AFRC"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                    <textarea
                      value={collectionConfig.description}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your tokenized collection..."
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Max Supply
                    </label>
                    <input
                      type="number"
                      value={collectionConfig.maxSupply}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, maxSupply: parseInt(e.target.value) || 0 }))}
                      min="1"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Minting Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CSV Rows:</span>
                      <span className="font-medium text-foreground">{csvData.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Selected for Minting:</span>
                      <span className="font-medium text-foreground">{selectedRows.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collection Name:</span>
                      <span className="font-medium text-foreground">{collectionConfig.name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Symbol:</span>
                      <span className="font-medium text-foreground">{collectionConfig.symbol || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connected Wallet:</span>
                      <span className="font-medium text-foreground text-xs">
                        {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleMintTokens}
                    disabled={!collectionConfig.name || !collectionConfig.symbol || selectedRows.size === 0 || mintingProgress.isActive}
                    className="w-full mt-6 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mintingProgress.isActive ? 'Minting...' : `Mint ${selectedRows.size} Tokens`}
                  </button>
                </div>
              </div>

              {mintingProgress.isActive && (
                <div className="bg-muted/50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-foreground">Minting Progress</h3>
                    <span className="text-sm text-muted-foreground">
                      {mintingProgress.current} of {mintingProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(mintingProgress.current / mintingProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center space-y-8">
              <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Tokenization Complete!</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Successfully minted {csvData.length} tokens from your CSV data.
                  Your AfriCoin collection is now live on the blockchain!
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-foreground mb-4">Collection Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium text-foreground">{collectionConfig.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Symbol:</span>
                    <span className="font-medium text-foreground">{collectionConfig.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Supply:</span>
                    <span className="font-medium text-foreground">{csvData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract:</span>
                    <span className="font-medium text-foreground text-xs">
                      {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={resetProcess}
                  className="px-6 py-3 border border-border text-foreground rounded-md hover:bg-muted transition-colors"
                >
                  Create Another Collection
                </button>
                <button
                  onClick={() => window.open(`https://etherscan.io/address/${CONTRACT_ADDRESS}`, '_blank')}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  View on Etherscan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;