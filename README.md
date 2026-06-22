# ⚽ AFC — Gestion d'équipe de football

Application web full-stack pour gérer une équipe de football, avec une interface
immersive sur le thème d'un terrain de foot (pelouse tondue, lignes blanches,
cartes joueurs style FIFA), responsive et déployable sur **Render**.

## Stack

| Couche      | Techno                                              |
|-------------|-----------------------------------------------------|
| Frontend    | React + Vite, React Router, @dnd-kit/core, html-to-image |
| Backend     | Node.js + Express (API REST)                        |
| Base        | PostgreSQL                                          |
| ORM         | Prisma (migrations + seed)                          |
| Déploiement | Render (1 web service + 1 base PostgreSQL)          |

En production, Express sert le build statique du front (`client/dist`) : **un seul
service web** + une base de données, sans problème de CORS.

## Arborescence

```
/client                       → app React (Vite)
/server                       → API Express + Prisma
/server/prisma/schema.prisma  → schéma de la base
render.yaml                   → blueprint de déploiement Render
```

## Fonctionnalités

- **Comptes = joueurs** : chaque compte est un joueur. À la première connexion, le
  joueur complète son profil (postes : DB, DC, DG, DD, MD, MG, MOC, MR, AC, AIG,
  AID, MLG, MLD) et ses notes sur 10 (vitesse, tir, passe, arrêt, réactivité, saut,
  endurance, risque de crampe, balle au pied, défense, dribble).
- **Validation** : un nouveau compte doit être validé par un **staff**. Un compte
  staff par défaut (`admin`) est créé par le seed.
- **Cartes FIFA** : chaque joueur a une carte avec sa note globale (moyenne). Les
  notes ne sont modifiables que par le joueur lui-même.
- **Tableau de bord** : moyenne de buts par format (5/7/9/11), effectif, solde.
- **Composition tactique** : terrain interactif, formats 5/7/9/11, schémas
  préconfigurés, drag & drop, banc des remplaçants, postes vides signalés,
  enregistrement (staff), réouverture, export en image.
- **Ajout d'un match** (staff) : terrain interactif (compo enregistrée ou non),
  titulaires + remplaçants. Les joueurs convoqués sont comptabilisés comme ayant
  joué → le **nombre de matchs joués** par joueur est suivi (dashboard, fiche).
- **Club & staff** : infos club, encadrement, calendrier matchs/entraînements,
  présences.
- **Finances (staff)** : compte de l'équipe (ajouts/retraits) et cotisations
  mensuelles avec suivi des retards.

## Application mobile (PWA)

Le site est une **PWA installable** : sur mobile, ouvrez l'URL puis « Ajouter à
l'écran d'accueil » (Android : menu Chrome ; iPhone : Partager → Sur l'écran
d'accueil). L'app s'ouvre en plein écran avec l'**icône = logo du club**
(manifeste et icône servis dynamiquement par Express, mis à jour si le logo
change). La base de données reste la même base en ligne.

## Démarrage en local

Pré-requis : Node 20+ et une base PostgreSQL.

```bash
# 1) Dépendances
npm run install:all

# 2) Variables d'environnement du serveur
cp server/.env.example server/.env
#   puis renseigner DATABASE_URL

# 3) Migrations + seed (équipe + joueurs de démo + compte admin)
npm run prisma:migrate
npm run seed

# 4) Lancer l'API (port 4000) et le front (port 5173) dans deux terminaux
npm run dev:server
npm run dev:client
```

Le front (Vite) proxifie `/api` vers `http://localhost:4000`.

### Compte par défaut

Le seed ne crée **que le compte staff `admin`** (aucun compte de démonstration) :

- **Staff / admin** : `admin@afc.local` / `admin1234`

> Configurables via `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Les autres joueurs
> s'inscrivent eux-mêmes puis sont validés par l'admin.

## API REST (extrait)

| Méthode | Route                          | Accès    |
|---------|--------------------------------|----------|
| POST    | `/api/auth/register`           | public   |
| POST    | `/api/auth/login`              | public   |
| GET/PUT | `/api/auth/me` · `/api/auth/profile` | connecté |
| CRUD    | `/api/players` (+ `/:id/stats`, `/:id/approve`) | connecté / staff |
| CRUD    | `/api/staff`, `/api/matches`, `/api/trainings` | staff |
| GET/POST| `/api/attendances` (+ `/bulk`) | staff    |
| CRUD    | `/api/lineups`                 | lecture libre / écriture staff |
| GET     | `/api/dashboard`               | connecté |
| GET/POST| `/api/finances/transactions` · `/api/finances/dues` | staff |

Toutes les entrées sont validées (Zod) et les erreurs renvoyées en JSON.

## Déploiement sur Render

1. Pousser ce repo sur GitHub.
2. Sur Render : **New + → Blueprint**, sélectionner le repo. Render lit
   `render.yaml` et crée la base PostgreSQL + le web service.
3. Le build installe tout, build le front et génère le client Prisma. Le start
   applique les migrations, lance le seed (compte `admin`) puis démarre l'API.

Variables gérées automatiquement : `DATABASE_URL`, `JWT_SECRET`. Pensez à changer
`ADMIN_PASSWORD` dans le dashboard Render après le premier déploiement.
