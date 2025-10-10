import { Patient, FeuilleSoins, Ordonnance } from '../types';

export interface DuplicateGroup {
  id: string;
  patients: Patient[];
  reason: 'dn' | 'name_birth' | 'both';
  confidence: 'high' | 'medium' | 'low';
}

export interface DuplicateStats {
  totalDuplicates: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  groups: DuplicateGroup[];
}

// Fonction pour normaliser les noms (supprimer accents, espaces, etc.)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/\s+/g, '') // Supprimer les espaces
    .trim();
}

// Fonction pour normaliser les dates (comparer seulement année, mois, jour)
function normalizeDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Détecter les doublons par DN identique
function detectDuplicatesByDN(patients: Patient[]): DuplicateGroup[] {
  const dnMap = new Map<string, Patient[]>();
  const groups: DuplicateGroup[] = [];

  patients.forEach(patient => {
    if (patient.dn && patient.dn.trim() !== '') {
      const normalizedDN = patient.dn.trim();
      if (!dnMap.has(normalizedDN)) {
        dnMap.set(normalizedDN, []);
      }
      dnMap.get(normalizedDN)!.push(patient);
    }
  });

  dnMap.forEach((patientList, dn) => {
    if (patientList.length > 1) {
      groups.push({
        id: `dn_${dn}`,
        patients: patientList,
        reason: 'dn',
        confidence: 'high'
      });
    }
  });

  return groups;
}

// Détecter les doublons par nom + prénom + date de naissance identiques
function detectDuplicatesByNameBirth(patients: Patient[]): DuplicateGroup[] {
  const nameBirthMap = new Map<string, Patient[]>();
  const groups: DuplicateGroup[] = [];

  patients.forEach(patient => {
    const normalizedName = normalizeName(patient.nom);
    const normalizedPrenom = normalizeName(patient.prenom);
    const normalizedDate = normalizeDate(new Date(patient.dateNaissance));
    
    const key = `${normalizedName}_${normalizedPrenom}_${normalizedDate}`;
    
    if (!nameBirthMap.has(key)) {
      nameBirthMap.set(key, []);
    }
    nameBirthMap.get(key)!.push(patient);
  });

  nameBirthMap.forEach((patientList, key) => {
    if (patientList.length > 1) {
      // Vérifier si c'est un vrai doublon (pas juste une coïncidence)
      const firstPatient = patientList[0];
      const isRealDuplicate = patientList.every(patient => 
        patient.nom === firstPatient.nom &&
        patient.prenom === firstPatient.prenom &&
        normalizeDate(new Date(patient.dateNaissance)) === normalizeDate(new Date(firstPatient.dateNaissance))
      );

      if (isRealDuplicate) {
        groups.push({
          id: `name_${key}`,
          patients: patientList,
          reason: 'name_birth',
          confidence: 'high'
        });
      }
    }
  });

  return groups;
}

// Détecter les doublons par similarité (noms proches)
function detectDuplicatesBySimilarity(patients: Patient[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  patients.forEach((patient, index) => {
    if (processed.has(patient.id)) return;

    const similarPatients: Patient[] = [patient];
    
    patients.slice(index + 1).forEach(otherPatient => {
      if (processed.has(otherPatient.id)) return;

      const similarity = calculateSimilarity(patient, otherPatient);
      if (similarity > 0.8) { // Seuil de similarité
        similarPatients.push(otherPatient);
        processed.add(otherPatient.id);
      }
    });

    if (similarPatients.length > 1) {
      groups.push({
        id: `similar_${patient.id}`,
        patients: similarPatients,
        reason: 'name_birth',
        confidence: 'medium'
      });
      processed.add(patient.id);
    }
  });

  return groups;
}

// Calculer la similarité entre deux patients
function calculateSimilarity(patient1: Patient, patient2: Patient): number {
  const name1 = normalizeName(patient1.nom);
  const name2 = normalizeName(patient2.nom);
  const prenom1 = normalizeName(patient1.prenom);
  const prenom2 = normalizeName(patient2.prenom);

  // Similarité des noms
  const nameSimilarity = calculateStringSimilarity(name1, name2);
  const prenomSimilarity = calculateStringSimilarity(prenom1, prenom2);

  // Similarité des dates (si proches, bonus)
  const date1 = new Date(patient1.dateNaissance);
  const date2 = new Date(patient2.dateNaissance);
  const dateDiff = Math.abs(date1.getTime() - date2.getTime());
  const dateSimilarity = dateDiff < 30 * 24 * 60 * 60 * 1000 ? 0.8 : 0; // 30 jours

  // Poids : nom 40%, prénom 40%, date 20%
  return (nameSimilarity * 0.4) + (prenomSimilarity * 0.4) + (dateSimilarity * 0.2);
}

// Calculer la similarité entre deux chaînes (algorithme de Levenshtein simplifié)
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (matrix[str2.length][str1.length] / maxLength);
}

