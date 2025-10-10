import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserService, UserProfile } from '../../services/userService';
import { TodoItem } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import AddTodoModal from './AddTodoModal';
import { log } from '../../utils/logger';

interface TodoListProps {
  maxItems?: number; // Nombre maximum d'éléments à afficher
}

const TodoList: React.FC<TodoListProps> = ({ maxItems = 5 }) => {
  const { state, addTodo, updateTodo, deleteTodo, loadTodos } = useApp();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

  // Charger les todos au montage du composant
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Charger les profils utilisateur pour les todos
  useEffect(() => {
    const loadUserProfiles = async () => {
      if (state.todos.length > 0) {
        const uniqueUserIds = Array.from(new Set([
          ...state.todos.map(todo => todo.created_by),
          ...state.todos.map(todo => todo.completedBy).filter((id): id is string => Boolean(id))
        ]));
        
        if (uniqueUserIds.length > 0) {
          const profiles = await UserService.getUserProfiles(uniqueUserIds);
          setUserProfiles(profiles);
        }
      }
    };

    loadUserProfiles();
  }, [state.todos]);

  // Séparer les tâches en cours et terminées
  const pendingTodos = state.todos
    .filter(todo => todo.status === 'pending')
    .sort((a, b) => {
      // Urgentes en premier
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      // Puis par date de création (plus récentes en premier)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const completedTodos = state.todos
    .filter(todo => todo.status === 'completed')
    .sort((a, b) => {
      // Trier par date de completion (plus récentes en premier)
      const aCompletedAt = a.completedAt || a.createdAt;
      const bCompletedAt = b.completedAt || b.createdAt;
      return new Date(bCompletedAt).getTime() - new Date(aCompletedAt).getTime();
    });

  // Combiner les tâches : d'abord les en cours, puis les terminées
  const allTodos = [...pendingTodos, ...completedTodos].slice(0, maxItems);


  // Trouver l'utilisateur par ID et retourner son nom/prénom
  const getUserDisplayName = (userId: string): string => {
    const userProfile = userProfiles[userId];
    if (userProfile) {
      return UserService.getDisplayName(userProfile);
    }
    return 'Chargement...';
  };

  // Marquer une tâche comme terminée
  const handleCompleteTodo = async (todoId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      await updateTodo(todoId, {
        status: 'completed',
        completedBy: user.id,
        completedAt: new Date()
      });
    } catch (error) {
      log.error('Erreur lors du marquage de la tâche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remettre une tâche au statut pending
  const handleReopenTodo = async (todoId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      await updateTodo(todoId, {
        status: 'pending',
        completedBy: undefined,
        completedAt: undefined
      });
    } catch (error) {
      log.error('Erreur lors de la réouverture de la tâche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une tâche
  const handleDeleteTodo = async (todoId: string) => {
    setLoading(true);
    try {
      await deleteTodo(todoId);
    } catch (error) {
      log.error('Erreur lors de la suppression de la tâche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une nouvelle tâche
  const handleAddTodo = async (title: string, description: string, priority: 'normal' | 'urgent', paramed_id?: string) => {
    if (!user) return;

    await addTodo({
      title,
      description,
      priority,
      status: 'pending',
      paramed_id: paramed_id,
      created_by: user.id
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="card-title">📋 Tâches du cabinet</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm px-3 py-1"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-6 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p>Chargement...</p>
          </div>
        ) : allTodos.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p>Aucune tâche</p>
            <p className="text-sm">Tout est à jour ! 🎉</p>
          </div>
        ) : (
          allTodos.map((todo) => (
            <div
              key={todo.id}
              className={`p-3 rounded-lg border-l-4 ${
                todo.status === 'completed'
                  ? 'border-green-300 bg-green-50 opacity-75'
                  : todo.priority === 'urgent'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {todo.status === 'completed' && (
                      <span className="text-green-600 text-sm font-medium">✅ TERMINÉ</span>
                    )}
                    {todo.priority === 'urgent' && todo.status !== 'completed' && (
                      <span className="text-red-600 text-sm font-medium">⚠️ URGENT</span>
                    )}
                    <h4 className={`text-sm font-medium ${
                      todo.status === 'completed'
                        ? 'text-green-700 line-through'
                        : todo.priority === 'urgent'
                        ? 'text-red-900'
                        : 'text-gray-900'
                    }`}>
                      {todo.title}
                    </h4>
                  </div>
                  {todo.description && (
                    <p className={`text-xs mt-1 ${
                      todo.status === 'completed' 
                        ? 'text-green-600 line-through' 
                        : 'text-gray-600'
                    }`}>
                      {todo.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Créé par {getUserDisplayName(todo.created_by)}</span>
                    <span>•</span>
                    {todo.status === 'completed' && todo.completedAt ? (
                      <span className="text-green-600">
                        Terminé le {new Date(todo.completedAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    ) : (
                      <span>
                        {new Date(todo.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  {todo.status === 'pending' ? (
                    <button
                      onClick={() => handleCompleteTodo(todo.id)}
                      disabled={loading}
                      className={`p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Marquer comme terminé"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReopenTodo(todo.id)}
                      disabled={loading}
                      className={`p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Remettre en cours"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    disabled={loading}
                    className={`p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

        {state.todos.length > maxItems && (
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-500">
              +{state.todos.length - maxItems} autres tâches
            </p>
          </div>
        )}

      <AddTodoModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTodo}
      />
    </div>
  );
};

export default TodoList;



