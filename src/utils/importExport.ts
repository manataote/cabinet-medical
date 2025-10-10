import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Patient, Medecin, Ordonnance } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Types pour l'import
export interface ImportedPatient {
  nom: string;
  prenom: string;
  dn: string;
  dateNaissance: Date;
  date_ordonnanceSoins?: Date;
  date_ordonnanceSemelles?: Date;
  medecinNom: string;
  medecinPrenom: string;
  medecinIdentifiant: string;
  adresse?: string;
  telephone?: string;
}

export interface ImportResult {
  patients: ImportedPatient[];
  errors: string[];
  warnings: string[];
}

export interface ColumnMapping {
  nom: string;
  prenom: string;
  dn: string;
  dateNaissance: string;
  date_ordonnanceSoins?: string;
  date_ordonnanceSemelles?: string;
  medecinPrescripteur: string;
  adresse?: string;
  telephone?: string;
}

// Fonction pour parser un médecin prescripteur
export function parseMedecinPrescripteur(medecinText: string): { nom: string; prenom: string; identifiant: string } {
  if (!medecinText || typeof medecinText !== 'string') {
    return { nom: '', prenom: '', identifiant: '' };
  }

  // Nettoyer le texte
  const cleaned = medecinText.trim().replace(/\s+/g, ' ');
  
  // Patterns de détection d'identifiant
  const identifiantPatterns = [
    /([A-Z]\d+)$/, // M1234, D5678, etc.
    /([A-Z]{2,}\d+)$/, // DR1234, etc.
    /(\d{4,})$/, // 1234, 5678, etc.
  ];

  let identifiant = '';
  let nomPrenom = cleaned;

  // Chercher un identifiant à la fin
  for (const pattern of identifiantPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      identifiant = match[1];
      nomPrenom = cleaned.replace(pattern, '').trim();
      break;
    }
  }

  // Si pas d'identifiant trouvé, générer un temporaire
  if (!identifiant) {
    identifiant = `T${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  // Séparer nom et prénom
  const parts = nomPrenom.split(' ');
  if (parts.length >= 2) {
    return {
      nom: parts[0],
      prenom: parts.slice(1).join(' '),
      identifiant
    };
  } else if (parts.length === 1) {
    return {
      nom: parts[0],
      prenom: '',
      identifiant
    };
  }

  return { nom: '', prenom: '', identifiant };
}

// Fonction pour détecter automatiquement les colonnes
export function detectColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};
  
  console.log('🔍 Détection des colonnes pour les en-têtes:', headers);

  const columnPatterns = {
    nom: ['nom', 'name', 'lastname', 'surname', 'nom_famille', 'nom_patient', 'patient_nom'],
    prenom: ['prenom', 'prénom', 'firstname', 'givenname', 'prenom_patient', 'patient_prenom'],
    dn: ['dn', 'dossier', 'numero_dossier', 'patient_id', 'id_patient', 'n°', 'no', 'numero', 'id', 'dossier_patient'],
    dateNaissance: ['date_naissance', 'date de naissance', 'birthdate', 'dob', 'naissance', 'birth', 'date_naiss', 'ddn'],
    date_ordonnanceSoins: ['date_ordonnance_soins', 'date ordonnance soins', 'prescription_soins', 'ordonnance_soins', 'soins', 'date_soins', 'ordonnance_soin'],
    date_ordonnanceSemelles: ['date_ordonnance_semelles', 'date ordonnance semelles', 'prescription_semelles', 'ordonnance_semelles', 'semelles', 'date_semelles', 'ordonnance_semelle'],
    medecinPrescripteur: ['medecin', 'médecin', 'doctor', 'prescriber', 'medecin_prescripteur', 'prescripteur', 'medecin_soins', 'medecin_semelles'],
    adresse: ['adresse', 'address', 'adr', 'adresse_patient', 'patient_adresse'],
    telephone: ['telephone', 'téléphone', 'phone', 'tel', 'tél', 'telephone_patient', 'patient_telephone']
  };

  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim().replace(/[_\s-]/g, '');
    console.log(`🔍 Analyse de l'en-tête "${header}" -> "${normalizedHeader}"`);
    
    for (const [field, patterns] of Object.entries(columnPatterns)) {
      const normalizedPatterns = patterns.map(p => p.toLowerCase().replace(/[_\s-]/g, ''));
      
      if (normalizedPatterns.some(pattern => 
        normalizedHeader.includes(pattern) || 
        pattern.includes(normalizedHeader) ||
        normalizedHeader === pattern
      )) {
        console.log(`✅ Colonne "${header}" mappée vers "${field}"`);
        mapping[field as keyof ColumnMapping] = header;
        break;
      }
    }
  });
  
  console.log('📋 Mapping final détecté:', mapping);
  return mapping;
}

