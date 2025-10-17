import React, { useState, useEffect } from 'react';
import { CabinetService, Cabinet } from '../services/cabinetService';
import { UserService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

interface CabinetSelectionProps {
  onCabinetSelected: () => void;
}

const CabinetSelection: React.FC<CabinetSelectionProps> = ({ onCabinetSelected }) => {
  const { user } = useAuth();
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Formulaire de création de cabinet
  const [newCabinetName, setNewCabinetName] = useState('');
  const [newCabinetAddress, setNewCabinetAddress] = useState('');
  const [newCabinetPhone, setNewCabinetPhone] = useState('');
  const [newCabinetEmail, setNewCabinetEmail] = useState('');

  useEffect(() => {
    loadCabinets();
  }, []);

  const loadCabinets = async () => {
    try {
      setLoading(true);
      const data = await CabinetService.getAllCabinets();
      setCabinets(data);
    } catch (err) {
      console.error('Erreur lors du chargement des cabinets:', err);
      setError('Impossible de charger la liste des cabinets');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCabinet = async () => {
    if (!selectedCabinetId || !user) {
      setError('Veuillez sélectionner un cabinet');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const success = await UserService.linkUserToCabinet(user.id, selectedCabinetId);
      
      if (success) {
        onCabinetSelected();
      } else {
        setError('Erreur lors de la liaison au cabinet');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCabinet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCabinetName.trim()) {
      setError('Le nom du cabinet est obligatoire');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const newCabinet = await CabinetService.createCabinet(
        newCabinetName,
        newCabinetAddress || undefined,
        newCabinetPhone || undefined,
        newCabinetEmail || undefined
      );
      
      if (newCabinet && user) {
        // Lier automatiquement l'utilisateur au nouveau cabinet créé
        const success = await UserService.linkUserToCabinet(user.id, newCabinet.id);
        
        if (success) {
          onCabinetSelected();
        } else {
          setError('Cabinet créé mais erreur lors de la liaison');
        }
      } else {
        setError('Erreur lors de la création du cabinet');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Une erreur est survenue lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue !</h1>
          <p className="text-gray-600">
            Pour commencer, veuillez sélectionner votre cabinet ou en créer un nouveau
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!showCreateForm ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un cabinet existant
              </label>
              
              {cabinets.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {cabinets.map((cabinet) => (
                    <label
                      key={cabinet.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedCabinetId === cabinet.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cabinet"
                        value={cabinet.id}
                        checked={selectedCabinetId === cabinet.id}
                        onChange={(e) => setSelectedCabinetId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedCabinetId === cabinet.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedCabinetId === cabinet.id && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">{cabinet.name}</div>
                          {(cabinet.address || cabinet.phone) && (
                            <div className="text-sm text-gray-500 mt-1">
                              {cabinet.address && <div>{cabinet.address}</div>}
                              {cabinet.phone && <div>{cabinet.phone}</div>}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="mt-2">Aucun cabinet disponible</p>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleSelectCabinet}
                disabled={!selectedCabinetId || submitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Connexion en cours...' : 'Confirmer la sélection'}
              </button>
              
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={submitting}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border-2 border-gray-300 transition-colors disabled:opacity-50"
              >
                Créer un nouveau cabinet
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateCabinet} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du cabinet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCabinetName}
                onChange={(e) => setNewCabinetName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cabinet Médical"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={newCabinetAddress}
                onChange={(e) => setNewCabinetAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Rue de la Santé"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={newCabinetPhone}
                onChange={(e) => setNewCabinetPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="01 23 45 67 89"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={newCabinetEmail}
                onChange={(e) => setNewCabinetEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@cabinet.com"
              />
            </div>

            <div className="flex flex-col space-y-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Création en cours...' : 'Créer et rejoindre'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCabinetName('');
                  setNewCabinetAddress('');
                  setNewCabinetPhone('');
                  setNewCabinetEmail('');
                  setError(null);
                }}
                disabled={submitting}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border-2 border-gray-300 transition-colors disabled:opacity-50"
              >
                Retour
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CabinetSelection;

