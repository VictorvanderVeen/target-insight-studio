import { UploadSection } from "@/components/upload-section";
import { TargetGroupSection } from "@/components/target-group-section";
import { AnalysisSection } from "@/components/analysis-section";
import { ResultsDashboard } from "@/components/results-dashboard";
import { SettingsPanel } from "@/components/settings-panel";
import { usePersonaAnalysis } from "@/hooks/usePersonaAnalysis";
import { generateMockAnalysis } from "@/utils/mockAnalysis";
import { ClaudeAnalysisService, AnalysisResult } from "@/utils/claudeAnalysis";
import { useToast } from "@/components/ui/use-toast";
import { Brain } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const { state, actions } = usePersonaAnalysis();
  const { toast } = useToast();
  const [showResults, setShowResults] = useState(false);
  const [claudeResults, setClaudeResults] = useState<AnalysisResult[]>([]);
  const [hasApiKey, setHasApiKey] = useState(ClaudeAnalysisService.hasApiKey());

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
      
      // Hier zou normaal gesproken de echte API call komen
      // Voor nu gebruiken we mock data
      const results = await generateMockAnalysis(
        state.selectedPersonas,
        state.websiteUrl || 'Screenshot analysis',
        actions.updateProgress
      );
      
      actions.setResults(results);
      setShowResults(true);
      
      toast({
        title: "Analyse voltooid",
        description: `${state.selectedPersonas.length} personas geanalyseerd`,
      });
    } catch (error) {
      actions.setError('Fout tijdens analyse');
      toast({
        title: "Analyse fout",
        description: "Er is iets misgegaan tijdens de analyse",
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
    setClaudeResults(results);
    
    // Process results for the dashboard
    const processed = ClaudeAnalysisService.processResults(results);
    
    // Convert to the format expected by ResultsDashboard
    const dashboardResults = {
      results: results.map(r => ({
        persona: { naam: 'Claude Persona' }, // We'll need to map this properly
        responses: { [r.vraagId]: r.score || r.uitleg || r.woorden?.join(', ') || '' },
        timestamp: new Date().toISOString(),
        websiteUrl: state.websiteUrl
      })),
      summary: processed.summary,
      totalResponses: results.length,
      completedAt: new Date().toISOString()
    };
    
    actions.setResults(dashboardResults);
    setShowResults(true);
    
    toast({
      title: "Claude analyse voltooid",
      description: `${results.length} authentieke persona responses gegenereerd`,
    });
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
            <SettingsPanel onApiKeyChange={setHasApiKey} />
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
          
          {showResults && state.results && <ResultsDashboard />}
        </div>
      </main>
    </div>
  );
};

export default Index;