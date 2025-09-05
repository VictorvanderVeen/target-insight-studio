import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Users, Target } from "lucide-react";
import { useState } from "react";

export function TargetGroupSection() {
  const [selectedSheet, setSelectedSheet] = useState("");
  const [personaCount, setPersonaCount] = useState([15]);
  
  // Mock data voor Excel sheets
  const mockSheets = [
    { name: "Personas_Q1_2024", count: 32 },
    { name: "Target_Audience", count: 18 },
    { name: "User_Research_Data", count: 24 },
    { name: "Customer_Segments", count: 41 }
  ];

  return (
    <Card className="shadow-card border-border/50 transition-smooth hover:shadow-elegant">
      <CardContent className="p-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Doelgroep Selectie
            </h2>
            <p className="text-muted-foreground">
              Kies welke personas je wilt analyseren en configureer de sample size
            </p>
          </div>

          {/* Sheet Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Excel Sheet</Label>
            <Select value={selectedSheet} onValueChange={setSelectedSheet}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecteer een sheet uit je Excel bestand" />
              </SelectTrigger>
              <SelectContent>
                {mockSheets.map((sheet, index) => (
                  <SelectItem key={index} value={sheet.name}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{sheet.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {sheet.count} personas
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSheet && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>
                  Sheet bevat {mockSheets.find(s => s.name === selectedSheet)?.count} personas
                </span>
              </div>
            )}
          </div>

          {/* Persona Count Slider */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-medium">Aantal Personas voor Analyse</Label>
              <p className="text-sm text-muted-foreground">
                Selecteer hoeveel personas je wilt analyseren (5-25 voor optimale resultaten)
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">5</span>
                <div className="flex-1 mx-6">
                  <Slider
                    value={personaCount}
                    onValueChange={setPersonaCount}
                    max={25}
                    min={5}
                    step={1}
                    className="w-full"
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground">25</span>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold text-lg">{personaCount[0]}</span>
                  <span className="text-sm">personas geselecteerd</span>
                </div>
              </div>
            </div>

            {/* Analysis Cost Estimate */}
            <div className="bg-gradient-subtle p-4 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Geschatte Analysetijd</p>
                  <p className="text-sm text-muted-foreground">
                    ~{Math.ceil(personaCount[0] * 0.3)} minuten voor {personaCount[0]} personas
                  </p>
                </div>
                <Badge variant="outline" className="bg-card">
                  {personaCount[0]} × Claude API calls
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}