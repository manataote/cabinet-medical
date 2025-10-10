// Types de base pour l'application

export interface Patient {
  id: string;
  numeroFacture: string;
  nom: string;
  prenom: string;
  dn: string; // 7 chiffres (Identifiant CPS)
  dateNaissance: Date;
  adresse: string;
  telephone: string;
  dateCreation?: Date; // Date de création du patient
  notes?: PatientNote[]; // Notes du patient
  assure?: {
    nom: string;
    prenom: string;
    dn: string;
    dateNaissance: Date;
    adresse: string;
    telephone: string;
  };
}

export interface Medecin {
  id: string;
  nom: string;
  prenom: string;
  specialite?: string;
  numeroRPPS?: string;
  identificationPrescripteur: string; // Code d'identification pour les feuilles de soins
  adresse?: string;
  telephone?: string;
  email?: string;
  actif: boolean;
  dateCreation?: Date; // Date de création du médecin
}

// Devise supprimée - Application forcée en Francs Pacifiques (XPF)

export interface Prestation {
  id: string;
  code: string;
  libelle: string;
  tarif: number;
  lettresCles: string[];
  coefficients: number[];
  actif: boolean;
}

export interface Acte {
  id: string;
  patientId: string;
  date: Date;
  lettreCle: string;
  coefficient: number;
  ifd: boolean;
  ik?: number;
  majorationDimanche: boolean;
  majorationNuit: boolean;
  montant: number; // Montant total de l'acte
  // Devise supprimée - Application forcée en XPF
  medecinPrescripteur: string;
  commentaire?: string;
}

// Types séparés pour les actes
export interface ActeSoins {
  id: string;
  code: string;
  libelle: string;
  tarif: number;
  coefficient: number;
  actif: boolean;
}


// Garder ActeTemplate pour la compatibilité temporaire
export interface ActeTemplate {
  id: string;
  lettreCle: string;
  coefficient: number;
  libelle: string;
  tarif: number;
  // Devise supprimée - Application forcée en XPF
  type: 'soins' | 'orthopedique'; // Type d'acte : soins ou orthopédique
  codeLPPR?: string; // Code LPPR pour les actes orthopédiques
  // Champs spécifiques aux actes orthopédiques
  libelleFacture?: string; // Libellé pour l'impression sur la facture
  quantite?: number;
  total?: number;
  partCPS?: number;
  partPatient?: number;
  tarifBaseLPPR?: number;
  tauxApplique?: number;
  regime?: 'maladie' | 'longue-maladie' | 'maternite' | 'arret-travail';
  actif: boolean;
}

export interface Ordonnance {
  id: string;
  numero_ordonnance: string;
  patient_id: string;
  type: 'soins' | 'semelles'; // Type d'ordonnance
  date_ordonnance: Date;
  duree_soins: number; // Durée en mois (pour les soins)
  quantite?: number; // Quantité (pour les semelles, 1 par défaut)
  medecin_prescripteur: string;
  cabinet_id: string;
  contenu: string; // Contenu de l'ordonnance
  fichier_url?: string; // URL du fichier dans Supabase Storage
  nom_fichier?: string; // Nom original du fichier
  type_fichier?: string; // Type MIME du fichier
  taille_fichier?: number; // Taille en bytes
  date_import: Date;
  commentaire?: string;
  created_at?: Date;
  updated_at?: Date;
  // Relations (chargées séparément)
  patient?: {
    nom: string;
    prenom: string;
    dateNaissance?: Date;
  };
  medecin?: {
    nom: string;
    prenom: string;
  };
}

export interface OrdonnanceSemelles {
  id: string;
  patientId: string;
  dateOrdonnance: Date;
  quantite: number; // Quantité (1 par défaut)
  medecinPrescripteurId: string;
  fichier?: string; // URL ou base64 du fichier scanné/importé
  nomFichier?: string; // Nom original du fichier
  typeFichier?: string; // Type MIME du fichier
  tailleFichier?: number; // Taille en bytes
  dateImport: Date;
  commentaire?: string;
}