// Fonction pour parser une date flexible
export function parseDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  
  // Si c'est déjà une date
  if (dateStr instanceof Date) return dateStr;
  
  // Si c'est un nombre (timestamp Excel)
  if (typeof dateStr === 'number') {
    return new Date((dateStr - 25569) * 86400 * 1000);
  }
  
  // Si c'est une chaîne
  if (typeof dateStr === 'string') {
    const cleaned = dateStr.trim();
    
    // Formats supportés
    const formats = [
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // DD/MM/YYYY ou DD-MM-YYYY
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY/MM/DD ou YYYY-MM-DD
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/, // DD/MM/YY ou DD-MM-YY
    ];
    
    for (const format of formats) {
      const match = cleaned.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        
        // Déterminer le format
        if (part3.length === 4) {
          // Format avec année complète
          if (part1.length === 4) {
            // YYYY/MM/DD
            return new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
          } else {
            // DD/MM/YYYY
            return new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1));
          }
        } else {
          // Format avec année courte
          const year = parseInt(part3) + (parseInt(part3) < 50 ? 2000 : 1900);
          return new Date(year, parseInt(part2) - 1, parseInt(part1));
        }
      }
    }
  }
  
  // Essayer de parser avec Date native
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// Fonction pour valider un DN
export function validateDN(dn: any): boolean {
  if (!dn) return false;
  const dnStr = dn.toString().trim();
  return /^\d{7}$/.test(dnStr);
}

// Fonction pour parser une ligne CSV avec détection automatique du séparateur
function parseCSVLine(line: string): string[] {
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
}

// Fonction principale d'import
export function importPatientsFromFile(file: File, mapping: ColumnMapping): Promise<ImportResult> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🔄 ImportPatientsFromFile - Début:', file.name, file.type);
      
      // Vérifier le type de fichier
      const isCSV = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     file.type === 'application/vnd.ms-excel' ||
                     file.name.toLowerCase().endsWith('.xlsx') ||
                     file.name.toLowerCase().endsWith('.xls');
      
      let headers: string[] = [];
      let dataRows: any[][] = [];
      
      if (isCSV) {
        // Parser le CSV
        const text = await file.text();
        console.log('📝 Contenu CSV (premiers 500 caractères):', text.substring(0, 500));
        
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          resolve({
            patients: [],
            errors: ['Le fichier CSV ne contient pas de données'],
            warnings: []
          });
          return;
        }
        
        headers = parseCSVLine(lines[0]);
        console.log('📋 En-têtes CSV:', headers);
        
        // Parser les lignes de données
        dataRows = lines.slice(1).map(line => parseCSVLine(line));
        console.log('📊 Lignes de données CSV:', dataRows.length);
        
      } else if (isExcel) {
        // Lire le fichier Excel avec ExcelJS
        const workbook = new ExcelJS.Workbook();
        const buffer = await file.arrayBuffer();
        await workbook.xlsx.load(buffer);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          resolve({
            patients: [],
            errors: ['Le fichier Excel ne contient pas de données'],
            warnings: []
          });
          return;
        }
        
        const rows = worksheet.getSheetValues();
        if (rows.length < 2) {
          resolve({
            patients: [],
            errors: ['Le fichier Excel ne contient pas de données'],
            warnings: []
          });
          return;
        }
        
        headers = rows[0] as string[];
        dataRows = rows.slice(1) as any[][];
        console.log('📋 En-têtes Excel:', headers);
        console.log('📊 Lignes de données Excel:', dataRows.length);
        
      } else {
        resolve({
          patients: [],
          errors: ['Format de fichier non supporté. Veuillez utiliser un fichier CSV ou Excel (.xlsx)'],
          warnings: []
        });
        return;
      }
      
      const patients: ImportedPatient[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];
      
      dataRows.forEach((row, index) => {
          try {
            // Récupérer les valeurs selon le mapping
            const nom = row[headers.indexOf(mapping.nom)]?.toString()?.trim() || '';
            const prenom = row[headers.indexOf(mapping.prenom)]?.toString()?.trim() || '';
            const dn = row[headers.indexOf(mapping.dn)]?.toString()?.trim() || '';
            const dateNaissance = parseDate(row[headers.indexOf(mapping.dateNaissance)]);
            const date_ordonnanceSoins = mapping.date_ordonnanceSoins ? parseDate(row[headers.indexOf(mapping.date_ordonnanceSoins)]) : null;
            const date_ordonnanceSemelles = mapping.date_ordonnanceSemelles ? parseDate(row[headers.indexOf(mapping.date_ordonnanceSemelles)]) : null;
            const medecinText = row[headers.indexOf(mapping.medecinPrescripteur)]?.toString()?.trim() || '';
            const adresse = mapping.adresse ? row[headers.indexOf(mapping.adresse)]?.toString()?.trim() : '';
            const telephone = mapping.telephone ? row[headers.indexOf(mapping.telephone)]?.toString()?.trim() : '';
            
            // Validation stricte - seuls nom et prénom sont obligatoires
            if (!nom || !prenom) {
              errors.push(`Ligne ${index + 2}: Nom et prénom sont obligatoires`);
              return;
            }
            
            // DN optionnel - si fourni et invalide, on le vide plutôt que d'arrêter
            let validDN = dn;
            if (dn && !validateDN(dn)) {
              warnings.push(`Ligne ${index + 2}: DN invalide (${dn}) - sera ignoré`);
              validDN = '';
            }
            
            // Date de naissance optionnelle - si invalide, on utilise une date par défaut
            let validDateNaissance: Date = dateNaissance || new Date('1900-01-01');
            if (!dateNaissance) {
              warnings.push(`Ligne ${index + 2}: Date de naissance invalide - sera ignorée`);
            }
            
            // Validation des ordonnances (au moins une doit être présente)
            if (!date_ordonnanceSoins && !date_ordonnanceSemelles) {
              warnings.push(`Ligne ${index + 2}: Aucune date d'ordonnance fournie (ni soins ni semelles)`);
            }
            
            // Parser le médecin
            const medecin = parseMedecinPrescripteur(medecinText);
            
            patients.push({
              nom,
              prenom,
              dn: validDN || '', // DN peut être vide
              dateNaissance: validDateNaissance,
              date_ordonnanceSoins: date_ordonnanceSoins || undefined,
              date_ordonnanceSemelles: date_ordonnanceSemelles || undefined,
              medecinNom: medecin.nom,
              medecinPrenom: medecin.prenom,
              medecinIdentifiant: medecin.identifiant,
              adresse,
              telephone
            });
            
        } catch (error) {
          errors.push(`Ligne ${index + 2}: Erreur de traitement - ${error}`);
        }
      });
      
      resolve({ patients, errors, warnings });
      
    } catch (error) {
      reject(new Error(`Erreur lors de la lecture du fichier: ${error}`));
    }
  });
}