// Fonction principale pour détecter tous les doublons
export function detectDuplicates(patients: Patient[]): DuplicateStats {
  const dnGroups = detectDuplicatesByDN(patients);
  const nameBirthGroups = detectDuplicatesByNameBirth(patients);
  const similarityGroups = detectDuplicatesBySimilarity(patients);

  // Fusionner les groupes qui se chevauchent
  const allGroups = [...dnGroups, ...nameBirthGroups, ...similarityGroups];
  const mergedGroups = mergeOverlappingGroups(allGroups);

  const stats: DuplicateStats = {
    totalDuplicates: mergedGroups.reduce((sum, group) => sum + group.patients.length - 1, 0),
    highConfidence: mergedGroups.filter(g => g.confidence === 'high').length,
    mediumConfidence: mergedGroups.filter(g => g.confidence === 'medium').length,
    lowConfidence: mergedGroups.filter(g => g.confidence === 'low').length,
    groups: mergedGroups
  };

  return stats;
}

// Fusionner les groupes qui se chevauchent
function mergeOverlappingGroups(groups: DuplicateGroup[]): DuplicateGroup[] {
  const merged: DuplicateGroup[] = [];
  const processed = new Set<string>();

  groups.forEach(group => {
    if (processed.has(group.id)) return;

    const patient_ids = new Set(group.patients.map(p => p.id));
    const overlappingGroups = groups.filter(g => 
      g.id !== group.id && 
      !processed.has(g.id) &&
      g.patients.some(p => patient_ids.has(p.id))
    );

    // Fusionner avec les groupes qui se chevauchent
    overlappingGroups.forEach(overlappingGroup => {
      overlappingGroup.patients.forEach(patient => {
        if (!patient_ids.has(patient.id)) {
          group.patients.push(patient);
          patient_ids.add(patient.id);
        }
      });
      processed.add(overlappingGroup.id);
    });

    // Déterminer la confiance finale
    if (group.reason === 'dn' || overlappingGroups.some(g => g.reason === 'dn')) {
      group.confidence = 'high';
      group.reason = 'both';
    } else if (group.reason === 'name_birth' || overlappingGroups.some(g => g.reason === 'name_birth')) {
      group.confidence = group.confidence === 'high' ? 'high' : 'medium';
    }

    merged.push(group);
    processed.add(group.id);
  });

  return merged;
}

// Obtenir les statistiques des références pour un patient
export function getPatientReferences(patient_id: string, feuillesSoins: FeuilleSoins[], ordonnances: Ordonnance[]) {
  const feuilles = feuillesSoins.filter(f => f.patient_id === patient_id);
  const ordonnancesPatient = ordonnances.filter(o => o.patient_id === patient_id);

  return {
    feuillesSoins: feuilles.length,
    ordonnances: ordonnancesPatient.length,
    totalMontant: feuilles.reduce((sum, f) => sum + f.montantTotal, 0)
  };
}