export interface FeuilleSoins {
  id: string;
  numero_feuille: string;
  date_soins: Date;
  medecin_prescripteur: string; // UUID du médecin
  date_prescription: Date;
  montant_total: number;
  cabinet_id: string;
  patient_id: string; // UUID du patient
  dap?: string; // Dossier d'Accompagnement Personnalisé
  is_parcours_soins: boolean;
  is_longue_maladie: boolean;
  is_atmp: boolean;
  is_maternite: boolean;
  is_urgence: boolean;
  is_autres_derogations: boolean;
  autres_derogations?: string | null; // Nouvelle colonne text
  numero_atmp?: number | null; // Nouvelle colonne int8
  panier_soins?: string;
  rsr?: string;
  created_at?: Date;
  updated_at?: Date;
  // Relations (chargées séparément)
  patient?: {
    nom: string;
    prenom: string;
    dateNaissance?: Date;
  };
  medecin?: {
    nom: string;
    prenom: string;
  };
  // Les actes seront gérés séparément car ils ne sont pas dans cette table
  actes: Acte[];
  // Propriétés de compatibilité pour l'interface existante
  numeroFeuilleSoins: string; // Alias pour numero_feuille
  parcoursSoins: boolean; // Alias pour is_parcours_soins
  medecinPrescripteur: string; // Alias pour medecin_prescripteur
  datePrescription: Date; // Alias pour date_prescription
  conditions: {
    longueMaladie: boolean; // Alias pour is_longue_maladie
    atmp: boolean; // Alias pour is_atmp
    numeroAtmp?: string;
    maternite: boolean; // Alias pour is_maternite
    urgence: boolean; // Alias pour is_urgence
    autresDerogations: boolean; // Alias pour is_autres_derogations
    descriptionAutresDerogations?: string;
  };
  numeroPanierSoins?: string; // Alias pour panier_soins
  montantTotal: number; // Alias pour montant_total
  montantPaye: number; // Pas dans la DB, calculé côté client
  montantTiersPayant: number; // Pas dans la DB, calculé côté client
  modeleUtilise: string; // Pas dans la DB, géré côté client
  assure?: Patient; // Pas dans la DB, géré côté client
  accordPrealable?: string; // Pas dans la DB, géré côté client
  bordereau_id?: string | null; // Référence vers le bordereau (peut être null)
}

export interface ActeOrthopedique {
  id: string;
  libelleInterne: string; // Libellé interne (non imprimé)
  libelleFacture: string; // Libellé pour l'impression sur la facture
  codeLPPR: string;
  quantite: number;
  total: number; // TOTAL
  partCPS: number; // PART CPS
  partPatient: number; // PART PATIENT
  tarifBase: number; // Tarif de base (pour compatibilité)
  tarifBaseLPPR: number; // Tarif de base LPPR
  tauxApplique: number; // 70 ou 100
  regime: 'maladie' | 'longue-maladie' | 'maternite' | 'arret-travail';
  actif: boolean; // Statut actif (pour compatibilité)
}

export interface ArticleSemelles {
  designation: string;
  reference: string;
  pointure: string;
  lateralite: 'G' | 'D' | 'P';
  prixUnitaire: number;
  quantite: number;
  montant: number;
}

export interface FactureSemelles {
  id: string;
  numeroFacture: string;
  patient: Patient;
  dateSoins: Date; // Date des soins (correspond à date_facture en DB)
  medecinPrescripteur?: Medecin; // Médecin prescripteur complet
  datePrescription: Date; // Date de la prescription
  actesOrthopediques: ActeOrthopedique[]; // Actes orthopédiques
  montantTotal: number; // Montant total sans TVA
  
  // Champs pour compatibilité avec la base de données Supabase
  patient_id?: string;
  medecin_id?: string;
  date_facture?: Date; // Alias pour dateSoins
  montant_total?: number; // Alias pour montantTotal
  cabinet_id?: string;
  bordereau_id?: string; // ID du bordereau auquel cette facture est assignée
  created_at?: Date;
  updated_at?: Date;
}

