import { supabase } from '../config/supabase';
import { TodoItem } from '../types';
import { log } from '../utils/logger';

export class TodosService {
  // Charger toutes les tâches depuis Supabase
  static async loadTodos(cabinet_id?: string): Promise<TodoItem[]> {
    try {
      let query = supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (cabinet_id) {
        query = query.eq('cabinet_id', cabinet_id);
      }

      const { data, error } = await query;

      if (error) {
        log.error('Erreur lors du chargement des todos:', error);
        return [];
      }

      return data.map(todo => ({
        id: todo.id,
        title: todo.titre,
        description: todo.description,
        priority: todo.priorite,
        status: todo.statut,
        paramed_id: todo.paramed_id,
        created_by: todo.created_by,
        completedBy: todo.completed_by,
        createdAt: new Date(todo.created_at),
        completedAt: todo.updated_at ? new Date(todo.updated_at) : undefined
      }));
    } catch (error) {
      log.error('Erreur lors du chargement des todos:', error);
      return [];
    }
  }

  // Créer une nouvelle tâche
  static async createTodo(todo: Omit<TodoItem, 'id' | 'createdAt' | 'completedAt'>, cabinet_id?: string): Promise<TodoItem | null> {
    try {
      console.log('🔄 TodosService.createTodo - Données reçues:', { todo, cabinet_id });
      
      const insertData = {
        titre: todo.title,
        description: todo.description,
        priorite: todo.priority,
        statut: todo.status,
        paramed_id: todo.paramed_id,
        created_by: todo.created_by,
        completed_by: todo.completedBy,
        cabinet_id: cabinet_id
      };
      
      console.log('📝 TodosService.createTodo - Données à insérer:', insertData);
      
      const { data, error } = await supabase
        .from('todos')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ TodosService.createTodo - Erreur Supabase:', error);
        log.error('Erreur lors de la création de la tâche:', error);
        return null;
      }
      
      console.log('✅ TodosService.createTodo - Données créées:', data);

      return {
        id: data.id,
        title: data.titre,
        description: data.description,
        priority: data.priorite,
        status: data.statut,
        paramed_id: data.paramed_id,
        created_by: data.created_by,
        completedBy: data.completed_by,
        createdAt: new Date(data.created_at),
        completedAt: data.updated_at ? new Date(data.updated_at) : undefined
      };
    } catch (error) {
      log.error('Erreur lors de la création de la tâche:', error);
      return null;
    }
  }

  // Mettre à jour une tâche
  static async updateTodo(id: string, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.titre = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.priority !== undefined) updateData.priorite = updates.priority;
      if (updates.status !== undefined) updateData.statut = updates.status;
      if (updates.paramed_id !== undefined) updateData.paramed_id = updates.paramed_id;
      if (updates.completedBy !== undefined) updateData.completed_by = updates.completedBy;
      if (updates.completedAt !== undefined) updateData.updated_at = updates.completedAt?.toISOString();
      
      // Vérifier d'abord si la tâche existe
      const { data: existingTodo, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        log.error('Erreur lors de la récupération de la tâche:', fetchError);
        return null;
      }
      
      if (!existingTodo) {
        log.error('Tâche non trouvée avec l\'ID:', id);
        return null;
      }
      
      const { data, error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        log.error('Erreur lors de la mise à jour de la tâche:', error);
        return null;
      }

      return {
        id: data.id,
        title: data.titre,
        description: data.description,
        priority: data.priorite,
        status: data.statut,
        paramed_id: data.paramed_id,
        created_by: data.created_by,
        completedBy: data.completed_by,
        createdAt: new Date(data.created_at),
        completedAt: data.updated_at ? new Date(data.updated_at) : undefined
      };
    } catch (error) {
      log.error('Erreur lors de la mise à jour de la tâche:', error);
      return null;
    }
  }

  // Supprimer une tâche
  static async deleteTodo(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        log.error('Erreur lors de la suppression de la tâche:', error);
        return false;
      }

      return true;
    } catch (error) {
      log.error('Erreur lors de la suppression de la tâche:', error);
      return false;
    }
  }
}
