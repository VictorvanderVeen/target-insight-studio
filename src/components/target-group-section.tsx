import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Target, Sliders, User, Shuffle } from "lucide-react";
import { useState, useEffect } from "react";
import { stratifiedSampling } from "@/utils/excelProcessor";

interface TargetGroupSectionProps {
  doelgroepen: Record<string, any[]>;
  availableSheets: string[];
  selectedDoelgroep: string;
  selectedPersonas: any[];
  availablePersonas: any[];
  aantalPersonas: number;
  onDoelgroepSelect: (doelgroep: string) => void;
  onPersonaCountChange: (count: number) => void;
  onPersonasSelect: (personas: any[]) => void;
}

export function TargetGroupSection({
  doelgroepen,
  availableSheets,
  selectedDoelgroep,
  selectedPersonas,
  availablePersonas,
  aantalPersonas,
  onDoelgroepSelect,
  onPersonaCountChange,
  onPersonasSelect
}: TargetGroupSectionProps) {
  const [personaCount, setPersonaCount] = useState([aantalPersonas]);

  useEffect(() => {
    setPersonaCount([aantalPersonas]);
  }, [aantalPersonas]);

  const handlePersonaCountChange = (value: number[]) => {
    setPersonaCount(value);
    onPersonaCountChange(value[0]);
    
    // Automatisch nieuwe selectie maken als er een doelgroep is geselecteerd
    if (selectedDoelgroep && availablePersonas.length > 0) {
      const newSelection = stratifiedSampling(availablePersonas, value[0]);
      onPersonasSelect(newSelection);
    }
  };

  const handleGroupSelect = (value: string) => {
    onDoelgroepSelect(value);
    // Selecteer automatisch personas na groep selectie
    if (doelgroepen[value] && doelgroepen[value].length > 0) {
      const selection = stratifiedSampling(doelgroepen[value], personaCount[0]);
      onPersonasSelect(selection);
    }
  };

  const reshufflePersonas = () => {
    if (selectedDoelgroep && availablePersonas.length > 0) {
      const newSelection = stratifiedSampling(availablePersonas, personaCount[0]);
      onPersonasSelect(newSelection);
    }
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl flex items-center gap-3">
          <Target className="w-7 h-7 text-primary" />
          Doelgroep Selectie
        </CardTitle>
        <p className="text-muted-foreground">
          Kies welke personas je wilt analyseren en configureer de sample size
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <label className="text-sm font-medium">Selecteer doelgroep</label>
          </div>
          <Select value={selectedDoelgroep} onValueChange={handleGroupSelect}>
            <SelectTrigger className="w-full bg-card border-border/50 hover:border-primary/50 transition-colors">
              <SelectValue placeholder="Kies een doelgroep" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/50 z-50">
              {availableSheets.map((sheet) => (
                <SelectItem key={sheet} value={sheet} className="hover:bg-accent/50">
                  {sheet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedDoelgroep && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{availablePersonas.length} personas beschikbaar in deze groep</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <label className="text-sm font-medium">Aantal personas voor analyse</label>
          </div>
          <div className="space-y-2">
            <Slider
              value={personaCount}
              onValueChange={handlePersonaCountChange}
              max={Math.min(25, availablePersonas.length || 25)}
              min={5}
              step={1}
              className="w-full"
              disabled={!selectedDoelgroep}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>5 personas</span>
              <span className="font-medium text-foreground">{personaCount[0]} geselecteerd</span>
              <span>{Math.min(25, availablePersonas.length || 25)} max</span>
            </div>
          </div>

          {selectedDoelgroep && selectedPersonas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {selectedPersonas.length}
                  </Badge>
                  Geselecteerde personas
                </h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={reshufflePersonas}
                  className="text-xs"
                >
                  <Shuffle className="w-3 h-3 mr-1" />
                  Nieuwe selectie
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedPersonas.slice(0, 4).map((persona, i) => (
                  <div 
                    key={persona.id || i}
                    className="p-3 bg-gradient-subtle rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{persona.naam}</p>
                        <p className="text-xs text-muted-foreground">
                          {persona.leeftijd} jaar, {persona.beroep}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedPersonas.length > 4 && (
                  <div className="p-3 bg-muted/30 rounded-lg border border-dashed border-border/50 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">
                      +{selectedPersonas.length - 4} meer...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}