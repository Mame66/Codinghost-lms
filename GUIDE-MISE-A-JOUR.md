# Mise à jour CodingHost LMS — octobre 2026

À faire **dans cet ordre**. Compte environ 20 minutes.

## 1. Installer les nouvelles dépendances

```bash
cd frontend
npm install          # ajoute papaparse et read-excel-file (import Kommo)
```

## 2. Base de données Supabase (backend)

La nouvelle migration `20261021120000_espaces_photos_enseignants` :
- ajoute le public Enfants/Adultes, les photos, les infos enseignants et la table des webhooks SumUp ;
- rattrape les colonnes qui manquaient dans les migrations (`LessonProgress`, contenu des leçons, `coverImage`, etc.) ;
- est **tolérante** : elle ne crée que ce qui n'existe pas encore.

```bash
cd backend
# avec la DATABASE_URL de PROD dans .env (connexion directe, port 5432)
npx prisma migrate status      # doit lister la nouvelle migration comme « pending »
npx prisma migrate deploy      # applique la migration
npx prisma migrate status      # doit dire « Database schema is up to date »
```

> Faites une sauvegarde avant (Supabase → Database → Backups), par précaution.

Si `migrate status` signale aussi d'anciennes migrations non appliquées, **arrêtez-vous** et envoyez-moi le message.

## 3. Variables d'environnement Railway (backend)

