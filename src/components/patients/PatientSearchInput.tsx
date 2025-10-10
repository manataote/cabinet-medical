import React, { useState, useEffect } from 'react';
import { Patient } from '../../types';
import { PatientsService } from '../../services/patientsService';

interface PatientSearchInputProps {
  onPatientSelect: (patient: Patient) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const PatientSearchInput: React.FC<PatientSearchInputProps> = ({
  onPatientSelect,
  placeholder = "Rechercher un patient...",
  className = "",
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
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

  // Search patients when debounced term changes
  useEffect(() => {
    const searchPatients = async () => {
      if (debouncedSearchTerm.length < 2) {
        setPatients([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await PatientsService.getPatientsListMinimal(
          0, 
          20, // Limiter à 20 résultats pour la recherche
          debouncedSearchTerm,
          'nom',
          true
        );
        setPatients(results);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Erreur lors de la recherche de patients:', error);
        setPatients([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };

    searchPatients();
  }, [debouncedSearchTerm]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || patients.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < patients.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : patients.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < patients.length) {
          handlePatientSelect(patients[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    onPatientSelect(patient);
    setSearchTerm('');
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length < 2) {
      setShowDropdown(false);
    }
  };

  const handleInputFocus = () => {
    if (patients.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow clicking on items
    setTimeout(() => setShowDropdown(false), 150);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {showDropdown && patients.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {patients.map((patient, index) => (
            <div
              key={patient.id}
              onClick={() => handlePatientSelect(patient)}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="font-medium text-gray-900">
                {patient.prenom} {patient.nom}
              </div>
              <div className="text-sm text-gray-500">
                DN: {patient.dn} • {new Date(patient.dateNaissance).toLocaleDateString('fr-FR')}
              </div>
              {patient.telephone && (
                <div className="text-xs text-gray-400">
                  {patient.telephone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showDropdown && patients.length === 0 && debouncedSearchTerm.length >= 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-gray-500 text-sm">
            Aucun patient trouvé
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSearchInput;
