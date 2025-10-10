import React, { useState, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Ordonnance } from '../../types';
import { OrdonnancesService } from '../../services/ordonnancesService';
import { supabase } from '../../config/supabase';

interface OrdonnanceFormProps {
  patientId: string;
  ordonnanceToEdit?: Ordonnance;
  onBack: () => void;
}

const OrdonnanceForm: React.FC<OrdonnanceFormProps> = ({ patientId, ordonnanceToEdit, onBack }) => {
  const { state, addOrdonnance, updateOrdonnance } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Ordonnance>>({
    patient_id: patientId,
    type: ordonnanceToEdit?.type || 'soins', // Type par défaut ou type existant
    date_ordonnance: ordonnanceToEdit?.date_ordonnance || new Date(),
    duree_soins: ordonnanceToEdit?.type === 'soins' ? (ordonnanceToEdit?.duree_soins || 1) : 1,
    quantite: ordonnanceToEdit?.type === 'semelles' ? (ordonnanceToEdit?.quantite || 1) : 1,
    medecin_prescripteur: ordonnanceToEdit?.medecin_prescripteur || '',
    contenu: ordonnanceToEdit?.contenu || '',
    commentaire: ordonnanceToEdit?.commentaire || '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Caméra arrière par défaut
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Erreur lors de l\'accès à la caméra:', error);
      alert('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Définir les dimensions du canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Dessiner l'image de la vidéo sur le canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir le canvas en blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `ordonnance_${Date.now()}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            setSelectedFile(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medecin_prescripteur) {
      alert('Veuillez sélectionner un médecin prescripteur.');
      return;
    }

    if (formData.type === 'soins' && !formData.duree_soins) {
      alert('Veuillez saisir la durée des soins.');
      return;
    }

    if (formData.type === 'semelles' && !formData.quantite) {
      alert('Veuillez saisir la quantité.');
      return;
    }

    setIsUploading(true);

    try {
      // Récupérer le cabinet_id de l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Utilisateur non connecté');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('cabinet_id')
        .eq('id', user.id)
        .single();

      if (!userData) {
        alert('Erreur lors de la récupération des données utilisateur');
        return;
      }

      let fichierUrl: string | undefined;
      let nom_fichier: string | undefined;
      let typeFichier: string | undefined;
      let taille_fichier: number | undefined;

      if (selectedFile) {
        // Upload du nouveau fichier_url vers Supabase Storage
        const uploadResult = await OrdonnancesService.uploadFile(selectedFile, ordonnanceToEdit?.id || `temp_${Date.now()}`);
        if (uploadResult) {
          fichierUrl = uploadResult.url;
          nom_fichier = selectedFile.name;
          typeFichier = selectedFile.type;
          taille_fichier = selectedFile.size;
        }
      } else if (formData.fichier_url === undefined && ordonnanceToEdit?.fichier_url) {
        // Fichier existant supprimé
        if (ordonnanceToEdit.fichier_url) {
          // Supprimer le fichier du storage
          await OrdonnancesService.deleteFile(ordonnanceToEdit.fichier_url);
        }
        fichierUrl = undefined;
        nom_fichier = undefined;
        typeFichier = undefined;
        taille_fichier = undefined;
      } else if (ordonnanceToEdit?.fichier_url) {
        // Conserver le fichier existant
        fichierUrl = ordonnanceToEdit.fichier_url;
        nom_fichier = ordonnanceToEdit.nom_fichier;
        typeFichier = ordonnanceToEdit.type_fichier;
        taille_fichier = ordonnanceToEdit.taille_fichier;
      }

      const ordonnanceData = {
        numero_ordonnance: ordonnanceToEdit?.numero_ordonnance || `ORD-${Date.now()}`,
        patient_id: formData.patient_id!,
        type: formData.type!,
        date_ordonnance: new Date(formData.date_ordonnance!),
        duree_soins: formData.type === 'soins' ? formData.duree_soins! : 0,
        quantite: formData.type === 'semelles' ? formData.quantite! : 1,
        medecin_prescripteur: formData.medecin_prescripteur!,
        cabinet_id: userData.cabinet_id,
        contenu: formData.contenu || '',
        fichier_url: fichierUrl,
        nom_fichier: nom_fichier,
        type_fichier: typeFichier,
        taille_fichier: taille_fichier,
        date_import: new Date(),
        commentaire: formData.commentaire,
      };

      if (ordonnanceToEdit) {
        await updateOrdonnance(ordonnanceToEdit.id, ordonnanceData);
      } else {
        await addOrdonnance(ordonnanceData);
      }

      onBack();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'ordonnance:', error);
      alert('Erreur lors de la sauvegarde de l\'ordonnance');
    } finally {
      setIsUploading(false);
    }
  };



  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {ordonnanceToEdit ? 'Modifier l\'ordonnance' : 'Nouvelle ordonnance'}
        </h2>
        <p className="text-gray-600">
          {ordonnanceToEdit ? 'Modifiez les informations de l\'ordonnance' : 'Ajoutez une nouvelle ordonnance pour ce patient'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type d'ordonnance */}
        <div>
          <label className="form-label">Type d'ordonnance *</label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value as 'soins' | 'semelles')}
            className="form-select"
            required
          >
            <option value="soins">Ordonnance de soins</option>
            <option value="semelles">Ordonnance de semelles orthopédiques</option>
          </select>
        </div>

        {/* Date de l'ordonnance */}
        <div>
          <label className="form-label">Date de l'ordonnance *</label>
          <input
            type="date"
            value={formData.date_ordonnance ? new Date(formData.date_ordonnance).toISOString().split('T')[0] : ''}
            onChange={(e) => handleInputChange('date_ordonnance', e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Durée des soins (uniquement pour les soins) */}
        {formData.type === 'soins' && (
          <div>
            <label className="form-label">Durée des soins (en mois) *</label>
            <input
              type="number"
              value={formData.duree_soins}
              onChange={(e) => handleInputChange('duree_soins', parseInt(e.target.value))}
              className="input-field"
              min="1"
              max="12"
              required
            />
          </div>
        )}

        {/* Quantité (uniquement pour les semelles) */}
        {formData.type === 'semelles' && (
          <div>
            <label className="form-label">Quantité *</label>
            <input
              type="number"
              value={formData.quantite}
              onChange={(e) => handleInputChange('quantite', parseInt(e.target.value))}
              className="input-field"
              min="1"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Nombre de paires de semelles prescrites</p>
          </div>
        )}

        {/* Médecin prescripteur */}
        <div>
          <label className="form-label">Médecin prescripteur *</label>
          <select
            value={formData.medecin_prescripteur}
            onChange={(e) => handleInputChange('medecin_prescripteur', e.target.value)}
            className="form-select"
            required
          >
            <option value="">Sélectionnez un médecin</option>
            {state.medecins
              .filter(medecin => medecin.actif)
              .map(medecin => (
                <option key={medecin.id} value={medecin.id}>
                  Dr. {medecin.prenom} {medecin.nom} - {medecin.identificationPrescripteur}
                </option>
              ))}
          </select>
        </div>

        {/* Fichier */}
        <div>
          <label className="form-label">Fichier de l'ordonnance</label>
          <div className="space-y-3">
            {ordonnanceToEdit?.fichier_url && !selectedFile && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Fichier actuel:</strong> {ordonnanceToEdit.nom_fichier}
                    </p>
                    <p className="text-xs text-gray-500">
                      Taille: {ordonnanceToEdit.taille_fichier ? `${(ordonnanceToEdit.taille_fichier / 1024).toFixed(1)} KB` : 'Inconnue'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        fichier_url: undefined,
                        nom_fichier: undefined,
                        typeFichier: undefined,
                        taille_fichier: undefined
                      }));
                    }}
                    className="ml-3 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-200"
                    title="Supprimer le fichier_url actuel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {ordonnanceToEdit ? 'Remplacer le fichier_url' : 'Sélectionner un fichier_url'}
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn-secondary bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Scanner l'ordonnance
                </button>
              </div>
              
              {selectedFile && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-800">
                      <strong>Fichier sélectionné:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="ml-3 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-200"
                      title="Retirer le fichier_url"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Formats acceptés: PDF, JPG, JPEG, PNG, TIFF, BMP (max 10 MB)
            </p>
          </div>
        </div>

        {/* Commentaire */}
        <div>
          <label className="form-label">Commentaire</label>
          <textarea
            value={formData.commentaire}
            onChange={(e) => handleInputChange('commentaire', e.target.value)}
            className="input-field"
            rows={3}
            placeholder="Commentaires optionnels sur cette ordonnance..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="btn-primary"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrement...
              </>
            ) : (
              ordonnanceToEdit ? 'Modifier l\'ordonnance' : 'Ajouter l\'ordonnance'
            )}
          </button>
        </div>
      </form>

      {/* Interface de la caméra */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Scanner l'ordonnance
              </h3>
              <button
                onClick={stopCamera}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-h-[60vh] object-cover rounded-lg"
                />
                <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400 text-center">
                    <p className="text-sm font-medium bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                      Positionnez l'ordonnance dans le cadre
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-6 space-x-4">
                <button
                  onClick={stopCamera}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={capturePhoto}
                  className="btn-primary bg-green-600 hover:bg-green-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Capturer l'ordonnance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas caché pour la capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default OrdonnanceForm;