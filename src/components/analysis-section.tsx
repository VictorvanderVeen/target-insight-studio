import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Clock, Users, Brain, Zap, Globe, Image, AlertTriangle, TestTube, CheckCircle2, X, Download, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { ClaudeAnalysisService, AnalysisProgress, AnalysisResult } from "@/utils/claudeAnalysis";
import { getTotalQuestionCount, getQuestionsByAnalysisType } from "@/data/questions";

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
  onClaudeAnalysisComplete: (results: AnalysisResult[]) => void;
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
  onClaudeAnalysisComplete,
  canStartAnalysis
}: AnalysisSectionProps) {
  const [currentPersona, setCurrentPersona] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [claudeResults, setClaudeResults] = useState<AnalysisResult[]>([]);
  const [analysisError, setAnalysisError] = useState<string>("");
  const [isClaudeAnalyzing, setIsClaudeAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisType, setAnalysisType] = useState<'advertentie' | 'landingspagina' | 'complete'>('advertentie');

  useEffect(() => {
    // Check for saved progress on component mount
    const savedProgress = ClaudeAnalysisService.loadProgress();
    if (savedProgress && savedProgress.completed.length > 0) {
      setAnalysisProgress(savedProgress);
      setClaudeResults(savedProgress.completed);
    }
  }, []);

  const startClaudeAnalysis = async (useDemoMode = false) => {
    console.log(`=== STARTING CLAUDE ANALYSIS ===`);
    console.log(`Demo Mode: ${useDemoMode}`);
    console.log(`Analysis Type: ${analysisType}`);
    console.log(`Selected Personas: ${selectedPersonas.length}`);
    
    setIsClaudeAnalyzing(true);
    setAnalysisError("");
    setShowResults(false);
    
    try {
      // Convert screenshot to base64 if available
      let imageData = null;
      if (screenshot) {
        console.log('Converting screenshot to base64...');
        imageData = await convertFileToBase64(screenshot);
        console.log('Screenshot converted successfully');
      }
      
      const url = websiteUrl || `Screenshot: ${screenshot?.name}`;
      
      console.log(`Calling ClaudeAnalysisService.startAnalysis with demoMode: ${useDemoMode}`);
      
      const results = await ClaudeAnalysisService.startAnalysis(
        selectedPersonas,
        url,
        (progress) => {
          setAnalysisProgress(progress);
          setCurrentPersona(
            progress.currentPersona < selectedPersonas.length 
              ? selectedPersonas[progress.currentPersona]?.naam || ""
              : ""
          );
        },
        (error) => {
          setAnalysisError(error);
        },
        useDemoMode, // EXPLICIET dooregeven - GEEN AUTO DEMO MODE
        analysisType,
        imageData // Pass image data to Claude
      );
      
      console.log(`Analysis completed. Results count: ${results.length}`);
      console.log(`Demo mode was: ${useDemoMode}`);
      
      setClaudeResults(results);
      onClaudeAnalysisComplete(results);
      setShowResults(true);
      
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Onbekende fout tijdens analyse');
    } finally {
      setIsClaudeAnalyzing(false);
      setCurrentPersona("");
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:image/...;base64, prefix to get just the base64 data
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const startDemoMode = async () => {
    await startClaudeAnalysis(true);
  };

  const stopAnalysis = () => {
    setIsClaudeAnalyzing(false);
    // Save current progress
    if (analysisProgress) {
      ClaudeAnalysisService.saveProgress(analysisProgress);
    }
  };

  const resumeAnalysis = () => {
    if (analysisProgress && analysisProgress.completed.length < selectedPersonas.length) {
      startClaudeAnalysis();
    }
  };

  const exportResults = (format: 'json' | 'markdown') => {
    if (claudeResults.length === 0) return;
    
    const data = ClaudeAnalysisService.exportResults(claudeResults, format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `persona-analyse-${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (claudeResults.length === 0) return;
    
    const markdown = ClaudeAnalysisService.exportResults(claudeResults, 'markdown');
    await navigator.clipboard.writeText(markdown);
  };

  const getEstimatedCost = () => {
    const totalQuestions = getTotalQuestionCount(analysisType);
    const tokensPerPersona = 200 * totalQuestions; // ~200 tokens per question
    const totalTokens = selectedPersonas.length * tokensPerPersona;
    const cost = (totalTokens / 1000) * 0.003; // Claude 3.5 Haiku pricing
    return { tokens: totalTokens, cost };
  };

  const estimatedCost = getEstimatedCost();

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
          <div className="bg-card rounded border h-48 flex items-center justify-center overflow-hidden">
            <iframe 
              src={websiteUrl} 
              className="w-full h-full border-0"
              title="Website Preview"
              style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
            />
          </div>
        </div>
      );
    }
    
    if (previewMode === 'screenshot' && screenshot) {
      const imageUrl = URL.createObjectURL(screenshot);
      return (
        <div className="mt-4 p-4 bg-gradient-subtle rounded-lg border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Screenshot Preview</span>
          </div>
          <div className="bg-card rounded border h-48 flex items-center justify-center overflow-hidden">
            <img 
              src={imageUrl} 
              alt="Screenshot preview"
              className="max-w-full max-h-full object-contain rounded"
              onLoad={() => URL.revokeObjectURL(imageUrl)}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">{screenshot.name}</p>
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

        {analysisError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {analysisError}
              {analysisProgress && analysisProgress.completed.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resumeAnalysis}
                  className="ml-2"
                >
                  Hervat analyse
                </Button>
              )}
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
            <div className="text-2xl font-bold text-foreground">{getTotalQuestionCount(analysisType)}</div>
            <p className="text-xs text-muted-foreground">Vragen</p>
          </div>
          <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border/50">
            <Clock className="w-6 h-6 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              ~{Math.ceil(selectedPersonas.length * 0.5)}m
            </div>
            <p className="text-xs text-muted-foreground">Geschatte tijd</p>
          </div>
          <div className="text-center p-4 bg-gradient-subtle rounded-lg border border-border/50">
            <Zap className="w-6 h-6 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              ${estimatedCost.cost.toFixed(3)}
            </div>
            <p className="text-xs text-muted-foreground">Geschatte kosten</p>
          </div>
        </div>
        
        {getPreviewContent()}

        {!isAnalyzing && !isClaudeAnalyzing && progress === 0 && (
          <div className="space-y-4">
            {/* Analysetype dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Analysetype
              </label>
              <Select value={analysisType} onValueChange={(value) => setAnalysisType(value as 'advertentie' | 'landingspagina' | 'complete')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kies analysetype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advertentie">
                    Advertentie analyse (7 vragen)
                  </SelectItem>
                  <SelectItem value="landingspagina">
                    Landingspagina analyse (8 vragen)
                  </SelectItem>
                  <SelectItem value="complete">
                    Complete analyse (18 vragen)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {analysisType === 'advertentie' && 'Focus op eerste indruk, relevantie en klikintentie'}
                {analysisType === 'landingspagina' && 'Focus op waardepropositie, vertrouwen en conversie'}
                {analysisType === 'complete' && 'Volledige analyse van advertentie naar conversie'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => startClaudeAnalysis(false)} // EXPLICIET demoMode: false
                disabled={!canStartAnalysis}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-spring h-12 text-base font-semibold"
              >
                <Brain className="w-5 h-5 mr-2" />
                Start Claude Analyse (LIVE API)
              </Button>
              <Button 
                onClick={() => startClaudeAnalysis(true)} // EXPLICIET demoMode: true
                disabled={selectedPersonas.length === 0}
                variant="outline"
                className="px-6 h-12 border-2"
              >
                <TestTube className="w-5 h-5 mr-2" />
                Demo Mode
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Claude analyse gebruikt echte AI voor authentieke persona responses. Demo Mode gebruikt mock data.
            </p>
          </div>
        )}

        {(isAnalyzing || isClaudeAnalyzing) && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse shadow-glow">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {isClaudeAnalyzing ? 'Claude AI Analyse...' : 'Mock Analyse...'}
              </h3>
              {currentPersona && (
                <p className="text-muted-foreground">
                  Analyseren: {currentPersona}
                </p>
              )}
              {analysisProgress && (
                <p className="text-sm text-muted-foreground mt-1">
                  Batch {analysisProgress.currentBatch} van {analysisProgress.totalBatches} 
                  • {analysisProgress.completed.length} van {analysisProgress.totalPersonas} voltooid
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">Voortgang</span>
                <span className="text-muted-foreground">
                  {analysisProgress ? 
                    Math.round((analysisProgress.completed.length / analysisProgress.totalPersonas) * 100) :
                    Math.round(progress)
                  }%
                </span>
              </div>
              <Progress 
                value={analysisProgress ? 
                  (analysisProgress.completed.length / analysisProgress.totalPersonas) * 100 :
                  progress
                } 
                className="h-3" 
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="p-3 bg-success/10 rounded-lg">
                <div className="font-medium text-success">Voltooid</div>
                <div className="text-xs text-muted-foreground">
                  {analysisProgress?.completed.length || 0} personas
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="font-medium text-primary">Bezig</div>
                <div className="text-xs text-muted-foreground">
                  {isClaudeAnalyzing ? 'Claude AI' : 'Mock analyse'}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium text-muted-foreground">Wachtend</div>
                <div className="text-xs text-muted-foreground">
                  {analysisProgress ? 
                    analysisProgress.totalPersonas - analysisProgress.completed.length :
                    selectedPersonas.length - Math.floor((progress / 100) * selectedPersonas.length)
                  } personas
                </div>
              </div>
            </div>

            {isClaudeAnalyzing && (
              <div className="flex justify-center">
                <Button 
                  onClick={stopAnalysis}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Stop Analyse
                </Button>
              </div>
            )}
          </div>
        )}

        {((progress === 100 && !isAnalyzing) || showResults) && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Analyse Voltooid!
              </h3>
              <p className="text-muted-foreground">
                {claudeResults.length > 0 ? 
                  `Claude heeft ${claudeResults.length} responses gegenereerd.` :
                  `Alle ${selectedPersonas.length} personas zijn geanalyseerd.`
                }
                Bekijk de resultaten hieronder.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {claudeResults.length > 0 ? 'Claude analyse' : testMode ? 'Test analyse' : 'API analyse'} voltooid
              </Badge>
              
              {claudeResults.length > 0 && (
                <>
                  <Button 
                    onClick={() => exportResults('json')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    JSON
                  </Button>
                  <Button 
                    onClick={() => exportResults('markdown')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Markdown
                  </Button>
                  <Button 
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Kopieer
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}