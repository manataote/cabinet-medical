import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { CabinetService, Cabinet } from '../services/cabinetService';
import { UserService, UserInfo } from '../services/userService';
// Devise supprimée - Application forcée en XPF

const Settings: React.FC = () => {
  const { state, updateConfiguration, updateUserInfo } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'positionnement' | 'appearance' | 'about'>('general');
  const [cabinet, setCabinet] = useState<Cabinet | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [initialConfigLoaded, setInitialConfigLoaded] = useState(false); // Flag pour éviter les rechargements
  
  // États pour les formats de données
  const [formatDate, setFormatDate] = useState<string>('DD/MM/YYYY');
  const [formatNombre, setFormatNombre] = useState<string>('Virgule (1,234.56)');

  // Fonction de conversion supprimée - Application forcée en XPF

  // Utiliser les données déjà chargées dans l'état global
  useEffect(() => {
    if (state.cabinetInfo && state.userInfo && !initialConfigLoaded) {
      // Les données sont déjà disponibles dans l'état global
      console.log('✅ Utilisation des données du cabinet et utilisateur depuis l\'état global');
      setCabinet({
        id: state.cabinetInfo.id,
        name: state.cabinetInfo.name,
        address: state.cabinetInfo.address,
        phone: state.cabinetInfo.phone,
        email: state.cabinetInfo.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setUserInfo(state.userInfo);
      setDataLoaded(true);
      
      // Mettre à jour la configuration avec les données du cabinet et de l'utilisateur
      const newConfig = {
        ...state.configuration,
        parametres: {
          ...state.configuration.parametres,
          nomCabinet: state.cabinetInfo.name || '',
          adresse: state.cabinetInfo.address || '',
          telephone: state.cabinetInfo.phone || '',
          email: state.cabinetInfo.email || '',
          auxiliaireMedicalRemplacant: state.configuration.parametres?.auxiliaireMedicalRemplacant || false,
        },
        // Charger les calculs depuis la BDD ou utiliser les valeurs par défaut
        calculs: state.userInfo?.config_calculs || state.configuration.calculs,
        // Charger les positionnements depuis la BDD
        positionnement: state.userInfo?.config_positionnements_pdf || state.configuration.positionnement,
      };
      
      // Charger la configuration une seule fois au montage
      updateConfiguration(newConfig);
      setInitialConfigLoaded(true); // Marquer comme chargé pour éviter les rechargements
    } else if (user?.id && !dataLoaded) {
      // Fallback : charger les données si elles ne sont pas dans l'état global
      setLoading(true);
      const loadCabinetInfo = async () => {
        try {
          const userData = await UserService.getUserInfo(user.id);
          if (userData) {
            setUserInfo(userData);
            if (userData.cabinet_id) {
              const cabinetData = await CabinetService.getCabinetById(userData.cabinet_id);
              if (cabinetData) {
                setCabinet(cabinetData);
                updateConfiguration({
                  ...state.configuration,
                  parametres: {
                    ...state.configuration.parametres,
                    nomCabinet: cabinetData.name || '',
                    adresse: cabinetData.address || '',
                    telephone: cabinetData.phone || '',
                    email: cabinetData.email || '',
                    auxiliaireMedicalRemplacant: state.configuration.parametres?.auxiliaireMedicalRemplacant || false,
                  },
                  // Charger les calculs depuis la BDD ou utiliser les valeurs par défaut
                  calculs: userData.config_calculs || state.configuration.calculs,
                  // Charger les positionnements depuis la BDD
                  positionnement: userData.config_positionnements_pdf || state.configuration.positionnement,
                });
              }
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement des informations:', error);
        } finally {
          setLoading(false);
          setDataLoaded(true);
          setInitialConfigLoaded(true); // Marquer comme chargé pour éviter les rechargements
        }
      };
      loadCabinetInfo();
    } else if (!user?.id) {
      setDataLoaded(true);
    }
  }, [user?.id, state.cabinetInfo, state.configuration.parametres?.nomCabinet, updateConfiguration, dataLoaded, initialConfigLoaded]);

  // Charger les formats depuis userInfo (une seule fois au montage)
  useEffect(() => {
    if (state.userInfo?.config_formats && !initialConfigLoaded) {
      if (state.userInfo.config_formats.formatDate) {
        setFormatDate(state.userInfo.config_formats.formatDate);
      }
      if (state.userInfo.config_formats.formatNombre) {
        setFormatNombre(state.userInfo.config_formats.formatNombre);
      }
    }
  }, [state.userInfo, initialConfigLoaded]);

  const handleParametreChange = (key: string, value: any) => {
    updateConfiguration({
      ...state.configuration,
      parametres: {
        identificationPraticien: state.configuration.parametres?.identificationPraticien || '',
        auxiliaireMedicalRemplacant: state.configuration.parametres?.auxiliaireMedicalRemplacant || false,
        nomCabinet: state.configuration.parametres?.nomCabinet || '',
        adresse: state.configuration.parametres?.adresse || '',
        telephone: state.configuration.parametres?.telephone || '',
        email: state.configuration.parametres?.email || '',
        logo: state.configuration.parametres?.logo || '',
        logoMaxWidth: state.configuration.parametres?.logoMaxWidth || '200',
        logoPosition: state.configuration.parametres?.logoPosition || 'top-left',
        [key]: value
      }
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target?.result as string;
        handleParametreChange('logo', logoData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = async () => {
    try {
      let successCount = 0;
      let totalOperations = 0;

      // Sauvegarder les informations du cabinet si elles ont été modifiées
      if (cabinet && userInfo?.cabinet_id) {
        totalOperations++;
        const cabinetUpdates = {
          name: state.configuration.parametres?.nomCabinet || '',
          address: state.configuration.parametres?.adresse || '',
          phone: state.configuration.parametres?.telephone || '',
          email: state.configuration.parametres?.email || '',
        };

        const updatedCabinet = await CabinetService.updateCabinet(userInfo.cabinet_id, cabinetUpdates);
        if (updatedCabinet) {
          setCabinet(updatedCabinet);
          successCount++;
        }
      }

      // Sauvegarder les informations de l'utilisateur si elles ont été modifiées
      if (userInfo && user?.id) {
        totalOperations++;
        const userUpdates = {
          nom: userInfo.nom,
          prenom: userInfo.prenom,
          email: userInfo.email,
          numero_ident: userInfo.numero_ident,
          role: userInfo.role,
          // Sauvegarder les configurations dans la BDD
          config_calculs: state.configuration.calculs,
          config_positionnements_pdf: state.configuration.positionnement || {},
          config_formats: {
            formatDate,
            formatNombre,
          },
        };

        const updatedUser = await UserService.updateUser(user.id, userUpdates);
        if (updatedUser) {
          setUserInfo(updatedUser);
          updateUserInfo(updatedUser); // Mettre à jour l'état global
          successCount++;
        }
      }

      // Sauvegarder toutes les modifications de configuration (localStorage)
      updateConfiguration({
        ...state.configuration
      });
      
      if (successCount === totalOperations && totalOperations > 0) {
        alert('Paramètres sauvegardés avec succès !');
      } else if (totalOperations === 0) {
        alert('Aucune modification à sauvegarder');
      } else {
        alert('Certains paramètres n\'ont pas pu être sauvegardés');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des paramètres');
    }
  };

  // === NOUVEAU : Gestion du positionnement PDF ===
  const handlePositionnementChange = (element: string, field: 'x' | 'y', value: number) => {
    const currentPositionnement = state.configuration.positionnement || {};
    const currentElement = currentPositionnement[element];
    
    // Valeurs par défaut du contexte
    const defaultValues: { [key: string]: { x: number; y: number } } = {
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
      numeroAtMp: { x: 0, y: 126 },
      maternite: { x: 110, y: 125 },
      autresDerogations: { x: 130, y: 125 },
      descriptionAutresDerogations: { x: 0, y: 126 },
      urgence: { x: 10, y: 132 },
      panierSoins: { x: 60, y: 132 },
      rsr: { x: 0, y: 133 },
      
      // Tableau des Actes
      tableauActes: { x: 0, y: 140 },
      majorationDimanche: { x: 0, y: 141 },
      majorationNuit: { x: 0, y: 141 },
      
      // Totaux
      montantTotal: { x: 90, y: 255 },
      montantPaye: { x: 70, y: 280 },
      tiersPayant: { x: 110, y: 280 }
    };
    
    const defaultElement = defaultValues[element] || { x: 0, y: 0 };
    const elementToUse = currentElement || defaultElement;
    
    // Préserver la valeur existante de l'autre axe
    const newElement = {
      ...elementToUse,
      [field]: value
    };
    
    updateConfiguration({
      ...state.configuration,
      positionnement: {
        ...currentPositionnement,
        [element]: newElement
      }
    });
  };

  const getPositionnementValue = (element: string, field: 'x' | 'y', defaultValue: number): number => {
    const currentValue = state.configuration.positionnement?.[element]?.[field];
    return currentValue !== undefined ? currentValue : defaultValue;
  };

  // Fonction utilitaire pour gérer les changements de positionnement
  const handlePositionnementInputChange = (element: string, field: 'x' | 'y', value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      handlePositionnementChange(element, field, numValue);
    }
  };


  const handleSavePositionnement = async () => {
    try {
      // Sauvegarder dans la configuration locale
      updateConfiguration({
        ...state.configuration
      });

      // Sauvegarder dans la BDD si l'utilisateur est connecté
      if (user?.id) {
        const userUpdates = {
          config_positionnements_pdf: state.configuration.positionnement || {},
        };

        const updatedUser = await UserService.updateUser(user.id, userUpdates);
        if (updatedUser) {
          setUserInfo(updatedUser);
          updateUserInfo(updatedUser); // Mettre à jour l'état global
          alert('Positionnement sauvegardé avec succès !');
        } else {
          alert('Erreur lors de la sauvegarde du positionnement');
        }
      } else {
        alert('Positionnement sauvegardé localement !');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du positionnement:', error);
      alert('Erreur lors de la sauvegarde du positionnement');
    }
  };

  const handleSaveFormats = async () => {
    try {
      // Sauvegarder dans la BDD si l'utilisateur est connecté
      if (user?.id) {
        const userUpdates = {
          config_formats: {
            formatDate,
            formatNombre,
          },
        };

        const updatedUser = await UserService.updateUser(user.id, userUpdates);
        if (updatedUser) {
          setUserInfo(updatedUser);
          updateUserInfo(updatedUser); // Mettre à jour l'état global
          alert('Formats de données sauvegardés avec succès !');
        } else {
          alert('Erreur lors de la sauvegarde des formats');
        }
      } else {
        alert('Utilisateur non connecté');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des formats:', error);
      alert('Erreur lors de la sauvegarde des formats');
    }
  };

  const handleTestImpression = async () => {
    try {
      // Import dynamique de jsPDF
      const jsPDF = await import('jspdf');
      
      // Création du document jsPDF en format A4
      const doc = new jsPDF.default('p', 'mm', 'a4');
      
      // Fonction pour ajouter du texte avec positionnement précis
      const addTextAtPosition = (doc: any, text: string, x: number, y: number, fontSize: number = 12) => {
        if (!text || text.trim() === '') return;
        doc.setFont('arial', 'normal');
        doc.setFontSize(fontSize);
        doc.text(text, x, y);
      };

      // Fonction pour ajouter une case à cocher
      const addCheckboxAtPosition = (doc: any, x: number, y: number, checked: boolean) => {
        // Ne rien dessiner si la case n'est pas cochée
        if (!checked) {
          return;
        }
        
        const size = 4; // Plus grande pour être plus visible
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.8);
        doc.rect(x, y - size, size, size, 'S');
        
        doc.setLineWidth(1.5);
        // Dessiner un X plus visible
        doc.line(x + 0.5, y - size + 0.5, x + size - 0.5, y - 0.5);
        doc.line(x + 0.5, y - 0.5, x + size - 0.5, y - size + 0.5);
      };

      // Utiliser les positions configurées ou les valeurs par défaut
      const getPosition = (element: string, field: 'x' | 'y', defaultValue: number): number => {
        return state.configuration.positionnement?.[element]?.[field] ?? defaultValue;
      };

      // 1. NUMÉRO DE LA FEUILLE DE SOINS
      addTextAtPosition(doc, 'FS-2024-001234', getPosition('numeroFeuilleSoins', 'x', 150), getPosition('numeroFeuilleSoins', 'y', 30));
      
      // 2. INFORMATIONS PATIENT PRINCIPAL
      addTextAtPosition(doc, 'MARTIN', getPosition('nomPatient', 'x', 20), getPosition('nomPatient', 'y', 40));
      addTextAtPosition(doc, 'Pierre', getPosition('prenomPatient', 'x', 120), getPosition('prenomPatient', 'y', 40));
      addTextAtPosition(doc, '1234567', getPosition('dnPatient', 'x', 20), getPosition('dnPatient', 'y', 45));
      addTextAtPosition(doc, '15/03/1980', getPosition('dateNaissancePatient', 'x', 150), getPosition('dateNaissancePatient', 'y', 45));
      addTextAtPosition(doc, '123 Rue de la Paix, Papeete, Tahiti', getPosition('adressePatient', 'x', 40), getPosition('adressePatient', 'y', 75));
      
      // 3. INFORMATIONS ASSURÉ (exemple avec assuré différent)
      addTextAtPosition(doc, 'DUPONT', getPosition('nomAssure', 'x', 20), getPosition('nomAssure', 'y', 57));
      addTextAtPosition(doc, 'Marie', getPosition('prenomAssure', 'x', 120), getPosition('prenomAssure', 'y', 57));
      addTextAtPosition(doc, '7654321', getPosition('dnAssure', 'x', 20), getPosition('dnAssure', 'y', 62));
      addTextAtPosition(doc, '22/07/1985', getPosition('dateNaissanceAssure', 'x', 150), getPosition('dateNaissanceAssure', 'y', 62));
      
      // 4. AUXILIAIRE MÉDICAL
      addTextAtPosition(doc, 'A1234', getPosition('identificationPraticien', 'x', 90), getPosition('identificationPraticien', 'y', 90)); // Identification praticien pour le test
      addCheckboxAtPosition(doc, getPosition('auxiliaireRemplacant', 'x', 85), getPosition('auxiliaireRemplacant', 'y', 93), true); // Coché pour le test
      
      // 5. CONDITIONS SPÉCIALES (TOUTES COCHÉES POUR LE TEST)
      addCheckboxAtPosition(doc, getPosition('parcoursSoins', 'x', 30), getPosition('parcoursSoins', 'y', 110), true); // Parcours de soins
      addTextAtPosition(doc, '12345678', getPosition('accordPrealable', 'x', 85), getPosition('accordPrealable', 'y', 105)); // Accord préalable
      addTextAtPosition(doc, 'M1234', getPosition('identificationPrescripteur', 'x', 55), getPosition('identificationPrescripteur', 'y', 115)); // Identification prescripteur
      addTextAtPosition(doc, '15/12/2024', getPosition('datePrescription', 'x', 110), getPosition('datePrescription', 'y', 115)); // Date prescription
      addCheckboxAtPosition(doc, getPosition('longueMaladie', 'x', 10), getPosition('longueMaladie', 'y', 115), true); // Longue maladie
      addCheckboxAtPosition(doc, getPosition('atMp', 'x', 38), getPosition('atMp', 'y', 125), true); // AT/MP
      addCheckboxAtPosition(doc, getPosition('maternite', 'x', 110), getPosition('maternite', 'y', 125), true); // Maternité
      addCheckboxAtPosition(doc, getPosition('autresDerogations', 'x', 130), getPosition('autresDerogations', 'y', 125), true); // Autres dérogations
      addCheckboxAtPosition(doc, getPosition('urgence', 'x', 10), getPosition('urgence', 'y', 132), true); // Urgence
      addTextAtPosition(doc, '456456456', getPosition('panierSoins', 'x', 60), getPosition('panierSoins', 'y', 132)); // Panier de soins
      addTextAtPosition(doc, '5677789', getPosition('rsr', 'x', 120), getPosition('rsr', 'y', 132)); // RSR
      
      // 6. TABLEAU DES ACTES COMPLET (16 lignes remplies)
      const startY = getPosition('tableauActes', 'y', 140);
      const positionsY = Array.from({length: 16}, (_, i) => startY + (i * 6));
      
      // Données d'exemple pour 16 actes (TOUTES LES CASES COCHÉES POUR LE TEST)
      const actesExemple = [
        { date: '15/12/2024', code: 'AMP', coeff: '6', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '40', montant: '4910' },
        { date: '15/12/2024', code: 'BIL', coeff: '1', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '20', montant: '1200' },
        { date: '15/12/2024', code: 'CON', coeff: '2', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '30', montant: '1800' },
        { date: '15/12/2024', code: 'DER', coeff: '1', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '25', montant: '1500' },
        { date: '15/12/2024', code: 'END', coeff: '3', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '35', montant: '2100' },
        { date: '15/12/2024', code: 'GAS', coeff: '1', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '15', montant: '900' },
        { date: '15/12/2024', code: 'GYN', coeff: '2', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '28', montant: '1680' },
        { date: '15/12/2024', code: 'HEM', coeff: '1', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '22', montant: '1320' },
        { date: '15/12/2024', code: 'INF', coeff: '4', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '32', montant: '1920' },
        { date: '15/12/2024', code: 'KIN', coeff: '2', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '18', montant: '1080' },
        { date: '15/12/2024', code: 'NEU', coeff: '1', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '26', montant: '1560' },
        { date: '15/12/2024', code: 'OPH', coeff: '1', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '24', montant: '1440' },
        { date: '15/12/2024', code: 'ORL', coeff: '2', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '30', montant: '1800' },
        { date: '15/12/2024', code: 'PED', coeff: '1', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '20', montant: '1200' },
        { date: '15/12/2024', code: 'RAD', coeff: '3', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '38', montant: '2280' },
        { date: '15/12/2024', code: 'URO', coeff: '1', ifd: true, majorationDimanche: true, majorationNuit: true, ik: '28', montant: '1680' }
      ];
      
      // Remplir le tableau avec tous les actes
      actesExemple.forEach((acte, index) => {
        const y = positionsY[index];
        addTextAtPosition(doc, acte.date, 10, y, 10);
        addTextAtPosition(doc, acte.code, 50, y, 10);
        addTextAtPosition(doc, acte.coeff, 70, y, 10);
        // Case IFD (toujours cochée pour le test)
        addCheckboxAtPosition(doc, 115, y, acte.ifd); // IFD
        addTextAtPosition(doc, acte.ik, 130, y, 10); // IK
        // Case majoration dimanche/jours fériés
        addCheckboxAtPosition(doc, 150, y, acte.majorationDimanche); // Majoration dimanche
        // Case majoration nuit
        addCheckboxAtPosition(doc, 165, y, acte.majorationNuit); // Majoration nuit
        addTextAtPosition(doc, acte.montant, 175, y, 10); // Montant
      });
      
      // 7. TOTAUX (calculés)
      const montantTotal = actesExemple.reduce((sum, acte) => sum + parseInt(acte.montant), 0);
      const montantPaye = 0; // Aucun paiement pour le test
      const tiersPayant = montantTotal; // Tiers payant complet
      
      addTextAtPosition(doc, montantTotal.toString(), getPosition('montantTotal', 'x', 90), getPosition('montantTotal', 'y', 240), 12);
      addTextAtPosition(doc, montantPaye.toString(), getPosition('montantPaye', 'x', 70), getPosition('montantPaye', 'y', 270), 12);
      addTextAtPosition(doc, tiersPayant.toString(), getPosition('tiersPayant', 'x', 110), getPosition('tiersPayant', 'y', 270), 12);
      
      // 8. AJOUTER LES CHAMPS MANQUANTS
      // Numéro AT/MP (quand AT/MP est coché)
      addTextAtPosition(doc, '123456789', getPosition('numeroAtMp', 'x', 50), getPosition('numeroAtMp', 'y', 125));
      
      // Description autres dérogations (quand autres dérogations est coché)
      addTextAtPosition(doc, 'Dérogation spéciale test', getPosition('descriptionAutresDerogations', 'x', 140), getPosition('descriptionAutresDerogations', 'y', 125));
      
      // Ouvrir le PDF dans un nouvel onglet
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const newTab = window.open(pdfUrl, '_blank');
      
      if (!newTab) {
        console.warn('Veuillez autoriser les popups pour ouvrir le PDF');
      }
      
      // Nettoyer l'URL après un délai
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF de test:', error);
      alert('Erreur lors de la génération du PDF de test');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600">Configuration de l'application</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs">
        <div className="tab-list">
          <button
            onClick={() => setActiveTab('general')}
            className={`tab ${activeTab === 'general' ? 'active' : 'inactive'}`}
          >
            Général
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`tab ${activeTab === 'data' ? 'active' : 'inactive'}`}
          >
            Données
          </button>
          {/* Onglet devise supprimé - Application forcée en XPF */}
          <button
            onClick={() => setActiveTab('positionnement')}
            className={`tab ${activeTab === 'positionnement' ? 'active' : 'inactive'}`}
          >
            Positionnement PDF
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`tab ${activeTab === 'appearance' ? 'active' : 'inactive'}`}
          >
            Apparence
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`tab ${activeTab === 'about' ? 'active' : 'inactive'}`}
          >
            À propos
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'general' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              ⚙️ Paramètres généraux
            </h2>
            
            {/* Bouton de sauvegarde globale */}
            <div className="mb-6">
              <button
                onClick={handleSaveAll}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                💾 Sauvegarder tous les paramètres
              </button>
            </div>

         {/* Informations du cabinet et de l'utilisateur */}
         <div className="mb-8">
           <h3 className="text-lg font-semibold mb-4 text-gray-700">🏥 Informations du cabinet et de l'utilisateur</h3>
           {loading && !dataLoaded ? (
             <div className="flex items-center justify-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
               <span className="ml-2 text-gray-600">Chargement des informations...</span>
             </div>
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Bloc Informations du cabinet */}
               <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                 <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                   🏥 Informations du cabinet
                 </h4>
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Nom du cabinet
                     </label>
                     <input
                       type="text"
                       value={state.configuration.parametres?.nomCabinet || ''}
                       onChange={(e) => handleParametreChange('nomCabinet', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Nom du cabinet"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Adresse
                     </label>
                     <input
                       type="text"
                       value={state.configuration.parametres?.adresse || ''}
                       onChange={(e) => handleParametreChange('adresse', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Adresse complète"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Téléphone
                     </label>
                     <input
                       type="tel"
                       value={state.configuration.parametres?.telephone || ''}
                       onChange={(e) => handleParametreChange('telephone', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Numéro de téléphone"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Email
                     </label>
                     <input
                       type="email"
                       value={state.configuration.parametres?.email || ''}
                       onChange={(e) => handleParametreChange('email', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Adresse email"
                     />
                   </div>
                 </div>
               </div>

               {/* Bloc Informations de l'utilisateur */}
               <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                 <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                   👤 Informations de l'utilisateur
                 </h4>
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Nom
                     </label>
                     <input
                       type="text"
                       value={userInfo?.nom || ''}
                       onChange={(e) => setUserInfo(prev => prev ? {...prev, nom: e.target.value} : null)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Nom de l'utilisateur"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Prénom
                     </label>
                     <input
                       type="text"
                       value={userInfo?.prenom || ''}
                       onChange={(e) => setUserInfo(prev => prev ? {...prev, prenom: e.target.value} : null)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Prénom de l'utilisateur"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Email
                     </label>
                     <input
                       type="email"
                       value={userInfo?.email || ''}
                       onChange={(e) => setUserInfo(prev => prev ? {...prev, email: e.target.value} : null)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Adresse email"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Numéro d'identification
                     </label>
                     <input
                       type="text"
                       value={userInfo?.numero_ident || ''}
                       onChange={(e) => setUserInfo(prev => prev ? {...prev, numero_ident: e.target.value} : null)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Numéro d'identification"
                       maxLength={5}
                     />
                     <p className="text-xs text-gray-500 mt-1">
                       Maximum 5 caractères
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Rôle
                     </label>
                     <select
                       value={userInfo?.role || ''}
                       onChange={(e) => setUserInfo(prev => prev ? {...prev, role: e.target.value} : null)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                       <option value="admin">Administrateur</option>
                       <option value="medecin">Médecin</option>
                       <option value="secretaire">Secrétaire</option>
                     </select>
                   </div>
                 </div>
               </div>
             </div>
           )}
         </div>

            {/* Logo du cabinet */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">🖼️ Logo du cabinet</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formats acceptés : JPG, PNG, GIF. Taille recommandée : 200x200px
                  </p>
                </div>
                
                {state.configuration.parametres?.logo && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Taille maximale dans les PDF
                        </label>
                        <select
                          value={state.configuration.parametres?.logoMaxWidth || '200'}
                          onChange={(e) => handleParametreChange('logoMaxWidth', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="150">150px</option>
                          <option value="200">200px</option>
                          <option value="250">250px</option>
                          <option value="300">300px</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position dans les PDF
                        </label>
                        <select
                          value={state.configuration.parametres?.logoPosition || 'top-left'}
                          onChange={(e) => handleParametreChange('logoPosition', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="top-left">Haut-gauche</option>
                          <option value="top-center">Haut-centre</option>
                          <option value="top-right">Haut-droite</option>
                          <option value="header">En-tête</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <img
                        src={state.configuration.parametres.logo}
                        alt="Logo du cabinet"
                        className="w-20 h-20 object-contain border border-gray-300 rounded"
                      />
                      <button
                        onClick={() => handleParametreChange('logo', '')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        🗑️ Supprimer le logo
                      </button>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Recommandations :</strong> Utilisez un logo de bonne qualité (200x200px minimum) 
                        pour un rendu professionnel dans vos documents PDF.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Texte de facturation pour les semelles */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Texte de facturation semelles
                  </label>
                  <textarea
                    value={state.configuration.parametres?.texteFacturationSemelles || ''}
                    onChange={(e) => handleParametreChange('texteFacturationSemelles', e.target.value)}
                    placeholder="Texte modifiable pour les informations de facturation..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    Ce texte apparaîtra en bas des factures de semelles orthopédiques
                  </p>
                </div>
              </div>
            </div>

            {/* Aperçu des informations du cabinet */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">👁️ Aperçu des informations du cabinet</h3>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-start space-x-4">
                  {state.configuration.parametres?.logo && (
                    <img
                      src={state.configuration.parametres.logo}
                      alt="Logo du cabinet"
                      className="w-16 h-16 object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900">
                      {state.configuration.parametres?.nomCabinet || 'Nom du cabinet'}
                    </h4>
                    <p className="text-gray-700">
                      {state.configuration.parametres?.adresse || 'Adresse du cabinet'}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {state.configuration.parametres?.telephone && (
                        <p>📞 {state.configuration.parametres.telephone}</p>
                      )}
                      {state.configuration.parametres?.email && (
                        <p>✉️ {state.configuration.parametres.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration des calculs */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">🧮 Configuration des calculs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Multiplicateur IK
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={state.configuration.calculs.multiplicateurIK}
                    onChange={(e) => updateConfiguration({
                      calculs: {
                        ...state.configuration.calculs,
                        multiplicateurIK: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarif IFD
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={state.configuration.calculs.tarifIFD || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateConfiguration({
                        calculs: {
                          ...state.configuration.calculs,
                          tarifIFD: value === "" ? 0 : parseFloat(value) || 0
                        }
                      });
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "" || parseFloat(e.target.value) === 0) {
                        updateConfiguration({
                          calculs: {
                            ...state.configuration.calculs,
                            tarifIFD: 2.0
                          }
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Majoration nuit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={state.configuration.calculs.majorationNuit || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateConfiguration({
                        calculs: {
                          ...state.configuration.calculs,
                          majorationNuit: value === "" ? 0 : parseFloat(value) || 0
                        }
                      });
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "" || parseFloat(e.target.value) === 0) {
                        updateConfiguration({
                          calculs: {
                            ...state.configuration.calculs,
                            majorationNuit: 0.0
                          }
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Majoration dimanche/jours fériés
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={state.configuration.calculs.majorationDimanche || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateConfiguration({
                        calculs: {
                          ...state.configuration.calculs,
                          majorationDimanche: value === "" ? 0 : parseFloat(value) || 0
                        }
                      });
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "" || parseFloat(e.target.value) === 0) {
                        updateConfiguration({
                          calculs: {
                            ...state.configuration.calculs,
                            majorationDimanche: 0.0
                          }
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              📊 Formats de données
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format de date
                </label>
                <select 
                  value={formatDate}
                  onChange={(e) => setFormatDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Format utilisé pour l'affichage des dates dans l'application
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format de nombre
                </label>
                <select
                  value={formatNombre}
                  onChange={(e) => setFormatNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Virgule (1,234.56)">Virgule (1,234.56)</option>
                  <option value="Point (1.234,56)">Point (1.234,56)</option>
                  <option value="Espace (1 234,56)">Espace (1 234,56)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Format utilisé pour l'affichage des nombres dans l'application
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveFormats}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💾 Sauvegarder les formats
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section devise supprimée - Application forcée en XPF */}

      {activeTab === 'positionnement' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              🎯 Éditeur de positionnement PDF - Feuille de soins
            </h2>
            <p className="text-gray-600 mb-6">
              Ajustez le positionnement de tous les éléments de la feuille de soins PDF. 
              Modifiez les coordonnées en millimètres pour un positionnement précis.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Panneau de contrôle à gauche */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-700">⚙️ Contrôles de positionnement</h3>
                
                {/* Section Informations Patient */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-2">👤 Informations Patient</h4>
                  
                  {/* Numéro de feuille */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Numéro de feuille de soins <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('numeroFeuilleSoins', 'x', 150)}
                        onChange={(e) => handlePositionnementInputChange('numeroFeuilleSoins', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('numeroFeuilleSoins', 'y', 30)}
                        onChange={(e) => handlePositionnementInputChange('numeroFeuilleSoins', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Nom du patient */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nom du patient <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('nomPatient', 'x', 20)}
                        onChange={(e) => handlePositionnementInputChange('nomPatient', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('nomPatient', 'y', 40)}
                        onChange={(e) => handlePositionnementInputChange('nomPatient', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Prénom du patient */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Prénom du patient <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('prenomPatient', 'x', 120)}
                        onChange={(e) => handlePositionnementInputChange('prenomPatient', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('prenomPatient', 'y', 40)}
                        onChange={(e) => handlePositionnementInputChange('prenomPatient', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* DN du patient */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      DN du patient <span className="text-xs text-green-600 font-normal bg-green-100 px-1 rounded">(nombre)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('dnPatient', 'x', 20)}
                        onChange={(e) => handlePositionnementInputChange('dnPatient', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('dnPatient', 'y', 45)}
                        onChange={(e) => handlePositionnementInputChange('dnPatient', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Date de naissance du patient */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Date de naissance du patient <span className="text-xs text-purple-600 font-normal bg-purple-100 px-1 rounded">(date)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('dateNaissancePatient', 'x', 150)}
                        onChange={(e) => handlePositionnementInputChange('dateNaissancePatient', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('dateNaissancePatient', 'y', 45)}
                        onChange={(e) => handlePositionnementInputChange('dateNaissancePatient', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Adresse du patient */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Adresse du patient <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('adressePatient', 'x', 40)}
                        onChange={(e) => handlePositionnementInputChange('adressePatient', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('adressePatient', 'y', 75)}
                        onChange={(e) => handlePositionnementInputChange('adressePatient', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Informations Assuré */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-2">👥 Informations Assuré</h4>
                  
                  {/* Nom de l'assuré */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nom de l'assuré <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('nomAssure', 'x', 20)}
                        onChange={(e) => handlePositionnementInputChange('nomAssure', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('nomAssure', 'y', 57)}
                        onChange={(e) => handlePositionnementInputChange('nomAssure', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Prénom de l'assuré */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Prénom de l'assuré <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('prenomAssure', 'x', 120)}
                        onChange={(e) => handlePositionnementInputChange('prenomAssure', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('prenomAssure', 'y', 57)}
                        onChange={(e) => handlePositionnementInputChange('prenomAssure', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* DN de l'assuré */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      DN de l'assuré <span className="text-xs text-green-600 font-normal bg-green-100 px-1 rounded">(nombre)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('dnAssure', 'x', 20)}
                        onChange={(e) => handlePositionnementInputChange('dnAssure', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('dnAssure', 'y', 62)}
                        onChange={(e) => handlePositionnementInputChange('dnAssure', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Date de naissance de l'assuré */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Date de naissance de l'assuré <span className="text-xs text-purple-600 font-normal bg-purple-100 px-1 rounded">(date)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('dateNaissanceAssure', 'x', 150)}
                        onChange={(e) => handlePositionnementInputChange('dateNaissanceAssure', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('dateNaissanceAssure', 'y', 62)}
                        onChange={(e) => handlePositionnementInputChange('dateNaissanceAssure', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Auxiliaire Médical */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-2">👨‍⚕️ Auxiliaire Médical</h4>
                  
                  {/* Identification du praticien */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Identification du praticien <span className="text-xs text-green-600 font-normal bg-green-100 px-1 rounded">(nombre)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('identificationPraticien', 'x', 90)}
                        onChange={(e) => handlePositionnementInputChange('identificationPraticien', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('identificationPraticien', 'y', 90)}
                        onChange={(e) => handlePositionnementInputChange('identificationPraticien', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Auxiliaire médical remplaçant */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Auxiliaire médical remplaçant <span className="text-xs text-orange-600 font-normal bg-orange-100 px-1 rounded">(case à cocher)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('auxiliaireRemplacant', 'x', 85)}
                        onChange={(e) => handlePositionnementInputChange('auxiliaireRemplacant', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('auxiliaireRemplacant', 'y', 93)}
                        onChange={(e) => handlePositionnementInputChange('auxiliaireRemplacant', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Conditions Spéciales */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-2">📋 Conditions Spéciales</h4>
                  
                  {/* Parcours de soins */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Parcours de soins <span className="text-xs text-orange-600 font-normal bg-orange-100 px-1 rounded">(case à cocher)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('parcoursSoins', 'x', 30)}
                        onChange={(e) => handlePositionnementInputChange('parcoursSoins', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('parcoursSoins', 'y', 110)}
                        onChange={(e) => handlePositionnementInputChange('parcoursSoins', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Accord préalable */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Accord préalable <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('accordPrealable', 'x', 85)}
                        onChange={(e) => handlePositionnementInputChange('accordPrealable', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('accordPrealable', 'y', 105)}
                        onChange={(e) => handlePositionnementInputChange('accordPrealable', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Identification prescripteur */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Identification prescripteur <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('identificationPrescripteur', 'x', 55)}
                        onChange={(e) => handlePositionnementInputChange('identificationPrescripteur', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('identificationPrescripteur', 'y', 115)}
                        onChange={(e) => handlePositionnementInputChange('identificationPrescripteur', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Date prescription */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Date prescription <span className="text-xs text-purple-600 font-normal bg-purple-100 px-1 rounded">(date)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('datePrescription', 'x', 110)}
                        onChange={(e) => handlePositionnementInputChange('datePrescription', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('datePrescription', 'y', 115)}
                        onChange={(e) => handlePositionnementInputChange('datePrescription', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Longue maladie */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Longue maladie <span className="text-xs text-orange-600 font-normal bg-orange-100 px-1 rounded">(case à cocher)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('longueMaladie', 'x', 10)}
                        onChange={(e) => handlePositionnementInputChange('longueMaladie', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('longueMaladie', 'y', 115)}
                        onChange={(e) => handlePositionnementInputChange('longueMaladie', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* AT/MP */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      AT/MP <span className="text-xs text-orange-600 font-normal bg-orange-100 px-1 rounded">(case à cocher)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('atMp', 'x', 38)}
                        onChange={(e) => handlePositionnementInputChange('atMp', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('atMp', 'y', 125)}
                        onChange={(e) => handlePositionnementInputChange('atMp', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Maternité */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Maternité <span className="text-xs text-orange-600 font-normal bg-orange-100 px-1 rounded">(case à cocher)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('maternite', 'x', 110)}
                        onChange={(e) => handlePositionnementInputChange('maternite', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('maternite', 'y', 125)}
                        onChange={(e) => handlePositionnementInputChange('maternite', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Autres dérogations */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Autres dérogations <span className="text-xs text-orange-600 font-normal bg-orange-100 px-1 rounded">(case à cocher)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('autresDerogations', 'x', 130)}
                        onChange={(e) => handlePositionnementInputChange('autresDerogations', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('autresDerogations', 'y', 125)}
                        onChange={(e) => handlePositionnementInputChange('autresDerogations', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Urgence */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Urgence <span className="text-xs text-orange-600 font-normal bg-orange-100 px-1 rounded">(case à cocher)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('urgence', 'x', 10)}
                        onChange={(e) => handlePositionnementInputChange('urgence', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('urgence', 'y', 132)}
                        onChange={(e) => handlePositionnementInputChange('urgence', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Panier de soins */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Panier de soins <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('panierSoins', 'x', 60)}
                        onChange={(e) => handlePositionnementInputChange('panierSoins', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('panierSoins', 'y', 132)}
                        onChange={(e) => handlePositionnementInputChange('panierSoins', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* RSR */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      RSR <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('rsr', 'x', 120)}
                        onChange={(e) => handlePositionnementInputChange('rsr', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('rsr', 'y', 132)}
                        onChange={(e) => handlePositionnementInputChange('rsr', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Numéro AT/MP */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Numéro AT/MP <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('numeroAtMp', 'x', 50)}
                        onChange={(e) => handlePositionnementInputChange('numeroAtMp', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('numeroAtMp', 'y', 125)}
                        onChange={(e) => handlePositionnementInputChange('numeroAtMp', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Description autres dérogations */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Description autres dérogations <span className="text-xs text-blue-600 font-normal bg-blue-100 px-1 rounded">(texte)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('descriptionAutresDerogations', 'x', 140)}
                        onChange={(e) => handlePositionnementInputChange('descriptionAutresDerogations', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('descriptionAutresDerogations', 'y', 125)}
                        onChange={(e) => handlePositionnementInputChange('descriptionAutresDerogations', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Tableau des Actes */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-2">📊 Tableau des Actes</h4>
                  
                  {/* Position de départ du tableau */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Position de départ du tableau <span className="text-xs text-indigo-600 font-normal bg-indigo-100 px-1 rounded">(tableau)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('tableauActes', 'x', 20)}
                        onChange={(e) => handlePositionnementInputChange('tableauActes', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('tableauActes', 'y', 140)}
                        onChange={(e) => handlePositionnementInputChange('tableauActes', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Les 16 lignes d'actes seront positionnées automatiquement à partir de cette position
                    </p>
                  </div>

                  {/* Majoration dimanche/jours fériés */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Majoration dimanche/jours fériés <span className="text-xs text-orange-600 font-normal bg-orange-100 px-1 rounded">(case à cocher)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('majorationDimanche', 'x', 150)}
                        onChange={(e) => handlePositionnementInputChange('majorationDimanche', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('majorationDimanche', 'y', 140)}
                        onChange={(e) => handlePositionnementInputChange('majorationDimanche', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Majoration nuit */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Majoration nuit <span className="text-xs text-orange-600 font-normal bg-orange-100 px-1 rounded">(case à cocher)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('majorationNuit', 'x', 165)}
                        onChange={(e) => handlePositionnementInputChange('majorationNuit', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('majorationNuit', 'y', 140)}
                        onChange={(e) => handlePositionnementInputChange('majorationNuit', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Totaux */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-2">💰 Totaux</h4>
                  
                  {/* Montant total */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Montant total <span className="text-xs text-red-600 font-normal bg-red-100 px-1 rounded">(montant)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('montantTotal', 'x', 90)}
                        onChange={(e) => handlePositionnementInputChange('montantTotal', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('montantTotal', 'y', 240)}
                        onChange={(e) => handlePositionnementInputChange('montantTotal', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Montant payé */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Montant payé <span className="text-xs text-red-600 font-normal bg-red-100 px-1 rounded">(montant)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('montantPaye', 'x', 70)}
                        onChange={(e) => handlePositionnementInputChange('montantPaye', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('montantPaye', 'y', 270)}
                        onChange={(e) => handlePositionnementInputChange('montantPaye', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Tiers payant */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tiers payant <span className="text-xs text-red-600 font-normal bg-red-100 px-1 rounded">(montant)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="X (mm)"
                        value={getPositionnementValue('tiersPayant', 'x', 110)}
                        onChange={(e) => handlePositionnementInputChange('tiersPayant', 'x', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Y (mm)"
                        value={getPositionnementValue('tiersPayant', 'y', 270)}
                        onChange={(e) => handlePositionnementInputChange('tiersPayant', 'y', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="space-y-3 pt-4">
                  <button
                    onClick={handleSavePositionnement}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    💾 Sauvegarder
                  </button>
                  <button
                    onClick={() => {
                      // Réinitialiser aux valeurs par défaut
                      updateConfiguration({
                        ...state.configuration,
                        positionnement: undefined
                      });
                    }}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    🔄 Réinitialiser aux valeurs par défaut
                  </button>
                </div>
              </div>

              {/* Zone de test d'impression à droite */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-700">🖨️ Test d'impression</h3>
                
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">📄</div>
                    <h4 className="text-lg font-medium text-gray-700">Test de feuille de soins</h4>
                    <p className="text-sm text-gray-600">
                      Générez une feuille de soins de test avec les positions actuelles pour vérifier le positionnement.
                    </p>
                    
                    <button
                      onClick={handleTestImpression}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      🖨️ Générer feuille de test
                    </button>
                    
                    <p className="text-xs text-gray-500">
                      Une feuille de soins avec des données d'exemple sera générée et ouverte dans un nouvel onglet.
                    </p>
                  </div>
                </div>

                {/* Informations sur les positions */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">ℹ️ Informations</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Les coordonnées sont en millimètres (mm)</li>
                    <li>• Format A4 : 210mm × 297mm</li>
                    <li>• Les positions sont relatives au coin supérieur gauche</li>
                    <li>• Utilisez le test d'impression pour vérifier le rendu</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              🎨 Paramètres d'apparence
            </h2>
            
            <div className="space-y-6">
              {/* Échelle d'affichage */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">🔍 Échelle d'affichage</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taille de l'interface
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={state.configuration.apparence?.echelleAffichage || 1.0}
                        onChange={(e) => {
                          const newScale = parseFloat(e.target.value);
                          updateConfiguration({
                            ...state.configuration,
                            apparence: {
                              ...state.configuration.apparence,
                              echelleAffichage: newScale
                            }
                          });
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="w-20 text-center">
                        <span className="text-lg font-semibold text-blue-600">
                          {Math.round((state.configuration.apparence?.echelleAffichage || 1.0) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>50%</span>
                      <span>100%</span>
                      <span>200%</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Conseil :</strong> Ajustez l'échelle d'affichage pour améliorer la lisibilité de l'interface. 
                      Une échelle plus grande facilite la lecture sur les écrans haute résolution.
                    </p>
                  </div>
                  
                  {/* Boutons de réglage rapide */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Réglages rapides
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateConfiguration({
                          ...state.configuration,
                          apparence: {
                            ...state.configuration.apparence,
                            echelleAffichage: 0.75
                          }
                        })}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Petit (75%)
                      </button>
                      <button
                        onClick={() => updateConfiguration({
                          ...state.configuration,
                          apparence: {
                            ...state.configuration.apparence,
                            echelleAffichage: 1.0
                          }
                        })}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Normal (100%)
                      </button>
                      <button
                        onClick={() => updateConfiguration({
                          ...state.configuration,
                          apparence: {
                            ...state.configuration.apparence,
                            echelleAffichage: 1.25
                          }
                        })}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Grand (125%)
                      </button>
                      <button
                        onClick={() => updateConfiguration({
                          ...state.configuration,
                          apparence: {
                            ...state.configuration.apparence,
                            echelleAffichage: 1.5
                          }
                        })}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Très grand (150%)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Aperçu de l'échelle */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">👁️ Aperçu</h3>
                <div 
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                  style={{ 
                    transform: `scale(${state.configuration.apparence?.echelleAffichage || 1.0})`,
                    transformOrigin: 'top left'
                  }}
                >
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg text-gray-900">Exemple de texte</h4>
                    <p className="text-gray-700">
                      Ceci est un exemple de texte pour vous donner une idée de la taille de l'interface.
                    </p>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Bouton exemple
                      </button>
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                        Bouton secondaire
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  L'aperçu ci-dessus montre l'effet de l'échelle d'affichage sur l'interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">À propos</h3>
          
          <div className="space-y-4">
            <div className="card">
              <h4 className="font-medium text-gray-900 mb-2">Cabinet Médical</h4>
              <p className="text-sm text-gray-600">Version 1.0.0</p>
              <p className="text-sm text-gray-600 mt-2">
                Application de gestion pour cabinet médical avec support des feuilles de soins,
                factures et bordereaux de remise.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 