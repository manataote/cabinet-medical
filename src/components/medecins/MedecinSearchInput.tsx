import React, { useState, useEffect } from 'react';
import { Medecin } from '../../types';
import { MedecinsService } from '../../services/medecinsService';

interface MedecinSearchInputProps {
  onMedecinSelect: (medecin: Medecin) => void;
  placeholder?: string;
  className?: string;
}

const MedecinSearchInput: React.FC<MedecinSearchInputProps> = ({ 
  onMedecinSelect, 
  placeholder = "Rechercher un médecin...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search medecins when debounced term changes
  useEffect(() => {
    const searchMedecins = async () => {
      if (debouncedSearchTerm.length < 2) {
        setMedecins([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await MedecinsService.getMedecinsListMinimal(
          0, 
          20, // Limiter à 20 résultats pour la recherche
          debouncedSearchTerm,
          'nom',
          true
        );
        setMedecins(results);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Erreur lors de la recherche de médecins:', error);
        setMedecins([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };

    searchMedecins();
  }, [debouncedSearchTerm]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || medecins.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < medecins.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : medecins.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < medecins.length) {
          handleSelectMedecin(medecins[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectMedecin = (medecin: Medecin) => {
    onMedecinSelect(medecin);
    setSearchTerm(`${medecin.prenom} ${medecin.nom}`);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    if (medecins.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }, 150);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="input-field w-full"
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {showDropdown && medecins.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
          {medecins.map((medecin, index) => (
            <li
              key={medecin.id}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => handleSelectMedecin(medecin)}
            >
              <div className="flex flex-col">
                <div className="font-medium text-gray-900">
                  {medecin.prenom} {medecin.nom}
                </div>
                <div className="text-sm text-gray-600">
                  {medecin.specialite && (
                    <span className="mr-2">Spécialité: {medecin.specialite}</span>
                  )}
                  {medecin.identificationPrescripteur && (
                    <span>ID: {medecin.identificationPrescripteur}</span>
                  )}
                </div>
                {medecin.telephone && (
                  <div className="text-xs text-gray-500">
                    📞 {medecin.telephone}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && !isLoading && medecins.length === 0 && debouncedSearchTerm && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 px-4 py-2 text-gray-500">
          Aucun médecin trouvé.
        </div>
      )}
    </div>
  );
};

export default MedecinSearchInput;
