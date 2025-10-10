import { 
  Patient, 
  Medecin, 
  // Devise supprimée - Application forcée en XPF 
  Prestation, 
  Acte, 
  ActeTemplate, 
  FeuilleSoins, 
  FactureSemelles, 
  Bordereau, 
  ModeleDocument, 
  Ordonnance, 
  TodoItem,
  Configuration,
  AppState 
} from '../types';

const STORAGE_KEYS = {
  PATIENTS: 'cabinet_medical_patients',
  PRESTATIONS: 'cabinet_medical_prestations',
  FEUILLES_SOINS: 'cabinet_medical_feuilles_soins',
  FACTURES_SEMELLES: 'cabinet_medical_factures_semelles',
  BORDEREAUX: 'cabinet_medical_bordereaux',
  MODELES: 'cabinet_medical_modeles',
  MEDECINS: 'cabinet_medical_medecins',
  // DEVISES supprimées - Application forcée en XPF
  ACTES: 'cabinet_medical_actes',
  ACTE_TEMPLATES: 'cabinet_medical_acte_templates',
  ACTES_SOINS: 'cabinet_medical_actes_soins',
  ACTES_ORTHOPEDIQUES: 'cabinet_medical_actes_orthopediques',
  ORDONNANCES: 'cabinet_medical_ordonnances',
  TODOS: 'cabinet_medical_todos',
  CONFIGURATION: 'cabinet_medical_configuration',
} as const;

