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
    
    console.log('API Key status:');
    console.log('- Exists:', !!anthropicApiKey);
    console.log('- Length:', anthropicApiKey?.length || 0);
    console.log('- Starts correctly:', anthropicApiKey?.startsWith('sk-ant-') || false);
    
    if (!anthropicApiKey || anthropicApiKey.trim() === '') {
      console.error('ANTHROPIC_API_KEY is empty or missing');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ANTHROPIC_API_KEY is not configured. Please set your Claude API key in Supabase secrets.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Parsing request body...');
    const requestBody = await req.json();
    
    const { personas, questions, websiteUrl, batchSize = 1 } = requestBody;
    
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
    
    console.log(`Starting analysis for ${personas.length} personas, ${questions.length} questions`);

    // Process just first few items for testing
    const testPersonas = personas.slice(0, Math.min(2, personas.length));
    const testQuestions = questions.slice(0, Math.min(3, questions.length));
    
    console.log(`Processing ${testPersonas.length} personas with ${testQuestions.length} questions for testing`);

    const results: AnalysisResponse[] = [];
    
    // Process one persona at a time to avoid overwhelming
    for (const persona of testPersonas) {
      console.log(`Processing persona: ${persona.naam}`);
      
      for (const question of testQuestions) {
        try {
          console.log(`Processing question: ${question.id}`);
          
          const result = await simuleerPersonaAntwoord(persona, question, websiteUrl, anthropicApiKey);
          results.push(result);
          
          console.log(`Successfully processed ${persona.naam} - ${question.id}`);
          
          // Small delay to be nice to the API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Error with ${persona.naam} - ${question.id}:`, error.message);
          results.push({
            personaId: persona.id,
            vraagId: question.id,
            rawResponse: `Error: ${error.message}`
          });
        }
      }
    }

    console.log(`Analysis completed. Generated ${results.length} results`);

    return new Response(JSON.stringify({
      success: true,
      results,
      totalPersonas: testPersonas.length,
      totalQuestions: testQuestions.length,
      processedItems: results.length,
      note: "This is a test run with limited personas and questions"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Critical error in claude-persona-analysis:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Function error: ${error.message}`,
      stack: error.stack
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