import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, Clock, Users, Brain, Zap, Globe, Image, AlertTriangle, TestTube, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface AnalysisSectionProps {
  selectedPersonas: any[];
  websiteUrl: string;
  screenshot: File | null;
  previewMode: 'url' | 'screenshot' | 'none';
  isAnalyzing: boolean;
  progress: number;
  testMode: boolean;
  onStartAnalysis: () => void;
  onStartTestAnalysis: () => void;
  canStartAnalysis: boolean;
}

export function AnalysisSection({
  selectedPersonas,
  websiteUrl,
  screenshot,
  previewMode,
  isAnalyzing,
  progress,
  testMode,
  onStartAnalysis,
  onStartTestAnalysis,
  canStartAnalysis
}: AnalysisSectionProps) {
  const [currentPersona, setCurrentPersona] = useState("");

  const startAnalysis = () => {
    if (testMode) {
      onStartTestAnalysis();
    } else {
      onStartAnalysis(); 
    }
    
    // Simuleer persona updates tijdens analyse
    if (selectedPersonas.length > 0) {
      const interval = setInterval(() => {
        const currentIndex = Math.floor((progress / 100) * selectedPersonas.length);
        if (currentIndex < selectedPersonas.length && isAnalyzing) {
          setCurrentPersona(selectedPersonas[currentIndex]?.naam || "");
        } else {
          setCurrentPersona("");
          clearInterval(interval);
        }
      }, 1000);
    }
  };

  const getPreviewContent = () => {
    if (previewMode === 'url' && websiteUrl) {
      return (
        <div className="mt-4 p-4 bg-gradient-subtle rounded-lg border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Website Preview</span>
          </div>
          <div className="bg-card rounded border h-32 flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{websiteUrl}</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (previewMode === 'screenshot' && screenshot) {
      return (
        <div className="mt-4 p-4 bg-gradient-subtle rounded-lg border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Screenshot Preview</span>
          </div>
          <div className="bg-card rounded border h-32 flex items-center justify-center">
            <div className="text-center">
              <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{screenshot.name}</p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl flex items-center gap-3">
          <Brain className="w-7 h-7 text-primary" />
          Persona Analyse
        </CardTitle>
        <p className="text-muted-foreground">
          Start de geautomatiseerde analyse van je geselecteerde personas
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!canStartAnalysis && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Selecteer eerst een doelgroep en upload een website URL of screenshot om te kunnen starten.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border/50">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{selectedPersonas.length}</div>
            <p className="text-xs text-muted-foreground">Personas</p>
          </div>
          <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border/50">
            <Brain className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground">Vragen</p>
          </div>
          <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border/50">
            <Clock className="w-6 h-6 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">~{Math.ceil(selectedPersonas.length * 0.5)}m</div>
            <p className="text-xs text-muted-foreground">Geschatte tijd</p>
          </div>
          <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border/50">
            <Zap className="w-6 h-6 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{testMode ? 'TEST' : 'API'}</div>
            <p className="text-xs text-muted-foreground">{testMode ? 'Mock data' : 'Claude 3.5'}</p>
          </div>
        </div>
        
        {getPreviewContent()}

        {!isAnalyzing && progress === 0 && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={startAnalysis}
                disabled={isAnalyzing || !canStartAnalysis}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-spring h-12 text-base font-semibold"
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Analyseren... ({Math.round(progress)}%)
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Analyse
                  </>
                )}
              </Button>
              <Button 
                onClick={onStartTestAnalysis}
                disabled={isAnalyzing || selectedPersonas.length === 0}
                variant="outline"
                className="px-6 h-12 border-2"
              >
                <TestTube className="w-5 h-5 mr-2" />
                Test Mode
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Test Mode gebruikt mock data voor snelle UI tests. Echte analyse gebruikt Claude AI.
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse shadow-glow">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Analyse wordt uitgevoerd...
              </h3>
              {currentPersona && (
                <p className="text-muted-foreground">
                  Analyseren: {currentPersona}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">Voortgang</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="p-3 bg-success/10 rounded-lg">
                <div className="font-medium text-success">Voltooid</div>
                <div className="text-xs text-muted-foreground">
                  {Math.floor((progress / 100) * selectedPersonas.length)} personas
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="font-medium text-primary">Bezig</div>
                <div className="text-xs text-muted-foreground">
                  {testMode ? 'Mock analyse' : 'Claude AI'}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-muted-foreground">Wachtend</div>
                <div className="text-xs text-muted-foreground">
                  {selectedPersonas.length - Math.floor((progress / 100) * selectedPersonas.length)} personas
                </div>
              </div>
            </div>
          </div>
        )}

        {progress === 100 && !isAnalyzing && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Analyse Voltooid!
              </h3>
              <p className="text-muted-foreground">
                Alle {selectedPersonas.length} personas zijn geanalyseerd. 
                Bekijk de resultaten hieronder.
              </p>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              {testMode ? 'Test analyse' : 'API analyse'} voltooid
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}