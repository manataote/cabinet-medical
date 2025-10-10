import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { signIn, signUp, loading, error } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'medecin' | 'secretaire'>('medecin');
  const [localError, setLocalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    try {
      await signIn(email, password);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setFieldErrors({});

    // Validation côté client
    if (!nom.trim()) {
      setLocalError('Le nom est requis');
      setFieldErrors({ nom: true });
      return;
    }

    if (!prenom.trim()) {
      setLocalError('Le prénom est requis');
      setFieldErrors({ prenom: true });
      return;
    }

    if (!email.trim()) {
      setLocalError('L\'email est requis');
      setFieldErrors({ email: true });
      return;
    }

    if (password.length < 6) {
      setLocalError('Le mot de passe doit contenir au moins 6 caractères');
      setFieldErrors({ password: true });
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Les mots de passe ne correspondent pas');
      setFieldErrors({ confirmPassword: true });
      return;
    }

    try {
      await signUp(email, password, role, nom, prenom);
      // Ne vider les champs qu'en cas de succès
      setNom('');
      setPrenom('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFieldErrors({});
    } catch (err: any) {
      setLocalError(err.message);
      // En cas d'erreur, garder les champs remplis et rester en mode inscription
      setIsSignUpMode(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Cabinet Médical</h1>
          <p className="text-gray-600 mt-2">Gestion professionnelle</p>
        </div>

        {/* Formulaire d'authentification */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setIsSignUpMode(false);
                  setLocalError('');
                  setFieldErrors({});
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  !isSignUpMode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => {
                  setIsSignUpMode(true);
                  setLocalError('');
                  setFieldErrors({});
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isSignUpMode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Inscription
              </button>
            </div>
          </div>

          <form onSubmit={isSignUpMode ? handleSignUp : handleLogin} className="space-y-4">
            {isSignUpMode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => {
                      setNom(e.target.value);
                      if (fieldErrors.nom) setFieldErrors(prev => ({ ...prev, nom: false }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                      fieldErrors.nom 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => {
                      setPrenom(e.target.value);
                      if (fieldErrors.prenom) setFieldErrors(prev => ({ ...prev, prenom: false }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                      fieldErrors.prenom 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Votre prénom"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: false }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  fieldErrors.email 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="votre@email.com"
                required
              />
            </div>

            {isSignUpMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'medecin' | 'secretaire')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="medecin">Médecin</option>
                  <option value="secretaire">Secrétaire</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: false }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  fieldErrors.password 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="••••••••"
                required
              />
            </div>

            {isSignUpMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: false }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.confirmPassword 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {(error || localError) && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error || localError}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (isSignUpMode ? 'Inscription...' : 'Connexion...') 
                : (isSignUpMode ? 'S\'inscrire' : 'Se connecter')
              }
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isSignUpMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
              <button
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode);
                  setLocalError('');
                  setFieldErrors({});
                  setNom('');
                  setPrenom('');
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isSignUpMode ? 'Se connecter' : 'S\'inscrire'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer simple */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>&copy; 2025 Cabinet Médical. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
