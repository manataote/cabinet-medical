import { supabase } from '../config/supabase';

/**
 * Script pour corriger les données des patients
 * - Supprime les DN incorrects (format date de naissance)
 * - Remet les DN à vide pour permettre la saisie manuelle
 */
export const fixPatientData = async () => {
  try {
    console.log('🔧 Début de la correction des données patients...');
    
    // Récupérer tous les patients
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des patients:', fetchError);
      return;
    }
    
    console.log(`📊 ${patients.length} patients trouvés`);
    
    let correctedCount = 0;
    
    for (const patient of patients) {
      // Vérifier si le DN ressemble à une date (8 chiffres ou format JJMMAAAA)
      const currentDn = patient.dn;
      
      if (currentDn && (currentDn.length === 8 || /^\d{8}$/.test(currentDn))) {
        console.log(`🔧 Correction du patient ${patient.nom} ${patient.prenom}: DN "${currentDn}" → ""`);
        
        // Mettre le DN à vide pour permettre la saisie manuelle
        const { error: updateError } = await supabase
          .from('patients')
          .update({ 
            dn: '',
            updated_at: new Date().toISOString()
          })
          .eq('id', patient.id);
        
        if (updateError) {
          console.error(`❌ Erreur lors de la correction du patient ${patient.nom}:`, updateError);
        } else {
          correctedCount++;
          console.log(`✅ Patient ${patient.nom} ${patient.prenom} corrigé`);
        }
      }
    }
    
    console.log(`🎯 Correction terminée: ${correctedCount} patients corrigés`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction des données:', error);
  }
};

/**
 * Script pour créer des données de test correctes
 */
export const createTestPatientData = async () => {
  try {
    console.log('🧪 Création des données de test...');
    
    // Récupérer l'ID du cabinet
    const { data: cabinet, error: cabinetError } = await supabase
      .from('cabinets')
      .select('id')
      .eq('name', 'Cabinet Médical')
      .single();
    
    if (cabinetError || !cabinet) {
      console.error('❌ Cabinet non trouvé');
      return;
    }
    
    // Données de test pour Soraya ABBES
    const testPatient = {
      nom: 'ABBES',
      prenom: 'Soraya',
      dn: '4972845', // Identifiant CPS correct (7 chiffres)
      date_naissance: '1977-08-13', // Date correcte
      telephone: '01 23 45 67 89',
      adresse: '123 Rue de la Paix, Nouméa',
      numero_facture: 'F2025001',
      // Champs assuré (vide pour ce test)
      assure_nom: null,
      assure_prenom: null,
      assure_dn: null,
      assure_date_naissance: null,
      assure_adresse: null,
      assure_telephone: null,
      cabinet_id: cabinet.id
    };
    
    // Vérifier si le patient existe déjà
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('nom', testPatient.nom)
      .eq('prenom', testPatient.prenom)
      .single();
    
    if (existingPatient) {
      // Mettre à jour le patient existant
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          dn: testPatient.dn,
          date_naissance: testPatient.date_naissance,
          telephone: testPatient.telephone,
          adresse: testPatient.adresse,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPatient.id);
      
      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour du patient test:', updateError);
      } else {
        console.log('✅ Patient test mis à jour avec succès');
      }
    } else {
      // Créer un nouveau patient test
      const { error: insertError } = await supabase
        .from('patients')
        .insert(testPatient);
      
      if (insertError) {
        console.error('❌ Erreur lors de la création du patient test:', insertError);
      } else {
        console.log('✅ Patient test créé avec succès');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error);
  }
};