export type TypeBordereau = 
  | 'feuilles-soins'
  | 'rejet-feuilles-soins'
  | 'semelles-orthopediques'
  | 'rejet-semelles-orthopediques';

export interface Bordereau {
  id: string;
  numeroBordereau: string;
  date: Date;
  type: TypeBordereau;
  feuillesSoins: FeuilleSoins[];
  facturesSemelles?: FactureSemelles[]; // Pour les bordereaux de semelles orthopédiques
  montantTotal: number;
  modeleUtilise: string;
  cabinetId: string;
}

export interface ZoneImpression {
  id: string;
  type: 'text' | 'checkbox' | 'table' | 'image' | 'signature';
  x: number;
  y: number;
  width: number;
  height: number;
  style: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    fontStyle: string;
    color: string;
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: string;
    textAlign: 'left' | 'center' | 'right';
    verticalAlign: 'top' | 'middle' | 'bottom';
    rotation?: number;
  };
  dataBinding: string; // Chemin vers la donnée
  conditional?: {
    field: string;
    condition: 'equals' | 'notEquals' | 'contains';
    value: any;
  };
}

export interface ModeleDocument {
  id: string;
  nom: string;
  type: 'feuilleSoins' | 'factureSemelles' | 'bordereau';
  zones: ZoneImpression[];
  version: string;
  dateCreation: Date;
  dateModification: Date;
  actif: boolean;
}

export interface Configuration {
  // Devise supprimée - Application forcée en XPF
  apparence?: {
    echelleAffichage?: number;
    theme?: string;
  };
  calculs: {
    multiplicateurIK: number;
    tarifIFD: number;
    majorationNuit: number;
    majorationDimanche: number;
  };
  parametres?: {
    identificationPraticien?: string;
    auxiliaireMedicalRemplacant: boolean;
    nomCabinet?: string;
    adresse?: string;
    telephone?: string;
    email?: string;
    logo?: string;
    logoMaxWidth?: string;
    logoPosition?: string;
    // Paramètres de facturation pour les semelles
    texteFacturationSemelles?: string; // Texte modifiable pour les informations de facturation
  };
  positionnement?: {
    [key: string]: {
      x: number;
      y: number;
    };
  };
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  priority: 'normal' | 'urgent';
  status: 'pending' | 'completed';
  paramed_id?: string; // ID de l'utilisateur assigné à la tâche
  created_by: string; // ID de l'utilisateur qui a créé la tâche
  completedBy?: string; // ID du médecin qui a terminé (pour compatibilité)
  createdAt: Date;
  completedAt?: Date;
}

export interface PatientNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string; // ID du médecin qui a créé la note
}

export interface AppState {
  patients: Patient[];
  patientsCount: number; // Nombre total de patients (chargé au démarrage sans la liste complète)
  prestations: Prestation[];
  feuillesSoins: FeuilleSoins[];
  facturesSemelles: FactureSemelles[];
  bordereaux: Bordereau[];
  modeles: ModeleDocument[];
  medecins: Medecin[];
  // Devises supprimées - Application forcée en XPF
  actes: Acte[];
  acteTemplates: ActeTemplate[];
  actesSoins: ActeSoins[];
  actesOrthopediques: ActeOrthopedique[];
  ordonnances: Ordonnance[];
  todos: TodoItem[];
  configuration: Configuration;
  selectedPatient?: Patient;
  selectedModele?: ModeleDocument;
  // Informations du cabinet et de l'utilisateur
  cabinetInfo?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  userInfo?: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    cabinet_id: string;
    numero_ident?: string;
    config_calculs?: {
      multiplicateurIK: number;
      tarifIFD: number;
      majorationNuit: number;
      majorationDimanche: number;
    };
    config_formats?: {
      formatDate?: string;
      formatNombre?: string;
    };
    config_positionnements_pdf?: {
      [key: string]: { x: number; y: number };
    };
  };
} 