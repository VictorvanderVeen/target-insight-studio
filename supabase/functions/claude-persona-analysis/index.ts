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
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    console.log('API Key status:', anthropicApiKey ? 'Present' : 'Missing');
    
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY not configured in environment');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ANTHROPIC_API_KEY not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify({
      personasCount: requestBody.personas?.length,
      questionsCount: requestBody.questions?.length,
      websiteUrl: requestBody.websiteUrl,
      batchSize: requestBody.batchSize
    }));

    const { personas, questions, websiteUrl, batchSize = 3 }: PersonaAnalysisRequest = requestBody;
    
    if (!personas || !questions || !websiteUrl) {
      console.error('Missing required fields:', { personas: !!personas, questions: !!questions, websiteUrl: !!websiteUrl });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: personas, questions, or websiteUrl' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Starting analysis for ${personas.length} personas, ${questions.length} questions`);

    const results: AnalysisResponse[] = [];
    
    // Process personas in batches
    for (let i = 0; i < personas.length; i += batchSize) {
      const batch = personas.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}, personas ${i + 1} to ${Math.min(i + batchSize, personas.length)}`);
      
      const batchPromises = batch.map(async (persona) => {
        const personaResults: AnalysisResponse[] = [];
        
        for (const question of questions) {
          try {
            const result = await simuleerPersonaAntwoord(persona, question, websiteUrl, anthropicApiKey);
            personaResults.push(result);
            
            // Small delay between questions for the same persona
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error processing question ${question.id} for persona ${persona.id}:`, error);
            // Add error response
            personaResults.push({
              personaId: persona.id,
              vraagId: question.id,
              rawResponse: `Error: ${error.message}`
            });
          }
        }
        
        return personaResults;
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());
      
      // Delay between batches for rate limiting
      if (i + batchSize < personas.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`Analysis completed. Generated ${results.length} results`);

    return new Response(JSON.stringify({
      success: true,
      results,
      totalPersonas: personas.length,
      totalQuestions: questions.length,
      processedItems: results.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in claude-persona-analysis:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
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
        model: 'claude-3-5-sonnet-20241022',
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