import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Cloud, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IPFSConfigProps {
  onConfigSaved: (apiKey: string, secretKey: string) => void;
  hasSupabase?: boolean;
}

export const IPFSConfig: React.FC<IPFSConfigProps> = ({ 
  onConfigSaved, 
  hasSupabase = false 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);

  const handleSave = () => {
    if (apiKey && secretKey) {
      // Store in localStorage for this session
      localStorage.setItem('pinata_api_key', apiKey);
      localStorage.setItem('pinata_secret_key', secretKey);
      onConfigSaved(apiKey, secretKey);
    }
  };

  // Check if keys are already saved
  const savedApiKey = localStorage.getItem('pinata_api_key');
  const savedSecretKey = localStorage.getItem('pinata_secret_key');
  
  if (savedApiKey && savedSecretKey) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            IPFS Configuration
          </CardTitle>
          <CardDescription>Pinata API keys configured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              API keys are saved for this session
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                localStorage.removeItem('pinata_api_key');
                localStorage.removeItem('pinata_secret_key');
                window.location.reload();
              }}
            >
              Reset Keys
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          IPFS Configuration
        </CardTitle>
        <CardDescription>
          {hasSupabase 
            ? "Supabase can manage your API keys securely, or enter them here for this session"
            : "Enter your Pinata API keys to upload metadata to IPFS"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasSupabase && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              For better security, consider connecting to Supabase to manage API keys securely.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="api-key">Pinata API Key</Label>
            <Input
              id="api-key"
              type="text"
              placeholder="Your Pinata API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="secret-key">Pinata Secret API Key</Label>
            <div className="relative">
              <Input
                id="secret-key"
                type={showSecretKey ? "text" : "password"}
                placeholder="Your Pinata Secret API Key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowSecretKey(!showSecretKey)}
              >
                {showSecretKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleSave}
            disabled={!apiKey || !secretKey}
            className="w-full"
          >
            Save Configuration
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Keys are stored locally for this session only</p>
          <p>• Get your API keys from <a href="https://pinata.cloud" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">pinata.cloud</a></p>
        </div>
      </CardContent>
    </Card>
  );
};