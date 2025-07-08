import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Coins, CheckCircle, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx'; // For Excel parsing
import { WalletConnect } from "@/components/WalletConnect"; // Assuming this is your component path
import { FileUpload } from "@/components/FileUpload"; // Assuming this is your component path
import { useToast } from "@/hooks/use-toast"; // Assuming useToast is in @/hooks/use-toast

const Index = () => {
  // State variables for the multi-step process
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [mintingStatus, setMintingStatus] = useState<'idle' | 'minting' | 'completed' | 'failed'>('idle');
  const [collectionStatus, setCollectionStatus] = useState<'idle' | 'minting' | 'completed' | 'failed'>('idle');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [walletConnected, setWalletConnected] = useState(false); // State to track wallet connection status
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null); // State to store connected wallet address

  const { toast } = useToast();

  /**
   * Parses the uploaded file (CSV or Excel) and updates the parsedData state.
   * @param file The File object to parse.
   */
  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) {
        toast({
          title: "File read error",
          description: "No data found in the file.",
          variant: "destructive",
        });
        return;
      }

      let parsedContent: any[] = [];

      try {
        if (file.name.endsWith('.csv')) {
          // Parse CSV data
          const lines = (data as string).split('\n');
          const headers = lines[0].split(',').map(h => h.trim());

          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map(v => v.trim());
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              parsedContent.push(row);
            }
          }
        } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
          // Parse Excel data using XLSX library
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedContent = XLSX.utils.sheet_to_json(worksheet);
        } else {
          toast({
            title: "Unsupported file type",
            description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls).",
            variant: "destructive",
          });
          setUploadedFile(null);
          setParsedData([]);
          return;
        }

        setParsedData(parsedContent);
        setCurrentStep(2); // Move to the next step (Data Preview)
        toast({
          title: "File parsed successfully",
          description: `Found ${parsedContent.length} records in ${file.name}.`,
        });
      } catch (error) {
        console.error("Error parsing file:", error);
        toast({
          title: "Error parsing file",
          description: "Please check your file format and content, then try again.",
          variant: "destructive",
        });
        setUploadedFile(null);
        setParsedData([]);
      }
    };

    // Read file based on its type
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file); // For Excel, read as binary string
    }
  }, [toast]);

  /**
   * Callback for when a file is uploaded via the FileUpload component.
   * @param file The uploaded File object.
   */
  const handleFileUpload = useCallback((file: File) => {
    setUploadedFile(file);
    parseFile(file);
  }, [parseFile]);

  /**
   * Toggles the selection status of an item in the parsed data table.
   * @param index The index of the item to toggle.
   */
  const toggleSelectItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  /**
   * Selects or deselects all items in the parsed data table.
   */
  const selectAll = () => {
    if (selectedItems.size === parsedData.length) {
      setSelectedItems(new Set()); // Deselect all
    } else {
      setSelectedItems(new Set(parsedData.map((_, index) => index))); // Select all
    }
  };

  /**
   * Handles the minting of selected individual NFTs by calling the backend.
   */
  const mintIndividualNFTs = async () => {
    if (!walletConnected || !connectedAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint NFTs.",
        variant: "destructive",
      });
      return;
    }

    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one row to mint.",
        variant: "destructive",
      });
      return;
    }

    setMintingStatus('minting');
    setCurrentStep(3); // Move to the Minting NFTs step

    try {
      // Extract serial numbers from selected data.
      // Assuming 'serialNumber' is a key in your CSV/Excel data.
      // Adjust 'serialNumber' to the actual column header for your serial numbers.
      const serialNumbersToMint = Array.from(selectedItems).map(index => parsedData[index]?.serialNumber || parsedData[index]?.SerialNumber || parsedData[index][Object.keys(parsedData[index])[0]]);

      // IMPORTANT: Replace with your actual deployed Flask backend URL
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

      const response = await fetch(`${backendUrl}/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serialNumbers: serialNumbersToMint }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setMintingStatus('completed');
        toast({
          title: "NFTs minted successfully",
          description: `${selectedItems.size} NFTs have been minted on chain!`,
          variant: "success",
        });
      } else {
        setMintingStatus('failed');
        toast({
          title: "Minting failed",
          description: data.message || "There was an error minting your NFTs.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error minting tokens:', error);
      setMintingStatus('failed');
      toast({
        title: "Network Error",
        description: "Could not connect to the backend or blockchain. Check console for details.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handles the creation of a collection (placeholder for future logic).
   */
  const mintCollection = async () => {
    if (!walletConnected || !connectedAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a collection.",
        variant: "destructive",
      });
      return;
    }

    setCollectionStatus('minting');
    setCurrentStep(4); // Move to the Create Collection step

    try {
      // TODO: Replace with actual collection creation/deployment logic
      // This would typically involve deploying a new smart contract or
      // interacting with a factory contract on the blockchain.
      // For now, it's a simulation.
      await new Promise(resolve => setTimeout(resolve, 4000)); // Simulate collection creation

      setCollectionStatus('completed');
      toast({
        title: "Collection created successfully",
        description: "Your NFTs are now part of a collection.",
        variant: "success",
      });
    } catch (error) {
      console.error('Error creating collection:', error);
      setCollectionStatus('failed');
      toast({
        title: "Collection creation failed",
        description: "There was an error creating your collection.",
        variant: "destructive",
      });
    }
  };

  /**
   * Resets the entire process back to the file upload step.
   */
  const resetProcess = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setParsedData([]);
    setMintingStatus('idle');
    setCollectionStatus('idle');
    setSelectedItems(new Set());
    // Optionally, disconnect wallet here if desired, or let WalletConnect manage its state
    // setWalletConnected(false);
    // setConnectedAddress(null);
  };

  // Define the steps for the progress indicator
  const steps = [
    { number: 1, title: 'Upload File', icon: Upload },
    { number: 2, title: 'Review Data', icon: FileText },
    { number: 3, title: 'Mint NFTs', icon: Coins },
    { number: 4, title: 'Create Collection', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-accent/20">
      <div className="container px-4 py-16 mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            <span className="text-primary">Afri</span>
            <span className="text-secondary">coin</span>
          </h1>
          {/* WalletConnect component, passing props for connection status */}
          <WalletConnect
            onConnect={(address: string) => {
              setWalletConnected(true);
              setConnectedAddress(address);
              toast({
                title: "Wallet Connected",
                description: `Connected to ${address.substring(0, 6)}...${address.slice(-4)}`,
              });
            }}
            onDisconnect={() => {
              setWalletConnected(false);
              setConnectedAddress(null);
              toast({
                title: "Wallet Disconnected",
                description: "Your wallet has been disconnected.",
              });
            }}
            connected={walletConnected} // Pass the connected status
            currentAddress={connectedAddress} // Pass the current address for display
          />
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Issue New Carbon Credits
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simply upload your CSV or Excel file with serial numbers and geographic coordinates, and we'll mint unique NFTs for each row.
            </p>
          </div>

          {/* Progress Steps Indicator */}
          <div className="flex justify-center mb-12 mt-8">
            <div className="flex space-x-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex flex-col items-center ${index > 0 ? 'ml-4' : ''}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className={`text-sm mt-2 ${
                        isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mt-6 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conditional Rendering based on currentStep */}

          {/* Step 1: File Upload */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Upload Your Carbon Credit Data
                </h2>
                <p className="text-gray-600">
                  Support for CSV and Excel files (.csv, .xlsx, .xls)
                </p>
              </div>
              {/* FileUpload component, passing the handleFileUpload callback */}
              <FileUpload onFileUpload={handleFileUpload} />
            </div>
          )}

          {/* Step 2: Data Preview */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Review Your Data
                  </h2>
                  <p className="text-gray-600">
                    {parsedData.length} records found in {uploadedFile?.name}
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    {selectedItems.size === parsedData.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={resetProcess}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === parsedData.length && parsedData.length > 0}
                          onChange={selectAll}
                          className="w-4 h-4"
                        />
                      </th>
                      {parsedData.length > 0 && Object.keys(parsedData[0]).map(key => (
                        <th key={key} className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, index) => (
                      <tr key={index} className={`border-t ${selectedItems.has(index) ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(index)}
                            onChange={() => toggleSelectItem(index)}
                            className="w-4 h-4"
                          />
                        </td>
                        {Object.values(row).map((value, colIndex) => (
                          <td key={colIndex} className="px-4 py-3 text-sm text-gray-900">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={mintIndividualNFTs}
                  disabled={selectedItems.size === 0 || !walletConnected || mintingStatus === 'minting'}
                  className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                    selectedItems.size === 0 || !walletConnected || mintingStatus === 'minting'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {mintingStatus === 'minting' ? 'Minting...' : `Mint ${selectedItems.size} NFTs`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Minting NFTs */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Minting Individual NFTs
                </h2>

                {mintingStatus === 'minting' && (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <p className="text-lg text-gray-600">
                      Minting {selectedItems.size} NFTs on the blockchain...
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      This may take a few minutes
                    </p>
                  </div>
                )}

                {mintingStatus === 'completed' && (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <p className="text-lg text-gray-800 mb-4">
                      Successfully minted {selectedItems.size} NFTs!
                    </p>
                    <button
                      onClick={mintCollection}
                      disabled={collectionStatus === 'minting'}
                      className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                        collectionStatus === 'minting'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                    >
                      {collectionStatus === 'minting' ? 'Creating Collection...' : 'Create Collection'}
                    </button>
                  </div>
                )}

                {mintingStatus === 'failed' && (
                  <div className="flex flex-col items-center">
                    <Trash2 className="w-16 h-16 text-red-500 mb-4" />
                    <p className="text-lg text-gray-800 mb-4">
                      NFT minting failed.
                    </p>
                    <button
                      onClick={resetProcess}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Collection Creation */}
          {currentStep === 4 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Creating NFT Collection
                </h2>

                {collectionStatus === 'minting' && (
                  <div className="flex flex-col items-center">
                    <div className="animate-pulse">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-4"></div>
                    </div>
                    <p className="text-lg text-gray-600">
                      Deploying collection contract...
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Organizing your NFTs into a collection
                    </p>
                  </div>
                )}

                {collectionStatus === 'completed' && (
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg mb-4 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-lg text-gray-800 mb-4">
                      Collection successfully created!
                    </p>
                    <p className="text-sm text-gray-600 mb-6">
                      Your {selectedItems.size} carbon credit NFTs are now part of a collection
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={resetProcess}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Mint Another Batch
                      </button>
                      <button className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </button>
                    </div>
                  </div>
                )}

                {collectionStatus === 'failed' && (
                  <div className="flex flex-col items-center">
                    <Trash2 className="w-16 h-16 text-red-500 mb-4" />
                    <p className="text-lg text-gray-800 mb-4">
                      Collection creation failed.
                    </p>
                    <button
                      onClick={resetProcess}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Try Again
                    </button>
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
