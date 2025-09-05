import { getAllQuestions } from '../data/questions';

// Mock responses gebaseerd op persona karakteristieken
const generateMockResponse = (persona, question) => {
  const responses = {
    // Score responses (1-10)
    score: () => {
      // Basis score afhankelijk van persona type
      let baseScore = 7;
      
      if (persona.naam.includes('Jan') || persona.naam.includes('Marieke')) {
        baseScore = 6; // Christelijke doelgroep wat conservatiever
      }
      if (persona.naam.includes('Sophie')) {
        baseScore = 8; // Journalist kritischer maar apprecieert kwaliteit
      }
      if (persona.naam.includes('Ahmad')) {
        baseScore = 7; // Pragmatisch
      }
      if (persona.naam.includes('Linda')) {
        baseScore = 8; // Marketing professional hoge standaarden
      }
      
      // Voeg wat variatie toe
      const variation = Math.random() * 2 - 1; // -1 tot +1
      const score = Math.max(1, Math.min(10, Math.round(baseScore + variation)));
      return score;
    },
    
    // Text responses
    text: () => {
      const textResponses = {
        "Wat is je eerste indruk in één woord?": [
          "Professioneel", "Modern", "Duidelijk", "Aantrekkelijk", "Verwarrend", 
          "Druk", "Simpel", "Elegant", "Outdated", "Innovatief"
        ],
        "Wat zou je verbeteren aan deze pagina?": [
          "Meer witruimte gebruiken",
          "Snellere laadtijd",
          "Duidelijkere call-to-action", 
          "Betere mobiele weergave",
          "Meer contrast in kleuren",
          "Eenvoudigere navigatie"
        ],
        "Wat zijn de belangrijkste voordelen die je ziet?": [
          "Gebruiksvriendelijke interface",
          "Goede informatiestructuur", 
          "Aantrekkelijk design",
          "Duidelijke navigatie",
          "Professionele uitstraling"
        ],
        "Wat zijn je grootste zorgen of twijfels?": [
          "Onduidelijke prijsstelling",
          "Te weinig contactinformatie",
          "Geen klantenreviews zichtbaar",
          "Technische complexiteit",
          "Vertrouwenskwesties"
        ]
      };
      
      const responses = textResponses[question.tekst] || [
        "Ziet er goed uit",
        "Kan beter", 
        "Neutraal",
        "Interessant concept",
        "Meer informatie nodig"
      ];
      
      return responses[Math.floor(Math.random() * responses.length)];
    },
    
    // Multiple choice responses  
    multiple: () => {
      if (question.options) {
        return question.options[Math.floor(Math.random() * question.options.length)];
      }
      return "Geen mening";
    }
  };
  
  return responses[question.type]();
};

// Genereer mock analyse resultaten
export const generateMockAnalysis = async (personas, websiteUrl, updateProgress) => {
  const questions = getAllQuestions();
  const results = [];
  
  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    
    // Simuleer vertraging
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update progress
    const progress = ((i + 1) / personas.length) * 100;
    updateProgress(progress);
    
    // Genereer responses voor alle vragen
    const responses = {};
    questions.forEach(question => {
      responses[question.id] = generateMockResponse(persona, question);
    });
    
    results.push({
      persona: {
        naam: persona.naam,
        leeftijd: persona.leeftijd,
        beroep: persona.beroep,
        woonplaats: persona.woonplaats
      },
      responses,
      timestamp: new Date().toISOString(),
      websiteUrl
    });
  }
  
  // Bereken samenvatting statistieken
  const summary = calculateSummaryStats(results, questions);
  
  return {
    results,
    summary,
    totalResponses: results.length,
    completedAt: new Date().toISOString()
  };
};

// Bereken samenvatting statistieken
const calculateSummaryStats = (results, questions) => {
  const scoreQuestions = questions.filter(q => q.type === 'score');
  const textQuestions = questions.filter(q => q.type === 'text');
  
  // Gemiddelde scores per vraag
  const averageScores = scoreQuestions.map(question => {
    const scores = results.map(r => r.responses[question.id]);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return {
      question: question.tekst.substring(0, 20) + '...',
      score: Math.round(average * 10) / 10,
      questionId: question.id
    };
  });
  
  // Eerste indrukken (text responses)
  const firstImpressionQuestion = questions.find(q => 
    q.tekst.includes('eerste indruk') || q.tekst.includes('één woord')
  );
  
  let firstImpressions = [];
  if (firstImpressionQuestion) {
    const impressions = results.map(r => r.responses[firstImpressionQuestion.id]);
    const impressionCounts = {};
    
    impressions.forEach(impression => {
      impressionCounts[impression] = (impressionCounts[impression] || 0) + 1;
    });
    
    firstImpressions = Object.entries(impressionCounts)
      .map(([word, count]) => ({
        word,
        count,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  
  // Top verbeterpunten
  const improvements = [
    {
      title: "Verbeter laadtijden",
      description: `${Math.floor(Math.random() * 30 + 50)}% van de personas vond de website te langzaam`,
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
  
  return {
    averageScores,
    firstImpressions,
    improvements,
    overallScore: averageScores.reduce((sum, item) => sum + item.score, 0) / averageScores.length,
    totalParticipants: results.length,
    positiveResponses: results.filter(r => {
      const scores = scoreQuestions.map(q => r.responses[q.id]);
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return avgScore >= 7;
    }).length
  };
};