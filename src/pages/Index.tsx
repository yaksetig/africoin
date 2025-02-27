
import { WalletConnect } from "@/components/WalletConnect";
import { FileUpload } from "@/components/FileUpload";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-accent/20">
      <div className="container px-4 py-16 mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            <span className="text-primary">Afri</span>
            <span className="text-secondary">coin</span>
          </h1>
          <WalletConnect />
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Issue New Carbon Credits
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simply upload your CSV file with serial numbers and geographic coordinates, and we'll mint unique NFTs for each row.
            </p>
          </div>

          <FileUpload />
        </main>
      </div>
    </div>
  );
};

export default Index;
