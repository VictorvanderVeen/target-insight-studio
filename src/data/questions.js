// EXACTE Focusgroep vragenlijst
export const questions = {
  // A. Advertentie analyse (7 vragen)
  advertentieVragen: [
    { 
      id: 'A1', 
      tekst: 'Eerste indruk (3 woorden)', 
      type: 'woorden',
      expectedWords: 3 
    },
    { 
      id: 'A2', 
      tekst: 'Wat is dit en voor wie? (in eigen woorden)', 
      type: 'text' 
    },
    { 
      id: 'A3', 
      tekst: 'Relevantie voor jou (1-7). Waarom? Welke doelgroep raakt dit vooral?', 
      type: 'score',
      maxScore: 7 
    },
    { 
      id: 'A4', 
      tekst: 'Wat wordt beloofd? Geloofwaardigheid (1-7). Wat mist als bewijs?', 
      type: 'score',
      maxScore: 7 
    },
    { 
      id: 'A5', 
      tekst: 'Emotie & nieuwsgierigheid: wat voel je hierbij?', 
      type: 'text' 
    },
    { 
      id: 'A6', 
      tekst: 'Klikintentie (1-7). Wat zou +2 punten geven?', 
      type: 'score',
      maxScore: 7 
    },
    { 
      id: 'A7', 
      tekst: 'CTA-verwachting: wat denk je dat er gebeurt na de klik? Specificiteit CTA (1-7)', 
      type: 'mixed',
      maxScore: 7 
    }
  ],
  
  // B. Landingspagina analyse (8 vragen)
  landingspaginaVragen: [
    { 
      id: 'B1', 
      tekst: '5-seconden test: Wat is dit? Voor wie? Wat kan ik hier doen?', 
      type: 'text' 
    },
    { 
      id: 'B2', 
      tekst: 'Aansluiting met advertentie ("scent") (1-7). Wat matcht/niet?', 
      type: 'score',
      maxScore: 7 
    },
    { 
      id: 'B3', 
      tekst: 'Waardepropositie (hoofdboodschap). Duidelijkheid (1-7)', 
      type: 'score',
      maxScore: 7 
    },
    { 
      id: 'B4', 
      tekst: 'Wat mis je om te beslissen? (impact, kosten, tijd, privacy, bewijs)', 
      type: 'text' 
    },
    { 
      id: 'B5', 
      tekst: 'Vertrouwen: wat geeft vertrouwen, wat voelt "te marketing"? Vertrouwen (1-7)', 
      type: 'score',
      maxScore: 7 
    },
    { 
      id: 'B6', 
      tekst: 'Formulier & frictie: storende velden/twijfels. Inspanning (1-7). Wat kan weg/korter?', 
      type: 'score',
      maxScore: 7 
    },
    { 
      id: 'B7', 
      tekst: 'CTA op pagina: begrijp je wat er gebeurt? Is hij zichtbaar? Sterkte CTA (1-7)', 
      type: 'score',
      maxScore: 7 
    },
    { 
      id: 'B8', 
      tekst: 'Mobiel: leesbaarheid & aanklikbaarheid – wat belemmert je?', 
      type: 'text' 
    }
  ],

  // C. Combinatie vragen (3 vragen)
  combinatieVragen: [
    { 
      id: 'C1', 
      tekst: 'Lost de pagina de belofte in? (1-7). Grootste gemis?', 
      type: 'score',
      maxScore: 7 
    },
    { 
      id: 'C2', 
      tekst: 'Verwachting: wat had je hier willen zien/doen?', 
      type: 'text' 
    },
    { 
      id: 'C3', 
      tekst: 'Eén wijziging met de grootste + op conversie', 
      type: 'text' 
    }
  ],

  // Mini-scorekaart criteria (8 scores)  
  scoreCriteria: [
    'Duidelijkheid boodschap',
    'Relevantie voor doelgroep', 
    'Geloofwaardigheid/bewijs',
    'Motivatie/klikintentie',
    'Frictie (lager = beter)',
    'Vertrouwen',
    'Scent ad → page',
    'Likelihood to act'
  ]
};

// Analysetype functies
export const getQuestionsByAnalysisType = (analysisType) => {
  switch (analysisType) {
    case 'advertentie':
      return questions.advertentieVragen;
    case 'landingspagina': 
      return questions.landingspaginaVragen;
    case 'complete':
      return [...questions.advertentieVragen, ...questions.landingspaginaVragen, ...questions.combinatieVragen];
    default:
      return questions.advertentieVragen;
  }
};

// Helper functie om alle vragen te krijgen (voor backwards compatibility)
export const getAllQuestions = () => {
  return [...questions.advertentieVragen, ...questions.landingspaginaVragen, ...questions.combinatieVragen];
};

// Helper functie om vragen per categorie te krijgen
export const getQuestionsByCategory = (category) => {
  return questions[category] || [];
};

// Helper functie om het totaal aantal vragen te krijgen per analysetype
export const getTotalQuestionCount = (analysisType = 'complete') => {
  return getQuestionsByAnalysisType(analysisType).length;
};