// Fonction pour convertir les patients importés en patients et médecins
export function convertImportedData(
  importedPatients: ImportedPatient[],
  existingPatients: Patient[],
  existingMedecins: Medecin[]
): { patients: Patient[]; medecins: Medecin[]; ordonnances: Ordonnance[] } {
  const newPatients: Patient[] = [];
  const newMedecins: Medecin[] = [];
  const newOrdonnances: Ordonnance[] = [];
  
  // Créer un map des médecins existants
  const medecinMap = new Map<string, Medecin>();
  existingMedecins.forEach(medecin => {
    const key = `${medecin.nom.toLowerCase()}_${medecin.prenom.toLowerCase()}`;
    medecinMap.set(key, medecin);
  });
  
  // Créer un map des patients existants par DN
  const patientMap = new Map<string, Patient>();
  existingPatients.forEach(patient => {
    patientMap.set(patient.dn, patient);
  });
  
  importedPatients.forEach(importedPatient => {
    // Vérifier si le patient existe déjà
    if (patientMap.has(importedPatient.dn)) {
      // Patient existe déjà, on ne l'ajoute pas
      return;
    }
    
    // Créer le patient
    const patient: Patient = {
      id: uuidv4(),
      numeroFacture: `P${Date.now()}`,
      nom: importedPatient.nom,
      prenom: importedPatient.prenom,
      dn: importedPatient.dn,
      dateNaissance: importedPatient.dateNaissance,
      adresse: importedPatient.adresse || '',
      telephone: importedPatient.telephone || ''
    };
    
    newPatients.push(patient);
    
    // Gérer le médecin
    const medecinKey = `${importedPatient.medecinNom.toLowerCase()}_${importedPatient.medecinPrenom.toLowerCase()}`;
    let medecin = medecinMap.get(medecinKey);
    
    if (!medecin) {
      // Créer un nouveau médecin
      medecin = {
        id: uuidv4(),
        nom: importedPatient.medecinNom,
        prenom: importedPatient.medecinPrenom,
        identificationPrescripteur: importedPatient.medecinIdentifiant,
        actif: true
      };
      
      newMedecins.push(medecin);
      medecinMap.set(medecinKey, medecin);
    }
    
    // Créer les ordonnances selon les données disponibles
    if (importedPatient.date_ordonnanceSoins) {
      const ordonnanceSoins: Ordonnance = {
        id: uuidv4(),
        numero_ordonnance: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patient_id: patient.id,
        type: 'soins',
        date_ordonnance: importedPatient.date_ordonnanceSoins,
        duree_soins: 1,
        medecin_prescripteur: medecin.id,
        cabinet_id: '', // Sera défini lors de la sauvegarde
        contenu: 'Ordonnance importée',
        date_import: new Date()
      };
      newOrdonnances.push(ordonnanceSoins);
    }
    
    if (importedPatient.date_ordonnanceSemelles) {
      const ordonnanceSemelles: Ordonnance = {
        id: uuidv4(),
        numero_ordonnance: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patient_id: patient.id,
        type: 'semelles',
        date_ordonnance: importedPatient.date_ordonnanceSemelles,
        duree_soins: 0, // Pas de durée pour les semelles
        quantite: 1,
        medecin_prescripteur: medecin.id,
        cabinet_id: '', // Sera défini lors de la sauvegarde
        contenu: 'Ordonnance importée',
        date_import: new Date()
      };
      newOrdonnances.push(ordonnanceSemelles);
    }
  });
  
  return {
    patients: newPatients,
    medecins: newMedecins,
    ordonnances: newOrdonnances
  };
}

