import React, { useState, useCallback } from 'react';
import { Upload, FileText, Coins, CheckCircle, Trash2, Download, Cloud, Rocket } from 'lucide-react';
import * as XLSX from 'xlsx';
import { WalletConnect } from "@/components/WalletConnect";
import { FileUpload } from "@/components/FileUpload";
import { ContractDeployer } from "@/components/ContractDeployer";
import IPFSConfig from "@/components/IPFSConfig";
import { useToast } from "@/hooks/use-toast";
import { ethers } from 'ethers';
import { uploadMetadataToIPFS, type CarbonCreditData } from '@/lib/ipfs';

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [mintingInProgress, setMintingInProgress] = useState(false);
  const [mintedTokens, setMintedTokens] = useState<number>(0);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [contractABI, setContractABI] = useState<any[]>([]);
  const [ipfsConfigured, setIpfsConfigured] = useState(false);
  const [ipfsUploading, setIpfsUploading] = useState(false);
  const [uploadedURIs, setUploadedURIs] = useState<string[]>([]);
  const { toast } = useToast();

  const steps = [
    {
      number: 1,
      title: "Connect Wallet",
      description: "Connect your MetaMask wallet to begin the tokenization process",
      icon: <Upload className="w-6 h-6" />,
      completed: walletConnected
    },
    {
      number: 2,
      title: "Setup Contract",
      description: "Deploy or configure your smart contract",
      icon: <Rocket className="w-6 h-6" />,
      completed: contractAddress !== ''
    },
    {
      number: 3,
      title: "Configure IPFS",
      description: "Set up IPFS storage for metadata",
      icon: <Cloud className="w-6 h-6" />,
      completed: ipfsConfigured
    },
    {
      number: 4,
      title: "Upload CSV/Excel",
      description: "Upload your CSV or Excel file containing asset data",
      icon: <FileText className="w-6 h-6" />,
      completed: uploadedFile !== null
    },
    {
      number: 5,
      title: "Mint NFTs",
      description: "Mint NFTs for each asset in your uploaded file",
      icon: <Coins className="w-6 h-6" />,
      completed: mintedTokens > 0
    }
  ];

  const handleWalletConnect = useCallback((address: string, walletProvider: ethers.BrowserProvider, walletSigner: ethers.Signer) => {
    setProvider(walletProvider);
    setSigner(walletSigner);
    setWalletAddress(address);
    setWalletConnected(true);
    setCurrentStep(2);
  }, []);

  const handleWalletDisconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setWalletAddress('');
    setWalletConnected(false);
    setCurrentStep(1);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    setUploadedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      let jsonData: any[] = [];
      
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = data as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index]?.trim() || '';
            });
            jsonData.push(row);
          }
        }
      } else {
        // Parse Excel
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet);
      }
      
      setCsvData(jsonData);
      toast({
        title: "File Uploaded",
        description: `Successfully loaded ${jsonData.length} rows`,
      });
    };
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }, [toast]);

  const downloadSampleCSV = () => {
    const sampleData = [
      ['SerialNumber', 'CarbonQuantity', 'ProjectID', 'VintageYear', 'GeographicCoordinates'],
      ['CC001', '1.5', 'PROJ001', '2023', '40.7128,-74.0060'],
      ['CC002', '2.0', 'PROJ001', '2023', '34.0522,-118.2437'],
      ['CC003', '1.8', 'PROJ002', '2023', '41.8781,-87.6298']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-carbon-credits.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uploadToIPFS = async () => {
    if (csvData.length === 0) {
      toast({
        title: "Error",
        description: "Please upload and process CSV data first",
        variant: "destructive",
      });
      return;
    }

    setIpfsUploading(true);
    
    try {
      // Convert CSV data to CarbonCreditData format
      const carbonCreditDataList: CarbonCreditData[] = csvData.map(item => ({
        serialNumber: item[Object.keys(item)[0]] || '',
        carbonQuantity: item['CarbonQuantity'] || item['Carbon Quantity'] || '',
        projectID: item['ProjectID'] || item['Project ID'] || '',
        vintageYear: item['VintageYear'] || item['Vintage Year'] || '',
        geographicCoordinates: item['GeographicCoordinates'] || item['Geographic Coordinates'] || '',
        ...item
      }));

      const results = await uploadMetadataToIPFS(carbonCreditDataList);

      const successfulUploads = results.filter(r => r.success);
      const uris = successfulUploads.map(r => r.tokenURI!);
      
      setUploadedURIs(uris);
      
      toast({
        title: "IPFS Upload Complete",
        description: `Successfully uploaded ${successfulUploads.length} out of ${results.length} metadata files`,
      });

      if (successfulUploads.length > 0) {
        setCurrentStep(5); // Move to minting step
      }
      
    } catch (error) {
      console.error('IPFS upload error:', error);
      toast({
        title: "Error",
        description: "An error occurred during IPFS upload",
        variant: "destructive",
      });
    } finally {
      setIpfsUploading(false);
    }
  };

  const mintNFTs = async () => {
    if (!signer || uploadedURIs.length === 0) {
      toast({
        title: "Error",
        description: "Please ensure wallet is connected and metadata is uploaded to IPFS",
        variant: "destructive",
      });
      return;
    }

    if (!contractAddress) {
      toast({
        title: "Error",
        description: "Please deploy or configure a contract first",
        variant: "destructive",
      });
      return;
    }

    setMintingInProgress(true);
    
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      let successCount = 0;
      
      for (let i = 0; i < uploadedURIs.length; i++) {
        const tokenURI = uploadedURIs[i];
        
        try {
          // Mint the NFT with the IPFS metadata URI
          const tx = await contract.mint(walletAddress, tokenURI);
          await tx.wait();
          
          successCount++;
          setMintedTokens(successCount);
          
          toast({
            title: "NFT Minted",
            description: `Successfully minted NFT ${i + 1} of ${uploadedURIs.length}`,
          });
          
        } catch (error) {
          console.error(`Error minting NFT ${i + 1}:`, error);
          toast({
            title: "Minting Error",
            description: `Failed to mint NFT ${i + 1}`,
            variant: "destructive",
          });
        }
      }
      
      toast({
        title: "Minting Complete",
        description: `Successfully minted ${successCount} out of ${uploadedURIs.length} NFTs`,
      });
      
    } catch (error) {
      console.error('Minting error:', error);
      toast({
        title: "Error",
        description: "An error occurred during the minting process",
        variant: "destructive",
      });
    } finally {
      setMintingInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Carbon Credit NFT Tokenization Platform
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your carbon credits into verifiable NFTs on the blockchain. 
            Upload your data, deploy contracts, and mint unique tokens representing your environmental assets.
          </p>
        </header>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                    ${step.completed 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : currentStep === step.number
                        ? 'border-primary text-primary bg-background'
                        : 'border-muted-foreground text-muted-foreground bg-background'
                    }
                  `}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      step.completed || currentStep === step.number 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground max-w-24">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    h-0.5 w-16 mx-4 transition-all
                    ${step.completed ? 'bg-primary' : 'bg-border'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        <main>
          {/* Step 1: Connect Wallet */}
          {currentStep === 1 && (
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-center mb-4">Connect Your Wallet</h2>
                <p className="text-center text-muted-foreground">
                  Connect your MetaMask wallet to start the tokenization process
                </p>
              </div>
              
              <WalletConnect
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
                connected={walletConnected}
                currentAddress={walletAddress}
              />
            </div>
          )}

          {/* Step 2: Setup Contract */}
          {currentStep === 2 && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-center mb-4">Smart Contract Setup</h2>
                <p className="text-center text-muted-foreground">
                  Deploy a new contract or connect to an existing one for minting NFTs.
                </p>
              </div>

              <ContractDeployer 
                signer={signer}
                onContractDeployed={(address, abi) => {
                  setContractAddress(address);
                  setContractABI(abi);
                  setCurrentStep(3);
                }}
              />
            </div>
          )}

          {/* Step 3: Configure IPFS */}
          {currentStep === 3 && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-center mb-4">IPFS Configuration</h2>
                <p className="text-center text-muted-foreground">
                  Configure Pinata API keys to upload metadata to IPFS.
                </p>
              </div>

              <IPFSConfig 
                onConfigured={() => {
                  setIpfsConfigured(true);
                  setCurrentStep(4);
                }}
                isConfigured={ipfsConfigured}
              />
            </div>
          )}

          {/* Step 4: Upload CSV/Excel */}
          {currentStep === 4 && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-center mb-4">Upload Your Data File</h2>
                <p className="text-center text-muted-foreground">
                  Upload a CSV or Excel file containing your asset data. The first column should contain unique identifiers.
                </p>
              </div>

              <FileUpload onFileUpload={handleFileUpload} />
              
              {uploadedFile && (
                <div className="mt-8 p-6 bg-muted rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">File Preview</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">
                      File: {uploadedFile.name} ({csvData.length} rows)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={downloadSampleCSV}
                        className="inline-flex items-center px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download Sample
                      </button>
                      <button
                        onClick={() => {
                          setUploadedFile(null);
                          setCsvData([]);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/80"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  {csvData.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-sm">
                          <thead className="bg-muted border-b">
                            <tr>
                              {Object.keys(csvData[0]).map((header, index) => (
                                <th key={index} className="text-left p-2 font-medium">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.slice(0, 5).map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b border-border/50">
                                {Object.values(row).map((cell, cellIndex) => (
                                  <td key={cellIndex} className="p-2">
                                    {String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {csvData.length > 5 && (
                        <div className="p-2 text-xs text-muted-foreground bg-muted border-t">
                          Showing first 5 rows of {csvData.length} total rows
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={uploadToIPFS}
                      disabled={csvData.length === 0 || ipfsUploading}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ipfsUploading ? 'Uploading to IPFS...' : 'Upload Metadata to IPFS'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Mint NFTs */}
          {currentStep === 5 && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-center mb-4">Mint NFTs</h2>
                <p className="text-center text-muted-foreground">
                  Ready to mint NFTs using the metadata uploaded to IPFS.
                </p>
              </div>

              <div className="p-6 bg-muted rounded-lg">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Minting Summary</h3>
                  <p className="text-muted-foreground">
                    {uploadedURIs.length} metadata files ready for minting
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Contract: {contractAddress}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{mintedTokens} / {uploadedURIs.length}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadedURIs.length > 0 ? (mintedTokens / uploadedURIs.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={mintNFTs}
                    disabled={mintingInProgress || uploadedURIs.length === 0}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mintingInProgress ? 'Minting in Progress...' : 'Start Minting NFTs'}
                  </button>
                </div>

                {mintedTokens > 0 && (
                  <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-center text-primary">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-semibold">
                        Successfully minted {mintedTokens} NFT{mintedTokens !== 1 ? 's' : ''}!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;