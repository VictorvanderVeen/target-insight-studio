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
  demoMode?: boolean;
}

interface AnalysisResponse {
  personaId: string;
  vraagId: string;
  score?: number;
  uitleg?: string;
  woorden?: string[];
  rawResponse?: string;
  fallback?: boolean;
  mock?: boolean;
}

// WRAPPER TO CATCH ALL ERRORS
serve(async (req) => {
  try {
    return await handleRequest(req);
  } catch (globalError) {
    console.error('=== GLOBAL ERROR HANDLER (v2) ===');
    console.error('Global error:', globalError);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Global error: ${globalError.message}`,
      fallback: true,
      code: 'GLOBAL_ERROR'
    }), {
      status: 200, // Always return 200 to avoid "non-2xx status code" error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleRequest(req: Request): Promise<Response> {
  console.log(`=== CLAUDE ANALYSIS REQUEST START (v3) ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`All ENV keys:`, Object.keys(Deno.env.toObject()).sort());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request - returning 200');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log(`=== CHECKING API KEY (v4) ===`);
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    console.log('=== DETAILED API KEY DEBUG ===');
    console.log('Raw API Key exists:', !!anthropicApiKey);
    console.log('API Key length:', anthropicApiKey?.length || 0);
    console.log('API Key first 10 chars:', anthropicApiKey?.substring(0, 10) || 'none');
    console.log('API Key starts with sk-ant-:', anthropicApiKey?.startsWith('sk-ant-') || false);
    console.log('All environment variables:', Object.keys(Deno.env.toObject()).sort());
    console.log('ANTHROPIC_API_KEY exists in env:', 'ANTHROPIC_API_KEY' in Deno.env.toObject());
    console.log('=== END API KEY DEBUG ===');
    
    console.log(`=== PARSING REQUEST BODY ===`);
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw body length:', bodyText.length);
      requestBody = JSON.parse(bodyText);
      console.log('Parsed body successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON in request body',
        details: parseError.message,
        fallback: true,
        code: 'PARSE_ERROR'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { personas, questions, websiteUrl, demoMode = false, batchSize = 1 } = requestBody; // BACK TO NORMAL
    
    console.log(`=== REQUEST DETAILS ===`);
    console.log('Demo mode:', demoMode);
    console.log('Personas count:', personas?.length || 0);
    console.log('Questions count:', questions?.length || 0);
    console.log('Website URL:', websiteUrl);
    console.log('Batch size:', batchSize);
    
    // DEMO MODE - Return mock responses for testing
    if (demoMode) {
      console.log('=== RUNNING DEMO MODE ===');
      const mockResults = generateMockResults(personas, questions, websiteUrl);
      
      console.log(`Generated ${mockResults.length} mock results`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = {
        success: true,
        results: mockResults,
        totalPersonas: personas.length,
        totalQuestions: questions.length,
        processedItems: mockResults.length,
        demoMode: true,
        note: "Demo mode - AI-gegenereerde mock responses"
      };
      
      console.log('=== DEMO MODE SUCCESS ===');
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // VALIDATION FOR PRODUCTION MODE
    console.log(`=== VALIDATING PRODUCTION MODE ===`);
    
    if (!anthropicApiKey || anthropicApiKey.trim() === '') {
      console.error('API key validation failed:', {
        exists: !!anthropicApiKey,
        isEmpty: !anthropicApiKey || anthropicApiKey.trim() === '',
        hasCorrectFormat: anthropicApiKey?.startsWith('sk-ant-') || false,
        actualPrefix: anthropicApiKey?.substring(0, 7) || 'none'
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ANTHROPIC_API_KEY is not configured correctly. Please set a valid Claude API key starting with sk-ant- in Supabase secrets.',
        fallback: true,
        code: 'INVALID_API_KEY'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!personas || !Array.isArray(personas) || personas.length === 0) {
      console.error('Validation failed: no personas provided');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No personas provided',
        code: 'NO_PERSONAS'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.error('Validation failed: no questions provided');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No questions provided',
        code: 'NO_QUESTIONS'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`=== STARTING CLAUDE ANALYSIS ===`);
    console.log(`Processing ${personas.length} personas with ${questions.length} questions`);

    const results: AnalysisResponse[] = [];
    const startTime = Date.now();
    
    // Process personas one by one for now to debug
    for (let i = 0; i < Math.min(personas.length, 2); i++) {
      const persona = personas[i];
      console.log(`=== PROCESSING PERSONA ${i + 1}: ${persona.naam} ===`);
      
      try {
        const personaResults = await batchAnalyzePersona(persona, questions.slice(0, 3), websiteUrl, anthropicApiKey);
        results.push(...personaResults);
        console.log(`Successfully processed ${persona.naam} - ${personaResults.length} responses`);
        
        // Rate limiting delay
        if (i < personas.length - 1) {
          console.log('Applying rate limit delay...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`Error processing persona ${persona.naam}:`, error);
        
        // Add fallback responses for all questions
        for (const question of questions.slice(0, 3)) {
          results.push({
            personaId: persona.id,
            vraagId: question.id,
            rawResponse: `Fallback: API error - ${error.message}`,
            fallback: true
          });
        }
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`=== ANALYSIS COMPLETED ===`);
    console.log(`Processing time: ${processingTime}ms`);
    console.log(`Generated ${results.length} results`);

    const successResponse = {
      success: true,
      results,
      totalPersonas: Math.min(personas.length, 2),
      totalQuestions: Math.min(questions.length, 3),
      processedItems: results.length,
      processingTime,
      demoMode: false,
      note: "Limited to 2 personas and 3 questions for testing"
    };

    console.log('=== RETURNING SUCCESS RESPONSE ===');
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    const errorResponse = {
      success: false,
      error: `Function error: ${error.message}`,
      errorName: error.name,
      fallback: true,
      code: 'CRITICAL_ERROR'
    };

    console.log('=== RETURNING ERROR RESPONSE ===');
    return new Response(JSON.stringify(errorResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

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
    console.log(`=== MAKING CLAUDE API CALL ===`);
    console.log('API Key being used:', apiKey?.substring(0, 15) + '...');
    console.log('Model:', 'claude-3-5-haiku-20241022');
    console.log('Batch prompt length:', batchPrompt.length);
    
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

    console.log('API Response status:', response.status);
    console.log('API Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';
    
    console.log(`=== CLAUDE API RESPONSE DETAILS ===`);
    console.log('Full API response object:', JSON.stringify(data, null, 2));
    console.log(`Extracted content:`, content);
    console.log(`Content length:`, content.length);
    console.log(`Content preview (first 200 chars):`, content.substring(0, 200));
    console.log(`=== END CLAUDE API RESPONSE ===`);

    return parseBatchResponse(persona.id, questions, content);
    
  } catch (error) {
    console.error(`Batch API call failed for ${persona.naam}:`, error);
    throw error;
  }
}

// Parse the batch response into individual question responses
function parseBatchResponse(personaId: string, questions: any[], response: string): AnalysisResponse[] {
  console.log(`=== PARSING BATCH RESPONSE FOR PERSONA ${personaId} ===`);
  console.log('Raw Claude response:', response);
  console.log('Response length:', response.length);
  
  const results: AnalysisResponse[] = [];
  
  // Try different parsing strategies
  
  // Strategy 1: Look for numbered responses (1., 2., etc.)
  let lines = response.split('\n').filter(line => line.trim());
  console.log('Split into lines:', lines.length);
  
  // Strategy 2: If no clear structure, try to extract based on question patterns
  if (lines.length === 1 && response.length > 50) {
    // Claude might have returned everything on one line, try to split differently
    lines = response.split(/(?=\d+\.)/g).filter(line => line.trim());
    console.log('Re-split by number patterns:', lines.length);
  }
  
  lines.forEach((line, index) => {
    console.log(`Line ${index}: "${line}"`);
  });
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const questionNumber = i + 1;
    
    console.log(`Looking for question ${questionNumber} (${question.id})`);
    
    // Try multiple patterns to find the response
    let responseLine = lines.find(line => {
      const trimmed = line.trim();
      return (
        trimmed.startsWith(`${questionNumber}.`) ||
        trimmed.startsWith(`${questionNumber}:`) ||
        trimmed.startsWith(`${questionNumber} `) ||
        trimmed.startsWith(`Vraag ${questionNumber}`) ||
        trimmed.includes(`${questionNumber}.`) ||
        trimmed.match(new RegExp(`^${questionNumber}[\\s\\.:]`))
      );
    });
    
    // If no numbered response found, try to extract from context
    if (!responseLine && response.includes(question.tekst.substring(0, 20))) {
      // Look for the question text in the response
      const questionPos = response.indexOf(question.tekst.substring(0, 20));
      if (questionPos !== -1) {
        const afterQuestion = response.substring(questionPos + question.tekst.length);
        const nextQuestionPos = afterQuestion.search(/\d+\./);
        responseLine = nextQuestionPos > 0 ? 
          afterQuestion.substring(0, nextQuestionPos).trim() : 
          afterQuestion.substring(0, 100).trim();
        console.log(`Extracted by question text: "${responseLine}"`);
      }
    }
    
    // Last resort: if we have a single long response, try to extract parts
    if (!responseLine && lines.length === 1 && response.length > 200) {
      const parts = response.split(/[\.!?]\s+/).filter(p => p.trim().length > 10);
      if (parts.length >= questions.length && i < parts.length) {
        responseLine = parts[i].trim();
        console.log(`Extracted from parts: "${responseLine}"`);
      }
    }
    
    if (responseLine) {
      console.log(`Found response for Q${questionNumber}: "${responseLine}"`);
      // Clean up the response
      let cleanResponse = responseLine
        .replace(/^\d+[\.\:\s]+/, '') // Remove number prefix
        .replace(/^(Vraag \d+[:.]?\s*)/, '') // Remove "Vraag X:" prefix
        .trim();
      
      console.log(`Cleaned response: "${cleanResponse}"`);
      
      // If still empty or too short, use the original
      if (cleanResponse.length < 3) {
        cleanResponse = responseLine.trim();
      }
      
      results.push(parseClaudeResponse(personaId, question.id, cleanResponse, question.type));
    } else {
      console.log(`NO RESPONSE FOUND for question ${questionNumber}`);
      console.log(`Available lines starting with numbers:`, lines.filter(l => /^\d/.test(l.trim())));
      
      // Create a fallback response that indicates parsing failure
      results.push({
        personaId,
        vraagId: question.id,
        rawResponse: `Parsing mislukt - origineel: ${response.substring(0, 100)}...`,
        fallback: true
      });
    }
  }
  
  console.log(`=== PARSING COMPLETE: Generated ${results.length} results ===`);
  console.log('Results summary:', results.map(r => ({ id: r.vraagId, hasScore: !!r.score, hasText: !!r.uitleg, hasWords: !!r.woorden, fallback: (r as any).fallback })));
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
