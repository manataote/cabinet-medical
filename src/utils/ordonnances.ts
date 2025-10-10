import { Ordonnance, Patient } from '../types';

/**
 * Interface pour les ordonnances expirantes
 */
export interface OrdonnanceExpirante {
  ordonnance: Ordonnance;
  patient: Patient;
  dateExpiration: Date;
  joursRestants: number;
  statut: 'expiree' | 'expire-bientot';
}

/**
 * Calcule la date d'expiration d'une ordonnance de soins
 * @param date_ordonnance Date de création de l'ordonnance
 * @param duree_soins Durée en mois
 * @returns Date d'expiration
 */
export function calculerDateExpiration(date_ordonnance: Date, duree_soins: number): Date {
  const date = new Date(date_ordonnance);
  date.setMonth(date.getMonth() + duree_soins);
  return date;
}

/**
 * Calcule le nombre de jours restants jusqu'à l'expiration
 * @param dateExpiration Date d'expiration
 * @returns Nombre de jours restants (négatif si déjà expirée)
 */
export function calculerJoursRestants(dateExpiration: Date): number {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0); // Remettre à minuit pour la comparaison
  
  const expiration = new Date(dateExpiration);
  expiration.setHours(0, 0, 0, 0); // Remettre à minuit pour la comparaison
  
  const diffTime = expiration.getTime() - aujourdhui.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Filtre les ordonnances de soins expirantes ou qui vont bientôt expirer
 * @param ordonnances Liste de toutes les ordonnances
 * @param patients Liste de tous les patients
 * @returns Liste des ordonnances expirantes avec informations du patient
 */
export function getOrdonnancesExpirantes(
  ordonnances: Ordonnance[],
  patients: Patient[]
): OrdonnanceExpirante[] {
  const resultats: OrdonnanceExpirante[] = [];


  // Filtrer uniquement les ordonnances de soins
  const ordonnancesSoins = ordonnances.filter(ord => ord.type === 'soins');

  for (const ordonnance of ordonnancesSoins) {
    // Calculer la date d'expiration
    const dateExpiration = calculerDateExpiration(ordonnance.date_ordonnance, ordonnance.duree_soins);
    
    // Calculer les jours restants
    const joursRestants = calculerJoursRestants(dateExpiration);
    
    // Vérifier si l'ordonnance est expirée ou va bientôt expirer (dans 1 mois)
    const estExpiree = joursRestants < 0;
    const expireBientot = joursRestants >= 0 && joursRestants <= 30;
    
    if (estExpiree || expireBientot) {
      // Trouver le patient correspondant
      const patient = patients.find(p => p.id === ordonnance.patient_id);
      
      
      if (patient) {
        resultats.push({
          ordonnance,
          patient,
          dateExpiration,
          joursRestants,
          statut: estExpiree ? 'expiree' : 'expire-bientot'
        });
      }
    }
  }

  // Trier par date d'expiration (les plus urgentes en premier)
  return resultats.sort((a, b) => a.joursRestants - b.joursRestants);
}

/**
 * Formate le nombre de jours restants pour l'affichage
 * @param joursRestants Nombre de jours restants
 * @returns Texte formaté
 */
export function formaterJoursRestants(joursRestants: number): string {
  if (joursRestants < 0) {
    return `Expirée depuis ${Math.abs(joursRestants)} jour${Math.abs(joursRestants) > 1 ? 's' : ''}`;
  } else if (joursRestants === 0) {
    return 'Expire aujourd\'hui';
  } else if (joursRestants === 1) {
    return 'Expire demain';
  } else {
    return `Expire dans ${joursRestants} jours`;
  }
}

/**
 * Obtient la classe CSS pour le statut de l'ordonnance
 * @param statut Statut de l'ordonnance
 * @returns Classe CSS
 */
export function getClasseStatut(statut: 'expiree' | 'expire-bientot'): string {
  switch (statut) {
    case 'expiree':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'expire-bientot':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}
