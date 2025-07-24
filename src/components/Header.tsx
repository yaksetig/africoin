import { Link } from "react-router-dom";
import { WalletConnect } from "./WalletConnect";
import { ethers } from "ethers";

interface HeaderProps {
  onConnect: (
    address: string,
    provider: ethers.BrowserProvider,
    signer: ethers.JsonRpcSigner
  ) => void;
  onDisconnect: () => void;
  connected: boolean;
  currentAddress: string | null;
}

const Header: React.FC<HeaderProps> = ({
  onConnect,
  onDisconnect,
  connected,
  currentAddress,
}) => (
  <header className="bg-primary text-primary-foreground shadow">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <Link to="/" className="text-lg font-semibold">
        Africoin
      </Link>
      <WalletConnect
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        connected={connected}
        currentAddress={currentAddress}
      />
    </div>
  </header>
);

export default Header;
