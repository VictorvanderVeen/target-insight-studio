// Professionele vragenlijst gebaseerd op CRO beste praktijken
export const questions = {
  // A. Advertentie analyse (7 vragen)
  advertentieVragen: [
    {
      id: "adv_1",
      tekst: "Eerste indruk: Beschrijf in precies 3 woorden wat je eerste indruk is",
      type: "text",
      expectedWords: 3
    },
    {
      id: "adv_2",
      tekst: "Wat is dit en voor wie? Leg in eigen woorden uit wat dit is en voor welke doelgroep",
      type: "text"
    },
    {
      id: "adv_3",
      tekst: "Relevantie voor jou op schaal 1-7. Waarom dit cijfer? Welke doelgroep raakt dit vooral?",
      type: "score",
      maxScore: 7
    },
    {
      id: "adv_4", 
      tekst: "Kernbelofte & bewijs: Wat wordt er beloofd? Geef geloofwaardigheid een cijfer 1-7. Wat mist er als bewijs?",
      type: "score",
      maxScore: 7
    },
    {
      id: "adv_5",
      tekst: "Emotie & nieuwsgierigheid: Wat voel je hierbij? Welke emotie roept dit op?",
      type: "text"
    },
    {
      id: "adv_6",
      tekst: "Klikintentie: Geef een cijfer 1-7. Wat zou +2 punten geven om te klikken?",
      type: "score", 
      maxScore: 7
    },
    {
      id: "adv_7",
      tekst: "CTA-verwachting: Wat denk je dat er gebeurt na de klik? Geef CTA specificiteit een cijfer 1-7. Suggestie voor betere CTA-tekst?",
      type: "score",
      maxScore: 7
    }
  ],
  
  // B. Landingspagina analyse (8 vragen)
  landingspaginaVragen: [
    {
      id: "lp_1",
      tekst: "5-seconden test: Wat is dit? Voor wie? Wat kan ik hier doen? (Eerste indruk zonder lang kijken)",
      type: "text"
    },
    {
      id: "lp_2",
      tekst: "Aansluiting met advertentie ('scent'): Cijfer 1-7. Wat matcht wel/niet met de advertentie?",
      type: "score",
      maxScore: 7
    },
    {
      id: "lp_3",
      tekst: "Waardepropositie hoofdboodschap: Cijfer 1-7. Hoe duidelijk is de kernboodschap? (1-7)",
      type: "score", 
      maxScore: 7
    },
    {
      id: "lp_4",
      tekst: "Wat mis je om te beslissen? (denk aan impact, kosten, tijd, privacy, bewijs)",
      type: "text"
    },
    {
      id: "lp_5",
      tekst: "Vertrouwen: Wat geeft vertrouwen? Wat voelt 'te marketing'? Geef vertrouwen een cijfer 1-7",
      type: "score",
      maxScore: 7
    },
    {
      id: "lp_6",
      tekst: "Formulier & frictie: Storende velden/twijfels? Inspanning cijfer 1-7. Wat kan weg of korter?",
      type: "score",
      maxScore: 7
    },
    {
      id: "lp_7", 
      tekst: "CTA op pagina: Begrijp je wat er gebeurt? Is hij zichtbaar? Sterkte CTA cijfer 1-7",
      type: "score",
      maxScore: 7
    },
    {
      id: "lp_8",
      tekst: "Mobiel: Leesbaarheid & aanklikbaarheid - wat belemmert je op mobiel?",
      type: "text"
    }
  ],

  // C. Van advertentie → pagina (3 vragen)
  advertentiePaginaVragen: [
    {
      id: "ap_1", 
      tekst: "Lost de pagina de belofte in? Cijfer 1-7. Wat is het grootste gemis?",
      type: "score",
      maxScore: 7
    },
    {
      id: "ap_2",
      tekst: "Verwachting vs realiteit: Wat had je willen zien of kunnen doen?",
      type: "text"
    },
    {
      id: "ap_3",
      tekst: "Eén wijziging met de grootste impact op conversie - wat zou dat zijn?",
      type: "text"
    }
  ],

  // Mini-scorekaart criteria (8 scores)
  scorekaartvragen: [
    {
      id: "score_1",
      tekst: "Duidelijkheid boodschap (advertentie/pagina)",
      type: "score",
      maxScore: 7
    },
    {
      id: "score_2", 
      tekst: "Relevantie voor beoogde doelgroep",
      type: "score",
      maxScore: 7
    },
    {
      id: "score_3",
      tekst: "Geloofwaardigheid / bewijs",
      type: "score", 
      maxScore: 7
    },
    {
      id: "score_4",
      tekst: "Motivatie / klikintentie",
      type: "score",
      maxScore: 7
    },
    {
      id: "score_5",
      tekst: "Frictie (1=veel frictie, 7=geen frictie)",
      type: "score",
      maxScore: 7
    },
    {
      id: "score_6",
      tekst: "Vertrouwen",
      type: "score", 
      maxScore: 7
    },
    {
      id: "score_7",
      tekst: "Scent advertentie → pagina (aansluiting)",
      type: "score",
      maxScore: 7
    },
    {
      id: "score_8",
      tekst: "Likelihood to act nu (waarschijnlijkheid om actie te ondernemen)",
      type: "score",
      maxScore: 7
    }
  ]
};

// Helper functie om alle vragen te krijgen
export const getAllQuestions = () => {
  return [
    ...questions.advertentieVragen,
    ...questions.landingspaginaVragen, 
    ...questions.advertentiePaginaVragen,
    ...questions.scorekaartvragen
  ];
};

// Helper functie om vragen per categorie te krijgen
export const getQuestionsByCategory = (category) => {
  return questions[category] || [];
};

// Helper functie om het totaal aantal vragen te krijgen
export const getTotalQuestionCount = () => {
  return getAllQuestions().length;
};