| Variable | Obligatoire | Rôle |
|---|---|---|
| `JWT_SECRET` | oui (déjà en place) | le serveur refuse maintenant de démarrer sans |
| `SUPABASE_URL` | pour les photos | `https://xxxx.supabase.co` (Supabase → Project Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | pour les photos | clé **service_role** (même page). Ne jamais la mettre dans le frontend |
| `SUMUP_WEBHOOK_SECRET` | pour SumUp | une longue chaîne aléatoire de votre choix |
| `CORS_ORIGINS` | non | par défaut : `https://codinghost.fr,https://www.codinghost.fr,http://localhost:3000` |

Le bucket `avatars` (public) est créé automatiquement au premier envoi de photo.

## 4. Webhook SumUp

L'URL du webhook doit maintenant contenir le secret :

```
https://codinghost-lms-production.up.railway.app/api/billing/webhook/sumup?secret=VOTRE_SUMUP_WEBHOOK_SECRET
```

Sans cela, SumUp reçoit une erreur 401 et rien n'est marqué payé. Avant, n'importe qui pouvait marquer une échéance payée.

## 5. Frontend (IONOS)

```bash
cd frontend
npm run build
```

Envoyez **tout** le contenu de `build/` sur IONOS, y compris le fichier caché **`.htaccess`**. Sans lui, rafraîchir une page comme `/groups/2` ou `/login/enfants` donne une erreur 404.

## 6. Après la mise en ligne

1. Les groupes et cours existants sont classés **Enfants** par défaut. Ouvrez *Groupes*, filtrez, et passez les groupes adultes en « Adultes » (bouton Modifier). Faites de même pour les cours adultes.
2. Les élèves suivent automatiquement le public de leur groupe.
3. Nouvelles adresses de connexion :
   - `codinghost.fr/login` : choix de l'espace
   - `codinghost.fr/login/enfants`
   - `codinghost.fr/login/adultes`
   - `codinghost.fr/login/equipe` : admins et enseignants
4. Vérifiez que le compte `admin` n'a plus le mot de passe `admin123` du fichier seed.

## Changements de droits à connaître

- **Facturation** et **Paiements** sont réservés aux administrateurs.
- Les enseignants ne peuvent plus supprimer un cours verrouillé par l'admin.
- Supprimer un élève ou un groupe qui a des contrats est bloqué (message explicatif) pour protéger la comptabilité. Passez le groupe en « Terminé » à la place.
- Le menu « Mes devoirs » des élèves a été retiré (la page n'affichait rien pour eux). Les notes restent dans « Mes notes ».

---

# Mise à jour n°2 : contenus des leçons (fichiers, devoirs, import de dossiers)

## 1. Dépendance frontend

```bash
cd frontend
npm install          # ajoute jszip (import des ZIP Google Drive)
```

## 2. Base de données

Nouvelle migration `20261022090000_contenus_lecons` (tolérante, ne supprime rien) :

```bash
cd backend
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
```

> Jamais `migrate dev` ni `migrate reset` sur la base de production.

## 3. Stockage des fichiers

Les mêmes variables que pour les photos suffisent (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dans `backend/.env` et sur Railway).
Un bucket **privé** `course-files` est créé automatiquement au premier envoi : les élèves n'accèdent aux fichiers que par des liens temporaires (1 h), et jamais aux fichiers « Prof uniquement ».

Limites de l'offre gratuite Supabase : **50 Mo par fichier, 1 Go au total**. L'espace utilisé s'affiche en haut de la page des cours. Pour les vidéos et les gros fichiers, utilisez un lien Google Drive ou YouTube.

## 4. Ce qui change pour les enseignants

- **Leçon** : glisser-déposer des fichiers (PDF, PowerPoint, Word, Scratch, scripts, ZIP…), liens Drive/YouTube, chaque élément « 👁 Élèves » ou « 🔒 Prof uniquement ». Tout est facultatif.
- **Quiz** : bouton « Importer (Excel / CSV) », colonnes `Question | A | B | C | D | Bonne réponse` (modèle téléchargeable).
- **Devoir à rendre** : interrupteur dans la leçon, consignes et date limite facultatives. L'élève dépose un fichier ou un lien ; la correction se fait dans « Correction devoirs » ou directement dans la leçon.
- **Importer un dossier** (page des cours) : dossier du PC ou ZIP téléchargé depuis Google Drive, organisé `Cours / Module / Leçon / fichiers`. Les noms contenant prof, guide, corrigé ou solution sont réservés au prof. Fichiers reconnus : `quiz.xlsx`, `liens.txt`, `devoir.txt`, `objectifs.txt`, et les raccourcis Google Drive (.gdoc, .gslides…).
- **Dupliquer** un cours (menu ⋯) : copie le contenu (fichiers partagés, sans les recopier) sans les groupes ni la progression.
- Supprimer un module supprime maintenant aussi ses leçons (avant, elles restaient orphelines).

---

# Mise à jour n°3 : emails aux parents et aux élèves adultes

## 1. Base de données

Nouvelle migration `20261022180000_emails` (tables des modèles et de l'historique, plus 8 modèles prêts à l'emploi) :

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## 2. Service d'envoi (important)

Railway **bloque l'envoi par Gmail (SMTP)** sauf sur l'offre Pro : les emails actuels (bienvenue, notes…) ne partent probablement pas en production. Tous les emails de la plateforme passent maintenant par le premier service configuré :

| Variable (Railway et `backend/.env`) | Rôle |
|---|---|
| `BREVO_API_KEY` | **Recommandé.** Brevo (français), gratuit jusqu'à 300 emails/jour. Clé dans Brevo → SMTP & API → Clés API |
| `RESEND_API_KEY` | Alternative : Resend (nécessite de valider le domaine codinghost.fr) |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail, utilisé seulement si aucune clé ci-dessus (fonctionne en local, pas sur Railway Hobby) |
| `EMAIL_FROM` | Adresse d'expédition, **validée chez Brevo** (Expéditeurs) — par ex. contact@codinghost.fr |
| `EMAIL_FROM_NAME` | Nom affiché (défaut : CodingHost) |
| `EMAIL_REPLY_TO` | Adresse qui reçoit les réponses des parents (par ex. votre Gmail) |
| `FRONTEND_URL` | Défaut `https://codinghost.fr` (pour le lien de connexion dans les emails) |

Pour une bonne délivrabilité avec une adresse @codinghost.fr, ajoutez dans Brevo le domaine codinghost.fr (Expéditeurs, domaines) et créez chez IONOS les enregistrements DNS qu'il indique.

## 3. Utilisation

Menu **Emails** (administrateurs et enseignants ; un enseignant ne voit que ses groupes) :
- **Nouveau message** : un ou plusieurs groupes (parents pour les groupes enfants, l'élève lui-même pour les groupes adultes) ou une seule personne. On peut décocher des destinataires ; ceux sans adresse email sont signalés.
- **Variables** remplies pour chaque destinataire : {{destinataire}}, {{prenom_eleve}}, {{groupe}}, {{prof}}, {{identifiant}}, {{lien_connexion}}…
- Les passages [entre crochets] des modèles sont signalés tant qu'ils ne sont pas complétés.
- **Aperçu** exact de l'email, **M'envoyer un essai**, puis envoi (300 destinataires max par envoi).
- **Modèles** : 8 fournis, modifiables ; créer, dupliquer, supprimer.
- **Envoyés** : historique avec le détail par destinataire (envoyé / erreur).
- Raccourcis : bouton « Email aux parents » dans la fiche d'un groupe, icône ✉ dans la liste des élèves.
