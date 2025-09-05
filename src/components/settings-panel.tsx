import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Key, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SettingsPanelProps {
  onApiKeyChange?: (hasKey: boolean) => void;
}

export function SettingsPanel({ onApiKeyChange }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load API key from localStorage on component mount
    const savedKey = localStorage.getItem('anthropic_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      onApiKeyChange?.(true);
    }
  }, [onApiKeyChange]);

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      setErrorMessage("API key kan niet leeg zijn");
      return;
    }

    if (!apiKey.startsWith('sk-ant-')) {
      setErrorMessage("Ongeldige API key format. Anthropic keys beginnen met 'sk-ant-'");
      return;
    }

    localStorage.setItem('anthropic_api_key', apiKey);
    onApiKeyChange?.(true);
    setConnectionStatus('idle');
    toast({
      title: "API Key opgeslagen",
      description: "Je kunt nu de Claude API gebruiken voor analyses",
    });
  };

  const removeApiKey = () => {
    localStorage.removeItem('anthropic_api_key');
    setApiKey("");
    setConnectionStatus('idle');
    onApiKeyChange?.(false);
    toast({
      title: "API Key verwijderd",
      description: "Je kunt geen analyses meer uitvoeren tot je een nieuwe key invoert",
    });
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setErrorMessage("");
    
    try {
      // Simple test call to Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{
            role: 'user',
            content: 'Test'
          }]
        })
      });

      if (response.ok) {
        setConnectionStatus('success');
        toast({
          title: "Verbinding succesvol",
          description: "Claude API is bereikbaar en je key werkt",
        });
      } else {
        const errorData = await response.text();
        setConnectionStatus('error');
        setErrorMessage(`API Error: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(`Netwerk fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getEstimatedCosts = (personaCount: number) => {
    // Rough estimation: ~200 tokens per question, ~15 questions per persona
    const tokensPerPersona = 200 * 15;
    const totalTokens = personaCount * tokensPerPersona;
    const estimatedCost = (totalTokens / 1000) * 0.003; // $0.003 per 1K tokens for Claude 3.5 Sonnet
    
    return {
      tokens: totalTokens,
      cost: estimatedCost
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          API Instellingen
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Claude API Configuratie
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="api-key">Anthropic API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setConnectionStatus('idle');
                setErrorMessage("");
              }}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Je API key wordt alleen lokaal opgeslagen in je browser
            </p>
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={saveApiKey} 
              disabled={!apiKey.trim()}
              className="flex-1"
            >
              Opslaan
            </Button>
            <Button 
              onClick={testConnection} 
              disabled={!apiKey.trim() || isTestingConnection}
              variant="outline"
              className="flex-1"
            >
              {isTestingConnection ? 'Testen...' : 'Test Verbinding'}
            </Button>
          </div>

          {connectionStatus === 'success' && (
            <Alert className="border-success">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                Verbinding succesvol! Claude API is bereikbaar.
              </AlertDescription>
            </Alert>
          )}

          {apiKey && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Geschatte Kosten</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>10 personas:</span>
                  <span>~${getEstimatedCosts(10).cost.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>25 personas:</span>
                  <span>~${getEstimatedCosts(25).cost.toFixed(3)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  *Geschatte kosten voor Claude 3.5 Sonnet
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Key Status:</span>
              <div className="flex items-center gap-2">
                {apiKey ? (
                  <span className="text-xs text-success flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Geconfigureerd
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Niet ingesteld</span>
                )}
              </div>
            </div>
            
            {apiKey && (
              <Button 
                onClick={removeApiKey} 
                variant="destructive" 
                size="sm"
                className="w-full"
              >
                Verwijder API Key
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <a 
                href="https://console.anthropic.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Krijg je API key bij Anthropic
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}