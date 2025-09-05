import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDown, TrendingUp, AlertTriangle, Lightbulb, MessageSquare } from "lucide-react";

export function ResultsDashboard() {
  // Mock data voor demonstratie
  const averageScores = [
    { question: 'Navigatie', score: 7.2 },
    { question: 'Design', score: 8.1 },
    { question: 'Content', score: 6.8 },
    { question: 'Snelheid', score: 5.9 },
    { question: 'Mobiel', score: 7.5 }
  ];

  const firstImpressions = [
    { word: 'Professioneel', count: 12, color: '#6366f1' },
    { word: 'Modern', count: 8, color: '#8b5cf6' },
    { word: 'Verwarrend', count: 6, color: '#ef4444' },
    { word: 'Intuïtief', count: 10, color: '#10b981' },
    { word: 'Langzaam', count: 4, color: '#f59e0b' }
  ];

  const improvements = [
    {
      title: "Verbeter laadtijden",
      description: "73% van de personas vond de website te langzaam laden",
      impact: "Hoog",
      priority: 1
    },
    {
      title: "Vereenvoudig navigatie",
      description: "Meerdere personas hadden moeite met het vinden van informatie",
      impact: "Gemiddeld",
      priority: 2
    },
    {
      title: "Optimaliseer mobiele ervaring",
      description: "Content is moeilijk leesbaar op kleinere schermen",
      impact: "Hoog",
      priority: 3
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-accent';
    return 'text-destructive';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-card border-border/50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Analyse Resultaten
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Gebaseerd op 15 persona analyses uitgevoerd op {new Date().toLocaleDateString('nl-NL')}
              </p>
            </div>
            <Button className="bg-gradient-primary hover:shadow-glow transition-spring">
              <FileDown className="w-4 h-4 mr-2" />
              Exporteer PDF
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Average Scores */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Gemiddelde Scores per Categorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {averageScores.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{item.question}</span>
                    <Badge variant={getScoreVariant(item.score)} className="font-mono">
                      {item.score}/10
                    </Badge>
                  </div>
                  <Progress value={item.score * 10} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Word Cloud Visualization */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Eerste Indrukken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={firstImpressions}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ word, count }) => `${word} (${count})`}
                >
                  {firstImpressions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Bar Chart */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Score Verdeling</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={averageScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="question" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[0, 10]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="score" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 3 Improvements */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            Top 3 Verbeterpunten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {improvements.map((improvement, index) => (
              <div 
                key={index}
                className="flex gap-4 p-4 bg-gradient-subtle rounded-lg border border-border/50"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                    {improvement.priority}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{improvement.title}</h4>
                    <Badge 
                      variant={improvement.impact === 'Hoog' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {improvement.impact} impact
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{improvement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card border-border/50">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">7.1</div>
            <p className="text-muted-foreground text-sm">Gemiddelde Score</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/50">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-success">12</div>
            <p className="text-muted-foreground text-sm">Positieve Reviews</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/50">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-destructive">3</div>
            <p className="text-muted-foreground text-sm">Kritieke Punten</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/50">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-accent">89%</div>
            <p className="text-muted-foreground text-sm">Completion Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}