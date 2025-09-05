// Vragenlijst data gebaseerd op de PDF
export const questions = {
  advertentieVragen: [
    {
      id: "adv_1",
      tekst: "Hoe duidelijk is de boodschap van deze advertentie?",
      type: "score",
      maxScore: 10
    },
    {
      id: "adv_2", 
      tekst: "Spreekt het design je aan?",
      type: "score",
      maxScore: 10
    },
    {
      id: "adv_3",
      tekst: "Zou je op deze advertentie klikken?",
      type: "score", 
      maxScore: 10
    },
    {
      id: "adv_4",
      tekst: "Wat is je eerste indruk in één woord?",
      type: "text"
    },
    {
      id: "adv_5",
      tekst: "Welke doelgroep denk je dat wordt aangesproken?",
      type: "multiple",
      options: ["Jonge professionals", "Families", "Senioren", "Studenten", "Ondernemers"]
    }
  ],
  
  landingspaginaVragen: [
    {
      id: "lp_1",
      tekst: "Hoe gemakkelijk is de navigatie op deze pagina?",
      type: "score",
      maxScore: 10
    },
    {
      id: "lp_2",
      tekst: "Hoe aantrekkelijk vind je het ontwerp?", 
      type: "score",
      maxScore: 10
    },
    {
      id: "lp_3",
      tekst: "Hoe relevant vind je de content?",
      type: "score",
      maxScore: 10
    },
    {
      id: "lp_4",
      tekst: "Hoe snel laadt de pagina volgens jou?",
      type: "score",
      maxScore: 10
    },
    {
      id: "lp_5",
      tekst: "Hoe goed werkt de pagina op mobiel?",
      type: "score", 
      maxScore: 10
    },
    {
      id: "lp_6",
      tekst: "Zou je een actie ondernemen op deze pagina?",
      type: "score",
      maxScore: 10
    },
    {
      id: "lp_7",
      tekst: "Wat zou je verbeteren aan deze pagina?",
      type: "text"
    }
  ],

  algemeneVragen: [
    {
      id: "alg_1",
      tekst: "Hoe waarschijnlijk is het dat je dit product/deze dienst zou gebruiken?",
      type: "score",
      maxScore: 10
    },
    {
      id: "alg_2", 
      tekst: "Hoe zou je dit aanbevelen aan vrienden/familie?",
      type: "score",
      maxScore: 10
    },
    {
      id: "alg_3",
      tekst: "Wat zijn de belangrijkste voordelen die je ziet?",
      type: "text"
    },
    {
      id: "alg_4",
      tekst: "Wat zijn je grootste zorgen of twijfels?", 
      type: "text"
    },
    {
      id: "alg_5",
      tekst: "Hoe vergelijkt dit met alternatieven die je kent?",
      type: "multiple",
      options: ["Veel beter", "Iets beter", "Gelijk", "Iets slechter", "Veel slechter", "Geen ervaring met alternatieven"]
    }
  ]
};

// Helper functie om alle vragen te krijgen
export const getAllQuestions = () => {
  return [
    ...questions.advertentieVragen,
    ...questions.landingspaginaVragen, 
    ...questions.algemeneVragen
  ];
};

// Helper functie om vragen per categorie te krijgen
export const getQuestionsByCategory = (category) => {
  return questions[category] || [];
};