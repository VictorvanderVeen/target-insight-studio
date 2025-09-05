import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PersonaAnalysisRequest {
  personas: any[];
  questions: any[];
  websiteUrl: string;
  batchSize?: number;
}

interface AnalysisResponse {
  personaId: string;
  vraagId: string;
  score?: number;
  uitleg?: string;
  woorden?: string[];
  rawResponse?: string;
}

serve(async (req) => {
  console.log(`Received ${req.method} request to claude-persona-analysis`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!anthropicApiKey || anthropicApiKey.trim() === '') {
      console.error('ANTHROPIC_API_KEY is empty or missing');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ANTHROPIC_API_KEY is not configured. Please set your Claude API key in Supabase secrets.',
        fallback: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    const { personas, questions, websiteUrl, demoMode = false, batchSize = 1 } = requestBody;
    
    console.log(`Processing request - Demo mode: ${demoMode}, Personas: ${personas?.length}, Questions: ${questions?.length}`);
    
    // DEMO MODE - Return mock responses for testing
    if (demoMode) {
      console.log('Running in demo mode');
      const mockResults = generateMockResults(personas, questions, websiteUrl);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return new Response(JSON.stringify({
        success: true,
        results: mockResults,
        totalPersonas: personas.length,
        totalQuestions: questions.length,
        processedItems: mockResults.length,
        demoMode: true,
        note: "Demo mode - AI-gegenereerde mock responses"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PRODUCTION MODE - Real Claude API calls
    if (!personas || !Array.isArray(personas) || personas.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No personas provided' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No questions provided' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache check
    const cacheKey = generateCacheKey(personas, questions, websiteUrl);
    console.log(`Cache key: ${cacheKey}`);

    console.log(`Starting REAL Claude analysis for ${personas.length} personas, ${questions.length} questions`);

    const results: AnalysisResponse[] = [];
    const startTime = Date.now();
    
    // Process personas in optimized batches
    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];
      console.log(`Processing persona ${i + 1}/${personas.length}: ${persona.naam}`);
      
      try {
        // BATCH PROCESSING: Send all questions for this persona at once
        const personaResults = await batchAnalyzePersona(persona, questions, websiteUrl, anthropicApiKey);
        results.push(...personaResults);
        
        console.log(`Successfully processed ${persona.naam} - ${personaResults.length} responses`);
        
        // Rate limiting delay
        if (i < personas.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`Error processing persona ${persona.naam}:`, error.message);
        
        // Add fallback responses for all questions
        for (const question of questions) {
          results.push({
            personaId: persona.id,
            vraagId: question.id,
            rawResponse: `Fallback: Kon niet analyseren door API limiet`,
            fallback: true
          });
        }
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`Analysis completed in ${processingTime}ms. Generated ${results.length} results`);

    return new Response(JSON.stringify({
      success: true,
      results,
      totalPersonas: personas.length,
      totalQuestions: questions.length,
      processedItems: results.length,
      processingTime,
      demoMode: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Critical error in claude-persona-analysis:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Function error: ${error.message}`,
      fallback: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function simuleerPersonaAntwoord(persona: any, question: any, websiteUrl: string, apiKey: string): Promise<AnalysisResponse> {
  const questionType = question.type;
  
  let prompt = `Je bent ${persona.naam}, ${persona.leeftijd} jaar oud.
Beroep: ${persona.beroep}
Woonplaats: ${persona.woonplaats}
Interesses: ${persona.hobbies}
Motivatie: ${persona.motivatie}
Je gebruikt vooral: ${persona.kanalen}

INSTRUCTIES:
- Reageer ALLEEN vanuit dit persona perspectief
- Wees authentiek voor jouw achtergrond en leeftijd
- Als iets je niet aanspreekt, zeg dat eerlijk
- Geef specifieke feedback gebaseerd op jouw persoonlijke situatie

Bekijk deze ${websiteUrl.includes('http') ? 'website' : 'advertentie'}: ${websiteUrl}

Vraag: ${question.tekst}`;

  if (questionType === 'score') {
    prompt += `\n\nGeef een score van 1-10 en leg kort uit waarom.
Formaat: Score: [1-10]
Reden: [uitleg in max 2 zinnen]`;
  } else if (questionType === 'text' && question.tekst.includes('één woord')) {
    prompt += `\n\nGeef precies 3 woorden die je eerste indruk beschrijven.
Formaat: Woord1, Woord2, Woord3`;
  } else {
    prompt += `\n\nGeef een kort maar specifiek antwoord vanuit jouw perspectief.`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';
    
    console.log(`Response for ${persona.naam} - ${question.id}: ${content}`);

    return parseClaudeResponse(persona.id, question.id, content, questionType);
    
  } catch (error) {
    console.error(`API call failed for ${persona.naam}:`, error);
    throw error;
  }
}

function parseClaudeResponse(personaId: string, vraagId: string, response: string, questionType: string): AnalysisResponse {
  const result: AnalysisResponse = {
    personaId,
    vraagId,
    rawResponse: response
  };

  try {
    if (questionType === 'score') {
      // Look for score pattern
      const scoreMatch = response.match(/(?:Score|score):\s*(\d+)/i);
      if (scoreMatch) {
        result.score = parseInt(scoreMatch[1]);
      }
      
      // Look for reason pattern
      const reasonMatch = response.match(/(?:Reden|reden|Reason|reason):\s*(.+)/i);
      if (reasonMatch) {
        result.uitleg = reasonMatch[1].trim();
      } else {
        // If no explicit reason format, take the part after the score
        const lines = response.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
          result.uitleg = lines.slice(1).join(' ').trim();
        }
      }
    } else if (questionType === 'text' && response.includes(',')) {
      // Parse comma-separated words
      const words = response.split(',').map(w => w.trim()).filter(w => w.length > 0);
      if (words.length >= 3) {
        result.woorden = words.slice(0, 3);
      }
    } else {
      // For other text responses, store as explanation
      result.uitleg = response.trim();
    }
  } catch (error) {
    console.error('Error parsing response:', error);
    result.uitleg = response; // Fallback to raw response
  }

  return result;
}

// CACHE UTILITIES
function generateCacheKey(personas: any[], questions: any[], websiteUrl: string): string {
  const personaIds = personas.map(p => p.id).sort().join('-');
  const questionIds = questions.map(q => q.id).sort().join('-');
  const urlHash = websiteUrl.slice(-10); // Simple hash
  return `${personaIds}-${questionIds}-${urlHash}`;
}

// BATCH PROCESSING - Send all questions for one persona in single request
async function batchAnalyzePersona(persona: any, questions: any[], websiteUrl: string, apiKey: string): Promise<AnalysisResponse[]> {
  console.log(`Batch processing ${questions.length} questions for ${persona.naam}`);
  
  // Create a batch prompt that includes all questions
  const batchPrompt = `Je bent ${persona.naam}, ${persona.leeftijd} jaar oud.
Beroep: ${persona.beroep}
Woonplaats: ${persona.woonplaats}
Interesses: ${persona["Hobby's & Interesses"] || persona.hobbies || 'Geen opgegeven'}
Motivatie: ${persona["Motivatie (Waarom UAF steunen?)"] || persona.motivatie || 'Geen opgegeven'}
Kanalen: ${persona.kanalen || 'Onbekend'}

INSTRUCTIES:
- Reageer ALLEEN vanuit dit persona perspectief
- Wees authentiek voor jouw achtergrond en leeftijd
- Als iets je niet aanspreekt, zeg dat eerlijk
- Geef specifieke feedback gebaseerd op jouw persoonlijke situatie

Bekijk deze ${websiteUrl.includes('http') ? 'website' : 'advertentie'}: ${websiteUrl}

Beantwoord de volgende vragen elk op een nieuwe regel:

${questions.map((q, index) => {
  let questionText = `${index + 1}. ${q.tekst}`;
  
  if (q.type === 'score') {
    questionText += ' (Geef score 1-10 en korte uitleg)';
  } else if (q.type === 'text' && q.tekst.includes('één woord')) {
    questionText += ' (Geef precies 3 woorden)';
  }
  
  return questionText;
}).join('\n')}

Formaat per antwoord:
${questions.map((q, index) => {
  if (q.type === 'score') {
    return `${index + 1}. Score: [1-10] | Uitleg: [reden]`;
  } else if (q.type === 'text' && q.tekst.includes('één woord')) {
    return `${index + 1}. Woord1, Woord2, Woord3`;
  }
  return `${index + 1}. [jouw antwoord]`;
}).join('\n')}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022', // Fast and cost-effective model
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: batchPrompt
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';
    
    console.log(`Batch response for ${persona.naam}:`, content);

    return parseBatchResponse(persona.id, questions, content);
    
  } catch (error) {
    console.error(`Batch API call failed for ${persona.naam}:`, error);
    throw error;
  }
}

// Parse the batch response into individual question responses
function parseBatchResponse(personaId: string, questions: any[], response: string): AnalysisResponse[] {
  const results: AnalysisResponse[] = [];
  const lines = response.split('\n').filter(line => line.trim());
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const questionNumber = i + 1;
    
    // Find the line that starts with this question number
    const responseLine = lines.find(line => 
      line.trim().startsWith(`${questionNumber}.`) || 
      line.trim().startsWith(`${questionNumber}:`)
    );
    
    if (responseLine) {
      const cleanResponse = responseLine.replace(/^\d+[\.\:]\s*/, '').trim();
      results.push(parseClaudeResponse(personaId, question.id, cleanResponse, question.type));
    } else {
      // Fallback if we can't find the response
      results.push({
        personaId,
        vraagId: question.id,
        rawResponse: 'Geen antwoord gevonden in batch response',
        fallback: true
      });
    }
  }
  
  return results;
}

// DEMO MODE - Generate realistic mock responses
function generateMockResults(personas: any[], questions: any[], websiteUrl: string): AnalysisResponse[] {
  const results: AnalysisResponse[] = [];
  
  const mockScores = [6, 7, 8, 5, 9, 7, 6, 8, 7, 5];
  const mockWords = [
    ['Professioneel', 'Duidelijk', 'Vertrouwd'],
    ['Modern', 'Uitnodigend', 'Relevant'],
    ['Inspirerend', 'Authentiek', 'Waardevol'],
    ['Helder', 'Motiverend', 'Toegankelijk'],
    ['Betrouwbaar', 'Persoonlijk', 'Effectief']
  ];
  const mockExplanations = [
    'Het spreekt me aan door de persoonlijke verhalen',
    'De informatie is helder en goed gestructureerd',
    'Ik mis wat meer concrete voorbeelden',
    'De visuele presentatie werkt goed voor mijn doelgroep',
    'Het sluit goed aan bij mijn persoonlijke ervaring'
  ];

  let scoreIndex = 0;
  let wordIndex = 0;
  let explanationIndex = 0;

  personas.forEach((persona) => {
    questions.forEach((question) => {
      const result: AnalysisResponse = {
        personaId: persona.id,
        vraagId: question.id,
        rawResponse: '',
        mock: true
      };

      if (question.type === 'score') {
        result.score = mockScores[scoreIndex % mockScores.length];
        result.uitleg = mockExplanations[explanationIndex % mockExplanations.length];
        result.rawResponse = `Score: ${result.score} | Uitleg: ${result.uitleg}`;
        scoreIndex++;
        explanationIndex++;
      } else if (question.type === 'text' && question.tekst.includes('één woord')) {
        result.woorden = mockWords[wordIndex % mockWords.length];
        result.rawResponse = result.woorden.join(', ');
        wordIndex++;
      } else {
        result.uitleg = mockExplanations[explanationIndex % mockExplanations.length];
        result.rawResponse = result.uitleg;
        explanationIndex++;
      }

      results.push(result);
    });
  });

  return results;
}