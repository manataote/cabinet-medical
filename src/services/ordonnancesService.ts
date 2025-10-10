import { supabase } from '../config/supabase';
import { Ordonnance } from '../types';

export class OrdonnancesService {
  // Récupérer toutes les ordonnances du cabinet
  static async getOrdonnances(cabinetId: string): Promise<Ordonnance[]> {
    try {
      const { data, error } = await supabase
        .from('ordonnances')
        .select(`
          *,
          patient:patients(nom, prenom),
          medecin:medecins(nom, prenom)
        `)
        .eq('cabinet_id', cabinetId)
        .order('date_ordonnance', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des ordonnances:', error);
      return [];
    }
  }

  // Récupérer une ordonnance par ID
  static async getOrdonnanceById(id: string): Promise<Ordonnance | null> {
    try {
      const { data, error } = await supabase
        .from('ordonnances')
        .select(`
          *,
          patient:patients(nom, prenom),
          medecin:medecins(nom, prenom)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Ordonnance;
    } catch (error) {
      console.error('Erreur lors du chargement de l\'ordonnance:', error);
      return null;
    }
  }

  // Créer une nouvelle ordonnance
  static async createOrdonnance(ordonnance: Omit<Ordonnance, 'id' | 'created_at' | 'updated_at'>): Promise<Ordonnance | null> {
    try {
      const { data, error } = await supabase
        .from('ordonnances')
        .insert(ordonnance)
        .select()
        .single();

      if (error) throw error;
      return data as Ordonnance;
    } catch (error) {
      console.error('Erreur lors de la création de l\'ordonnance:', error);
      return null;
    }
  }

  // Mettre à jour une ordonnance
  static async updateOrdonnance(id: string, updates: Partial<Ordonnance>): Promise<Ordonnance | null> {
    try {
      const { data, error } = await supabase
        .from('ordonnances')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Ordonnance;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ordonnance:', error);
      return null;
    }
  }

  // Supprimer une ordonnance
  static async deleteOrdonnance(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ordonnances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'ordonnance:', error);
      return false;
    }
  }

  // Uploader un fichier dans Supabase Storage
  static async uploadFile(file: File, ordonnanceId: string): Promise<{ url: string; path: string } | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${ordonnanceId}.${fileExt}`;
      const filePath = `ordonnances/${fileName}`;

      const { data, error } = await supabase.storage
        .from('ordonnances')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Pour un bucket public, on peut utiliser getPublicUrl
      const { data: { publicUrl } } = supabase.storage
        .from('ordonnances')
        .getPublicUrl(filePath);

      return { url: publicUrl, path: filePath };
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      return null;
    }
  }

  // Supprimer un fichier du storage
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('ordonnances')
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      return false;
    }
  }

  // Récupérer l'URL publique d'un fichier
  static getFileUrl(filePath: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from('ordonnances')
      .getPublicUrl(filePath);
    
    return publicUrl;
  }

  // Récupérer l'URL pour une ordonnance
  static getOrdonnanceFileUrl(ordonnance: Ordonnance): string | null {
    if (!ordonnance.fichier_url) {
      return null;
    }
    
    // Si c'est déjà une URL complète, la retourner directement
    if (ordonnance.fichier_url.startsWith('http')) {
      return ordonnance.fichier_url;
    }
    
    // Sinon, c'est un chemin de fichier, générer une URL publique
    return this.getFileUrl(ordonnance.fichier_url);
  }
}
