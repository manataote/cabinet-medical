import { supabase } from '../config/supabase';
import { Patient, PatientNote } from '../types';

// Fonction pour charger les notes d'un patient depuis la table patient_notes
export const loadPatientNotes = async (patientId: string): Promise<PatientNote[]> => {
  try {
    const { data, error } = await supabase
      .from('patient_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des notes:', error);
      return [];
    }

    return data.map(note => ({
      id: note.id,
      content: note.contenu,
      createdAt: new Date(note.created_at),
      createdBy: note.paramed_id
    }));
  } catch (error) {
    console.error('Erreur lors du chargement des notes:', error);
    return [];
  }
};

export class PatientsService {
  // Récupérer tous les patients
  static async getPatients(): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('nom', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des patients:', error);
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      numeroFacture: row.numero_facture || '',
      nom: row.nom,
      prenom: row.prenom,
      dn: row.dn || '',
      dateNaissance: new Date(row.date_naissance),
      adresse: row.adresse || '',
      telephone: row.telephone || '',
      dateCreation: row.created_at ? new Date(row.created_at) : undefined,
      notes: [], // Les notes sont maintenant chargées séparément via loadPatientNotes()
      assure: (row.assure_nom || row.assure_prenom) ? {
        nom: row.assure_nom || '',
        prenom: row.assure_prenom || '',
        dn: row.assure_dn || '',
        dateNaissance: row.assure_date_naissance ? new Date(row.assure_date_naissance) : new Date(),
        adresse: row.assure_adresse || '',
        telephone: row.assure_telephone || ''
      } : undefined
    }));
  }

  // Compter le nombre total de patients (sans charger les lignes)
  static async getPatientsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Erreur lors du comptage des patients:', error);
      throw error;
    }

    return count || 0;
  }

  // Récupérer un patient spécifique par son ID
  static async getPatientById(patientId: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du patient:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        numeroFacture: data.numero_facture || '',
        nom: data.nom,
        prenom: data.prenom,
        dn: data.dn || '',
        dateNaissance: new Date(data.date_naissance),
        adresse: data.adresse || '',
        telephone: data.telephone || '',
        dateCreation: data.created_at ? new Date(data.created_at) : undefined,
        notes: [], // Les notes sont chargées séparément
        assure: (data.assure_nom || data.assure_prenom) ? {
          nom: data.assure_nom || '',
          prenom: data.assure_prenom || '',
          dn: data.assure_dn || '',
          dateNaissance: data.assure_date_naissance ? new Date(data.assure_date_naissance) : new Date(),
          adresse: data.assure_adresse || '',
          telephone: data.assure_telephone || ''
        } : undefined
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du patient:', error);
      return null;
    }
  }

  // Récupérer uniquement les colonnes minimales pour la liste (pour pagination future)
  static async getPatientsListMinimal(
    offset: number = 0,
    limit: number = 50,
    search?: string,
    orderBy: 'nom' | 'prenom' | 'date_naissance' | 'created_at' = 'nom',
    ascending: boolean = true
  ): Promise<Patient[]> {
    let query = supabase
      .from('patients')
      .select('id, numero_facture, nom, prenom, dn, date_naissance, telephone, created_at');

    if (search && search.trim().length > 0) {
      const term = search.trim();
      // Si le terme ne contient que des chiffres, rechercher par DN
      if (/^\d+$/.test(term)) {
        console.log('🔍 Recherche par DN:', term);
        // Essayer plusieurs variantes de recherche par DN
        query = query.or(`dn.eq.${term},dn.ilike.%${term}%`);
      } else {
        console.log('🔍 Recherche textuelle:', term);
        // Sinon, recherche par nom, prénom ou téléphone
        query = query.or(`nom.ilike.%${term}%,prenom.ilike.%${term}%,telephone.ilike.%${term}%`);
      }
    }

    query = query.order(orderBy, { ascending });
    query = query.range(offset, Math.max(offset, offset + limit - 1));

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération paginée des patients:', error);
      throw error;
    }

    console.log('🔍 Résultats de recherche:', { term: search, count: data?.length || 0, data: data?.slice(0, 3) });

    return (data || []).map(row => ({
      id: row.id,
      numeroFacture: row.numero_facture || '',
      nom: row.nom,
      prenom: row.prenom,
      dn: row.dn || '',
      dateNaissance: new Date(row.date_naissance),
      adresse: '',
      telephone: row.telephone || '',
      dateCreation: row.created_at ? new Date(row.created_at) : undefined,
      notes: [],
      assure: undefined
    }));
  }

  // Créer un nouveau patient
  static async createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    
    const { data, error } = await supabase
      .from('patients')
      .insert({
        nom: patient.nom,
        prenom: patient.prenom,
        dn: patient.dn,
        date_naissance: patient.dateNaissance,
        adresse: patient.adresse,
        telephone: patient.telephone,
        numero_facture: patient.numeroFacture,
        // Champs assuré
        assure_nom: patient.assure?.nom || null,
        assure_prenom: patient.assure?.prenom || null,
        assure_dn: patient.assure?.dn || null,
        assure_date_naissance: patient.assure?.dateNaissance || null,
        assure_adresse: patient.assure?.adresse || null,
        assure_telephone: patient.assure?.telephone || null,
        // Les notes sont maintenant gérées dans la table patient_notes séparée
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du patient:', error);
      throw error;
    }

    return {
      id: data.id,
      numeroFacture: data.numero_facture || '',
      nom: data.nom,
      prenom: data.prenom,
      dn: data.dn || '',
      dateNaissance: new Date(data.date_naissance),
      adresse: data.adresse || '',
      telephone: data.telephone || '',
      dateCreation: data.created_at ? new Date(data.created_at) : undefined,
      notes: [], // Les notes sont maintenant chargées séparément via loadPatientNotes()
      assure: (data.assure_nom || data.assure_prenom) ? {
        nom: data.assure_nom || '',
        prenom: data.assure_prenom || '',
        dn: data.assure_dn || '',
        dateNaissance: data.assure_date_naissance ? new Date(data.assure_date_naissance) : new Date(),
        adresse: data.assure_adresse || '',
        telephone: data.assure_telephone || ''
      } : undefined
    };
  }

  // Mettre à jour un patient
  static async updatePatient(patient: Patient): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .update({
        nom: patient.nom,
        prenom: patient.prenom,
        dn: patient.dn,
        date_naissance: patient.dateNaissance,
        adresse: patient.adresse,
        telephone: patient.telephone,
        numero_facture: patient.numeroFacture,
        // Champs assuré
        assure_nom: patient.assure?.nom || null,
        assure_prenom: patient.assure?.prenom || null,
        assure_dn: patient.assure?.dn || null,
        assure_date_naissance: patient.assure?.dateNaissance || null,
        assure_adresse: patient.assure?.adresse || null,
        assure_telephone: patient.assure?.telephone || null,
        // Les notes sont maintenant gérées dans la table patient_notes séparée
        updated_at: new Date().toISOString()
      })
      .eq('id', patient.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du patient:', error);
      throw error;
    }

    return {
      id: data.id,
      numeroFacture: data.numero_facture || '',
      nom: data.nom,
      prenom: data.prenom,
      dn: data.dn || '',
      dateNaissance: new Date(data.date_naissance),
      adresse: data.adresse || '',
      telephone: data.telephone || '',
      dateCreation: data.created_at ? new Date(data.created_at) : undefined,
      notes: [], // Les notes sont maintenant chargées séparément via loadPatientNotes()
      assure: (data.assure_nom || data.assure_prenom) ? {
        nom: data.assure_nom || '',
        prenom: data.assure_prenom || '',
        dn: data.assure_dn || '',
        dateNaissance: data.assure_date_naissance ? new Date(data.assure_date_naissance) : new Date(),
        adresse: data.assure_adresse || '',
        telephone: data.assure_telephone || ''
      } : undefined
    };
  }

  // Supprimer un patient
  static async deletePatient(patientId: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId);

    if (error) {
      console.error('Erreur lors de la suppression du patient:', error);
      throw error;
    }
  }

  // Rechercher des patients
  static async searchPatients(searchTerm: string): Promise<Patient[]> {
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%`)
      .order('nom', { ascending: true });

    if (error) {
      console.error('Erreur lors de la recherche des patients:', error);
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      numeroFacture: row.numero_facture || '',
      nom: row.nom,
      prenom: row.prenom,
      dn: row.dn || '',
      dateNaissance: new Date(row.date_naissance),
      adresse: row.adresse || '',
      telephone: row.telephone || '',
      dateCreation: row.created_at ? new Date(row.created_at) : undefined,
      notes: [], // Les notes sont maintenant chargées séparément via loadPatientNotes()
      assure: (row.assure_nom || row.assure_prenom) ? {
        nom: row.assure_nom || '',
        prenom: row.assure_prenom || '',
        dn: row.assure_dn || '',
        dateNaissance: row.assure_date_naissance ? new Date(row.assure_date_naissance) : new Date(),
        adresse: row.assure_adresse || '',
        telephone: row.assure_telephone || ''
      } : undefined,
    }));
  }

  // Fusionner des patients doublons
  static async mergePatients(
    patientIds: string[],
    mergedPatientData: Patient
  ): Promise<Patient> {
    if (patientIds.length < 2) {
      throw new Error('Il faut au moins 2 patients pour effectuer une fusion');
    }

    console.log('🔄 Début de la fusion des patients:', patientIds);

    try {
      // 1. Récupérer tous les patients concernés avec leur date de création
      const { data: patientsData, error: fetchError } = await supabase
        .from('patients')
        .select('id, created_at')
        .in('id', patientIds)
        .order('created_at', { ascending: true });

      if (fetchError || !patientsData || patientsData.length === 0) {
        throw new Error('Impossible de récupérer les patients à fusionner');
      }

      // 2. Le patient à conserver est le plus ancien (premier dans la liste triée)
      const patientToKeepId = patientsData[0].id;
      const patientsToDeleteIds = patientsData.slice(1).map(p => p.id);

      console.log('✅ Patient conservé (le plus ancien):', patientToKeepId);
      console.log('🗑️ Patients à supprimer:', patientsToDeleteIds);

      // 3. Mettre à jour le patient conservé avec les données fusionnées
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          nom: mergedPatientData.nom,
          prenom: mergedPatientData.prenom,
          dn: mergedPatientData.dn,
          date_naissance: mergedPatientData.dateNaissance,
          adresse: mergedPatientData.adresse,
          telephone: mergedPatientData.telephone,
          // Champs assuré
          assure_nom: mergedPatientData.assure?.nom || null,
          assure_prenom: mergedPatientData.assure?.prenom || null,
          assure_dn: mergedPatientData.assure?.dn || null,
          assure_date_naissance: mergedPatientData.assure?.dateNaissance || null,
          assure_adresse: mergedPatientData.assure?.adresse || null,
          assure_telephone: mergedPatientData.assure?.telephone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientToKeepId);

      if (updateError) {
        throw new Error(`Erreur lors de la mise à jour du patient conservé: ${updateError.message}`);
      }

      // 4. Réassigner toutes les références vers le patient conservé
      
      // 4a. Réassigner les feuilles de soins
      const { error: feuillesError } = await supabase
        .from('feuilles_soins')
        .update({ patient_id: patientToKeepId })
        .in('patient_id', patientsToDeleteIds);

      if (feuillesError) {
        console.error('Erreur lors de la réassignation des feuilles de soins:', feuillesError);
      }

      // 4b. Réassigner les factures semelles
      const { error: facturesError } = await supabase
        .from('factures_semelles')
        .update({ patient_id: patientToKeepId })
        .in('patient_id', patientsToDeleteIds);

      if (facturesError) {
        console.error('Erreur lors de la réassignation des factures semelles:', facturesError);
      }

      // 4c. Réassigner les ordonnances
      const { error: ordonnancesError } = await supabase
        .from('ordonnances')
        .update({ patient_id: patientToKeepId })
        .in('patient_id', patientsToDeleteIds);

      if (ordonnancesError) {
        console.error('Erreur lors de la réassignation des ordonnances:', ordonnancesError);
      }

      // 4d. Réassigner les notes
      const { error: notesError } = await supabase
        .from('patient_notes')
        .update({ patient_id: patientToKeepId })
        .in('patient_id', patientsToDeleteIds);

      if (notesError) {
        console.error('Erreur lors de la réassignation des notes:', notesError);
      }

      // 5. Supprimer les patients doublons
      const { error: deleteError } = await supabase
        .from('patients')
        .delete()
        .in('id', patientsToDeleteIds);

      if (deleteError) {
        throw new Error(`Erreur lors de la suppression des doublons: ${deleteError.message}`);
      }

      console.log(`✅ Fusion réussie: ${patientsToDeleteIds.length} doublon(s) supprimé(s)`);

      // 6. Retourner le patient fusionné mis à jour
      return this.getPatientById(patientToKeepId).then(p => p!);

    } catch (error) {
      console.error('❌ Erreur lors de la fusion des patients:', error);
      throw error;
    }
  }
}
