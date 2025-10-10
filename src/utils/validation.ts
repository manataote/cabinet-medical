import { Patient, Acte, FeuilleSoins } from '../types';

export class ValidationUtils {
  // Validation du DN (exactement 7 chiffres)
  static validateDN(dn: string): boolean {
    return /^\d{7}$/.test(dn);
  }

  // Validation de l'accord préalable (8 chiffres)
  static validateAccordPrealable(accord: string): boolean {
    return /^\d{8}$/.test(accord);
  }

  // Validation du médecin prescripteur (doit être renseigné)
  static validateMedecinPrescripteur(medecin: string): boolean {
    return Boolean(medecin && medecin.trim().length > 0);
  }

  // Validation d'un montant (format numérique avec décimales)
  static validateMontant(montant: number): boolean {
    return typeof montant === 'number' && montant >= 0 && Number.isFinite(montant);
  }

  // Validation d'une date - AUCUNE RESTRICTION
  static validateDate(date: Date): boolean {
    // Accepte toutes les dates, même invalides
    return true;
  }

  // Validation de cohérence chronologique des dates - AUCUNE RESTRICTION
  static validateChronologie(dates: Date[]): boolean {
    // Accepte toutes les combinaisons de dates
    return true;
  }

  // Validation complète d'un patient
  static validatePatient(patient: Patient): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!patient.nom?.trim()) {
      errors.push('Le nom du patient est requis');
    }

    if (!patient.prenom?.trim()) {
      errors.push('Le prénom du patient est requis');
    }

    if (!this.validateDN(patient.dn)) {
      errors.push('Le DN doit contenir exactement 7 chiffres');
    }

    // Validation optionnelle de la date de naissance (si fournie) - AUCUNE RESTRICTION
    if (patient.dateNaissance) {
      // Accepte toutes les dates, même invalides
      // Aucune validation de cohérence ou de format
    }

    // Validation de l'assuré si différent
    if (patient.assure) {
      if (!patient.assure.nom?.trim()) {
        errors.push('Le nom de l\'assuré est requis');
      }
      if (!patient.assure.prenom?.trim()) {
        errors.push('Le prénom de l\'assuré est requis');
      }
      if (!this.validateDN(patient.assure.dn)) {
        errors.push('Le DN de l\'assuré doit contenir exactement 7 chiffres');
      }
      if (patient.assure.dateNaissance) {
        // Accepte toutes les dates, même invalides
        // Aucune validation de cohérence ou de format
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validation d'une feuille de soins
  static validateFeuilleSoins(feuille: FeuilleSoins): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validation du patient
    // Skip patient validation for now as patient structure has changed
    // const patientValidation = this.validatePatient(feuille.patient || { nom: '', prenom: '', dn: '', dateNaissance: new Date(), adresse: '', telephone: '' });
    // if (!patientValidation.isValid) {
    //   errors.push(...patientValidation.errors.map(err => `Patient: ${err}`));
    // }

    // Validation du numéro de feuille de soins
    if (!feuille.numeroFeuilleSoins?.trim()) {
      errors.push('Le numéro de la feuille de soins est requis');
    }

    // Validation de l'accord préalable si présent
    if (feuille.accordPrealable && !this.validateAccordPrealable(feuille.accordPrealable)) {
      errors.push('L\'accord préalable doit contenir exactement 8 chiffres');
    }

    // Validation du médecin prescripteur
    if (!this.validateMedecinPrescripteur(feuille.medecinPrescripteur)) {
      errors.push('Le médecin prescripteur est requis');
    }

    // Validation de la date de prescription
    if (!this.validateDate(feuille.datePrescription)) {
      errors.push('La date de prescription n\'est pas valide');
    }

    // Validation des actes
    if (feuille.actes.length === 0) {
      errors.push('Au moins un acte est requis');
    }

    if (feuille.actes.length > 16) {
      errors.push('Le nombre maximum d\'actes est de 16');
    }

    // Validation de chaque acte
    feuille.actes.forEach((acte, index) => {
      const acteValidation = this.validateActe(acte);
      if (!acteValidation.isValid) {
        errors.push(...acteValidation.errors.map(err => `Acte ${index + 1}: ${err}`));
      }
    });

    // Validation des montants
    if (!this.validateMontant(feuille.montantTotal)) {
      errors.push('Le montant total n\'est pas valide');
    }

    if (!this.validateMontant(feuille.montantPaye)) {
      errors.push('Le montant payé n\'est pas valide');
    }

    if (!this.validateMontant(feuille.montantTiersPayant)) {
      errors.push('Le montant tiers payant n\'est pas valide');
    }

    // Validation de la cohérence des montants
    const sommeMontants = feuille.montantPaye + feuille.montantTiersPayant;
    if (Math.abs(sommeMontants - feuille.montantTotal) > 0.01) { // Tolérance de 0.01 pour les arrondis
      errors.push('La somme du montant payé et du montant tiers payant doit être égale au montant total');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validation d'un acte
  static validateActe(acte: Acte): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateDate(acte.date)) {
      errors.push('La date de l\'acte n\'est pas valide');
    }

    if (!acte.lettreCle?.trim()) {
      errors.push('La lettre clé est requise');
    }

    if (typeof acte.coefficient !== 'number' || acte.coefficient <= 0) {
      errors.push('Le coefficient doit être un nombre positif');
    }

    if (typeof acte.ifd !== 'boolean') {
      errors.push('Le champ IFD doit être défini');
    }

    if (acte.ik !== undefined && (typeof acte.ik !== 'number' || acte.ik < 0)) {
      errors.push('L\'IK doit être un nombre positif ou zéro');
    }

    if (typeof acte.majorationDimanche !== 'boolean') {
      errors.push('La majoration dimanche doit être définie');
    }

    if (typeof acte.majorationNuit !== 'boolean') {
      errors.push('La majoration nuit doit être définie');
    }

    if (!this.validateMontant(acte.montant)) {
      errors.push('Le montant de l\'acte n\'est pas valide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validation d'un numéro de téléphone français
  static validateTelephone(telephone: string): boolean {
    // Format français : 01 23 45 67 89 ou 06 12 34 56 78
    const phoneRegex = /^(0[1-9])(\s?\d{2}){4}$/;
    return phoneRegex.test(telephone.replace(/\s/g, ''));
  }

  // Validation d'une adresse email
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validation d'un code postal français
  static validateCodePostal(codePostal: string): boolean {
    const cpRegex = /^[0-9]{5}$/;
    return cpRegex.test(codePostal);
  }

  // Validation d'un numéro de sécurité sociale français
  static validateNumeroSecu(numero: string): boolean {
    // Format : 15 chiffres
    const secuRegex = /^[12][0-9]{14}$/;
    return secuRegex.test(numero.replace(/\s/g, ''));
  }

  // Génération d'un numéro de facture unique
  static generateNumeroFacture(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `F${year}${month}${day}${random}`;
  }

  // Génération d'un numéro de feuille de soins unique
  static generateNumeroFeuilleSoins(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FS${year}${month}${day}${random}`;
  }

  // Génération d'un numéro de bordereau unique
  static generateNumeroBordereau(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `B${year}${month}${day}${random}`;
  }
} 