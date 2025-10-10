import { supabase } from '../config/supabase';
import { Medecin } from '../types';

export class MedecinsService {
  // Récupérer tous les médecins
  static async getMedecins(): Promise<Medecin[]> {
    const { data, error } = await supabase
      .from('medecins')
      .select('*')
      .order('nom', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des médecins:', error);
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      specialite: row.specialite || '',
      numeroRPPS: row.numero_rpps || '',
      identificationPrescripteur: row.identification_prescripteur || '',
      adresse: row.adresse || '',
      telephone: row.telephone || '',
      email: row.email || '',
      actif: row.actif !== undefined ? row.actif : true
    }));
  }

  // Récupérer uniquement les colonnes minimales pour la liste (pour pagination future)
  static async getMedecinsListMinimal(
    offset: number = 0, 
    limit: number = 50, 
    search?: string, 
    orderBy: 'nom' | 'prenom' | 'identification_prescripteur' = 'nom', 
    ascending: boolean = true
  ): Promise<Medecin[]> {
    let query = supabase
      .from('medecins')
      .select('id, nom, prenom, specialite, numero_rpps, identification_prescripteur, telephone, email, actif');

    if (search && search.trim().length > 0) {
      const term = search.trim();
      // Recherche par nom, prénom, identifiant prescripteur ou numéro RPPS
      query = query.or(`nom.ilike.%${term}%,prenom.ilike.%${term}%,identification_prescripteur.ilike.%${term}%,numero_rpps.ilike.%${term}%`);
    }

    query = query.order(orderBy, { ascending });
    query = query.range(offset, Math.max(offset, offset + limit - 1));

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération paginée des médecins:', error);
      throw error;
    }

    console.log('🔍 Résultats de recherche médecins:', { term: search, count: data?.length || 0, data: data?.slice(0, 3) });

    return (data || []).map(row => ({
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      specialite: row.specialite || '',
      numeroRPPS: row.numero_rpps || '',
      identificationPrescripteur: row.identification_prescripteur || '',
      adresse: '',
      telephone: row.telephone || '',
      email: row.email || '',
      actif: row.actif !== undefined ? row.actif : true
    }));
  }

  // Créer un nouveau médecin
  static async createMedecin(medecin: Omit<Medecin, 'id'>): Promise<Medecin> {
    try {
      console.log('🔍 MedecinsService: Début création médecin...', medecin);
      
      // Payload avec les vrais noms de colonnes Supabase
      const payload = {
        nom: medecin.nom,
        prenom: medecin.prenom,
        specialite: medecin.specialite,
        numero_rpps: medecin.numeroRPPS, // Nom exact de la colonne Supabase
        identification_prescripteur: medecin.identificationPrescripteur, // Nom exact de la colonne Supabase
        adresse: medecin.adresse || '',
        telephone: medecin.telephone || '',
        email: medecin.email || '',
        actif: medecin.actif !== undefined ? medecin.actif : true,
      };
      console.log('🔍 MedecinsService: Payload complet:', payload);
      console.log('🔍 MedecinsService: Payload à insérer:', payload);
      
      console.log('🔍 MedecinsService: Début de l\'insertion Supabase...');
      const { data, error } = await supabase
        .from('medecins')
        .insert(payload)
        .select()
        .single();
      
      console.log('🔍 MedecinsService: Réponse Supabase reçue - data:', data, 'error:', error);

      console.log('🔍 MedecinsService: Réponse Supabase - data:', data, 'error:', error);

      if (error) {
        console.error('❌ Erreur lors de la création du médecin:', error);
        throw error;
      }

      console.log('✅ MedecinsService: Médecin créé avec succès:', data);

      return {
        id: data.id,
        nom: data.nom,
        prenom: data.prenom,
        specialite: data.specialite,
        numeroRPPS: data.numero_rpps || '',
        identificationPrescripteur: data.identification_prescripteur || '',
        adresse: data.adresse || '',
        telephone: data.telephone || '',
        email: data.email || '',
        actif: data.actif !== undefined ? data.actif : true
      };
    } catch (error) {
      console.error('❌ MedecinsService: Erreur complète:', error);
      throw error;
    }
  }

  // Mettre à jour un médecin
  static async updateMedecin(medecin: Medecin): Promise<Medecin> {
    try {
      const updateData = {
        nom: medecin.nom,
        prenom: medecin.prenom,
        specialite: medecin.specialite,
        numero_rpps: medecin.numeroRPPS,
        identification_prescripteur: medecin.identificationPrescripteur,
        adresse: medecin.adresse || '',
        telephone: medecin.telephone || '',
        email: medecin.email || '',
        actif: medecin.actif !== undefined ? medecin.actif : true,
        updated_at: new Date().toISOString()
      };
      
      // Ajouter un timeout pour éviter les blocages
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La requête Supabase a pris plus de 30 secondes')), 30000);
      });
      
      const supabasePromise = supabase
        .from('medecins')
        .update(updateData)
        .eq('id', medecin.id)
        .select()
        .single();
      
      const { data, error } = await Promise.race([supabasePromise, timeoutPromise]) as any;

      if (error) {
        console.error('Erreur lors de la mise à jour du médecin:', error);
        throw error;
      }

      return {
        id: data.id,
        nom: data.nom,
        prenom: data.prenom,
        specialite: data.specialite,
        numeroRPPS: data.numero_rpps || '',
        identificationPrescripteur: data.identification_prescripteur || '',
        adresse: data.adresse || '',
        telephone: data.telephone || '',
        email: data.email || '',
        actif: data.actif !== undefined ? data.actif : true
      };
    } catch (error) {
      console.error('❌ MedecinsService: Erreur complète lors de la mise à jour:', error);
      throw error;
    }
  }

  // Supprimer un médecin
  static async deleteMedecin(medecinId: string): Promise<void> {
    const { error } = await supabase
      .from('medecins')
      .delete()
      .eq('id', medecinId);

    if (error) {
      console.error('Erreur lors de la suppression du médecin:', error);
      throw error;
    }
  }
}
