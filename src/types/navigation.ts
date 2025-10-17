// Types de navigation partagés entre les composants

export type CurrentView = 
  | 'dashboard'
  | 'patients'
  | 'patient-form'
  | 'patient-details'
  | 'feuilles-soins'
  | 'feuille-soins-form'
  | 'factures-semelles'
  | 'facture-semelles-form'
  | 'bordereaux'
  | 'bordereau-form'
  | 'medecins'
  | 'medecin-form'
  | 'actes'
  | 'cleanup-duplicates'
  | 'settings'
  | 'auth'; 