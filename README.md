# KL Beton - Système de Pointage

Application Next.js 14+ de gestion des pointages journaliers pour entreprise de construction avec architecture en couches (Clean Architecture).

## 🎯 Fonctionnalités

- ✅ **Authentification** : NextAuth.js avec rôles ADMIN/EMPLOYE
- ✅ **Dashboard** : Statistiques en temps réel, graphiques Chart.js (Pie, Line)
- ✅ **Pointage Journalier** : Gestion présences/absences avec calcul automatique
- ✅ **Gestion Employés** : CRUD complet, profils détaillés, historiques
- ✅ **Rapports Mensuels** : Récapitulatifs avec calcul de salaire automatique
- ✅ **Calcul Intelligent** : 
  - Exclusion automatique des dimanches
  - Gestion jours fériés tunisiens
  - Heures supplémentaires avec majoration 25%
  - Déduction absences du salaire

## 📋 Prérequis

- Node.js 18+ (télécharger sur [nodejs.org](https://nodejs.org))
- PostgreSQL 14+ (ou compte gratuit sur [Neon.tech](https://neon.tech))
- npm ou yarn

## 🚀 Installation

### 1. Cloner et installer les dépendances

```bash
cd c:/Users/tayse/OneDrive/Desktop/beton/frontend/bettonapp
npm install
```

### 2. Configurer la base de données

**Option A : PostgreSQL local**
```bash
# Créer une base de données PostgreSQL
createdb kl_beton
```

**Option B : Neon.tech (gratuit, recommandé)**
1. Créer un compte sur [Neon.tech](https://neon.tech)
2. Créer un nouveau projet
3. Copier la "Connection String"

### 3. Configurer les variables d'environnement

Créer un fichier `.env` à la racine :

```env
# Database PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/kl_beton?schema=public"
# Ou Neon.tech:
# DATABASE_URL="postgres://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="kl-beton-secret-CHANGEZ-MOI-EN-PRODUCTION"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

### 4. Initialiser la base de données

```bash
# Créer les tables Prisma
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate

# Peupler avec des données de test (5 employés + 2 mois de pointages)
npx prisma db seed
```

### 5. Lancer l'application

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🔐 Comptes de Test

Après le seeding, utilisez ces comptes :

**Administrateur** :
- Email : `admin@klbeton.tn`
- Mot de passe : `admin123`

**Employés** (avec compte) :
- Email : `mohamed.benali@klbeton.tn` (ou autre from seed)
- Mot de passe : `password123`

## 📁 Structure du Projet

```
bettonapp/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Pages authentification
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/            # Pages dashboard protégées
│   │   ├── page.js             # Dashboard principal
│   │   ├── pointage/           # Module pointage
│   │   ├── employes/           # Gestion employés
│   │   └── rapports/           # Rapports mensuels
│   └── api/                    # API Routes
│       ├── auth/
│       ├── employes/
│       ├── pointages/
│       ├── rapports/
│       └── dashboard/
├── components/                 # Composants React
│   └── layout/
│       ├── Sidebar.js
│       ├── Header.js
│       └── DashboardLayout.js
├── lib/                        # Logique métier (Clean Architecture)
│   ├── domain/                 # Entités et Value Objects
│   ├── use-cases/              # Cas d'utilisation
│   ├── services/               # Services métier
│   │   ├── calculJoursService.js
│   │   ├── dimancheCalculator.js
│   │   └── recapGenerator.js
│   ├── infrastructure/         # Infrastructure (DB, Auth, PDF)
│   └── prisma.js
├── prisma/
│   ├── schema.prisma           # Modèles de données
│   └── seed.js                 # Données de test
├── constants/
│   └── joursFeries.js          # Jours fériés Tunisie
├── config/
│   └── index.js                # Configuration app
├── middleware.js               # Protection routes Next.js
├── tailwind.config.js
└── package.json
```

## 🎨 Technologies

- **Frontend** : Next.js 14+ (App Router), React 19, JavaScript
- **Styling** : Tailwind CSS 4
- **Database** : PostgreSQL + Prisma ORM
- **Auth** : NextAuth.js (JWT)
- **Charts** : Chart.js + react-chartjs-2
- **PDF** : @react-pdf/renderer
- **Dates** : date-fns

## 💼 Logique Métier Clé

### Calcul des Jours Ouvrables
```javascript
// Formule: Total jours - Dimanches - Jours fériés
// Exemple: 30 jours - 4 dimanches - 0 férié = 26 jours ouvrables
```

### Calcul du Salaire
```javascript
Salaire Net = Salaire Base 
            + (Heures Supp × Taux Horaire × 1.25)
            - (Jours Absence × Taux Journalier)

Taux Journalier = Salaire Base / 26 jours
Taux Horaire = Taux Journalier / 8 heures
```

### Statuts de Pointage
- 🟢 **PRESENT** : Compte comme jour travaillé
- 🔴 **ABSENT** : Non payé, déduit du salaire
- 🟡 **CONGE** : Payé, décompté du solde congés
- 🟠 **MALADIE** : Payé, décompté du solde maladie
- 🔵 **FERIE** : Payé, non travaillé

## 📊 Commandes Utiles

```bash
# Développement
npm run dev

# Production
npm run build
npm run start

# Prisma
npx prisma studio              # Interface visuelle DB
npx prisma migrate reset       # Réinitialiser DB
npx prisma db seed             # Re-seeder
npx prisma migrate dev         # Nouvelle migration

# Linting
npm run lint
```

## 🛠️ Scripts de Démarrage Rapide

### Windows (PowerShell)
```powershell
# Installation complète
npm install
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
npm run dev
```

### Linux/Mac
```bash
# Installation complète
npm install && \
npx prisma migrate dev --name init && \
npx prisma generate && \
npx prisma db seed && \
npm run dev
```

## 🔧 Dépannage

**Erreur Prisma "Client not generated"** :
```bash
npx prisma generate
```

**Erreur NextAuth "NEXTAUTH_SECRET missing"** :
- Vérifier que `.env` existe et contient `NEXTAUTH_SECRET`

**Port 3000 déjà utilisé** :
```bash
# Changer le port
npm run dev -- -p 3001
```

**Base de données non accessible** :
- Vérifier `DATABASE_URL` dans `.env`
- Si Neon.tech : vérifier que `?sslmode=require` est présent

## 📝 Données de Démonstration

Le seed crée :
- 1 administrateur système
- 5 employés avec différents postes (Chef de chantier, Ingénieure, Maçon, etc.)
- 2 mois complets de pointages avec :
  - Présences majoritaires (70%)
  - Absences, congés, maladies (30%)
  - Heures supplémentaires aléatoires (30% des présences)

## 🚀 Déploiement

### Vercel (Recommandé pour Next.js)
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Ajouter variables d'environnement :
# - DATABASE_URL
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL (votre URL Vercel)
```

### Autres Plateformes
- **Railway.app** : Supporte PostgreSQL + Next.js
- **Render.com** : PostgreSQL + Web Service
- **Docker** : Dockerfile inclus (à créer)

## 📄 Licence

Propriétaire - KL Beton © 2024

## 👥 Support

Pour toute question ou problème :
- Email : admin@klbeton.tn
- Documentation Prisma : https://www.prisma.io/docs
- Documentation Next.js : https://nextjs.org/docs
