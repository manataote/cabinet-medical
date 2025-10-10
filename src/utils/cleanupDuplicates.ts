import { supabase } from '../config/supabase';

export interface CleanupResult {
  success: boolean;
  duplicatesRemoved: number;
  errors: string[];
}

export class DuplicatesCleanup {
  static async cleanupPatientDuplicates(): Promise<CleanupResult> {
    const errors: string[] = [];
    let duplicatesRemoved = 0;

    try {
      console.log('🧹 Début du nettoyage des doublons de patients...');

      // 1. Récupérer tous les patients
      const { data: allPatients, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: true }); // Garder les plus anciens

      if (fetchError) {
        throw new Error(`Erreur lors de la récupération des patients: ${fetchError.message}`);
      }

      console.log(`📊 ${allPatients.length} patients trouvés au total`);

      // 2. Identifier les doublons
      const duplicates = new Map<string, any[]>();
      
      for (const patient of allPatients) {
        // Créer une clé unique basée sur nom, prénom et date de naissance
        const key = `${patient.nom.toLowerCase().trim()}-${patient.prenom.toLowerCase().trim()}-${patient.date_naissance}`;
        
        if (!duplicates.has(key)) {
          duplicates.set(key, []);
        }
        duplicates.get(key)!.push(patient);
      }

      // 3. Traiter les doublons
      const duplicatesToProcess = Array.from(duplicates.entries()).filter(([_, patients]) => patients.length > 1);
      
      console.log(`🔍 ${duplicatesToProcess.length} groupes de doublons identifiés`);

      for (const [, patients] of duplicatesToProcess) {
        // Garder le premier (le plus ancien) et supprimer les autres
        const [keepPatient, ...patientsToDelete] = patients;
        
        console.log(`🔄 Traitement des doublons pour: ${keepPatient.nom} ${keepPatient.prenom} (${patientsToDelete.length} doublons)`);

        // Supprimer les doublons
        for (const patientToDelete of patientsToDelete) {
          const { error: deleteError } = await supabase
            .from('patients')
            .delete()
            .eq('id', patientToDelete.id);

          if (deleteError) {
            errors.push(`Erreur lors de la suppression du patient ${patientToDelete.nom} ${patientToDelete.prenom}: ${deleteError.message}`);
          } else {
            duplicatesRemoved++;
          }
        }
      }

      console.log(`✅ Nettoyage terminé: ${duplicatesRemoved} doublons supprimés`);

      return {
        success: errors.length === 0,
        duplicatesRemoved,
        errors
      };

    } catch (error) {
      errors.push(`Erreur générale lors du nettoyage: ${error}`);
      console.error('❌ Erreur lors du nettoyage:', error);
      return {
        success: false,
        duplicatesRemoved,
        errors
      };
    }
  }

  static async getDuplicateStats(): Promise<{ total: number; groups: number; highConfidence: number }> {
    try {
      const { data: allPatients, error } = await supabase
        .from('patients')
        .select('*');

      if (error) {
        throw error;
      }

      const duplicates = new Map<string, any[]>();
      
      for (const patient of allPatients) {
        const key = `${patient.nom.toLowerCase().trim()}-${patient.prenom.toLowerCase().trim()}-${patient.date_naissance}`;
        
        if (!duplicates.has(key)) {
          duplicates.set(key, []);
        }
        duplicates.get(key)!.push(patient);
      }

      const duplicateGroups = Array.from(duplicates.entries()).filter(([_, patients]) => patients.length > 1);
      const totalDuplicates = duplicateGroups.reduce((sum, [_, patients]) => sum + patients.length - 1, 0);

      return {
        total: totalDuplicates,
        groups: duplicateGroups.length,
        highConfidence: totalDuplicates // Tous sont haute confiance car même nom/prénom/date
      };

    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return { total: 0, groups: 0, highConfidence: 0 };
    }
  }
}
