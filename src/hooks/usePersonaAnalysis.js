import { useReducer } from 'react';

// Initial state
const initialState = {
  // Excel data
  excelFile: null,
  doelgroepen: {},
  availableSheets: [],
  
  // Selection
  selectedDoelgroep: '',
  selectedPersonas: [],
  availablePersonas: [],
  aantalPersonas: 15,
  
  // Input
  websiteUrl: '',
  screenshot: null,
  previewMode: 'none', // 'url', 'screenshot', 'none'
  
  // Analysis
  isAnalyzing: false,
  progress: 0,
  results: null,
  testMode: false,
  
  // UI state
  loading: false,
  error: null
};

// Action types
const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Excel actions
  SET_EXCEL_FILE: 'SET_EXCEL_FILE',
  SET_DOELGROEPEN: 'SET_DOELGROEPEN',
  SET_AVAILABLE_SHEETS: 'SET_AVAILABLE_SHEETS',
  
  // Selection actions
  SET_SELECTED_DOELGROEP: 'SET_SELECTED_DOELGROEP',
  SET_AVAILABLE_PERSONAS: 'SET_AVAILABLE_PERSONAS',
  SET_SELECTED_PERSONAS: 'SET_SELECTED_PERSONAS',
  SET_AANTAL_PERSONAS: 'SET_AANTAL_PERSONAS',
  
  // Input actions
  SET_WEBSITE_URL: 'SET_WEBSITE_URL',
  SET_SCREENSHOT: 'SET_SCREENSHOT',
  SET_PREVIEW_MODE: 'SET_PREVIEW_MODE',
  
  // Analysis actions
  START_ANALYSIS: 'START_ANALYSIS',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  SET_RESULTS: 'SET_RESULTS',
  RESET_ANALYSIS: 'RESET_ANALYSIS',
  SET_TEST_MODE: 'SET_TEST_MODE'
};

// Reducer
function personaAnalysisReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
      
    case ACTION_TYPES.CLEAR_ERROR:
      return { ...state, error: null };
      
    case ACTION_TYPES.SET_EXCEL_FILE:
      return { ...state, excelFile: action.payload };
      
    case ACTION_TYPES.SET_DOELGROEPEN:
      return { ...state, doelgroepen: action.payload };
      
    case ACTION_TYPES.SET_AVAILABLE_SHEETS:
      return { ...state, availableSheets: action.payload };
      
    case ACTION_TYPES.SET_SELECTED_DOELGROEP:
      return { 
        ...state, 
        selectedDoelgroep: action.payload,
        selectedPersonas: [],
        availablePersonas: state.doelgroepen[action.payload] || []
      };
      
    case ACTION_TYPES.SET_AVAILABLE_PERSONAS:
      return { ...state, availablePersonas: action.payload };
      
    case ACTION_TYPES.SET_SELECTED_PERSONAS:
      return { ...state, selectedPersonas: action.payload };
      
    case ACTION_TYPES.SET_AANTAL_PERSONAS:
      return { ...state, aantalPersonas: action.payload };
      
    case ACTION_TYPES.SET_WEBSITE_URL:
      return { 
        ...state, 
        websiteUrl: action.payload,
        previewMode: action.payload ? 'url' : 'none'
      };
      
    case ACTION_TYPES.SET_SCREENSHOT:
      return { 
        ...state, 
        screenshot: action.payload,
        previewMode: action.payload ? 'screenshot' : 'none'
      };
      
    case ACTION_TYPES.SET_PREVIEW_MODE:
      return { ...state, previewMode: action.payload };
      
    case ACTION_TYPES.START_ANALYSIS:
      return { 
        ...state, 
        isAnalyzing: true, 
        progress: 0, 
        results: null 
      };
      
    case ACTION_TYPES.UPDATE_PROGRESS:
      return { ...state, progress: action.payload };
      
    case ACTION_TYPES.SET_RESULTS:
      return { 
        ...state, 
        results: action.payload, 
        isAnalyzing: false, 
        progress: 100 
      };
      
    case ACTION_TYPES.RESET_ANALYSIS:
      return { 
        ...state, 
        isAnalyzing: false, 
        progress: 0, 
        results: null 
      };
      
    case ACTION_TYPES.SET_TEST_MODE:
      return { ...state, testMode: action.payload };
      
    default:
      return state;
  }
}

// Hook
export function usePersonaAnalysis() {
  const [state, dispatch] = useReducer(personaAnalysisReducer, initialState);
  
  const actions = {
    setLoading: (loading) => 
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: loading }),
      
    setError: (error) => 
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error }),
      
    clearError: () => 
      dispatch({ type: ACTION_TYPES.CLEAR_ERROR }),
      
    setExcelFile: (file) => 
      dispatch({ type: ACTION_TYPES.SET_EXCEL_FILE, payload: file }),
      
    setDoelgroepen: (doelgroepen) => 
      dispatch({ type: ACTION_TYPES.SET_DOELGROEPEN, payload: doelgroepen }),
      
    setAvailableSheets: (sheets) => 
      dispatch({ type: ACTION_TYPES.SET_AVAILABLE_SHEETS, payload: sheets }),
      
    setSelectedDoelgroep: (doelgroep) => 
      dispatch({ type: ACTION_TYPES.SET_SELECTED_DOELGROEP, payload: doelgroep }),
      
    setAvailablePersonas: (personas) => 
      dispatch({ type: ACTION_TYPES.SET_AVAILABLE_PERSONAS, payload: personas }),
      
    setSelectedPersonas: (personas) => 
      dispatch({ type: ACTION_TYPES.SET_SELECTED_PERSONAS, payload: personas }),
      
    setAantalPersonas: (aantal) => 
      dispatch({ type: ACTION_TYPES.SET_AANTAL_PERSONAS, payload: aantal }),
      
    setWebsiteUrl: (url) => 
      dispatch({ type: ACTION_TYPES.SET_WEBSITE_URL, payload: url }),
      
    setScreenshot: (screenshot) => 
      dispatch({ type: ACTION_TYPES.SET_SCREENSHOT, payload: screenshot }),
      
    setPreviewMode: (mode) => 
      dispatch({ type: ACTION_TYPES.SET_PREVIEW_MODE, payload: mode }),
      
    startAnalysis: () => 
      dispatch({ type: ACTION_TYPES.START_ANALYSIS }),
      
    updateProgress: (progress) => 
      dispatch({ type: ACTION_TYPES.UPDATE_PROGRESS, payload: progress }),
      
    setResults: (results) => 
      dispatch({ type: ACTION_TYPES.SET_RESULTS, payload: results }),
      
    resetAnalysis: () => 
      dispatch({ type: ACTION_TYPES.RESET_ANALYSIS }),
      
    setTestMode: (testMode) => 
      dispatch({ type: ACTION_TYPES.SET_TEST_MODE, payload: testMode })
  };
  
  return { state, actions };
}