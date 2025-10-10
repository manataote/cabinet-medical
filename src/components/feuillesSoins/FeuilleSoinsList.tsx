import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { FeuilleSoins, Ordonnance } from '../../types';
import { CalculUtils } from '../../utils/calculs';
import PrintPreview from './PrintPreview';
import PrintPreviewPixelPerfect from './PrintPreviewPixelPerfect';
import { ValidationUtils } from '../../utils/validation';

interface FeuilleSoinsListProps {
  onEditFeuille: (feuille?: FeuilleSoins) => void;
}

const FeuilleSoinsList: React.FC<FeuilleSoinsListProps> = ({ onEditFeuille }) => {
  const { state, deleteFeuilleSoins, updateFeuilleSoins, formatDate, formatCurrency, formatNumber } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeuille, setSelectedFeuille] = useState<FeuilleSoins | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [feuilleToPrint, setFeuilleToPrint] = useState<FeuilleSoins | null>(null);
  const [showPixelPerfectPreview, setShowPixelPerfectPreview] = useState(false);
  const [feuilleToPrintPixelPerfect, setFeuilleToPrintPixelPerfect] = useState<FeuilleSoins | null>(null);
  
  // États pour la visualisation des ordonnances
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<Ordonnance | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showOrdonnanceChoiceModal, setShowOrdonnanceChoiceModal] = useState(false);
  const [matchingOrdonnances, setMatchingOrdonnances] = useState<Ordonnance[]>([]);
  const [currentFeuilleForOrdonnance, setCurrentFeuilleForOrdonnance] = useState<FeuilleSoins | null>(null);
  
  // État pour afficher ou non les feuilles de soins qui ont déjà un bordereau (par défaut: masquées)
  const [showFeuillesAvecBordereau, setShowFeuillesAvecBordereau] = useState(false);

  // Fonction utilitaire pour formater les montants avec la devise configurée
  const formaterMontant = (montant: number): string => {
    return formatCurrency(montant);
  };

  // Fonction pour formater les montants dans le PDF (sans symbole de devise)
  const formaterMontantPDF = (montant: number): string => {
    // Pour les francs pacifiques, pas de décimales, pas de symbole
    return formatNumber(Math.round(montant), 0);
  };

  // Fonction pour sélectionner une ordonnance
  const selectOrdonnance = (ordonnance: Ordonnance) => {
    setSelectedOrdonnance(ordonnance);
    setShowViewModal(true);
    setShowOrdonnanceChoiceModal(false);
  };

  // Fonction pour fermer le modal de choix d'ordonnance
  const closeOrdonnanceChoiceModal = () => {
    setShowOrdonnanceChoiceModal(false);
    setMatchingOrdonnances([]);
    setCurrentFeuilleForOrdonnance(null);
  };

  // Fonction pour imprimer une ordonnance (non utilisée actuellement)
  /*
  const handlePrintOrdonnance = (ordonnance: any) => {
    // Créer un PDF de l'ordonnance
    const { jsPDF } = require('jspdf');
    const doc = new jsPDF();
    
    // En-tête professionnel (même que pour les bordereaux)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Thibaud Carré - Podologue D.E.', 20, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Cabinet de Podologie', 20, 26);
    doc.text('123 Rue de la Paix', 20, 30);
    doc.text('98713 Papeete, Tahiti', 20, 34);
    doc.text('Tél: 40.12.34.56', 20, 38);
    doc.text('Email: thibaud.carre@podologue.pf', 20, 42);
    
    // Titre
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 255);
    doc.text('ORDONNANCE', 140, 20);
    
    // Informations de l'ordonnance
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const patient = state.patients.find(p => p.id === ordonnance.patient_id);
    const medecin = state.medecins.find(m => m.id === ordonnance.medecin_prescripteur);
    
    let yPos = 50;
    doc.text(`Patient: ${patient ? `${patient.prenom} ${patient.nom}` : 'Non trouvé'}`, 20, yPos);
    yPos += 10;
    doc.text(`Date de l'ordonnance: ${formatDate(ordonnance.date_ordonnance)}`, 20, yPos);
    yPos += 10;
    doc.text(`Type: ${ordonnance.type === 'soins' ? 'Soins' : 'Semelles orthopédiques'}`, 20, yPos);
    yPos += 10;
    doc.text(`Durée: ${ordonnance.duree_soins} séance(s)`, 20, yPos);
    yPos += 10;
    
    if (medecin) {
      doc.text(`Médecin prescripteur: ${medecin.nom} ${medecin.prenom}`, 20, yPos);
      yPos += 10;
    }
    
    if (ordonnance.commentaire) {
      doc.text('Commentaire:', 20, yPos);
      yPos += 10;
      doc.text(ordonnance.commentaire, 20, yPos);
      yPos += 10;
    }
    
    // Ouvrir le PDF dans un nouvel onglet
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    
    // Nettoyer l'URL après un délai
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
  };
  */

  // Fonction pour afficher l'ordonnance correspondante à une feuille de soins
  const handleShowOrdonnance = (feuille: FeuilleSoins) => {
    // Vérifier si la feuille a une date de prescription
    if (!feuille.datePrescription) {
      showErrorModal(
        'Date de prescription manquante',
        'Cette feuille de soins n\'a pas de date de prescription. Impossible de trouver l\'ordonnance correspondante.',
        'error'
      );
      return;
    }

    // Rechercher les ordonnances de soins pour ce patient
    const ordonnancesSoins = state.ordonnances.filter(ordonnance => 
      ordonnance.patient_id === feuille.patient_id && 
      ordonnance.type === 'soins'
    );

    if (ordonnancesSoins.length === 0) {
      showErrorModal(
        'Aucune ordonnance trouvée',
        `Aucune ordonnance de soins n'a été enregistrée pour le patient ${feuille.patient?.prenom || ''} ${feuille.patient?.nom || ''}.`,
        'warning'
      );
      return;
    }

    // Convertir la date de prescription en format comparable
    const datePrescription = new Date(feuille.datePrescription);
    const datePrescriptionStr = datePrescription.toDateString();

    // Rechercher les ordonnances avec la même date
    const ordonnancesMatching = ordonnancesSoins.filter(ordonnance => {
      const ordonnanceDate = new Date(ordonnance.date_ordonnance);
      return ordonnanceDate.toDateString() === datePrescriptionStr;
    });

    if (ordonnancesMatching.length === 0) {
      // Afficher les dates disponibles pour aider l'utilisateur
      const datesDisponibles = ordonnancesSoins.map(o => 
        formatDate(o.date_ordonnance)
      ).join(', ');
      
      showErrorModal(
        'Aucune ordonnance correspondante',
        `Aucune ordonnance de soins trouvée avec la date de prescription du ${formatDate(datePrescription)}.\n\nDates d'ordonnances disponibles : ${datesDisponibles}`,
        'warning'
      );
      return;
    }

    // Vérifier si les ordonnances ont des fichier_urls
    const ordonnancesAvecFichier = ordonnancesMatching.filter(ordonnance => ordonnance.fichier_url);
    
    if (ordonnancesAvecFichier.length === 0) {
      showErrorModal(
        'Aucun fichier_url d\'ordonnance',
        `Des ordonnances de soins existent pour la date du ${formatDate(datePrescription)}, mais aucun fichier_url n'a été importé.`,
        'warning'
      );
      return;
    }

    // Si une seule ordonnance trouvée, l'afficher directement
    if (ordonnancesAvecFichier.length === 1) {
      setSelectedOrdonnance(ordonnancesAvecFichier[0]);
      setShowViewModal(true);
      return;
    }

    // Si plusieurs ordonnances trouvées, demander à choisir
    setMatchingOrdonnances(ordonnancesAvecFichier);
    setCurrentFeuilleForOrdonnance(feuille);
    setShowOrdonnanceChoiceModal(true);
  };

  // Fonction pour afficher une modal d'erreur élégante
  const showErrorModal = (title: string, message: string, type: 'error' | 'warning' | 'info') => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    
    const iconColor = type === 'error' ? 'text-red-500' : type === 'warning' ? 'text-yellow-500' : 'text-blue-500';
    const borderColor = type === 'error' ? 'border-red-200' : type === 'warning' ? 'border-yellow-200' : 'border-blue-200';
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full ${borderColor} border-2">
        <div class="p-6">
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${type === 'error' ? 
                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />' :
                  type === 'warning' ?
                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />' :
                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
                }
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-gray-900">${title}</h3>
            </div>
          </div>
          <div class="mt-2">
            <p class="text-sm text-gray-600 whitespace-pre-line">${message}</p>
          </div>
          <div class="mt-6 flex justify-end">
            <button onclick="this.closest('.fixed').remove()" class="btn-primary">
              Compris
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-suppression après 10 secondes
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 10000);
  };

  // Fonction pour fermer la modal de visualisation
  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedOrdonnance(null);
  };


  // Fonction pour recalculer le montant total d'une feuille de soins en temps réel
  const recalculerMontantTotal = (feuille: FeuilleSoins): number => {
    if (!feuille.actes || feuille.actes.length === 0) return 0;
    
    return feuille.actes.reduce((total, acte) => {
      // Utiliser le montant déjà calculé et stocké dans l'acte
      return total + (acte.montant || 0);
    }, 0);
  };

  // Fonction pour convertir les centimètres en millimètres (jsPDF utilise mm par défaut)
  const cmToPoints = (cm: number): number => {
    // 1 cm = 10 mm
    // jsPDF utilise des millimètres par défaut
    return cm * 10;
  };

  // Constantes pour uniformiser l'apparence
  const PDF_CONFIG = {
    font: 'arial',
    fontStyle: 'normal',
    fontSize: 10, // Taille uniforme pour tous les textes
    checkboxSize: 2.5, // Taille uniforme pour toutes les cases à cocher (en mm)
    lineWidth: 0.4, // Épaisseur uniforme pour les lignes
    textColor: [0, 0, 0], // Couleur noire pour tous les textes
    lineColor: [0, 0, 0] // Couleur noire pour toutes les lignes
  };

  // Fonction pour récupérer la position configurée d'un élément
  const getPosition = (element: string, defaultX_cm: number, defaultY_cm: number): { x: number; y: number } => {
    const pos = state.configuration.positionnement?.[element];
    if (pos) {
      // Les positions configurées sont stockées en mm, les convertir en cm pour jsPDF
      return { x: pos.x / 10, y: pos.y / 10 };
    }
    // Si aucune position configurée n'existe, utiliser les valeurs par défaut (déjà en cm)
    return { x: defaultX_cm, y: defaultY_cm };
  };

  // Fonction pour ajouter du texte avec positionnement précis
  const addTextAtPosition = (doc: any, text: string, x: number, y: number) => {
    if (!text || text.trim() === '') {
      return;
    }
    
    try {
      // Vérifier que le document est valide
      if (!doc || typeof doc.setFont !== 'function') {
        return;
      }
      
      // Configuration de la police uniforme
      doc.setFont(PDF_CONFIG.font, PDF_CONFIG.fontStyle);
      doc.setFontSize(PDF_CONFIG.fontSize);
      doc.setTextColor(PDF_CONFIG.textColor[0], PDF_CONFIG.textColor[1], PDF_CONFIG.textColor[2]);
      
      // Conversion des centimètres en millimètres
      const xPoints = cmToPoints(x);
      const yPoints = cmToPoints(y);
      
      // Vérifier que les coordonnées sont valides
      if (isNaN(xPoints) || isNaN(yPoints)) {
        return;
      }
      
      // Ajouter le texte
      doc.text(text, xPoints, yPoints);
      
    } catch (error) {
      // Erreur silencieuse pour un PDF propre
    }
  };

  // Fonction pour ajouter une case à cocher avec positionnement précis
  const addCheckboxAtPosition = (doc: any, x: number, y: number, checked: boolean) => {
    try {
      // Vérifier que le document est valide
      if (!doc || typeof doc.setDrawColor !== 'function') {
        return;
      }
      
      // Ne rien dessiner si la case n'est pas cochée
      if (!checked) {
        return;
      }
      
      const size = PDF_CONFIG.checkboxSize; // Taille uniforme de la case en millimètres
      const xPos = cmToPoints(x);
      const yPos = cmToPoints(y);
      
      // Vérifier que les coordonnées sont valides
      if (isNaN(xPos) || isNaN(yPos)) {
        return;
      }
      
      // Dessiner le carré (case à cocher) avec style uniforme
      doc.setDrawColor(PDF_CONFIG.lineColor[0], PDF_CONFIG.lineColor[1], PDF_CONFIG.lineColor[2]);
      doc.setLineWidth(PDF_CONFIG.lineWidth);
      doc.rect(xPos, yPos - size, size, size, 'S'); // 'S' pour stroke (contour)
      
      // Ajouter la croix si cochée avec style uniforme
      if (checked) {
        doc.setDrawColor(PDF_CONFIG.lineColor[0], PDF_CONFIG.lineColor[1], PDF_CONFIG.lineColor[2]);
        doc.setLineWidth(PDF_CONFIG.lineWidth * 1.5); // Légèrement plus épaisse pour la croix
        
        // Croix diagonale (de haut-gauche à bas-droite)
        doc.line(xPos + 0.5, yPos - size + 0.5, xPos + size - 0.5, yPos - 0.5);
        // Croix diagonale (de haut-droite à bas-gauche)
        doc.line(xPos + 0.5, yPos - 0.5, xPos + size - 0.5, yPos - size + 0.5);
      }
      
    } catch (error) {
      // Erreur silencieuse pour un PDF propre
    }
  };

  // Fonction pour ajouter une ligne avec positionnement précis (non utilisée actuellement)
  // const addLineAtPosition = (doc: any, x1: number, y1: number, x2: number, y2: number) => {
  //   doc.line(cmToPoints(x1), cmToPoints(y1), cmToPoints(x2), cmToPoints(y2));
  // };

  // Fonction pour s'assurer qu'une feuille de soins a un numéro
  const ensureNumeroFeuilleSoins = (feuille: FeuilleSoins): FeuilleSoins => {
    if (!feuille.numeroFeuilleSoins || feuille.numeroFeuilleSoins.trim() === '') {
      // Générer un nouveau numéro si la feuille n'en a pas
      const nouveauNumero = ValidationUtils.generateNumeroFeuilleSoins();
      console.log(`🔧 Génération d'un nouveau numéro pour la feuille ${feuille.id}: ${nouveauNumero}`);
      
      // Mettre à jour l'état local
      const feuilleMiseAJour = { ...feuille, numeroFeuilleSoins: nouveauNumero };
      
      // Mettre à jour dans le contexte global
      updateFeuilleSoins(feuilleMiseAJour);
      
      return feuilleMiseAJour;
    }
    return feuille;
  };

  // Filtrer et s'assurer que toutes les feuilles ont un numéro
  const filteredFeuilles = state.feuillesSoins
    .map(ensureNumeroFeuilleSoins)
    .filter(feuille => {
      // Filtre de recherche
      const matchesSearch = feuille.patient?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feuille.patient?.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feuille.numeroFeuilleSoins.includes(searchTerm);
      
      // Filtre bordereau : si showFeuillesAvecBordereau est false, exclure les feuilles avec bordereau_id
      const matchesBordereauFilter = showFeuillesAvecBordereau || !feuille.bordereau_id;
      
      return matchesSearch && matchesBordereauFilter;
    });

  const handleDeleteFeuille = (feuilleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette feuille de soins ?')) {
      deleteFeuilleSoins(feuilleId);
    }
  };

  const handlePrintDirect = async (feuille: FeuilleSoins) => {
    try {
      // Import dynamique de jsPDF
      const jsPDF = await import('jspdf');
      
      // Création du document jsPDF en format A4
      const doc = new jsPDF.default('p', 'mm', 'a4');
      
      // Positionnement pixel-perfect selon les coordonnées configurées
      
      // 1. NUMÉRO DE LA FEUILLE DE SOINS
      if (feuille.numeroFeuilleSoins) {
        const pos = getPosition('numeroFeuilleSoins', 15, 3);
        addTextAtPosition(doc, feuille.numeroFeuilleSoins, pos.x, pos.y);
      }
      
      // 2. INFORMATIONS PATIENT PRINCIPAL
      if (feuille.patient) {
        
        // Nom du patient
        if (feuille.patient.nom) {
          const pos = getPosition('nomPatient', 2, 4);
          addTextAtPosition(doc, feuille.patient.nom, pos.x, pos.y);
        }
        
        // Prénom du patient
        if (feuille.patient.prenom) {
          const pos = getPosition('prenomPatient', 12, 4);
          addTextAtPosition(doc, feuille.patient.prenom, pos.x, pos.y);
        }
        
        // Numéro DN du patient
        // DN n'est pas disponible dans la nouvelle structure
        // if (feuille.patient.dn) {
        //   const pos = getPosition('dnPatient', 2, 4.5);
        //   addTextAtPosition(doc, feuille.patient.dn, pos.x, pos.y);
        // }
        
        // Date de naissance du patient
        if (feuille.patient.dateNaissance) {
          const dateFormatted = formaterDateSecurisee(feuille.patient.dateNaissance);
          if (dateFormatted) {
            const pos = getPosition('dateNaissancePatient', 15, 4.5);
            addTextAtPosition(doc, dateFormatted, pos.x, pos.y);
          }
        }
      }
      
      // 3. INFORMATIONS ASSURÉ (si différent du patient)
      if (feuille.assure) {
        
        // Nom de l'assuré
        if (feuille.assure.nom) {
          const pos = getPosition('nomAssure', 2, 5.7);
          addTextAtPosition(doc, feuille.assure.nom, pos.x, pos.y);
        }
        
        // Prénom de l'assuré
        if (feuille.assure.prenom) {
          const pos = getPosition('prenomAssure', 12, 5.7);
          addTextAtPosition(doc, feuille.assure.prenom, pos.x, pos.y);
        }
        
        // Numéro DN de l'assuré
        if (feuille.assure.dn) {
          const pos = getPosition('dnAssure', 2, 6.2);
          addTextAtPosition(doc, feuille.assure.dn, pos.x, pos.y);
        }
        
        // Date de naissance de l'assuré
        if (feuille.assure.dateNaissance) {
          const dateFormatted = formaterDateSecurisee(feuille.assure.dateNaissance);
          if (dateFormatted) {
            const pos = getPosition('dateNaissanceAssure', 15, 6.2);
            addTextAtPosition(doc, dateFormatted, pos.x, pos.y);
          }
        }
      }
      
      // 4. ADRESSE DU PATIENT (seulement si IK présents)
      const hasIK = feuille.actes.some(acte => acte.ik && acte.ik > 0);
      // Adresse n'est pas disponible dans la nouvelle structure
      // if (hasIK && feuille.patient?.adresse) {
      //   const pos = getPosition('adressePatient', 4, 7.5);
      //   addTextAtPosition(doc, feuille.patient.adresse, pos.x, pos.y);
      // }
      
      // 5. IDENTIFICATION DU PRATICIEN
      const idPraticien = state.configuration.parametres?.identificationPraticien;
      if (idPraticien) {
        const pos = getPosition('identificationPraticien', 9, 9);
        addTextAtPosition(doc, idPraticien, pos.x, pos.y);
      }
      
      // 6. AUXILIAIRE MÉDICAL REMPLAÇANT
      const auxiliaireRemplacant = state.configuration.parametres?.auxiliaireMedicalRemplacant;
      if (auxiliaireRemplacant) {
        const pos = getPosition('auxiliaireRemplacant', 8.5, 9.3);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
      }
      
      // 7. CONDITIONS SPÉCIALES
      
      // Parcours de soins
      if (feuille.parcoursSoins) {
        const pos = getPosition('parcoursSoins', 3, 11);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
      }
      
      // Accord préalable
      if (feuille.accordPrealable) {
        const pos = getPosition('accordPrealable', 8.5, 10.5);
        addTextAtPosition(doc, feuille.accordPrealable, pos.x, pos.y);
      }
      
      // Identification du médecin prescripteur
      const medecin = state.medecins.find(m => m.id === feuille.medecinPrescripteur);
      if (medecin?.identificationPrescripteur) {
        const pos = getPosition('identificationPrescripteur', 5.5, 11.5);
        addTextAtPosition(doc, medecin.identificationPrescripteur, pos.x, pos.y);
      }
      
      // Date de prescription
      if (feuille.datePrescription) {
        const dateFormatted = formaterDateSecurisee(feuille.datePrescription);
        if (dateFormatted) {
          const pos = getPosition('datePrescription', 11, 11.5);
          addTextAtPosition(doc, dateFormatted, pos.x, pos.y);
        }
      }
      
      // Longue maladie
      if (feuille.conditions?.longueMaladie) {
        const pos = getPosition('longueMaladie', 1, 11.5);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
      }
      
      // AT/MP
      if (feuille.conditions?.atmp) {
        const pos = getPosition('atMp', 3.8, 12.5);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
        
        // Numéro d'AT/MP
        if (feuille.conditions.numeroAtmp) {
          const pos = getPosition('numeroAtMp', 5.5, 12.5);
          addTextAtPosition(doc, feuille.conditions.numeroAtmp, pos.x, pos.y);
        }
      }
      
      // Maternité
      if (feuille.conditions?.maternite) {
        const pos = getPosition('maternite', 11, 12.5);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
      }
      
      // Autres dérogations
      if (feuille.conditions?.autresDerogations) {
        const pos = getPosition('autresDerogations', 13, 12.5);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
        
        // Justifications autres dérogations
        if (feuille.conditions.descriptionAutresDerogations) {
          const pos = getPosition('descriptionAutresDerogations', 16, 12.5);
          addTextAtPosition(doc, feuille.conditions.descriptionAutresDerogations, pos.x, pos.y);
        }
      }
      
      // Urgence
      if (feuille.conditions?.urgence) {
        const pos = getPosition('urgence', 1, 13.2);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
      }
      
      // Numéro panier de soins
      if (feuille.numeroPanierSoins) {
        const pos = getPosition('panierSoins', 6, 13.2);
        addTextAtPosition(doc, feuille.numeroPanierSoins, pos.x, pos.y);
      }
      
      // Numéro RSR
      if (feuille.rsr) {
        const pos = getPosition('rsr', 12, 13.2);
        addTextAtPosition(doc, feuille.rsr, pos.x, pos.y);
      }
      
      // 8. TABLEAU DES ACTES (16 lignes)
      const tableauPos = getPosition('tableauActes', 2, 14);
      const positionsY = [tableauPos.y, tableauPos.y + 0.6, tableauPos.y + 1.2, tableauPos.y + 1.8, tableauPos.y + 2.4, tableauPos.y + 3, tableauPos.y + 3.6, tableauPos.y + 4.2, tableauPos.y + 4.8, tableauPos.y + 5.4, tableauPos.y + 6, tableauPos.y + 6.6, tableauPos.y + 7.2, tableauPos.y + 7.8, tableauPos.y + 8.4, tableauPos.y + 9];
      
      feuille.actes.forEach((acte, index) => {
        if (index < 16) { // Maximum 16 actes
          const y = positionsY[index];
          
          // Date de l'acte (1 cm gauche)
          if (acte.date) {
            const dateFormatted = formaterDateSecurisee(acte.date);
            if (dateFormatted) {
              addTextAtPosition(doc, dateFormatted, 1, y);
            }
          }
          
          // Lettre clé (5 cm gauche)
          if (acte.lettreCle) {
            addTextAtPosition(doc, acte.lettreCle, 5, y);
          }
          
          // Coefficient (7 cm gauche)
          if (acte.coefficient) {
            addTextAtPosition(doc, acte.coefficient.toString(), 7, y);
          }
          
          // IFD (11.5 cm gauche)
          if (acte.ifd) {
            addCheckboxAtPosition(doc, 11.5, y, true);
          }
          
          // IK (13 cm gauche)
          if (acte.ik && acte.ik > 0) {
            addTextAtPosition(doc, acte.ik.toString(), 13, y);
          }
          
          // Dimanche et jours fériés
          if (acte.majorationDimanche) {
            const pos = getPosition('majorationDimanche', 15, y);
            addCheckboxAtPosition(doc, pos.x, y, true);
          }
          
          // Majoration de nuit
          if (acte.majorationNuit) {
            const pos = getPosition('majorationNuit', 16.5, y);
            addCheckboxAtPosition(doc, pos.x, y, true);
          }
          
          // Montant total calculé de l'acte (17.5 cm gauche)
          const montantActe = acte.montant || 0;
          addTextAtPosition(doc, montantActe.toString(), 17.5, y);
        }
      });
      
      // 9. TOTAUX
      const montantTotal = recalculerMontantTotal(feuille);
      const posTotal = getPosition('montantTotal', 9, 24);
      addTextAtPosition(doc, formaterMontantPDF(montantTotal), posTotal.x, posTotal.y);
      
      // Montant payé par l'assuré
      if (feuille.montantPaye) {
        const pos = getPosition('montantPaye', 7, 27);
        addTextAtPosition(doc, formaterMontantPDF(feuille.montantPaye), pos.x, pos.y);
      }
      
      // Montant du tiers payant
      if (feuille.montantTiersPayant) {
        const pos = getPosition('tiersPayant', 11, 27);
        addTextAtPosition(doc, formaterMontantPDF(feuille.montantTiersPayant), pos.x, pos.y);
      }
      
      // Ouvrir le PDF dans un nouvel onglet
      const pdfBlob = doc.output('blob');
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Ouvrir le PDF dans un nouvel onglet
      const newTab = window.open(pdfUrl, '_blank');
      if (!newTab) {
        // Popup bloqué, on peut afficher un message dans la console
        console.warn('Veuillez autoriser les popups pour ouvrir le PDF');
      }
      
      // Nettoyer l'URL après un délai
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  const handleDownloadPDF = async (feuille: FeuilleSoins) => {
    try {
      // Import dynamique de jsPDF
      const jsPDF = await import('jspdf');
      const doc = new jsPDF.default();
      
      // Positionnement pixel-perfect identique à handlePrintDirect
      
      // 1. NUMÉRO DE LA FEUILLE DE SOINS
      if (feuille.numeroFeuilleSoins) {
        const pos = getPosition('numeroFeuilleSoins', 15, 3);
        addTextAtPosition(doc, feuille.numeroFeuilleSoins, pos.x, pos.y);
      }
      
      // 2. INFORMATIONS PATIENT PRINCIPAL
      if (feuille.patient) {
        // Nom du patient
        if (feuille.patient.nom) {
          const pos = getPosition('nomPatient', 2, 4);
          addTextAtPosition(doc, feuille.patient.nom, pos.x, pos.y);
        }
        
        // Prénom du patient
        if (feuille.patient.prenom) {
          const pos = getPosition('prenomPatient', 12, 4);
          addTextAtPosition(doc, feuille.patient.prenom, pos.x, pos.y);
        }
        
        // Numéro DN du patient
        // DN n'est pas disponible dans la nouvelle structure
        // if (feuille.patient.dn) {
        //   const pos = getPosition('dnPatient', 2, 4.5);
        //   addTextAtPosition(doc, feuille.patient.dn, pos.x, pos.y);
        // }
        
        // Date de naissance du patient
        if (feuille.patient.dateNaissance) {
          const dateFormatted = formaterDateSecurisee(feuille.patient.dateNaissance);
          if (dateFormatted) {
            const pos = getPosition('dateNaissancePatient', 15, 4.5);
            addTextAtPosition(doc, dateFormatted, pos.x, pos.y);
          }
        }
      }
      
      // 3. INFORMATIONS ASSURÉ (si différent du patient)
      if (feuille.assure) {
        // Nom de l'assuré
        if (feuille.assure.nom) {
          const pos = getPosition('nomAssure', 2, 5.7);
          addTextAtPosition(doc, feuille.assure.nom, pos.x, pos.y);
        }
        
        // Prénom de l'assuré
        if (feuille.assure.prenom) {
          const pos = getPosition('prenomAssure', 12, 5.7);
          addTextAtPosition(doc, feuille.assure.prenom, pos.x, pos.y);
        }
        
        // Numéro DN de l'assuré
        if (feuille.assure.dn) {
          const pos = getPosition('dnAssure', 2, 6.2);
          addTextAtPosition(doc, feuille.assure.dn, pos.x, pos.y);
        }
        
        // Date de naissance de l'assuré
        if (feuille.assure.dateNaissance) {
          const dateFormatted = formaterDateSecurisee(feuille.assure.dateNaissance);
          if (dateFormatted) {
            const pos = getPosition('dateNaissanceAssure', 15, 6.2);
            addTextAtPosition(doc, dateFormatted, pos.x, pos.y);
          }
        }
      }
      
      // 4. ADRESSE DU PATIENT (seulement si IK présents)
      const hasIK = feuille.actes.some(acte => acte.ik && acte.ik > 0);
      // Adresse n'est pas disponible dans la nouvelle structure
      // if (hasIK && feuille.patient?.adresse) {
      //   const pos = getPosition('adressePatient', 4, 7.5);
      //   addTextAtPosition(doc, feuille.patient.adresse, pos.x, pos.y);
      // }
      
      // 5. IDENTIFICATION DU PRATICIEN
      const idPraticien = state.configuration.parametres?.identificationPraticien;
      if (idPraticien) {
        const pos = getPosition('identificationPraticien', 9, 9);
        addTextAtPosition(doc, idPraticien, pos.x, pos.y);
      }
      
      // 6. AUXILIAIRE MÉDICAL REMPLAÇANT
      const auxiliaireRemplacant = state.configuration.parametres?.auxiliaireMedicalRemplacant;
      if (auxiliaireRemplacant) {
        const pos = getPosition('auxiliaireRemplacant', 8.5, 9.3);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
      }
      
      // 7. CONDITIONS SPÉCIALES
      
      // Parcours de soins
      if (feuille.parcoursSoins) {
        const pos = getPosition('parcoursSoins', 3, 11);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
      }
      
      // Accord préalable
      if (feuille.accordPrealable) {
        const pos = getPosition('accordPrealable', 8.5, 10.5);
        addTextAtPosition(doc, feuille.accordPrealable, pos.x, pos.y);
      }
      
      // Identification du médecin prescripteur
      const medecin = state.medecins.find(m => m.id === feuille.medecinPrescripteur);
      if (medecin?.identificationPrescripteur) {
        const pos = getPosition('identificationPrescripteur', 5.5, 11.5);
        addTextAtPosition(doc, medecin.identificationPrescripteur, pos.x, pos.y);
      }
      
      // Date de prescription
      if (feuille.datePrescription) {
        const dateFormatted = formaterDateSecurisee(feuille.datePrescription);
        if (dateFormatted) {
          const pos = getPosition('datePrescription', 11, 11.5);
          addTextAtPosition(doc, dateFormatted, pos.x, pos.y);
        }
      }
      
      // Longue maladie
      if (feuille.conditions?.longueMaladie) {
        const pos = getPosition('longueMaladie', 1, 11.5);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
      }
      
      // AT/MP
      if (feuille.conditions?.atmp) {
        const pos = getPosition('atMp', 3.8, 12.5);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
        
        // Numéro d'AT/MP
        if (feuille.conditions.numeroAtmp) {
          const pos = getPosition('numeroAtMp', 5.5, 12.5);
          addTextAtPosition(doc, feuille.conditions.numeroAtmp, pos.x, pos.y);
        }
      }
      
      // Maternité
      if (feuille.conditions?.maternite) {
        const pos = getPosition('maternite', 11, 12.5);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
      }
      
      // Autres dérogations
      if (feuille.conditions?.autresDerogations) {
        const pos = getPosition('autresDerogations', 13, 12.5);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
        
        // Justifications autres dérogations
        if (feuille.conditions.descriptionAutresDerogations) {
          const pos = getPosition('descriptionAutresDerogations', 16, 12.5);
          addTextAtPosition(doc, feuille.conditions.descriptionAutresDerogations, pos.x, pos.y);
        }
      }
      
      // Urgence
      if (feuille.conditions?.urgence) {
        const pos = getPosition('urgence', 1, 13.2);
        addCheckboxAtPosition(doc, pos.x, pos.y, true);
      }
      
      // Numéro panier de soins
      if (feuille.numeroPanierSoins) {
        const pos = getPosition('panierSoins', 6, 13.2);
        addTextAtPosition(doc, feuille.numeroPanierSoins, pos.x, pos.y);
      }
      
      // Numéro RSR
      if (feuille.rsr) {
        const pos = getPosition('rsr', 12, 13.2);
        addTextAtPosition(doc, feuille.rsr, pos.x, pos.y);
      }
      
      // 8. TABLEAU DES ACTES (16 lignes)
      const tableauPos = getPosition('tableauActes', 2, 14);
      const positionsY = [tableauPos.y, tableauPos.y + 0.6, tableauPos.y + 1.2, tableauPos.y + 1.8, tableauPos.y + 2.4, tableauPos.y + 3, tableauPos.y + 3.6, tableauPos.y + 4.2, tableauPos.y + 4.8, tableauPos.y + 5.4, tableauPos.y + 6, tableauPos.y + 6.6, tableauPos.y + 7.2, tableauPos.y + 7.8, tableauPos.y + 8.4, tableauPos.y + 9];
      
      feuille.actes.forEach((acte, index) => {
        if (index < 16) { // Maximum 16 actes
          const y = positionsY[index];
          
          // Date de l'acte
          if (acte.date) {
            const dateFormatted = formaterDateSecurisee(acte.date);
            if (dateFormatted) {
              addTextAtPosition(doc, dateFormatted, tableauPos.x + 0, y);
            }
          }
          
          // Lettre clé
          if (acte.lettreCle) {
            addTextAtPosition(doc, acte.lettreCle, tableauPos.x + 3, y);
          }
          
          // Coefficient
          if (acte.coefficient) {
            addTextAtPosition(doc, acte.coefficient.toString(), tableauPos.x + 5, y);
          }
          
          // IFD
          if (acte.ifd) {
            addCheckboxAtPosition(doc, tableauPos.x + 9.5, y, true);
          }
          
          // IK
          if (acte.ik && acte.ik > 0) {
            addTextAtPosition(doc, acte.ik.toString(), tableauPos.x + 11, y);
          }
          
          // Dimanche et jours fériés
          if (acte.majorationDimanche) {
            const pos = getPosition('majorationDimanche', 15, y);
            addCheckboxAtPosition(doc, pos.x, y, true);
          }
          
          // Majoration de nuit
          if (acte.majorationNuit) {
            const pos = getPosition('majorationNuit', 16.5, y);
            addCheckboxAtPosition(doc, pos.x, y, true);
          }
          
          // Montant total calculé de l'acte
          const montantActe = acte.montant || 0;
          addTextAtPosition(doc, formaterMontantPDF(montantActe), tableauPos.x + 15.5, y);
        }
      });
      
      // 9. TOTAUX
      // Montant total des actes (9 cm gauche, 24 cm haut)
      const montantTotal = recalculerMontantTotal(feuille);
      const posTotal = getPosition('montantTotal', 9, 24);
      addTextAtPosition(doc, formaterMontantPDF(montantTotal), posTotal.x, posTotal.y);
      
      // Montant payé par l'assuré
      if (feuille.montantPaye) {
        const pos = getPosition('montantPaye', 7, 27);
        addTextAtPosition(doc, formaterMontantPDF(feuille.montantPaye), pos.x, pos.y);
      }
      
      // Montant du tiers payant
      if (feuille.montantTiersPayant) {
        const pos = getPosition('tiersPayant', 11, 27);
        addTextAtPosition(doc, formaterMontantPDF(feuille.montantTiersPayant), pos.x, pos.y);
      }
      
      // Télécharger le PDF
      doc.save(`feuille-soins-${feuille.numeroFeuilleSoins || 'sans-numero'}.pdf`);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  const handleClosePrintPreview = () => {
    setShowPrintPreview(false);
    setFeuilleToPrint(null);
  };

  const handleClosePixelPerfectPreview = () => {
    setShowPixelPerfectPreview(false);
    setFeuilleToPrintPixelPerfect(null);
  };

  // Fonction pour convertir une date en objet Date valide
  const convertirDate = (date: any): Date | null => {
    if (!date) return null;
    
    if (date instanceof Date) {
      return date;
    }
    
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) ? null : dateObj;
    }
    
    return null;
  };

  // Fonction pour formater une date de manière sécurisée
  const formaterDateSecurisee = (date: any): string => {
    const dateObj = convertirDate(date);
    if (!dateObj) return '';
    
    try {
      return formatDate(dateObj);
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feuilles de soins</h1>
          <p className="text-gray-600">Gestion des feuilles de soins CPS</p>
        </div>
        <button onClick={() => onEditFeuille()} className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouvelle feuille
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher une feuille de soins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showFeuillesAvecBordereau}
              onChange={(e) => setShowFeuillesAvecBordereau(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Afficher les feuilles avec bordereau</span>
          </label>
        </div>
        <div className="text-sm text-gray-500">
          {filteredFeuilles.length} feuille(s) trouvée(s)
        </div>
      </div>

      {/* Liste des feuilles de soins */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell" style={{width: '20%'}}>Patient</th>
                <th className="table-header-cell" style={{width: '18%'}}>N° Facture</th>
                <th className="table-header-cell" style={{width: '12%'}}>Date</th>
                <th className="table-header-cell" style={{width: '10%'}}>Actes</th>
                <th className="table-header-cell" style={{width: '15%'}}>Montant</th>
                <th className="table-header-cell" style={{width: '25%'}}>Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredFeuilles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-gray-500 py-8">
                    {searchTerm ? 'Aucune feuille trouvée' : 'Aucune feuille de soins enregistrée'}
                  </td>
                </tr>
              ) : (
                filteredFeuilles.map((feuille) => (
                  <tr key={feuille.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">
                          {feuille.patient?.prenom || ''} {feuille.patient?.nom || ''}
                        </div>
                        {/* DN n'est pas disponible dans la nouvelle structure */}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono">{feuille.numeroFeuilleSoins}</span>
                    </td>
                    <td className="table-cell">
                      {formatDate(feuille.datePrescription)}
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-info">
                        {(() => {
                          const nombreActes = feuille.actes.length;
                          return nombreActes >= 2 ? `${nombreActes} actes` : `${nombreActes} acte`;
                        })()}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold">{formaterMontant(recalculerMontantTotal(feuille))}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-1 flex-wrap">
                        <button
                          onClick={() => setSelectedFeuille(feuille)}
                          className="text-primary-600 hover:text-primary-900 transition-colors duration-200 p-2 rounded-lg hover:bg-primary-50"
                          title="Voir les détails"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEditFeuille(feuille)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleShowOrdonnance(feuille)}
                          className="text-purple-600 hover:text-purple-900 transition-colors duration-200 p-2 rounded-lg hover:bg-purple-50"
                          title="Voir l'ordonnance"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePrintDirect(feuille)}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200 p-2 rounded-lg hover:bg-green-50"
                          title="Ouvrir en PDF"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteFeuille(feuille.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200 p-2 rounded-lg hover:bg-red-50"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(feuille)}
                          className="text-purple-600 hover:text-purple-900 transition-colors duration-200 p-2 rounded-lg hover:bg-purple-50"
                          title="Télécharger en PDF"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de détails de la feuille de soins */}
      {selectedFeuille && (
        <div className="modal-overlay" onClick={() => setSelectedFeuille(null)}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails de la feuille de soins
              </h3>
              <button
                onClick={() => setSelectedFeuille(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations patient */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Informations patient</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Nom:</span> {selectedFeuille.patient?.prenom || ''} {selectedFeuille.patient?.nom || ''}</p>
                    {/* DN, Adresse et Téléphone ne sont pas disponibles dans la nouvelle structure */}
                  </div>
                </div>

                {/* Informations feuille */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Informations feuille</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">N° Facture:</span> {selectedFeuille.numeroFeuilleSoins}</p>
                    <p><span className="font-medium">Date prescription:</span> {formatDate(selectedFeuille.datePrescription)}</p>
                    <p><span className="font-medium">Médecin prescripteur:</span> {(() => {
                      const medecin = state.medecins.find(m => m.id === selectedFeuille.medecinPrescripteur);
                      return medecin ? `Dr. ${medecin.prenom} ${medecin.nom} - ${medecin.identificationPrescripteur || 'N/A'}` : selectedFeuille.medecinPrescripteur;
                    })()}</p>
                    <p><span className="font-medium">Parcours de soins:</span> {selectedFeuille.parcoursSoins ? 'Oui' : 'Non'}</p>
                  </div>
                </div>
              </div>

              {/* Actes */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Actes ({selectedFeuille.actes.length})</h4>
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Date</th>
                        <th className="table-header-cell">Lettre clé</th>
                        <th className="table-header-cell">Coefficient</th>
                        <th className="table-header-cell">IFD</th>
                        <th className="table-header-cell">IK</th>
                        <th className="table-header-cell">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {selectedFeuille.actes.map((acte, index) => (
                        <tr key={index} className="table-row">
                          <td className="table-cell">
                            {formatDate(acte.date)}
                          </td>
                          <td className="table-cell">{acte.lettreCle}</td>
                          <td className="table-cell">{acte.coefficient}</td>
                          <td className="table-cell">
                            {acte.ifd ? (
                              <span className="badge badge-success">Oui</span>
                            ) : (
                              <span className="badge badge-warning">Non</span>
                            )}
                          </td>
                          <td className="table-cell">{acte.ik || '-'}</td>
                          <td className="table-cell font-semibold">
                            {formaterMontant(acte.montant || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Montant total:</span>
                    <p className="text-lg font-bold text-gray-900">
                      {formaterMontant(recalculerMontantTotal(selectedFeuille))}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Montant payé:</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {formaterMontant(selectedFeuille.montantPaye)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Tiers payant:</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {formaterMontant(Math.max(0, recalculerMontantTotal(selectedFeuille) - (selectedFeuille.montantPaye || 0)))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setSelectedFeuille(null)}
                className="btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de prévisualisation d'impression */}
      {showPrintPreview && feuilleToPrint && (
        <PrintPreview
          feuille={feuilleToPrint}
          onClose={handleClosePrintPreview}
          onPrint={() => handlePrintDirect(feuilleToPrint)}
          onSavePDF={() => handleDownloadPDF(feuilleToPrint)}
        />
      )}

      {/* Modal de prévisualisation d'impression pixel-perfect */}
      {showPixelPerfectPreview && feuilleToPrintPixelPerfect && (
        <PrintPreviewPixelPerfect
          feuille={feuilleToPrintPixelPerfect}
          onClose={handleClosePixelPerfectPreview}
        />
      )}

      {/* Modal de visualisation des ordonnances */}
      {showViewModal && selectedOrdonnance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
            {/* Header de la modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Visualisation - {selectedOrdonnance.nom_fichier || 'Ordonnance'}
                </h3>
                <p className="text-sm text-gray-600">
                  Ordonnance du {formatDate(selectedOrdonnance.date_ordonnance)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (selectedOrdonnance.fichier_url) {
                      window.open(selectedOrdonnance.fichier_url, '_blank');
                    }
                  }}
                  className="btn-primary"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Nouvel onglet
                </button>
                <button
                  onClick={() => {
                    if (selectedOrdonnance.fichier_url) {
                      window.print();
                    }
                  }}
                  className="btn-secondary"
                  title="Imprimer"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimer
                </button>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  title="Fermer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenu de la modal */}
            <div className="flex-1 p-4 overflow-hidden min-h-0">
              {(() => {
                const isImage = selectedOrdonnance.type_fichier?.startsWith('image/') || 
                               selectedOrdonnance.nom_fichier?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|tiff)$/);
                const isPDF = selectedOrdonnance.type_fichier === 'application/pdf' || 
                              selectedOrdonnance.nom_fichier?.toLowerCase().endsWith('.pdf');

                if (isPDF) {
                  return (
                    <div className="w-full h-full">
                      <iframe
                        src={selectedOrdonnance.fichier_url}
                        className="w-full h-full border border-gray-200 rounded-lg"
                        title={`PDF - ${selectedOrdonnance.nom_fichier || 'Ordonnance'}`}
                        style={{ minHeight: '600px' }}
                      />
                    </div>
                  );
                } else if (isImage) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <img
                        src={selectedOrdonnance.fichier_url}
                        alt={`Ordonnance - ${selectedOrdonnance.nom_fichier || 'Ordonnance'}`}
                        className="max-w-full max-h-full object-contain border border-gray-200 rounded-lg shadow-lg"
                      />
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                          Type de fichier_url non supporté
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Ce type de fichier_url ne peut pas être affiché directement.
                        </p>
                        <div className="mt-4">
                          <button
                            onClick={() => {
                              if (selectedOrdonnance.fichier_url) {
                                window.open(selectedOrdonnance.fichier_url, '_blank');
                              }
                            }}
                            className="btn-primary"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Ouvrir dans un nouvel onglet
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de choix d'ordonnance (cas multiples) */}
      {showOrdonnanceChoiceModal && currentFeuilleForOrdonnance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Choisir une ordonnance
                </h3>
                <button
                  onClick={closeOrdonnanceChoiceModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Plusieurs ordonnances de soins ont été trouvées pour la date du {formatDate(currentFeuilleForOrdonnance.datePrescription)}. 
                Veuillez choisir celle que vous souhaitez visualiser :
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {matchingOrdonnances.map((ordonnance, index) => {
                  const medecin = state.medecins.find(m => m.id === ordonnance.medecin_prescripteur);
                  return (
                    <div
                      key={ordonnance.id}
                      onClick={() => selectOrdonnance(ordonnance)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                Ordonnance #{index + 1} - {ordonnance.nom_fichier || 'Sans nom'}
                              </p>
                              <div className="mt-1 text-sm text-gray-500">
                                <p>Médecin : {medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : 'Inconnu'}</p>
                                <p>Durée : {ordonnance.duree_soins} mois</p>
                                {ordonnance.taille_fichier && (
                                  <p>Taille : {(() => {
                                    const bytes = ordonnance.taille_fichier;
                                    if (bytes < 1024) return `${bytes} B`;
                                    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                                    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                                  })()}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeOrdonnanceChoiceModal}
                  className="btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeuilleSoinsList; 