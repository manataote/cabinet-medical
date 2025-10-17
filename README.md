# Cabinet Médical - Application de Gestion

Une application web moderne pour la gestion complète d'un cabinet médical, développée avec React, TypeScript et Tailwind CSS.

## 🚀 Fonctionnalités

### 📊 Tableau de bord
- Vue d'ensemble des statistiques du cabinet
- Graphiques et métriques en temps réel
- Actions récentes et notifications

### 👥 Gestion des patients
- Création et modification de dossiers patients
- Informations personnelles et médicales
- Historique des consultations
- Gestion des assurés

### 📋 Feuilles de soins
- Création de feuilles de soins complètes
- Gestion des actes médicaux
- Calcul automatique des montants
- Conditions particulières (ATMP, maternité, urgence, etc.)
- Parcours de soins coordonnés

### 💰 Factures semelles orthopédiques
- Création de factures pour semelles
- Gestion des articles et références
- Calcul automatique TVA et montants
- Gestion des pointures et latéralités

### 📄 Bordereaux de remise
- Création de bordereaux de remise
- Regroupement de feuilles de soins
- Calcul automatique des totaux
- Numérotation automatique

### 🎨 Éditeur de modèles
- Création de modèles personnalisés
- Éditeur visuel drag & drop
- Zones d'impression configurables
- Prévisualisation en temps réel

### ⚙️ Paramètres
- Configuration de l'application
- Gestion des prestations
- Sauvegarde et restauration des données
- Export/Import des données

## 🛠️ Technologies utilisées

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **État global**: Context API + useReducer
- **Formulaires**: React Hook Form + Yup
- **PDF**: React PDF
- **Animations**: Framer Motion
- **Drag & Drop**: React DnD
- **Tests**: Jest + React Testing Library
- **Desktop**: Electron (application native multi-plateforme)

## 📦 Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd cabinet-medical
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Démarrer l'application**

   **Version Web:**
   ```bash
   npm start
   ```
   Puis ouvrir http://localhost:3000

   **Version Electron (application desktop):**
   ```bash
   npm run electron-dev
   ```

## 🏗️ Structure du projet

```
src/
├── components/           # Composants React
│   ├── patients/        # Gestion des patients
│   ├── feuillesSoins/   # Feuilles de soins
│   ├── factures/        # Factures semelles
│   ├── bordereaux/      # Bordereaux de remise
│   ├── editor/          # Éditeur de modèles
│   └── ...
├── contexts/            # Contextes React
│   └── AppContext.tsx   # État global de l'application
├── types/               # Définitions TypeScript
│   └── index.ts         # Types principaux
├── utils/               # Utilitaires
│   ├── calculs.ts       # Calculs médicaux
│   ├── storage.ts       # Gestion du stockage
│   └── validation.ts    # Validation des données
└── ...
```

## 📋 Types de données

### Patient
```typescript
interface Patient {
  id: string;
  numeroFacture: string;
  nom: string;
  prenom: string;
  dn: string; // 7 chiffres
  dateNaissance: Date;
  adresse: string;
  telephone: string;
  assure?: Patient; // Patient assuré
}
```

### Feuille de soins
```typescript
interface FeuilleSoins {
  id: string;
  numeroFacture: string;
  patient: Patient;
  assure?: Patient;
  parcoursSoins: boolean;
  accordPrealable?: string;
  medecinPrescripteur: string;
  datePrescription: Date;
  conditions: {
    longueMaladie: boolean;
    atmp: boolean;
    numeroAtp?: string;
    maternite: boolean;
    urgence: boolean;
  };
  actes: Acte[];
  montantTotal: number;
  montantPaye: number;
  montantTiersPayant: number;
  modeleUtilise: string;
}
```

### Facture semelles
```typescript
interface FactureSemelles {
  id: string;
  numeroFacture: string;
  patient: Patient;
  articles: ArticleSemelles[];
  tva: number;
  montantHT: number;
  montantTTC: number;
  modeleUtilise: string;
}
```

### Bordereau
```typescript
interface Bordereau {
  id: string;
  numeroBordereau: string;
  date: Date;
  feuillesSoins: FeuilleSoins[];
  montantTotal: number;
  modeleUtilise: string;
}
```

## 🔧 Configuration

### Variables d'environnement
Créez un fichier `.env` à la racine du projet :

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_VERSION=1.0.0
```

### Configuration Tailwind
Le fichier `tailwind.config.js` contient la configuration personnalisée avec :
- Couleurs primaires et médicales
- Police Inter
- Extensions personnalisées

## 📱 Fonctionnalités avancées

### Sauvegarde automatique
- Sauvegarde automatique dans le localStorage
- Export/Import des données en JSON
- Synchronisation en temps réel

### Calculs automatiques
- Calcul des montants des feuilles de soins
- Calcul des TVA pour les factures
- Calcul des totaux des bordereaux
- Gestion des majorations (dimanche, nuit)

### Validation des données
- Validation des numéros de sécurité sociale
- Validation des montants
- Validation des dates
- Messages d'erreur personnalisés

### Interface utilisateur
- Design responsive
- Animations fluides
- Thème médical professionnel
- Accessibilité optimisée

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Lancer les tests en mode watch
npm test -- --watch

# Générer un rapport de couverture
npm test -- --coverage
```

## 📦 Build de production

### Build Web
```bash
# Construire l'application web
npm run build

# Prévisualiser le build
npx serve -s build
```

### Build Electron (Application Desktop)

```bash
# Build pour Windows
npm run electron-build-win

# Build pour macOS
npm run electron-build-mac

# Build pour Linux
npm run electron-build-linux

# Build pour toutes les plateformes
npm run electron-build-all
```

Les fichiers d'installation seront générés dans le dossier `dist/` :
- **Windows** : `Cabinet Médical-Setup-0.1.0.exe` (installeur) et `Cabinet Médical-Portable-0.1.0.exe` (portable)
- **macOS** : `Cabinet Médical-0.1.0.dmg` et `.zip`
- **Linux** : `Cabinet Médical-0.1.0.AppImage` et `.deb`

## 🖥️ Application Desktop (Electron)

L'application peut être empaquetée en tant qu'application desktop native grâce à Electron.

### Avantages de la version desktop
- ✅ Fonctionne hors ligne
- ✅ Application autonome (pas besoin de navigateur)
- ✅ Icône dans la barre des tâches
- ✅ Meilleure intégration système
- ✅ Distribution facile via installeur

### Configuration Electron
- **Main process**: `public/electron.js` - Gestion de la fenêtre et des événements système
- **Preload script**: `public/preload.js` - Pont sécurisé entre l'application et Electron
- **Configuration build**: Dans `package.json` sous la clé `"build"`

### Sécurité
L'application suit les meilleures pratiques de sécurité Electron :
- ✅ Context Isolation activé
- ✅ Node Integration désactivé
- ✅ Remote Module désactivé
- ✅ Preload script pour l'exposition contrôlée des APIs

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation
- Contacter l'équipe de développement

## 🔄 Versions

- **v1.0.0** : Version initiale avec toutes les fonctionnalités de base
- **v1.1.0** : Ajout de l'éditeur de modèles
- **v1.2.0** : Amélioration des calculs et de la validation

---

Développé avec ❤️ pour les professionnels de santé
