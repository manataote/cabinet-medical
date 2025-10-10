/**
 * Utilitaire pour nettoyer le localStorage des anciennes données
 */

import { StorageManager } from './storage';

export class CleanupUtils {
  /**
   * Nettoie les feuilles de soins du localStorage
   */
  static cleanupFeuillesSoins(): void {
    try {
      const savedState = StorageManager.getAppState();
      
      if (savedState.feuillesSoins && savedState.feuillesSoins.length > 0) {
        console.log(`🧹 Nettoyage de ${savedState.feuillesSoins.length} anciennes feuilles de soins du localStorage`);
        savedState.feuillesSoins = [];
        StorageManager.saveAppState(savedState);
        console.log('✅ Feuilles de soins nettoyées du localStorage');
      } else {
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des feuilles de soins:', error);
    }
  }

  /**
   * Nettoie les factures semelles du localStorage
   */
  static cleanupFacturesSemelles(): void {
    try {
      const savedState = StorageManager.getAppState();
      
      if (savedState.facturesSemelles && savedState.facturesSemelles.length > 0) {
        console.log(`🧹 Nettoyage de ${savedState.facturesSemelles.length} anciennes factures semelles du localStorage`);
        savedState.facturesSemelles = [];
        StorageManager.saveAppState(savedState);
        console.log('✅ Factures semelles nettoyées du localStorage');
      } else {
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des factures semelles:', error);
    }
  }

  /**
   * Nettoie toutes les données de test du localStorage
   */
  static cleanupAllTestData(): void {
    try {
      console.log('🧹 Nettoyage complet du localStorage...');
      
      // Supprimer les clés spécifiques
      const keysToRemove = [
        'FEUILLES_SOINS',
        'BORDEREAUX',
        'patients',
        'medecins',
        'actes',
        'acteTemplates',
        'actesSoins',
        'actesOrthopediques',
        'facturesSemelles'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Supprimé: ${key}`);
      });

      console.log('✅ Nettoyage du localStorage terminé');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage du localStorage:', error);
    }
  }

  /**
   * Affiche les statistiques du localStorage
   */
  static showLocalStorageStats(): void {
    try {
      const savedState = StorageManager.getAppState();
      
      console.log('📊 Statistiques du localStorage:');
      console.log(`- Patients: ${savedState.patients?.length || 0}`);
      console.log(`- Médecins: ${savedState.medecins?.length || 0}`);
      console.log(`- Actes: ${savedState.actes?.length || 0}`);
      console.log(`- Templates d'actes: ${savedState.acteTemplates?.length || 0}`);
      console.log(`- Actes de soins: ${savedState.actesSoins?.length || 0}`);
      console.log(`- Actes orthopédiques: ${savedState.actesOrthopediques?.length || 0}`);
      console.log(`- Feuilles de soins: ${savedState.feuillesSoins?.length || 0}`);
      console.log(`- Factures semelles: ${savedState.facturesSemelles?.length || 0}`);
      console.log(`- Bordereaux: ${savedState.bordereaux?.length || 0}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage des statistiques:', error);
    }
  }
}

// Exposer les fonctions globalement pour le debug
if (typeof window !== 'undefined') {
  (window as any).CleanupUtils = CleanupUtils;
}
