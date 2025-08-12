import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";

interface IPFSConfigProps {
  onConfigured: () => void;
  isConfigured: boolean;
}

const IPFSConfig = ({ onConfigured, isConfigured }: IPFSConfigProps) => {
  const handleConfigure = () => {
    onConfigured();
  };

  if (isConfigured) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            IPFS Configuration Complete
          </CardTitle>
          <CardDescription>
            Your backend service is configured for IPFS uploads via Pinata.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configure IPFS Storage</CardTitle>
        <CardDescription>
          IPFS metadata uploads are handled by your backend service.
          <br />
          Make sure your backend is deployed with Pinata API keys configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            API keys are securely stored in your Railway backend environment variables.
          </span>
        </div>

        <Button onClick={handleConfigure} className="w-full">
          Continue with Backend Configuration
        </Button>
      </CardContent>
    </Card>
  );
};

export default IPFSConfig;