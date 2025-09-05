import { supabase } from "@/integrations/supabase/client";
import { getAllQuestions } from "@/data/questions";

export interface AnalysisResult {
  personaId: string;
  vraagId: string;
  score?: number;
  uitleg?: string;
  woorden?: string[];
  rawResponse?: string;
}

export interface AnalysisProgress {
  currentPersona: number;
  totalPersonas: number;
  currentBatch: number;
  totalBatches: number;
  completed: AnalysisResult[];
  errors: string[];
}

export class ClaudeAnalysisService {
  private static BATCH_SIZE = 3;
  private static STORAGE_KEY = 'persona_analysis_progress';
  
  static hasApiKey(): boolean {
    return !!localStorage.getItem('anthropic_api_key');
  }

  static getApiKey(): string | null {
    return localStorage.getItem('anthropic_api_key');
  }

  static saveProgress(progress: AnalysisProgress): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      ...progress,
      timestamp: Date.now()
    }));
  }

  static loadProgress(): AnalysisProgress | null {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return null;

    try {
      const data = JSON.parse(saved);
      // Check if progress is recent (within 1 hour)
      if (Date.now() - data.timestamp > 3600000) {
        localStorage.removeItem(this.STORAGE_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  static clearProgress(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static async startAnalysis(
    personas: any[],
    websiteUrl: string,
    onProgress: (progress: AnalysisProgress) => void,
    onError: (error: string) => void
  ): Promise<AnalysisResult[]> {
    
    if (!this.hasApiKey()) {
      throw new Error('Geen API key geconfigureerd. Ga naar instellingen om je Anthropic API key in te voeren.');
    }

    const questions = getAllQuestions();
    const totalBatches = Math.ceil(personas.length / this.BATCH_SIZE);
    
    let progress: AnalysisProgress = {
      currentPersona: 0,
      totalPersonas: personas.length,
      currentBatch: 0,
      totalBatches,
      completed: [],
      errors: []
    };

    // Check for existing progress
    const savedProgress = this.loadProgress();
    if (savedProgress && savedProgress.totalPersonas === personas.length) {
      progress = savedProgress;
      onProgress(progress);
      
      // Ask user if they want to resume
      const resume = confirm(`Er is een eerdere analyse gevonden met ${progress.completed.length} van ${progress.totalPersonas} personas voltooid. Wil je doorgaan waar je was gebleven?`);
      if (!resume) {
        progress.completed = [];
        progress.errors = [];
        progress.currentPersona = 0;
        progress.currentBatch = 0;
        this.clearProgress();
      }
    }

    try {
      const response = await supabase.functions.invoke('claude-persona-analysis', {
        body: {
          personas: personas.slice(progress.currentPersona),
          questions,
          websiteUrl,
          batchSize: this.BATCH_SIZE
        }
      });

      if (response.error) {
        throw new Error(`API Error: ${response.error.message}`);
      }

      const { data } = response;
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown API error');
      }

      // Combine with previous results if resuming
      const allResults = [...progress.completed, ...data.results];
      
      // Final progress update
      progress = {
        ...progress,
        currentPersona: personas.length,
        currentBatch: totalBatches,
        completed: allResults,
        errors: [...progress.errors]
      };
      
      onProgress(progress);
      this.clearProgress();
      
      return allResults;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      progress.errors.push(errorMessage);
      this.saveProgress(progress);
      onError(errorMessage);
      throw error;
    }
  }

  static async testApiConnection(): Promise<boolean> {
    const apiKey = this.getApiKey();
    if (!apiKey) return false;

    try {
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

      return response.ok;
    } catch {
      return false;
    }
  }

  static processResults(results: AnalysisResult[]): {
    averageScores: { question: string; score: number; questionId: string }[];
    firstImpressions: { word: string; count: number; color: string }[];
    improvements: { title: string; description: string; impact: string; priority: number }[];
    summary: any;
  } {
    const scoreQuestions = getAllQuestions().filter(q => q.type === 'score');
    const textQuestions = getAllQuestions().filter(q => q.type === 'text');

    // Calculate average scores
    const averageScores = scoreQuestions.map(question => {
      const scores = results
        .filter(r => r.vraagId === question.id && r.score !== undefined)
        .map(r => r.score!);
      
      const average = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
      
      return {
        question: question.tekst.substring(0, 30) + '...',
        score: Math.round(average * 10) / 10,
        questionId: question.id
      };
    });

    // Process first impressions (from word responses)
    const wordResponses = results.filter(r => r.woorden && r.woorden.length > 0);
    const wordCounts: Record<string, number> = {};
    
    wordResponses.forEach(r => {
      r.woorden!.forEach(word => {
        const cleanWord = word.toLowerCase().trim();
        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
      });
    });

    const firstImpressions = Object.entries(wordCounts)
      .map(([word, count]) => ({
        word: word.charAt(0).toUpperCase() + word.slice(1),
        count,
        color: `hsl(${Math.abs(word.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Generate improvements based on low scores
    const lowScoreQuestions = averageScores
      .filter(q => q.score < 6)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    const improvements = lowScoreQuestions.map((q, index) => {
      const relatedResponses = results.filter(r => r.vraagId === q.questionId && r.uitleg);
      const commonIssues = this.extractCommonIssues(relatedResponses.map(r => r.uitleg!));
      
      return {
        title: this.generateImprovementTitle(q.questionId),
        description: commonIssues || `Score van ${q.score}/10 bij vraag over ${q.question.toLowerCase()}`,
        impact: q.score < 4 ? "Hoog" : q.score < 6 ? "Gemiddeld" : "Laag",
        priority: index + 1
      };
    });

    const summary = {
      totalResponses: results.length,
      averageScore: averageScores.reduce((sum, item) => sum + item.score, 0) / averageScores.length,
      completionRate: (results.filter(r => r.score || r.uitleg || r.woorden).length / results.length) * 100,
      topWords: firstImpressions.slice(0, 3).map(fi => fi.word)
    };

    return {
      averageScores,
      firstImpressions,
      improvements,
      summary
    };
  }

  private static extractCommonIssues(explanations: string[]): string {
    // Simple keyword extraction for common issues
    const keywords = ['langzaam', 'onduidelijk', 'verwarrend', 'moeilijk', 'klein', 'slecht'];
    const mentions = keywords.reduce((acc, keyword) => {
      const count = explanations.filter(exp => 
        exp.toLowerCase().includes(keyword)
      ).length;
      if (count > 1) acc[keyword] = count;
      return acc;
    }, {} as Record<string, number>);

    const topIssue = Object.entries(mentions)
      .sort(([,a], [,b]) => b - a)[0];

    if (topIssue) {
      return `${Math.round((topIssue[1] / explanations.length) * 100)}% van de personas noemde problemen met: ${topIssue[0]}`;
    }

    return '';
  }

  private static generateImprovementTitle(questionId: string): string {
    const titles: Record<string, string> = {
      'lp_1': 'Verbeter navigatie-ervaring',
      'lp_2': 'Optimaliseer visueel ontwerp',
      'lp_3': 'Verhoog content relevantie',
      'lp_4': 'Versneller laadtijden',
      'lp_5': 'Mobiele ervaring verbeteren',
      'adv_1': 'Maak boodschap duidelijker',
      'adv_2': 'Verbeter advertentie design',
      'adv_3': 'Vergroot click-through rate'
    };

    return titles[questionId] || 'Algemene verbetering nodig';
  }

  static exportResults(results: AnalysisResult[], format: 'json' | 'markdown' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(results, null, 2);
    }

    // Markdown export
    const processed = this.processResults(results);
    
    let markdown = `# Persona Analyse Resultaten\n\n`;
    markdown += `**Datum:** ${new Date().toLocaleDateString('nl-NL')}\n`;
    markdown += `**Total responses:** ${processed.summary.totalResponses}\n`;
    markdown += `**Gemiddelde score:** ${processed.summary.averageScore.toFixed(1)}/10\n\n`;
    
    markdown += `## Gemiddelde Scores\n\n`;
    processed.averageScores.forEach(score => {
      markdown += `- **${score.question}**: ${score.score}/10\n`;
    });
    
    markdown += `\n## Eerste Indrukken\n\n`;
    processed.firstImpressions.forEach(impression => {
      markdown += `- **${impression.word}**: ${impression.count} keer genoemd\n`;
    });
    
    markdown += `\n## Top Verbeterpunten\n\n`;
    processed.improvements.forEach((improvement, index) => {
      markdown += `${index + 1}. **${improvement.title}** (${improvement.impact} impact)\n`;
      markdown += `   ${improvement.description}\n\n`;
    });

    return markdown;
  }
}