// Fonction d'export
export async function exportPatientsToExcel(patients: Patient[], medecins: Medecin[], ordonnances: Ordonnance[]): Promise<void> {
  // Créer un map des médecins pour l'export
  const medecinMap = new Map<string, Medecin>();
  medecins.forEach(medecin => {
    medecinMap.set(medecin.id, medecin);
  });
  
  // Créer un map des ordonnances par patient
  const ordonnanceMap = new Map<string, Ordonnance[]>();
  ordonnances.forEach(ordonnance => {
    if (!ordonnanceMap.has(ordonnance.patient_id)) {
      ordonnanceMap.set(ordonnance.patient_id, []);
    }
    ordonnanceMap.get(ordonnance.patient_id)!.push(ordonnance);
  });
  
  // Créer un nouveau workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Patients');
  
  // Définir les en-têtes
  const headers = [
    'Nom', 'Prénom', 'DN', 'Date de naissance',
    'Date ordonnance soins', 'Date ordonnance semelles',
    'Médecin prescripteur soins', 'Médecin prescripteur semelles',
    'Adresse', 'Téléphone'
  ];
  
  worksheet.addRow(headers);
  
  // Styliser les en-têtes
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // Ajouter les données des patients
  patients.forEach(patient => {
    const patientOrdonnances = ordonnanceMap.get(patient.id) || [];
    
    // Dernière ordonnance de soins
    const derniereOrdonnanceSoins = patientOrdonnances
      .filter(ord => ord.type === 'soins' || !ord.type) // Inclure les anciennes ordonnances sans type
      .sort((a, b) => new Date(b.date_ordonnance).getTime() - new Date(a.date_ordonnance).getTime())[0];
    
    // Dernière ordonnance de semelles
    const derniereOrdonnanceSemelles = patientOrdonnances
      .filter(ord => ord.type === 'semelles')
      .sort((a, b) => new Date(b.date_ordonnance).getTime() - new Date(a.date_ordonnance).getTime())[0];
    
    // Médecin pour les soins
    const medecinSoins = derniereOrdonnanceSoins ? medecinMap.get(derniereOrdonnanceSoins.medecin_prescripteur) : null;
    
    // Médecin pour les semelles
    const medecinSemelles = derniereOrdonnanceSemelles ? medecinMap.get(derniereOrdonnanceSemelles.medecin_prescripteur) : null;
    
    worksheet.addRow([
      patient.nom,
      patient.prenom,
      patient.dn,
      patient.dateNaissance.toLocaleDateString('fr-FR'),
      derniereOrdonnanceSoins ? new Date(derniereOrdonnanceSoins.date_ordonnance).toLocaleDateString('fr-FR') : '',
      derniereOrdonnanceSemelles ? new Date(derniereOrdonnanceSemelles.date_ordonnance).toLocaleDateString('fr-FR') : '',
      medecinSoins ? `${medecinSoins.nom} ${medecinSoins.prenom} ${medecinSoins.identificationPrescripteur}` : '',
      medecinSemelles ? `${medecinSemelles.nom} ${medecinSemelles.prenom} ${medecinSemelles.identificationPrescripteur}` : '',
      patient.adresse || '',
      patient.telephone || ''
    ]);
  });
  
  // Auto-adjuster la largeur des colonnes
  worksheet.columns.forEach(column => {
    if (column) {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    }
  });
  
  // Générer le fichier Excel
  const buffer = await workbook.xlsx.writeBuffer();
  const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Télécharger le fichier
  const fileName = `patients_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(data, fileName);
}
