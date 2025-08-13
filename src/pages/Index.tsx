import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  Coins,
  CheckCircle,
  Trash2,
  Download,
  Cloud,
  Rocket,
  AlertCircle,
  Lock
} from 'lucide-react';
import DataMap from '@/components/DataMap';
import * as XLSX from 'xlsx';
import { FileUpload } from "@/components/FileUpload";
import { ContractDeployer } from "@/components/ContractDeployer";
import { WalletConnect } from "@/components/WalletConnect";
import IPFSConfig from "@/components/IPFSConfig";
import { useToast } from "@/hooks/use-toast";
import { ethers } from 'ethers';
import { uploadMetadataToIPFS, type CarbonCreditData } from '@/lib/ipfs';
import { parseEthersError } from '@/lib/tx-error';

interface IndexProps {
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
  walletConnected: boolean;
  walletAddress: string | null;
  onWalletConnect: (
    address: string,
    provider: ethers.BrowserProvider,
    signer: ethers.JsonRpcSigner
  ) => void;
  onWalletDisconnect: () => void;
}

const Index: React.FC<IndexProps> = ({
  signer,
  provider,
  walletConnected,
  walletAddress,
  onWalletConnect,
  onWalletDisconnect,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [mintingInProgress, setMintingInProgress] = useState(false);
  const [mintedTokens, setMintedTokens] = useState<number>(0);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [contractABI, setContractABI] = useState<ethers.InterfaceAbi>([]);
  const [ipfsConfigured, setIpfsConfigured] = useState(false);
  const [ipfsUploading, setIpfsUploading] = useState(false);
  const [uploadedURIs, setUploadedURIs] = useState<string[]>([]);
  const { toast } = useToast();

  // Auto-advance to step 2 only on initial wallet connection, not when navigating back
  useEffect(() => {
    if (walletConnected && currentStep === 1) {
      // Only auto-advance if we're not coming from a disconnect action
      const timeoutId = setTimeout(() => {
        if (walletConnected && currentStep === 1) {
          setCurrentStep(2);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [walletConnected]);

  const steps = [
    {
      number: 1,
      title: "Connect Wallet",
      description: "Connect your wallet to begin tokenization process",
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
      title: "Upload file",
      description: "Upload your file containing asset data",
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

  const isStepLocked = (stepNumber: number) =>
    steps.slice(0, stepNumber - 1).some((step) => !step.completed);

  const handleWalletConnect = useCallback(
    (
      address: string,
      walletProvider: ethers.BrowserProvider,
      walletSigner: ethers.JsonRpcSigner
    ) => {
      onWalletConnect(address, walletProvider, walletSigner);
      setCurrentStep(2);
    },
    [onWalletConnect]
  );

  const handleWalletDisconnect = useCallback(() => {
    onWalletDisconnect();
    // Reset all states when disconnecting
    setCurrentStep(1);
    setContractAddress('');
    setContractABI([]);
    setIpfsConfigured(false);
    setUploadedFile(null);
    setCsvData([]);
    setSelectedRows([]);
    setUploadedURIs([]);
    setMintedTokens(0);
  }, [onWalletDisconnect]);

  const handleFileUpload = useCallback((file: File) => {
    setUploadedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      let jsonData: Record<string, string>[] = [];

      const normalizeCoordinate = (coord: unknown): string => {
        if (coord == null) return '';
        const coordStr = String(coord);
        const matches = coordStr.match(/-?\d+(?:\.\d+)?/g);
        if (!matches || matches.length < 2) return '';
        let lat = parseFloat(matches[0]);
        let lng = parseFloat(matches[1]);
        if (/s/i.test(coordStr)) lat = -Math.abs(lat);
        if (/w/i.test(coordStr)) lng = -Math.abs(lng);
        return `${lat},${lng}`;
      };

      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = data as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
              let value = values[index]?.trim() || '';
              if (header.toLowerCase().includes('geographic')) {
                value = normalizeCoordinate(value);
              }
              row[header] = value;
            });
            jsonData.push(row);
          }
        }
      } else {
        // Parse Excel
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
        jsonData = jsonData.map(row => {
          const key = Object.keys(row).find(k => k.toLowerCase().includes('geographic'));
          if (key) {
            row[key] = normalizeCoordinate(row[key]);
          }
          return row;
        });
      }
      
      setCsvData(jsonData);
      setSelectedRows([]);
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

  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const deleteSelectedRows = () => {
    setCsvData(prev => prev.filter((_, idx) => !selectedRows.includes(idx)));
    setSelectedRows([]);
  };

  const deleteRow = (index: number) => {
    setCsvData(prev => prev.filter((_, idx) => idx !== index));
    setSelectedRows(prev => prev.filter(i => i !== index));
  };

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
      // Convert CSV data to CarbonCreditData format with validation
      const carbonCreditDataList: CarbonCreditData[] = csvData.map((item, index) => {
        const serialNumber = item[Object.keys(item)[0]] || `ITEM-${index + 1}`;

        return {
          serialNumber,
          projectName: item['ProjectName'] || item['Project Name'] || item['ProjectID'] || item['Project ID'] || '',
          country: item['Country'] || item['GeographicCoordinates'] || item['Geographic Coordinates'] || '',
          methodology: item['Methodology'] || '',
          vintage: item['VintageYear'] || item['Vintage Year'] || item['Vintage'] || '',
          volume: item['CarbonQuantity'] || item['Carbon Quantity'] || item['Volume'] || '1 tCO2e',
          ...item
        };
      });

      const results = await uploadMetadataToIPFS(carbonCreditDataList);

      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);

      if (failedUploads.length > 0) {
        console.warn('Some uploads failed:', failedUploads);
      }

      const uris = successfulUploads.map(r => r.tokenURI!);
      setUploadedURIs(uris);

      if (successfulUploads.length === 0) {
        toast({
          title: "Upload Failed",
          description: "All metadata uploads failed. Please check your data and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "IPFS Upload Complete",
        description: `Successfully uploaded ${successfulUploads.length} out of ${results.length} metadata files`,
        variant: failedUploads.length > 0 ? "destructive" : "default",
      });

      if (successfulUploads.length > 0) {
        setCurrentStep(5);
      }

    } catch (error) {
      console.error('IPFS upload error:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "An error occurred during IPFS upload",
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

      // Check if contract has ownerMint function (for free minting)
      let hasOwnerMint = false;
      if (Array.isArray(contractABI)) {
        for (const item of contractABI as any[]) {
          if ((typeof item === 'object' && (item as any)?.name === 'ownerMint') || (typeof item === 'string' && item.includes('ownerMint'))) {
            hasOwnerMint = true;
            break;
          }
        }
      }

      // Preflight checks: owner permission and simulation
      try {
        if ((contract as any).owner) {
          const ownerAddr = await (contract as any).owner();
          const signerAddr = await signer.getAddress();
          if (ownerAddr && signerAddr && ownerAddr.toLowerCase() !== signerAddr.toLowerCase()) {
            toast({
              title: "Permission error",
              description: `Minting is restricted to the contract owner (${ownerAddr}). Connect with the owner wallet or redeploy a contract you own.`,
              variant: "destructive",
            });
            return;
          }
        }
      } catch {}

      try {
        if (uploadedURIs.length > 0) {
          const firstUri = uploadedURIs[0];
          if (hasOwnerMint && (contract as any).ownerMint?.staticCall) {
            await (contract as any).ownerMint.staticCall(walletAddress, firstUri);
          } else if ((contract as any).mint?.staticCall) {
            await (contract as any).mint.staticCall(walletAddress, firstUri);
          }
        }
      } catch (simErr) {
        const parsed = parseEthersError(simErr);
        toast({ title: parsed.title, description: parsed.description, variant: "destructive" });
        return;
      }

      for (let i = 0; i < uploadedURIs.length; i++) {
        const tokenURI = uploadedURIs[i];

        try {
          let tx;

          if (hasOwnerMint) {
            // Try owner mint first (free)
            try {
              tx = await (contract as any).ownerMint(walletAddress, tokenURI);
            } catch (ownerError) {
              // Fall back to paid mint
              console.log('Owner mint failed, trying paid mint');
              tx = await (contract as any).mint(walletAddress, tokenURI, { value: ethers.parseEther("0.01") });
            }
          } else {
            // Use regular mint function
            tx = await contract.mint(walletAddress, tokenURI);
          }

          await tx.wait();

          successCount++;
          setMintedTokens(successCount);

          toast({
            title: "NFT Minted",
            description: `Successfully minted NFT ${i + 1} of ${uploadedURIs.length}`,
          });

        } catch (error) {
          console.error(`Error minting NFT ${i + 1}:`, error);
          const parsed = parseEthersError(error);
          toast({
            title: "Minting failed",
            description: `NFT ${i + 1}: ${parsed.description}`,
            variant: "destructive",
          });
        }
      }

      if (successCount > 0) {
        toast({
          title: "Minting Complete",
          description: `Successfully minted ${successCount} out of ${uploadedURIs.length} NFTs`,
        });
      }

    } catch (error) {
      console.error('Minting error:', error);
      const parsed = parseEthersError(error);
      toast({
        title: parsed.title,
        description: parsed.description,
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
                <button
                  onClick={() => setCurrentStep(step.number)}
                  className="flex flex-col items-center focus:outline-none cursor-pointer"
                >
                  <div
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                    ${step.completed
                      ? 'bg-primary border-primary text-primary-foreground'
                      : currentStep === step.number
                        ? 'border-primary text-primary bg-background'
                        : 'border-muted-foreground text-muted-foreground bg-background'
                    }
                  `}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : currentStep > step.number ? (
                      <AlertCircle className="w-6 h-6" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-sm font-medium ${
                        step.completed || currentStep === step.number
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground max-w-24">
                      {step.description}
                    </div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`
                    h-0.5 w-16 mx-4 transition-all
                    ${step.completed ? 'bg-primary' : 'bg-border'}
                  `}
                  />
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Step Navigation Controls */}
      {currentStep > 1 && (
        <div className="max-w-4xl mx-auto mb-8 flex justify-between">
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
          >
            ← Previous Step
          </button>

          {currentStep < 5 && contractAddress && ipfsConfigured && uploadedFile && (
            <button
              onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Next Step →
            </button>
          )}
        </div>
      )}

      <main>
        {/* Step 1: Connect Wallet */}
          {currentStep === 1 && (
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-center mb-4">Connect Your Wallet</h2>
                <p className="text-center text-muted-foreground mb-4">
                  Connect your MetaMask wallet to start the tokenization process
                </p>
                <div className="text-center">
                  <WalletConnect
                    onConnect={handleWalletConnect}
                    onDisconnect={handleWalletDisconnect}
                    connected={walletConnected}
                    currentAddress={walletAddress}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Setup Contract */}
          {currentStep === 2 && (
            <div className="relative max-w-2xl mx-auto">
              <div className={isStepLocked(2) ? "pointer-events-none opacity-50" : ""}>
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
              {isStepLocked(2) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="w-5 h-5 mr-2" />
                    <span>Complete previous steps to continue</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Configure IPFS */}
          {currentStep === 3 && (
            <div className="relative max-w-2xl mx-auto">
              <div className={isStepLocked(3) ? "pointer-events-none opacity-50" : ""}>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-center mb-4">IPFS Configuration</h2>
                  <p className="text-center text-muted-foreground">
                    Configure <a href="https://pinata.cloud/" className="underline" target="_blank" rel="noopener noreferrer">Piñata API Keys</a> to upload metadata to IPFS.
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
              {isStepLocked(3) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="w-5 h-5 mr-2" />
                    <span>Complete previous steps to continue</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Upload CSV/Excel */}
          {currentStep === 4 && (
            <div className="relative max-w-2xl mx-auto">
              <div className={isStepLocked(4) ? "pointer-events-none opacity-50" : ""}>
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
                            setSelectedRows([]);
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
                                <th className="p-2"></th>
                                {Object.keys(csvData[0]).map((header, index) => (
                                  <th key={index} className="text-left p-2 font-medium">
                                    {header}
                                  </th>
                                ))}
                                <th className="p-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvData.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b border-border/50">
                                  <td className="p-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedRows.includes(rowIndex)}
                                      onChange={() => toggleRowSelection(rowIndex)}
                                    />
                                  </td>
                                  {Object.values(row).map((cell, cellIndex) => (
                                    <td key={cellIndex} className="p-2">
                                      {String(cell)}
                                    </td>
                                  ))}
                                  <td className="p-2 text-right">
                                    <button
                                      onClick={() => deleteRow(rowIndex)}
                                      className="text-destructive hover:underline text-xs"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {selectedRows.length > 0 && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={deleteSelectedRows}
                          className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/80"
                        >
                          Delete Selected
                        </button>
                      </div>
                    )}

                    {csvData.length > 0 && (
                      <div className="mt-6">
                        <DataMap data={csvData} />
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
              {isStepLocked(4) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="w-5 h-5 mr-2" />
                    <span>Complete previous steps to continue</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Mint NFTs */}
          {currentStep === 5 && (
            <div className="relative max-w-2xl mx-auto">
              <div className={isStepLocked(5) ? "pointer-events-none opacity-50" : ""}>
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
              {isStepLocked(5) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="w-5 h-5 mr-2" />
                    <span>Complete previous steps to continue</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
        {!walletConnected && (
          <div className="mt-12 flex justify-center">
            <WalletConnect
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
              connected={walletConnected}
              currentAddress={walletAddress}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
