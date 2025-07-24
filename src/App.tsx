import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import { WalletConnect } from "@/components/WalletConnect";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useState, useCallback } from "react";
import { ethers } from "ethers";

const queryClient = new QueryClient();

const App = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const handleConnect = useCallback(
    (
      address: string,
      walletProvider: ethers.BrowserProvider,
      walletSigner: ethers.JsonRpcSigner
    ) => {
      setWalletAddress(address);
      setProvider(walletProvider);
      setSigner(walletSigner);
      setWalletConnected(true);
    },
    []
  );

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
    setProvider(null);
    setSigner(null);
    setWalletConnected(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Header
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            connected={walletConnected}
            currentAddress={walletAddress}
          />
          <Routes>
            <Route
              path="/"
              element={
                <Index
                  signer={signer}
                  provider={provider}
                  walletConnected={walletConnected}
                  walletAddress={walletAddress}
                  onWalletConnect={handleConnect}
                  onWalletDisconnect={handleDisconnect}
                />
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
