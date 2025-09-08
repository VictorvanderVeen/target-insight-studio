import { UploadSection } from "@/components/upload-section";
import { TargetGroupSection } from "@/components/target-group-section";
import { AnalysisSection } from "@/components/analysis-section";
import { ResultsDashboard } from "@/components/results-dashboard";
import { usePersonaAnalysis } from "@/hooks/usePersonaAnalysis";
import { generateMockAnalysis } from "@/utils/mockAnalysis";
import { ClaudeAnalysisService, AnalysisResult } from "@/utils/claudeAnalysis";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const { state, actions } = usePersonaAnalysis();
  const { toast } = useToast();
  const [showResults, setShowResults] = useState(false);
  const [claudeResults, setClaudeResults] = useState<AnalysisResult[]>([]);

  const handleExcelProcessed = (data: { doelgroepen: any; availableSheets: string[] }) => {
    actions.setDoelgroepen(data.doelgroepen);
    actions.setAvailableSheets(data.availableSheets);
    toast({
      title: "Excel verwerkt",
      description: `${data.availableSheets.length} doelgroep(en) gevonden`,
    });
  };

  const handleStartAnalysis = async () => {
    try {
      actions.startAnalysis();
      actions.setTestMode(false);
      
      // Gebruik de echte Claude API via ClaudeAnalysisService (static method)
      const results = await ClaudeAnalysisService.startAnalysis(
        state.selectedPersonas,
        state.websiteUrl || 'Screenshot analysis',
        (progress) => {
          actions.updateProgress(progress);
        },
        (error) => {
          console.error('Claude analysis error:', error);
          actions.setError(error);
        },
        false // demoMode = false voor echte API
      );
      
      setClaudeResults(results);
      actions.setResults(results);
      setShowResults(true);
      
      toast({
        title: "Analyse voltooid",
        description: `${state.selectedPersonas.length} personas geanalyseerd met Claude AI`,
      });
    } catch (error) {
      actions.setError('Fout tijdens analyse');
      toast({
        title: "Analyse fout",
        description: error instanceof Error ? error.message : 'Onbekende fout',
        variant: "destructive",
      });
    }
  };

  const handleStartTestAnalysis = async () => {
    try {
      actions.startAnalysis();
      actions.setTestMode(true);
      
      const results = await generateMockAnalysis(
        state.selectedPersonas,
        state.websiteUrl || 'Test analysis',
        actions.updateProgress
      );
      
      actions.setResults(results);
      setShowResults(true);
      
      toast({
        title: "Test analyse voltooid",
        description: `${state.selectedPersonas.length} personas getest met mock data`,
      });
    } catch (error) {
      actions.setError('Fout tijdens test analyse');
      toast({
        title: "Test fout",
        description: "Er is iets misgegaan tijdens de test",
        variant: "destructive",
      });
    }
  };

  const handleClaudeAnalysisComplete = (results: AnalysisResult[]) => {
    console.log('=== HANDLE CLAUDE ANALYSIS COMPLETE ===');
    console.log('RAW RESULTS RECEIVED:', results);
    console.log('Results count:', results.length);
    console.log('Results sample:', results.slice(0, 3));
    
    // Check for fallback responses
    const fallbackCount = results.filter(r => (r as any).fallback).length;
    const validCount = results.filter(r => !((r as any).fallback) && (r.score || r.uitleg || r.woorden)).length;
    
    console.log(`Fallback responses: ${fallbackCount}, Valid responses: ${validCount}`);
    
    setClaudeResults(results);
    
    // Process results for the dashboard
    console.log('=== PROCESSING RESULTS FOR DASHBOARD ===');
    const processed = ClaudeAnalysisService.processResults(results);
    console.log('PROCESSED RESULTS:', processed);
    
    // Convert to the format expected by ResultsDashboard
    const dashboardResults = {
      results: results.map((r, index) => {
        // Find the corresponding persona
        const persona = state.selectedPersonas.find(p => p.id === r.personaId) || 
                        state.selectedPersonas[index % state.selectedPersonas.length];
        
        return {
          persona: { naam: persona?.naam || `Persona ${index + 1}` },
          responses: { [r.vraagId]: r.score || r.uitleg || r.woorden?.join(', ') || r.rawResponse || '' },
          timestamp: new Date().toISOString(),
          websiteUrl: state.websiteUrl,
          fallback: (r as any).fallback
        };
      }),
      summary: processed.summary,
      totalResponses: results.length,
      completedAt: new Date().toISOString()
    };
    
    console.log('DASHBOARD RESULTS:', dashboardResults);
    
    actions.setResults(dashboardResults);
    setShowResults(true);
    
    if (validCount > 0) {
      toast({
        title: "Claude analyse voltooid",
        description: `${validCount} authentieke persona responses gegenereerd${fallbackCount > 0 ? ` (${fallbackCount} fallback)` : ''}`,
      });
    } else {
      toast({
        title: "Analyse voltooid met fallback data",
        description: `Alle ${results.length} responses zijn fallback data. Check de logs voor details.`,
        variant: "destructive"
      });
    }
    
    console.log('=== ANALYSIS COMPLETE HANDLER FINISHED ===');
  };

  const canStartAnalysis = state.selectedPersonas.length > 0 && 
    (state.websiteUrl || state.screenshot);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Persona Analyzer
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-gedreven gebruikersonderzoek & feedback analyse
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <UploadSection 
            onExcelProcessed={handleExcelProcessed}
            onWebsiteUrlChange={actions.setWebsiteUrl}
            onScreenshotChange={actions.setScreenshot}
            loading={state.loading}
            error={state.error}
            onError={actions.setError}
          />
          
          {state.availableSheets.length > 0 && (
            <TargetGroupSection 
              doelgroepen={state.doelgroepen}
              availableSheets={state.availableSheets}
              selectedDoelgroep={state.selectedDoelgroep}
              selectedPersonas={state.selectedPersonas}
              availablePersonas={state.availablePersonas}
              aantalPersonas={state.aantalPersonas}
              onDoelgroepSelect={actions.setSelectedDoelgroep}
              onPersonaCountChange={actions.setAantalPersonas}
              onPersonasSelect={actions.setSelectedPersonas}
            />
          )}
          
          {state.selectedPersonas.length > 0 && (
            <AnalysisSection 
              selectedPersonas={state.selectedPersonas}
              websiteUrl={state.websiteUrl}
              screenshot={state.screenshot}
              previewMode={state.previewMode}
              isAnalyzing={state.isAnalyzing}
              progress={state.progress}
              testMode={state.testMode}
              onStartAnalysis={handleStartAnalysis}
              onStartTestAnalysis={handleStartTestAnalysis}
              onClaudeAnalysisComplete={handleClaudeAnalysisComplete}
              canStartAnalysis={canStartAnalysis}
            />
          )}
          
          {showResults && claudeResults.length > 0 && (
            <ResultsDashboard 
              processedResults={ClaudeAnalysisService.processResults(claudeResults)}
              totalPersonas={state.selectedPersonas.length}
              totalResults={claudeResults.filter(r => !((r as any).fallback)).length}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;