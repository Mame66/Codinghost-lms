-- Emails aux parents et aux élèves adultes : modèles + historique des envois
-- Migration tolérante : ne crée que ce qui n'existe pas encore.

CREATE TABLE IF NOT EXISTS "EmailTemplate" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "cible" TEXT NOT NULL DEFAULT 'TOUS',
    "sujet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailMessage" (
    "id" SERIAL NOT NULL,
    "sujet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "cible" TEXT NOT NULL,
    "sentById" INTEGER,
    "sentByNom" TEXT,
    "total" INTEGER NOT NULL DEFAULT 0,
    "envoyes" INTEGER NOT NULL DEFAULT 0,
    "echecs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailRecipient" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "studentId" INTEGER,
    "type" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "eleve" TEXT,
    "groupe" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailRecipient_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EmailRecipient_messageId_idx" ON "EmailRecipient"("messageId");

DO $$ BEGIN
    ALTER TABLE "EmailRecipient" ADD CONSTRAINT "EmailRecipient_messageId_fkey"
        FOREIGN KEY ("messageId") REFERENCES "EmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Modèles prêts à l'emploi (seulement si aucun modèle n'existe) ──
INSERT INTO "EmailTemplate" ("nom", "cible", "sujet", "contenu", "updatedAt")
SELECT v.nom, v.cible, v.sujet, v.contenu, CURRENT_TIMESTAMP
FROM (VALUES
 ('Bienvenue — parents', 'PARENTS',
  $t$Bienvenue chez CodingHost : l'espace de {{prenom_eleve}}$t$,
  $t$Bonjour {{destinataire}},

Nous sommes ravis d'accueillir {{prenom_eleve}} dans le groupe **{{groupe}}** !

{{prenom_eleve}} peut retrouver ses cours, ses documents et ses quiz sur son espace élève :
{{lien_connexion}}
Identifiant : **{{identifiant}}**

Le premier cours aura lieu le [date et heure à compléter].

N'hésitez pas à nous contacter pour toute question.

À très bientôt,
L'équipe {{ecole}}$t$),
 ('Bienvenue — élève adulte', 'ADULTES',
  $t$Bienvenue dans votre formation {{groupe}}$t$,
  $t$Bonjour {{destinataire}},

Bienvenue dans la formation **{{groupe}}** !

Vos supports de cours, quiz et exercices sont disponibles sur votre espace :
{{lien_connexion}}
Identifiant : **{{identifiant}}**

Première séance : [date et heure à compléter].

Au plaisir de vous retrouver,
L'équipe {{ecole}}$t$),
 ('Rappel de cours', 'TOUS',
  $t$Rappel : cours {{groupe}} [date]$t$,
  $t$Bonjour {{destinataire}},

Petit rappel : le prochain cours du groupe **{{groupe}}** a lieu le [date et heure à compléter].

[Matériel à apporter / informations utiles, à compléter ou supprimer]

À bientôt,
{{prof}}
{{ecole}}$t$),
 ('Cours annulé ou reporté', 'TOUS',
  $t$Changement : cours {{groupe}} du [date]$t$,
  $t$Bonjour {{destinataire}},

Le cours du groupe **{{groupe}}** prévu le [date à compléter] est [annulé / reporté au ... à compléter].

Nous vous prions de nous excuser pour ce changement.

Bien cordialement,
L'équipe {{ecole}}$t$),
 ('Absence au cours', 'PARENTS',
  $t$Absence de {{prenom_eleve}} au cours du [date]$t$,
  $t$Bonjour {{destinataire}},

Nous avons constaté l'absence de {{prenom_eleve}} au cours du groupe **{{groupe}}** du [date à compléter].

Si cette absence était prévue, merci de nous le signaler. {{prenom_eleve}} pourra retrouver le contenu de la séance sur son espace : {{lien_connexion}}

Bien cordialement,
{{prof}}
{{ecole}} · {{telephone_ecole}}$t$),
 ('Vacances / fermeture', 'TOUS',
  $t$Pas de cours pendant les vacances$t$,
  $t$Bonjour {{destinataire}},

Le centre sera fermé du [date] au [date]. Les cours du groupe **{{groupe}}** reprendront le [date de reprise].

Bonnes vacances !
L'équipe {{ecole}}$t$),
 ('Rappel de paiement', 'PARENTS',
  $t$Rappel de règlement — {{prenom_eleve}}$t$,
  $t$Bonjour {{destinataire}},

Sauf erreur de notre part, le règlement de [montant à compléter] € pour l'inscription de {{prenom_eleve}} (groupe {{groupe}}) n'a pas encore été reçu.

Si vous avez déjà effectué ce paiement, merci de ne pas tenir compte de ce message.

Bien cordialement,
L'équipe {{ecole}} · {{telephone_ecole}}$t$),
 ('Bilan de progression', 'PARENTS',
  $t$Les progrès de {{prenom_eleve}} en {{groupe}}$t$,
  $t$Bonjour {{destinataire}},

Voici un petit bilan des dernières séances de {{prenom_eleve}} :

- Ce qui a été vu : [à compléter]
- Points forts : [à compléter]
- À travailler : [à compléter]

Vous pouvez suivre sa progression avec {{prenom_eleve}} sur son espace : {{lien_connexion}}

Bien cordialement,
{{prof}}$t$)
) AS v(nom, cible, sujet, contenu)
WHERE NOT EXISTS (SELECT 1 FROM "EmailTemplate");
