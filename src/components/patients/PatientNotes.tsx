import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserService, UserProfile } from '../../services/userService';
import { PatientNote } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { loadPatientNotes } from '../../services/patientsService';
import { supabase } from '../../config/supabase';

interface PatientNotesProps {
  patientId: string;
  notes: PatientNote[];
  onAddNote: (note: PatientNote) => void;
  onDeleteNote: (noteId: string) => void;
  readOnly?: boolean;
}

const PatientNotes: React.FC<PatientNotesProps> = ({ 
  patientId, 
  notes: propNotes = [], 
  onAddNote, 
  onDeleteNote, 
  readOnly = false 
}) => {
  const { state } = useApp();
  const { user } = useAuth();
  const [notes, setNotes] = useState<PatientNote[]>(propNotes);
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

  // Charger les notes depuis Supabase
  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      try {
        const loadedNotes = await loadPatientNotes(patientId);
        setNotes(loadedNotes);
        
        // Charger les profils des utilisateurs uniques
        const uniqueUserIds = Array.from(new Set(loadedNotes.map(note => note.createdBy)));
        
        if (uniqueUserIds.length > 0) {
          const profiles = await UserService.getUserProfiles(uniqueUserIds);
          setUserProfiles(profiles);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des notes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [patientId, user]);

  // Trier les notes par date (plus récentes en premier)
  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Récupérer le nom d'affichage de l'utilisateur
  const getUserDisplayName = (userId: string): string => {
    const userProfile = userProfiles[userId];
    if (userProfile) {
      return UserService.getDisplayName(userProfile);
    }
    return 'Chargement...';
  };

  // Ajouter une nouvelle note
  const handleAddNote = async () => {
    if (newNote.trim() && !isAdding && user) {
      const note: PatientNote = {
        id: uuidv4(),
        content: newNote.trim(),
        createdAt: new Date(),
        createdBy: user.id // Utiliser l'ID de l'utilisateur connecté
      };

      try {
        await onAddNote(note);
        // Recharger les notes après l'ajout
        const loadedNotes = await loadPatientNotes(patientId);
        setNotes(loadedNotes);
        
        // Mettre à jour le profil de l'utilisateur connecté
        if (user) {
          const userProfile = await UserService.getUserProfile(user.id);
          if (userProfile) {
            setUserProfiles(prev => ({
              ...prev,
              [user.id]: userProfile
            }));
          }
        }
        
        setNewNote('');
        setIsAdding(false);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la note:', error);
      }
    }
  };

  // Supprimer une note
  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      try {
        await onDeleteNote(noteId);
        // Recharger les notes après la suppression
        const loadedNotes = await loadPatientNotes(patientId);
        setNotes(loadedNotes);
      } catch (error) {
        console.error('Erreur lors de la suppression de la note:', error);
      }
    }
  };

  // Formater la date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="card-title">
            📝 Notes du patient
            {notes.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({notes.length} note{notes.length > 1 ? 's' : ''})
              </span>
            )}
          </h3>
        </div>
      </div>

      {/* Formulaire d'ajout de note */}
      {!readOnly && (
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajouter une note pour ce patient..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isAdding}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setNewNote('');
                  setIsAdding(false);
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                disabled={isAdding}
              >
                Annuler
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isAdding}
                className="px-4 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Ajout...' : 'Ajouter la note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des notes */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p>Chargement des notes...</p>
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Aucune note pour ce patient</p>
            {!readOnly && (
              <p className="text-sm">Ajoutez la première note ci-dessus</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                      {note.content}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Par {getUserDisplayName(note.createdBy)}</span>
                      <span>•</span>
                      <span>{formatDate(note.createdAt)}</span>
                    </div>
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="ml-3 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-200"
                      title="Supprimer la note"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientNotes;



