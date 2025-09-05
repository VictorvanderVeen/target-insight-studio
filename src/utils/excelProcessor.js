import * as XLSX from 'xlsx';

// Parse Excel file en extract persona data
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const doelgroepen = {};
        const availableSheets = [];
        
        // Process elke sheet
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length > 0) {
            availableSheets.push(sheetName);
            
            // Convert data naar persona format
            const personas = jsonData.map((row, index) => ({
              id: `${sheetName}_${index}`,
              naam: row.naam || row.Naam || row.Name || `Persona ${index + 1}`,
              leeftijd: parseInt(row.leeftijd || row.Leeftijd || row.Age) || 30,
              woonplaats: row.woonplaats || row.Woonplaats || row.Location || 'Onbekend',
              beroep: row.beroep || row.Beroep || row.Job || 'Onbekend',
              hobbies: row.hobbies || row.Hobbies || row.Interests || '',
              motivatie: row.motivatie || row.Motivatie || row.Motivation || '',
              kanalen: row.kanalen || row.Kanalen || row.Channels || '',
              // Extra velden die mogelijk in Excel staan
              ...Object.keys(row).reduce((acc, key) => {
                if (!['naam', 'leeftijd', 'woonplaats', 'beroep', 'hobbies', 'motivatie', 'kanalen'].includes(key.toLowerCase())) {
                  acc[key] = row[key];
                }
                return acc;
              }, {})
            }));
            
            doelgroepen[sheetName] = personas;
          }
        });
        
        resolve({ doelgroepen, availableSheets });
      } catch (error) {
        reject(new Error(`Fout bij het lezen van Excel bestand: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Kon bestand niet lezen'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Stratified sampling functie
export const stratifiedSampling = (personas, targetCount) => {
  if (!personas || personas.length === 0) return [];
  if (personas.length <= targetCount) return personas;
  
  // Groepeer personas per leeftijdsgroep
  const ageGroups = {
    young: personas.filter(p => p.leeftijd < 35),
    middle: personas.filter(p => p.leeftijd >= 35 && p.leeftijd <= 55),
    senior: personas.filter(p => p.leeftijd > 55)
  };
  
  // Bereken proporties
  const totalPersonas = personas.length;
  const proportions = {
    young: ageGroups.young.length / totalPersonas,
    middle: ageGroups.middle.length / totalPersonas,
    senior: ageGroups.senior.length / totalPersonas
  };
  
  // Bereken aantal per groep
  let counts = {
    young: Math.round(proportions.young * targetCount),
    middle: Math.round(proportions.middle * targetCount),
    senior: Math.round(proportions.senior * targetCount)
  };
  
  // Zorg dat totaal klopt
  const totalCount = counts.young + counts.middle + counts.senior;
  if (totalCount !== targetCount) {
    const diff = targetCount - totalCount;
    // Voeg verschil toe aan grootste groep
    const largestGroup = Object.keys(counts).reduce((a, b) => 
      counts[a] > counts[b] ? a : b
    );
    counts[largestGroup] += diff;
  }
  
  // Selecteer random personas uit elke groep
  const selected = [];
  
  Object.keys(ageGroups).forEach(group => {
    const groupPersonas = ageGroups[group];
    const needed = Math.min(counts[group], groupPersonas.length);
    
    if (needed > 0) {
      const shuffled = [...groupPersonas].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, needed));
    }
  });
  
  // Als we nog niet genoeg hebben, vul aan met willekeurige personas
  if (selected.length < targetCount) {
    const remaining = personas.filter(p => !selected.find(s => s.id === p.id));
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    const needed = targetCount - selected.length;
    selected.push(...shuffled.slice(0, needed));
  }
  
  return selected.slice(0, targetCount);
};

// Valideer of Excel bestand geldig is
export const validateExcelFile = (file) => {
  if (!file) {
    throw new Error('Geen bestand geselecteerd');
  }
  
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Alleen Excel bestanden (.xlsx, .xls) zijn toegestaan');
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('Bestand is te groot (max 10MB)');
  }
  
  return true;
};

// Default doelgroepen als geen Excel wordt geüpload
export const defaultDoelgroepen = {
  "Christelijk buiten randstad": [
    {
      id: "chr_1",
      naam: "Jan de Vries",
      leeftijd: 45,
      woonplaats: "Dokkum (Friesland)",
      beroep: "Melkveehouder",
      hobbies: "Bestuurslid lokale kerk, vissen",
      motivatie: "Ieder mens heeft talent gekregen van God en moet dat gebruiken",
      kanalen: "Kerkblad, lokale krant, radio"
    },
    {
      id: "chr_2", 
      naam: "Marieke Bakker",
      leeftijd: 38,
      woonplaats: "Staphorst",
      beroep: "Onderwijzeres",
      hobbies: "Koor, tuinieren, lezen",
      motivatie: "Kinderen een goede basis meegeven in het leven",
      kanalen: "Christelijke tijdschriften, sociale media (Facebook)"
    }
  ],
  "Volkskrant lezers": [
    {
      id: "vk_1",
      naam: "Sophie Hendrikse", 
      leeftijd: 42,
      woonplaats: "Amsterdam",
      beroep: "Journalist",
      hobbies: "Theater, moderne kunst, politiek",
      motivatie: "Goed geïnformeerd blijven over maatschappelijke ontwikkelingen",
      kanalen: "Volkskrant, NRC, Twitter, podcasts"
    }
  ],
  "Vluchtelingen hoogopgeleid": [
    {
      id: "vl_1",
      naam: "Ahmad Hassan",
      leeftijd: 35,
      woonplaats: "Utrecht", 
      beroep: "Software engineer (was arts in Syrië)",
      hobbies: "Programmeren, voetbal, Nederlandse les",
      motivatie: "Nieuwe kansen pakken en bijdragen aan Nederlandse samenleving",
      kanalen: "LinkedIn, internationale nieuwssites, integratiecursussen"
    }
  ],
  "Professionals": [
    {
      id: "prof_1",
      naam: "Linda van der Berg",
      leeftijd: 32,
      woonplaats: "Rotterdam",
      beroep: "Marketing manager",
      hobbies: "Fitness, reizen, netwerken",
      motivatie: "Carrière uitbouwen en work-life balance vinden", 
      kanalen: "LinkedIn, Instagram, vak tijdschriften"
    }
  ]
};