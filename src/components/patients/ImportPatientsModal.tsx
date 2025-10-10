import React, { useState, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  importPatientsFromFile, 
  convertImportedData, 
  detectColumnMapping, 
  ColumnMapping, 
  // ImportedPatient,
  ImportResult 
} from '../../utils/importExport';

interface ImportPatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const ImportPatientsModal: React.FC<ImportPatientsModalProps> = ({ 
  isOpen, 
  onClose, 
  onImportComplete 
}) => {
  const { state, addPatient, addMedecin, addOrdonnance } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'select' | 'mapping' | 'preview' | 'importing'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      console.log('🔄 Début de la lecture du fichier:', file.name, file.type);
      setStep('mapping');
      
      // Vérifier le type de fichier
      const isCSV = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     file.type === 'application/vnd.ms-excel' ||
                     file.name.toLowerCase().endsWith('.xlsx') ||
                     file.name.toLowerCase().endsWith('.xls');
      
      console.log('📄 Type de fichier détecté:', { isCSV, isExcel, type: file.type });
      
      let headers: string[] = [];
      
      if (isCSV) {
        // Parser le CSV
        const text = await file.text();
        console.log('📝 Contenu CSV (premiers 500 caractères):', text.substring(0, 500));
        
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          alert('Le fichier CSV ne contient pas de données');
          return;
        }
        
        // Parser la première ligne pour obtenir les en-têtes
        headers = parseCSVLine(lines[0]);
        console.log('📋 En-têtes CSV détectés:', headers);
        
      } else if (isExcel) {
        // Lire le fichier Excel avec ExcelJS
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const buffer = await file.arrayBuffer();
        await workbook.xlsx.load(buffer);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          alert('Le fichier Excel ne contient pas de données');
          return;
        }
        
        const rows = worksheet.getSheetValues();
        if (rows.length < 2) {
          alert('Le fichier Excel ne contient pas de données');
          return;
        }
        
        headers = rows[0] as string[];
        console.log('📋 En-têtes Excel détectés:', headers);
        
      } else {
        alert('Format de fichier non supporté. Veuillez utiliser un fichier CSV ou Excel (.xlsx)');
        return;
      }
      
      setDetectedHeaders(headers);
      
      // Détecter automatiquement les colonnes
      const autoMapping = detectColumnMapping(headers);
      console.log('🔍 Mapping automatique détecté:', autoMapping);
      
      setColumnMapping({
        nom: autoMapping.nom || '',
        prenom: autoMapping.prenom || '',
        dn: autoMapping.dn || '',
        dateNaissance: autoMapping.dateNaissance || '',
        date_ordonnanceSoins: autoMapping.date_ordonnanceSoins || '',
        date_ordonnanceSemelles: autoMapping.date_ordonnanceSemelles || '',
        medecinPrescripteur: autoMapping.medecinPrescripteur || '',
        adresse: autoMapping.adresse || '',
        telephone: autoMapping.telephone || ''
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la lecture du fichier:', error);
      alert(`Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };
  
  // Fonction pour parser une ligne CSV avec détection automatique du séparateur
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    // Détecter le séparateur (point-virgule par défaut, virgule en fallback)
    const semicolonCount = (line.match(/;/g) || []).length;
    const commaCount = (line.match(/,/g) || []).length;
    const separator = semicolonCount >= commaCount ? ';' : ',';
    
    console.log(`🔍 Séparateur CSV détecté: "${separator}" (;: ${semicolonCount}, ,: ${commaCount})`);
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    } as ColumnMapping));
  };

  const handlePreview = async () => {
    if (!selectedFile || !columnMapping) return;
    
    try {
      setStep('preview');
      const result = await importPatientsFromFile(selectedFile, columnMapping);
      setImportResult(result);
    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error);
      alert('Erreur lors de la prévisualisation des données');
    }
  };

  const handleImport = async (ignoreErrors = false) => {
    if (!importResult) return;
    
    try {
      setIsImporting(true);
      setStep('importing');
      
      // Filtrer les patients selon le mode d'import
      let patientsToImport = importResult.patients;
      
      if (ignoreErrors) {
        // En mode "ignorer les erreurs", on importe tous les patients valides
        // Les erreurs de validation sont déjà gérées dans convertImportedData
        console.log(`Import en mode "ignorer les erreurs" : ${patientsToImport.length} patients à traiter`);
      }
      
      // Convertir les données importées
      const { patients, medecins, ordonnances } = convertImportedData(
        patientsToImport,
        state.patients,
        state.medecins
      );
      
      // Ajouter les nouveaux médecins
      for (const medecin of medecins) {
        addMedecin(medecin);
      }
      
      // Ajouter les nouveaux patients
      for (const patient of patients) {
        addPatient(patient);
      }
      
      // Ajouter les nouvelles ordonnances
      for (const ordonnance of ordonnances) {
        addOrdonnance(ordonnance);
      }
      
      // Fermer le modal et notifier le parent
      onImportComplete();
      handleClose();
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import des données');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedFile(null);
    setImportResult(null);
    setColumnMapping(null);
    setDetectedHeaders([]);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const renderSelectStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Importer des patients</h3>
        <p className="text-sm text-gray-500 mb-4">
          Sélectionnez un fichier Excel (.xlsx, .xls) ou CSV (.csv) contenant les données des patients
        </p>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center space-y-2 py-4"
        >
          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm font-medium text-gray-900">Cliquez pour sélectionner un fichier</span>
          <span className="text-xs text-gray-500">ou glissez-déposez le fichier ici</span>
        </button>
      </div>
      
      {selectedFile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-800">Fichier sélectionné: {selectedFile.name}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Mapping des colonnes</h3>
        <p className="text-sm text-gray-500">
          Associez les colonnes de votre fichier aux champs de l'application
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'nom', label: 'Nom de famille', required: true },
          { key: 'prenom', label: 'Prénom', required: true },
          { key: 'dn', label: 'Numéro de dossier (DN)', required: false },
          { key: 'dateNaissance', label: 'Date de naissance', required: true },
          { key: 'date_ordonnanceSoins', label: 'Date ordonnance soins', required: false },
          { key: 'date_ordonnanceSemelles', label: 'Date ordonnance semelles', required: false },
          { key: 'medecinPrescripteur', label: 'Médecin prescripteur', required: true },
          { key: 'adresse', label: 'Adresse', required: false },
          { key: 'telephone', label: 'Téléphone', required: false }
        ].map(({ key, label, required }) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={columnMapping?.[key as keyof ColumnMapping] || ''}
              onChange={(e) => handleMappingChange(key as keyof ColumnMapping, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionner une colonne</option>
              {detectedHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={() => setStep('select')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Retour
        </button>
        <button
          onClick={handlePreview}
          disabled={!columnMapping?.nom || !columnMapping?.prenom}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prévisualiser
        </button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Prévisualisation des données</h3>
        <p className="text-sm text-gray-500">
          Vérifiez les données avant l'import
        </p>
      </div>
      
      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{importResult?.patients.length || 0}</div>
          <div className="text-sm text-green-800">Patients à importer</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{importResult?.errors.length || 0}</div>
          <div className="text-sm text-red-800">Erreurs</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{importResult?.warnings.length || 0}</div>
          <div className="text-sm text-yellow-800">Avertissements</div>
        </div>
      </div>
      
      {/* Erreurs */}
      {importResult?.errors && importResult.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Erreurs :</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {importResult.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Avertissements */}
      {importResult?.warnings && importResult.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Avertissements :</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {importResult.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Aperçu des données */}
      {importResult?.patients && importResult.patients.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-3">Aperçu des données (5 premiers patients) :</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 text-left">Nom</th>
                  <th className="px-2 py-1 text-left">Prénom</th>
                  <th className="px-2 py-1 text-left">DN</th>
                  <th className="px-2 py-1 text-left">Date naissance</th>
                  <th className="px-2 py-1 text-left">Ordonnance soins</th>
                  <th className="px-2 py-1 text-left">Ordonnance semelles</th>
                  <th className="px-2 py-1 text-left">Médecin</th>
                </tr>
              </thead>
              <tbody>
                {importResult.patients.slice(0, 5).map((patient, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-2 py-1">{patient.nom}</td>
                    <td className="px-2 py-1">{patient.prenom}</td>
                    <td className="px-2 py-1">{patient.dn || '-'}</td>
                    <td className="px-2 py-1">{patient.dateNaissance.toLocaleDateString('fr-FR')}</td>
                    <td className="px-2 py-1">{patient.date_ordonnanceSoins ? patient.date_ordonnanceSoins.toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="px-2 py-1">{patient.date_ordonnanceSemelles ? patient.date_ordonnanceSemelles.toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="px-2 py-1">{patient.medecinNom} {patient.medecinPrenom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={() => setStep('mapping')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Retour
        </button>
        {importResult?.errors && importResult.errors.length > 0 && (
          <button
            onClick={() => handleImport(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
          >
            Ignorer les erreurs et importer
          </button>
        )}
        <button
          onClick={() => handleImport()}
          disabled={importResult?.errors && importResult.errors.length > 0}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Importer les données
        </button>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="text-center py-8">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
        <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Import en cours...</h3>
      <p className="text-sm text-gray-500">Veuillez patienter pendant l'import des données</p>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Importer des patients</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isImporting}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {step === 'select' && renderSelectStep()}
          {step === 'mapping' && renderMappingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'importing' && renderImportingStep()}
        </div>
      </div>
    </div>
  );
};

export default ImportPatientsModal;
