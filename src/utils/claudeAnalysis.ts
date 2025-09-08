import { supabase } from "@/integrations/supabase/client";
import { getAllQuestions, getQuestionsByAnalysisType } from "@/data/questions";

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
    onError: (error: string) => void,
    demoMode: boolean = false,
    analysisType: 'advertentie' | 'landingspagina' | 'complete' = 'complete',
    imageData?: string | null
  ): Promise<AnalysisResult[]> {
    
    const questions = analysisType ? getQuestionsByAnalysisType(analysisType) : getAllQuestions();
    const totalBatches = Math.ceil(personas.length / this.BATCH_SIZE);
    
    let progress: AnalysisProgress = {
      currentPersona: 0,
      totalPersonas: personas.length,
      currentBatch: 0,
      totalBatches,
      completed: [],
      errors: []
    };

    // Check for existing progress only if not in demo mode
    if (!demoMode) {
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
    }

    try {
      console.log(`=== FRONTEND: Starting ${demoMode ? 'DEMO' : 'PRODUCTION'} Claude analysis ===`);
      console.log('Request payload:', {
        personasCount: demoMode ? personas.length : personas.slice(progress.currentPersona).length,
        questionsCount: questions.length,
        websiteUrl,
        demoMode,
        batchSize: this.BATCH_SIZE
      });
      
      const requestBody = {
        personas: demoMode ? personas : personas.slice(progress.currentPersona),
        questions,
        websiteUrl,
        demoMode,
        batchSize: this.BATCH_SIZE,
        imageData // Add image data to request
      };
      
      console.log('=== FRONTEND: Calling supabase.functions.invoke ===');
      console.log(`CRITICAL: demoMode being sent = ${demoMode}`);
      const response = await supabase.functions.invoke('claude-persona-analysis', {
        body: requestBody
      });

      console.log('=== FRONTEND: Raw response received ===');
      console.log('Response object:', response);
      console.log('Response.data:', response.data);
      console.log('Response.error:', response.error);

      if (response.error) {
        console.error('=== FRONTEND: Supabase function error ===');
        console.error('Error object:', response.error);
        console.error('Error message:', response.error.message);
        console.error('Error name:', response.error.name);
        
        // Check if it's a fallback scenario
        if (response.error.message?.includes('ANTHROPIC_API_KEY') || 
            response.data?.fallback || 
            response.data?.error?.includes('ANTHROPIC_API_KEY')) {
          
          console.log('=== FRONTEND: API key not available, offering demo mode ===');
          if (!demoMode) {
            const useDemoMode = confirm('Claude API sleutel is niet beschikbaar. Wil je demo mode gebruiken met mock data?');
            
            if (useDemoMode) {
              return this.startAnalysis(personas, websiteUrl, onProgress, onError, true);
            }
          }
        }
        
        throw new Error(`API Error: ${response.error.message}`);
      }

      const { data } = response;
      
      console.log('=== FRONTEND: Processing response data ===');
      console.log('Data object:', data);
      
      if (!data) {
        console.error('=== FRONTEND: No data returned ===');
        throw new Error('No data returned from edge function');
      }
      
      if (!data.success) {
        console.error('=== FRONTEND: Edge function returned error ===');
        console.error('Data.success:', data.success);
        console.error('Data.error:', data.error);
        console.error('Data.fallback:', data.fallback);
        console.error('Data.code:', data.code);
        
        // Check for fallback scenario in data
        if (data.fallback && data.error?.includes('ANTHROPIC_API_KEY') && !demoMode) {
          console.log('=== FRONTEND: API key not configured, offering demo mode ===');
          const useDemoMode = confirm('Claude API sleutel is niet geconfigureerd. Wil je demo mode gebruiken met mock data?');
          
          if (useDemoMode) {
            return this.startAnalysis(personas, websiteUrl, onProgress, onError, true);
          }
        }
        
        throw new Error(data.error || 'Unknown API error');
      }

      console.log('=== FRONTEND: Successfully processed results ===');
      console.log('Results count:', data.results?.length || 0);
      console.log('Demo mode:', data.demoMode);

      // Combine with previous results if resuming (not applicable in demo mode)
      const allResults = demoMode ? data.results : [...progress.completed, ...data.results];
      
      // Final progress update
      progress = {
        ...progress,
        currentPersona: personas.length,
        currentBatch: totalBatches,
        completed: allResults,
        errors: [...progress.errors]
      };
      
      onProgress(progress);
      
      if (!demoMode) {
        this.clearProgress();
      }
      
      console.log('=== FRONTEND: Analysis completed successfully ===');
      return allResults;

    } catch (error) {
      console.error('=== FRONTEND: Analysis failed ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Suggest demo mode if API fails
      if (!demoMode && (
        errorMessage.includes('ANTHROPIC_API_KEY') || 
        errorMessage.includes('API Error') ||
        errorMessage.includes('Edge Function returned a non-2xx status code')
      )) {
        console.log('=== FRONTEND: API error detected, offering demo mode ===');
        const useDemoMode = confirm(`Analyse mislukt: ${errorMessage}\n\nWil je demo mode proberen met mock data?`);
        
        if (useDemoMode) {
          return this.startAnalysis(personas, websiteUrl, onProgress, onError, true);
        }
      }
      
      progress.errors.push(errorMessage);
      if (!demoMode) {
        this.saveProgress(progress);
      }
      onError(errorMessage);
      throw error;
    }
  }

  static async testApiConnection(): Promise<boolean> {
    try {
      // Test via our edge function instead of direct API call
      const response = await supabase.functions.invoke('claude-persona-analysis', {
        body: {
          personas: [{
            id: 'test',
            naam: 'Test',
            leeftijd: 30,
            beroep: 'Test',
            woonplaats: 'Test',
            hobbies: 'Test',
            motivatie: 'Test',
            kanalen: 'Test'
          }],
          questions: [{ id: 'test', tekst: 'Test', type: 'text' }],
          websiteUrl: 'test',
          batchSize: 1
        }
      });

      return !response.error;
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
    console.log('=== PROCESSING RESULTS START ===');
    console.log('RAW RESULTS RECEIVED:', results);
    console.log('Results length:', results.length);
    
    // Debug each result
    results.forEach((result, index) => {
      console.log(`Result ${index}:`, {
        personaId: result.personaId,
        vraagId: result.vraagId,
        score: result.score,
        uitleg: result.uitleg,
        woorden: result.woorden,
        rawResponse: result.rawResponse,
        fallback: (result as any).fallback
      });
    });

    // Group results by question
    const resultsByQuestion = {};
    results.forEach(r => {
      if (!resultsByQuestion[r.vraagId]) {
        resultsByQuestion[r.vraagId] = [];
      }
      resultsByQuestion[r.vraagId].push(r);
    });
    
    console.log('RESULTS GROUPED BY QUESTION:', resultsByQuestion);
    
    const scoreQuestions = getAllQuestions().filter(q => q.type === 'score');
    const textQuestions = getAllQuestions().filter(q => q.type === 'text' || q.type === 'woorden');
    
    console.log('Available score questions:', scoreQuestions.map(q => q.id));
    console.log('Available text questions:', textQuestions.map(q => q.id));

    // Calculate average scores
    const averageScores = scoreQuestions.map(question => {
      const scores = results
        .filter(r => r.vraagId === question.id && r.score !== undefined && !isNaN(r.score))
        .map(r => r.score!);
      
      console.log(`Question ${question.id} scores:`, scores);
      
      const average = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
      
      const result = {
        question: question.tekst.length > 40 ? question.tekst.substring(0, 37) + '...' : question.tekst,
        score: Math.round(average * 10) / 10,
        questionId: question.id
      };
      
      console.log(`Calculated average for ${question.id}:`, result);
      return result;
    });

    console.log('FINAL AVERAGE SCORES:', averageScores);

    // Process first impressions (from word responses)
    const wordResponses = results.filter(r => r.woorden && Array.isArray(r.woorden) && r.woorden.length > 0);
    console.log('Word responses found:', wordResponses.length);
    
    const wordCounts: Record<string, number> = {};
    
    wordResponses.forEach(r => {
      console.log('Processing word response:', r.woorden);
      r.woorden!.forEach(word => {
        const cleanWord = word.toLowerCase().trim().replace(/[.,!?]/g, '');
        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
      });
    });
    
    console.log('WORD COUNTS:', wordCounts);

    const firstImpressions = Object.entries(wordCounts)
      .map(([word, count]) => ({
        word: word.charAt(0).toUpperCase() + word.slice(1),
        count,
        color: `hsl(${Math.abs(word.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    console.log('FIRST IMPRESSIONS:', firstImpressions);

    // Generate improvements based on low scores
    const lowScoreQuestions = averageScores
      .filter(q => q.score > 0 && q.score < 6) // Only include actual scores
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    const improvements = lowScoreQuestions.map((q, index) => {
      const relatedResponses = results.filter(r => r.vraagId === q.questionId && r.uitleg);
      const commonIssues = this.extractCommonIssues(relatedResponses.map(r => r.uitleg!));
      
      return {
        title: this.generateImprovementTitle(q.questionId),
        description: commonIssues || `Score van ${q.score}/7 suggereert verbeteringen nodig`,
        impact: q.score < 3 ? "Hoog" : q.score < 5 ? "Gemiddeld" : "Laag",
        priority: index + 1
      };
    });

    const validScores = averageScores.filter(s => s.score > 0);
    const summary = {
      totalResponses: results.length,
      validResponses: results.filter(r => !((r as any).fallback) && (r.score || r.uitleg || r.woorden)).length,
      fallbackResponses: results.filter(r => (r as any).fallback).length,
      averageScore: validScores.length > 0 ? validScores.reduce((sum, item) => sum + item.score, 0) / validScores.length : 0,
      completionRate: (results.filter(r => r.score || r.uitleg || r.woorden).length / results.length) * 100,
      topWords: firstImpressions.slice(0, 3).map(fi => fi.word)
    };

    console.log('FINAL SUMMARY:', summary);
    console.log('=== PROCESSING RESULTS COMPLETE ===');

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
      // Nieuwe vraag IDs
      'A1': 'Verbeter eerste indruk',
      'A2': 'Maak doelgroep duidelijker', 
      'A3': 'Verhoog relevantie',
      'A4': 'Versterk geloofwaardigheid',
      'A5': 'Vergroot emotionele impact',
      'A6': 'Optimaliseer klikintentie',
      'A7': 'Verbeter CTA duidelijkheid',
      'B1': 'Verbeter 5-seconden test',
      'B2': 'Versterk advertentie-aansluiting',
      'B3': 'Verduidelijk waardepropositie',
      'B4': 'Verstrek meer informatie',
      'B5': 'Verhoog vertrouwen',
      'B6': 'Reduceer formulier frictie',
      'B7': 'Versterf CTA zichtbaarheid',
      'B8': 'Optimaliseer mobiele ervaring',
      'C1': 'Los belofte-gat op',
      'C2': 'Vervul verwachtingen beter',
      'C3': 'Implementeer top conversie-fix',
      // Oude vraag IDs (backwards compatibility)
      'lp_1': 'Verbeter navigatie-ervaring',
      'lp_2': 'Optimaliseer visueel ontwerp',
      'lp_3': 'Verhoog content relevantie',
      'lp_4': 'Versneller laadtijden',
      'lp_5': 'Mobiele ervaring verbeteren',
      'adv_1': 'Maak boodschap duidelijker',
      'adv_2': 'Verbeter advertentie design',
      'adv_3': 'Vergroot click-through rate'
    };

    return titles[questionId] || `Verbetering nodig (${questionId})`;
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