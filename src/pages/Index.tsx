import { UploadSection } from "@/components/upload-section";
import { TargetGroupSection } from "@/components/target-group-section";
import { AnalysisSection } from "@/components/analysis-section";
import { ResultsDashboard } from "@/components/results-dashboard";
import { Brain, Users, Zap } from "lucide-react";

const Index = () => {
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
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-card/60 backdrop-blur-sm rounded-lg border border-border/50">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium text-foreground">Upload Data</p>
              <p className="text-xs text-muted-foreground">Excel & Website URL</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card/60 backdrop-blur-sm rounded-lg border border-border/50">
            <div className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium text-foreground">Selecteer Doelgroep</p>
              <p className="text-xs text-muted-foreground">Configureer analyse</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card/60 backdrop-blur-sm rounded-lg border border-border/50">
            <div className="w-8 h-8 bg-success/10 text-success rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium text-foreground">Bekijk Resultaten</p>
              <p className="text-xs text-muted-foreground">Dashboard & Export</p>
            </div>
          </div>
        </div>

        {/* Main Sections */}
        <UploadSection />
        <TargetGroupSection />
        <AnalysisSection />
        <ResultsDashboard />
      </main>

      {/* Footer */}
      <footer className="bg-card/60 backdrop-blur-sm border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Persona Analyzer</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by Claude AI • Gebouwd voor UX Research Teams
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
