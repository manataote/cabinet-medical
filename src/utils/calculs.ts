import { Acte, FeuilleSoins, FactureSemelles, ArticleSemelles } from '../types';

export class CalculUtils {
  // Calcul du montant d'un acte
  static calculerMontantActe(
    acte: Acte, 
    multiplicateurIK: number = 0.35, 
    tarifIFD: number = 2.0, 
    tarif?: number,
    majorationNuit: number = 0.0,
    majorationDimanche: number = 0.0
  ): number {
    // Calculer le montant de base (le tarif, SANS multiplier par le coefficient)
    let montant = 0;
    
    if (tarif) {
      // Utiliser le tarif fourni en paramètre (le coefficient est juste une info, pas un multiplicateur)
      montant = tarif;
    } else if (acte.montant) {
      // Fallback: utiliser acte.montant si le tarif n'est pas fourni
      montant = acte.montant;
    } else {
      // Fallback: montant par défaut
      montant = 0;
    }

    // Majoration dimanche (configurable)
    if (acte.majorationDimanche && majorationDimanche > 0) {
      montant += majorationDimanche;
    }

    // Majoration nuit (configurable)
    if (acte.majorationNuit && majorationNuit > 0) {
      montant += majorationNuit;
    }

    // Majoration IFD (Indemnité Forfaitaire de Déplacement)
    if (acte.ifd) {
      montant += tarifIFD; // Tarif IFD configurable
    }

    // Majoration IK (Indemnité Kilométrique)
    if (acte.ik && acte.ik > 0) {
      montant += acte.ik * multiplicateurIK; // Multiplicateur configurable
    }

    return Math.round(montant * 100) / 100; // Arrondi à 2 décimales
  }

  // Calcul du montant total d'une feuille de soins
  static calculerMontantTotalFeuille(
    feuille: FeuilleSoins, 
    multiplicateurIK: number = 0.35, 
    tarifIFD: number = 2.0, 
    tarifs?: { [lettreCle: string]: number },
    majorationNuit: number = 0.0,
    majorationDimanche: number = 0.0
  ): number {
    return feuille.actes.reduce((total, acte) => {
      const tarif = tarifs ? tarifs[acte.lettreCle] : undefined;
      return total + this.calculerMontantActe(acte, multiplicateurIK, tarifIFD, tarif, majorationNuit, majorationDimanche);
    }, 0);
  }

  // Calcul du montant tiers payant
  static calculerMontantTiersPayant(montantTotal: number, montantPaye: number): number {
    return Math.max(0, montantTotal - montantPaye);
  }

  // Calcul du montant total d'une facture semelles
  static calculerMontantTotal(facture: FactureSemelles): number {
    return facture.actesOrthopediques.reduce((total, acte) => {
      return total + acte.total;
    }, 0);
  }

  // Calcul du montant TTC d'une facture semelles
  static calculerMontantTTC(montantHT: number, tauxTVA: number): number {
    return montantHT * (1 + tauxTVA / 100);
  }

  // Calcul du montant total d'un bordereau
  static calculerMontantTotalBordereau(feuillesSoins: FeuilleSoins[]): number {
    return feuillesSoins.reduce((total, feuille) => {
      return total + feuille.montantTotal;
    }, 0);
  }

  // Calcul du montant d'un article semelles
  static calculerMontantArticle(article: ArticleSemelles): number {
    return article.prixUnitaire * article.quantite;
  }

  // Calcul automatique des totaux pour une feuille de soins
  static recalculerTotauxFeuille(feuille: FeuilleSoins): FeuilleSoins {
    const montantTotal = this.calculerMontantTotalFeuille(feuille);
    const montantTiersPayant = this.calculerMontantTiersPayant(montantTotal, feuille.montantPaye);

    return {
      ...feuille,
      montantTotal,
      montantTiersPayant
    };
  }

  // Calcul automatique des totaux pour une facture semelles
  static recalculerTotauxFacture(facture: FactureSemelles): FactureSemelles {
    const montantTotal = this.calculerMontantTotal(facture);

    return {
      ...facture,
      montantTotal
    };
  }

  // Formatage d'un montant en Francs Pacifiques (XPF) uniquement
  static formaterMontant(montant: number): string {
    // Formatage en Francs Pacifiques sans décimales
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XPF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  }

  // Formatage d'un pourcentage
  static formaterPourcentage(pourcentage: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(pourcentage / 100);
  }

  // Calcul de la TVA
  static calculerTVA(montantHT: number, tauxTVA: number): number {
    return montantHT * (tauxTVA / 100);
  }

  // Calcul du montant HT à partir du TTC
  static calculerMontantHTDepuisTTC(montantTTC: number, tauxTVA: number): number {
    return montantTTC / (1 + tauxTVA / 100);
  }

  // Calcul de la marge
  static calculerMarge(prixVente: number, prixAchat: number): number {
    return prixVente - prixAchat;
  }

  // Calcul du taux de marge
  static calculerTauxMarge(prixVente: number, prixAchat: number): number {
    if (prixAchat === 0) return 0;
    return ((prixVente - prixAchat) / prixAchat) * 100;
  }

  // Calcul de la remise
  static calculerRemise(montantInitial: number, pourcentageRemise: number): number {
    return montantInitial * (pourcentageRemise / 100);
  }

  // Calcul du montant après remise
  static calculerMontantAvecRemise(montantInitial: number, pourcentageRemise: number): number {
    return montantInitial - this.calculerRemise(montantInitial, pourcentageRemise);
  }

  // Calcul de l'escompte
  static calculerEscompte(montant: number, tauxEscompte: number, nombreJours: number): number {
    return montant * (tauxEscompte / 100) * (nombreJours / 360);
  }

  // Calcul des intérêts
  static calculerInterets(montant: number, tauxInteret: number, nombreJours: number): number {
    return montant * (tauxInteret / 100) * (nombreJours / 360);
  }

  // Calcul de l'amortissement linéaire
  static calculerAmortissementLineaire(valeurInitiale: number, dureeVie: number, annee: number): number {
    const amortissementAnnuel = valeurInitiale / dureeVie;
    return Math.min(amortissementAnnuel, valeurInitiale - (amortissementAnnuel * (annee - 1)));
  }

  // Calcul de la valeur nette comptable
  static calculerVNC(valeurInitiale: number, amortissementsCumules: number): number {
    return Math.max(0, valeurInitiale - amortissementsCumules);
  }

  // Calcul du ratio de rentabilité
  static calculerRatioRentabilite(benefice: number, chiffreAffaires: number): number {
    if (chiffreAffaires === 0) return 0;
    return (benefice / chiffreAffaires) * 100;
  }

  // Calcul du seuil de rentabilité
  static calculerSeuilRentabilite(chargesFixes: number, tauxMarge: number): number {
    if (tauxMarge === 0) return 0;
    return chargesFixes / (tauxMarge / 100);
  }

  // Calcul de la capacité d'autofinancement
  static calculerCAF(beneficeNet: number, amortissements: number, provisions: number): number {
    return beneficeNet + amortissements + provisions;
  }

  // Calcul du fonds de roulement
  static calculerFondsRoulement(capitauxPermanents: number, immobilisations: number): number {
    return capitauxPermanents - immobilisations;
  }

  // Calcul du besoin en fonds de roulement
  static calculerBFR(stocks: number, creances: number, dettes: number): number {
    return stocks + creances - dettes;
  }

  // Calcul de la trésorerie nette
  static calculerTresorerieNette(fondsRoulement: number, bfr: number): number {
    return fondsRoulement - bfr;
  }
} 