export class StorageManager {
  // Gestion des patients
  static getPatients(): Patient[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
      return [];
    }
  }

  static savePatients(patients: Patient[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des patients:', error);
    }
  }

  static addPatient(patient: Patient): void {
    const patients = this.getPatients();
    patients.push(patient);
    this.savePatients(patients);
  }

  static updatePatient(patient: Patient): void {
    const patients = this.getPatients();
    const index = patients.findIndex(p => p.id === patient.id);
    if (index !== -1) {
      patients[index] = patient;
      this.savePatients(patients);
    }
  }

  static deletePatient(patientId: string): void {
    const patients = this.getPatients();
    const filteredPatients = patients.filter(p => p.id !== patientId);
    this.savePatients(filteredPatients);
  }

  // Gestion des prestations
  static getPrestations(): Prestation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRESTATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des prestations:', error);
      return [];
    }
  }

  static savePrestations(prestations: Prestation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESTATIONS, JSON.stringify(prestations));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des prestations:', error);
    }
  }

  // Gestion des feuilles de soins
  static getFeuillesSoins(): FeuilleSoins[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEUILLES_SOINS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des feuilles de soins:', error);
      return [];
    }
  }

  static saveFeuillesSoins(feuillesSoins: FeuilleSoins[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FEUILLES_SOINS, JSON.stringify(feuillesSoins));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des feuilles de soins:', error);
    }
  }

  // Gestion des factures semelles
  static getFacturesSemelles(): FactureSemelles[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FACTURES_SEMELLES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des factures semelles:', error);
      return [];
    }
  }

  static saveFacturesSemelles(facturesSemelles: FactureSemelles[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FACTURES_SEMELLES, JSON.stringify(facturesSemelles));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des factures semelles:', error);
    }
  }

  // Gestion des bordereaux
  static getBordereaux(): Bordereau[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BORDEREAUX);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des bordereaux:', error);
      return [];
    }
  }

  static saveBordereaux(bordereaux: Bordereau[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BORDEREAUX, JSON.stringify(bordereaux));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des bordereaux:', error);
    }
  }

  // Gestion des modèles
  static getModeles(): ModeleDocument[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MODELES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles:', error);
      return [];
    }
  }

  static saveModeles(modeles: ModeleDocument[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MODELES, JSON.stringify(modeles));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des modèles:', error);
    }
  }

  // Gestion des médecins
  static getMedecins(): Medecin[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEDECINS);
      return data ? JSON.parse(data) : this.getDefaultMedecins();
    } catch (error) {
      console.error('Erreur lors de la récupération des médecins:', error);
      return this.getDefaultMedecins();
    }
  }

  static saveMedecins(medecins: Medecin[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDECINS, JSON.stringify(medecins));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des médecins:', error);
    }
  }

  // Devises supprimées - Application forcée en XPF

  // Gestion des actes
  static getActes(): Acte[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des actes:', error);
      return [];
    }
  }

  static saveActes(actes: Acte[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTES, JSON.stringify(actes));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des actes:', error);
    }
  }

  // Gestion des modèles d'actes
  static getActeTemplates(): ActeTemplate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTE_TEMPLATES);
      return data ? JSON.parse(data) : this.getDefaultActeTemplates();
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles d\'actes:', error);
      return this.getDefaultActeTemplates();
    }
  }

  static saveActeTemplates(templates: ActeTemplate[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTE_TEMPLATES, JSON.stringify(templates));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des modèles d\'actes:', error);
    }
  }

  // Gestion des actes de soins
  static getActesSoins(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTES_SOINS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des actes de soins:', error);
      return [];
    }
  }

  static saveActesSoins(actes: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTES_SOINS, JSON.stringify(actes));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des actes de soins:', error);
    }
  }

  // Gestion des actes orthopédiques
  static getActesOrthopediques(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTES_ORTHOPEDIQUES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des actes orthopédiques:', error);
      return [];
    }
  }

  static saveActesOrthopediques(actes: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTES_ORTHOPEDIQUES, JSON.stringify(actes));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des actes orthopédiques:', error);
    }
  }

  // Gestion des ordonnances
  static getOrdonnances(): Ordonnance[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDONNANCES);
      if (!data) return [];
      
      const ordonnances = JSON.parse(data);
      // Reconvertir les dates de chaînes en objets Date avec validation
      return ordonnances.map((ord: any) => {
        // Gérer les cas où dateOrdonnance est manquante ou invalide
        let dateOrdonnance: Date;
        if (!ord.dateOrdonnance) {
          console.warn(`Date ordonnance manquante pour l'ordonnance ${ord.id}, utilisation de la date actuelle`);
          dateOrdonnance = new Date();
        } else {
          dateOrdonnance = new Date(ord.dateOrdonnance);
          if (isNaN(dateOrdonnance.getTime())) {
            console.warn(`Date ordonnance invalide pour l'ordonnance ${ord.id}:`, ord.dateOrdonnance, 'utilisation de la date actuelle');
            dateOrdonnance = new Date();
          }
        }
        
        // Gérer les cas où dateImport est manquante ou invalide
        let dateImport: Date;
        if (!ord.dateImport) {
          console.warn(`Date import manquante pour l'ordonnance ${ord.id}, utilisation de la date actuelle`);
          dateImport = new Date();
        } else {
          dateImport = new Date(ord.dateImport);
          if (isNaN(dateImport.getTime())) {
            console.warn(`Date import invalide pour l'ordonnance ${ord.id}:`, ord.dateImport, 'utilisation de la date actuelle');
            dateImport = new Date();
          }
        }
        
        return {
          ...ord,
          dateOrdonnance,
          dateImport
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des ordonnances:', error);
      return [];
    }
  }

  static saveOrdonnances(ordonnances: Ordonnance[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDONNANCES, JSON.stringify(ordonnances));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des ordonnances:', error);
    }
  }

  static deleteOrdonnance(ordonnanceId: string): void {
    const ordonnances = this.getOrdonnances();
    const filteredOrdonnances = ordonnances.filter(o => o.id !== ordonnanceId);
    this.saveOrdonnances(filteredOrdonnances);
  }

  // Gestion des todos
  static getTodos(): TodoItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TODOS);
      if (!data) return [];
      
      const todos = JSON.parse(data);
      // Reconvertir les dates de chaînes en objets Date avec validation
      return todos.map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt),
        completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des todos:', error);
      return [];
    }
  }

  static saveTodos(todos: TodoItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des todos:', error);
    }
  }

  static addTodo(todo: TodoItem): void {
    const todos = this.getTodos();
    todos.push(todo);
    this.saveTodos(todos);
  }

  static updateTodo(todoId: string, updates: Partial<TodoItem>): void {
    const todos = this.getTodos();
    const index = todos.findIndex(t => t.id === todoId);
    if (index !== -1) {
      todos[index] = { ...todos[index], ...updates };
      this.saveTodos(todos);
    }
  }

  static deleteTodo(todoId: string): void {
    const todos = this.getTodos();
    const filteredTodos = todos.filter(t => t.id !== todoId);
    this.saveTodos(filteredTodos);
  }

  // Sauvegarde complète de l'état
  static saveAppState(state: Partial<AppState>): void {
    if (state.patients) this.savePatients(state.patients);
    if (state.prestations) this.savePrestations(state.prestations);
    if (state.feuillesSoins) this.saveFeuillesSoins(state.feuillesSoins);
    if (state.facturesSemelles) this.saveFacturesSemelles(state.facturesSemelles);
    if (state.bordereaux) this.saveBordereaux(state.bordereaux);
    if (state.modeles) this.saveModeles(state.modeles);
    if (state.medecins) this.saveMedecins(state.medecins);
    // Devises supprimées - Application forcée en XPF
    if (state.actes) this.saveActes(state.actes);
    if (state.acteTemplates) this.saveActeTemplates(state.acteTemplates);
    if (state.actesSoins) this.saveActesSoins(state.actesSoins);
    if (state.actesOrthopediques) this.saveActesOrthopediques(state.actesOrthopediques);
    if (state.ordonnances) this.saveOrdonnances(state.ordonnances);
    if (state.todos) this.saveTodos(state.todos);
  }

  // Récupération complète de l'état
  static getAppState(): AppState {
    const patients = this.getPatients();
    return {
      patients: patients,
      patientsCount: patients.length, // Calculer le count depuis la liste en localStorage
      prestations: this.getPrestations(),
      feuillesSoins: this.getFeuillesSoins(),
      facturesSemelles: this.getFacturesSemelles(),
      bordereaux: this.getBordereaux(),
      modeles: this.getModeles(),
      medecins: this.getMedecins(),
      // devises supprimées - Application forcée en XPF
      actes: this.getActes(),
      acteTemplates: this.getActeTemplates(),
      actesSoins: this.getActesSoins(),
      actesOrthopediques: this.getActesOrthopediques(),
      ordonnances: this.getOrdonnances(),
      todos: this.getTodos(),
      configuration: {
        // Devise supprimée - Application forcée en XPF
        calculs: {
          multiplicateurIK: 45,
          tarifIFD: 350,
          majorationNuit: 0.0,
          majorationDimanche: 0.0
        },
        parametres: {
          identificationPraticien: '',
          auxiliaireMedicalRemplacant: false
        }
      },
    };
  }

  // Configuration
  static getConfiguration(): Configuration {
    const config = localStorage.getItem('configuration');
    if (config) {
      try {
        const parsedConfig = JSON.parse(config);
        // S'assurer que la structure est compatible avec la nouvelle interface
        return {
          // devise supprimée - Application forcée en XPF
          calculs: parsedConfig.calculs || {
            multiplicateurIK: 0.35,
            tarifIFD: 2.0,
            majorationNuit: 0.0,
            majorationDimanche: 0.0
          },
          parametres: {
            identificationPraticien: '',
            auxiliaireMedicalRemplacant: false,
            nomCabinet: '',
            adresse: '',
            telephone: '',
            email: '',
            logo: '',
            logoMaxWidth: '200',
            logoPosition: 'top-left'
          },
          positionnement: parsedConfig.positionnement || {
            // Informations Patient
            numeroFeuilleSoins: { x: 150, y: 30 },
            nomPatient: { x: 20, y: 40 },
            prenomPatient: { x: 120, y: 40 },
            dnPatient: { x: 20, y: 45 },
            dateNaissancePatient: { x: 150, y: 45 },
            adressePatient: { x: 40, y: 75 },
            
            // Informations Assuré
            nomAssure: { x: 20, y: 57 },
            prenomAssure: { x: 120, y: 57 },
            dnAssure: { x: 20, y: 62 },
            dateNaissanceAssure: { x: 150, y: 62 },
            
            // Auxiliaire Médical
            identificationPraticien: { x: 90, y: 90 },
            auxiliaireRemplacant: { x: 85, y: 93 },
            
            // Conditions Spéciales
            parcoursSoins: { x: 30, y: 110 },
            accordPrealable: { x: 85, y: 105 },
            identificationPrescripteur: { x: 55, y: 115 },
            datePrescription: { x: 110, y: 115 },
            longueMaladie: { x: 10, y: 115 },
            atMp: { x: 38, y: 125 },
            maternite: { x: 110, y: 125 },
            autresDerogations: { x: 130, y: 125 },
            urgence: { x: 10, y: 132 },
            panierSoins: { x: 60, y: 132 },
            rsr: { x: 120, y: 132 },
            
            // Tableau des Actes
            tableauActes: { x: 20, y: 140 },
            
            // Totaux
            montantTotal: { x: 90, y: 240 },
            montantPaye: { x: 70, y: 270 },
            tiersPayant: { x: 110, y: 270 }
          }
        };
      } catch (error) {
        console.error('Erreur lors du parsing de la configuration:', error);
      }
    }
    
    return this.getDefaultConfiguration();
  }

  static saveConfiguration(configuration: any): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIGURATION, JSON.stringify(configuration));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
    }
  }

  // Devises supprimées - Application forcée en XPF

  private static getDefaultActeTemplates(): ActeTemplate[] {
    return [
      {
        id: 'template_1',
        lettreCle: 'C1',
        coefficient: 1,
        libelle: 'Consultation simple',
        tarif: 2983.25,
        // devise supprimée - Application forcée en XPF
        type: 'soins',
        actif: true,
      },
      {
        id: 'template_2',
        lettreCle: 'C2',
        coefficient: 2,
        libelle: 'Consultation complexe',
        tarif: 2983.25,
        // devise supprimée - Application forcée en XPF
        type: 'soins',
        actif: true,
      },
      {
        id: 'template_3',
        lettreCle: 'BIL',
        coefficient: 1.5,
        libelle: 'Bilan soins',
        tarif: 3579.90,
        // devise supprimée - Application forcée en XPF
        type: 'soins',
        actif: true,
      },
      {
        id: 'template_4',
        lettreCle: 'K1',
        coefficient: 1,
        libelle: 'Acte technique simple',
        tarif: 4176.55,
        // devise supprimée - Application forcée en XPF
        type: 'soins',
        actif: true,
      },
      {
        id: 'template_5',
        lettreCle: 'K2',
        coefficient: 2,
        libelle: 'Acte technique complexe',
        tarif: 4176.55,
        // devise supprimée - Application forcée en XPF
        type: 'soins',
        actif: true,
      },
      {
        id: 'template_6',
        lettreCle: 'SOI',
        coefficient: 1,
        libelle: 'Soins infirmiers',
        tarif: 2386.60,
        // devise supprimée - Application forcée en XPF
        type: 'soins',
        actif: true,
      },
    ];
  }

  private static getDefaultMedecins(): Medecin[] {
    return [
      {
        id: 'medecin_1',
        nom: 'Dupont',
        prenom: 'Jean',
        specialite: 'Médecine générale',
        numeroRPPS: '12345678901',
        identificationPrescripteur: 'DP001',
        adresse: '123 Rue de la Santé, 75001 Paris',
        telephone: '01 23 45 67 89',
        email: 'jean.dupont@example.com',
        actif: true,
      },
      {
        id: 'medecin_2',
        nom: 'Martin',
        prenom: 'Marie',
        specialite: 'Cardiologie',
        numeroRPPS: '12345678902',
        identificationPrescripteur: 'MT002',
        adresse: '456 Avenue des Médecins, 75002 Paris',
        telephone: '01 98 76 54 32',
        email: 'marie.martin@example.com',
        actif: true,
      },
    ];
  }

  static getDefaultConfiguration(): Configuration {
    return {
      // devise supprimée - Application forcée en XPF
      calculs: {
        multiplicateurIK: 45,
        tarifIFD: 350,
        majorationNuit: 0.0,
        majorationDimanche: 0.0
      },
      parametres: {
        identificationPraticien: '',
        auxiliaireMedicalRemplacant: false,
        nomCabinet: '',
        adresse: '',
        telephone: '',
        email: '',
        logo: '',
        logoMaxWidth: '200',
        logoPosition: 'top-left'
      },
      positionnement: {
        // Informations Patient
        numeroFeuilleSoins: { x: 150, y: 30 },
        nomPatient: { x: 20, y: 40 },
        prenomPatient: { x: 120, y: 40 },
        dnPatient: { x: 20, y: 45 },
        dateNaissancePatient: { x: 150, y: 45 },
        adressePatient: { x: 40, y: 75 },
        
        // Informations Assuré
        nomAssure: { x: 20, y: 57 },
        prenomAssure: { x: 120, y: 57 },
        dnAssure: { x: 20, y: 62 },
        dateNaissanceAssure: { x: 150, y: 62 },
        
        // Auxiliaire Médical
        identificationPraticien: { x: 90, y: 90 },
        auxiliaireRemplacant: { x: 85, y: 93 },
        
        // Conditions Spéciales
        parcoursSoins: { x: 30, y: 110 },
        accordPrealable: { x: 85, y: 105 },
        identificationPrescripteur: { x: 55, y: 115 },
        datePrescription: { x: 110, y: 115 },
        longueMaladie: { x: 10, y: 115 },
        atMp: { x: 38, y: 125 },
        maternite: { x: 110, y: 125 },
        autresDerogations: { x: 130, y: 125 },
        urgence: { x: 10, y: 132 },
        panierSoins: { x: 60, y: 132 },
        rsr: { x: 120, y: 132 },
        
        // Tableau des Actes
        tableauActes: { x: 20, y: 140 },
        
        // Totaux
        montantTotal: { x: 90, y: 240 },
        montantPaye: { x: 70, y: 270 },
        tiersPayant: { x: 110, y: 270 }
      }
    };
  }

  // Export/Import des données
  static exportData(): string {
    const state = this.getAppState();
    return JSON.stringify(state, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      this.saveAppState(data);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'import des données:', error);
      return false;
    }
  }

  // Nettoyage des données
  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
} 