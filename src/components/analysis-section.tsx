import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Zap, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

export function AnalysisSection() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPersona, setCurrentPersona] = useState(0);
  const [totalPersonas] = useState(15);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentPersona(0);

    // Simulate analysis progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          return 100;
        }
        const newProgress = prev + (100 / totalPersonas);
        setCurrentPersona(Math.floor(newProgress / (100 / totalPersonas)));
        return newProgress;
      });
    }, 1200);
  };

  const resetAnalysis = () => {
    setProgress(0);
    setCurrentPersona(0);
  };

  return (
    <Card className="shadow-card border-border/50 transition-smooth hover:shadow-elegant">
      <CardContent className="p-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <Zap className="w-6 h-6 text-accent" />
              AI Persona Analyse
            </h2>
            <p className="text-muted-foreground">
              Start de geautomatiseerde analyse van je geselecteerde personas
            </p>
          </div>

          {!isAnalyzing && progress === 0 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
                <PlayCircle className="w-10 h-10 text-primary-foreground" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Klaar om te starten
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We gaan {totalPersonas} personas analyseren met Claude AI. 
                  Elke persona wordt individueel beoordeeld op gebruiksvriendelijkheid en eerste indrukken.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>~{Math.ceil(totalPersonas * 0.3)} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>{totalPersonas} API calls</span>
                </div>
              </div>

              <Button 
                onClick={startAnalysis}
                size="lg"
                className="bg-gradient-primary hover:shadow-glow transition-spring"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Start Analyse
              </Button>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse shadow-glow">
                  <Zap className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Analyse wordt uitgevoerd...
                </h3>
                <p className="text-muted-foreground">
                  Persona {currentPersona} van {totalPersonas} wordt geanalyseerd
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">Voortgang</span>
                  <span className="text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium text-sm">Voltooid</p>
                    <p className="text-xs text-muted-foreground">{currentPersona} personas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                  <Zap className="w-5 h-5 text-primary animate-pulse" />
                  <div>
                    <p className="font-medium text-sm">Bezig</p>
                    <p className="text-xs text-muted-foreground">Claude AI analyse</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Wachtend</p>
                    <p className="text-xs text-muted-foreground">{totalPersonas - currentPersona} personas</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {progress === 100 && !isAnalyzing && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Analyse Voltooid!
                </h3>
                <p className="text-muted-foreground">
                  Alle {totalPersonas} personas zijn succesvol geanalyseerd. 
                  Bekijk de resultaten in het dashboard hieronder.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {totalPersonas} personas voltooid
                </Badge>
                <Badge variant="outline" className="bg-card">
                  <Clock className="w-3 h-3 mr-1" />
                  {Math.ceil(totalPersonas * 0.3)} min gebruikt
                </Badge>
              </div>

              <Button 
                onClick={resetAnalysis}
                variant="outline"
                size="sm"
              >
                Nieuwe Analyse
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}