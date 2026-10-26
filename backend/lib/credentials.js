// ════════════════════════════════════════════════════════════
// Génération des identifiants (login unique + mot de passe)
// ════════════════════════════════════════════════════════════
const crypto = require('crypto');

const clean = (str = '') => String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.|\.$/g, '');

const baseLogin = (prenom, nom) => {
    const p = clean(prenom);
    const n = clean(nom);
    return [p, n].filter(Boolean).join('.') || 'utilisateur';
};

// Login unique : prenom.nom, puis prenom.nom2, prenom.nom3…
const uniqueLogin = async (db, prenom, nom) => {
    const base = baseLogin(prenom, nom);
    const taken = await db.user.findMany({
        where: { login: { startsWith: base, mode: 'insensitive' } },
        select: { login: true },
    });
    const set = new Set(taken.map(u => u.login.toLowerCase()));
    if (!set.has(base)) return base;
    let i = 2;
    while (set.has(`${base}${i}`)) i++;
    return `${base}${i}`;
};

// Mot de passe lisible pour les élèves : initiales + 4 chiffres + symbole
const genPassword = (prenom = '', nom = '') => {
    const init = `${(prenom.trim()[0] || 'C')}${(nom.trim()[0] || 'H')}`.toUpperCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '');
    const num  = crypto.randomInt(1000, 10000);
    const syms = ['!', '@', '#', '*'];
    return `${init}${num}${syms[crypto.randomInt(0, syms.length)]}`;
};

// Mot de passe plus robuste pour le personnel
const genStaffPassword = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 10; i++) out += alphabet[crypto.randomInt(0, alphabet.length)];
    return `${out}!`;
};

// Email technique quand l'élève n'en a pas (le champ est obligatoire en base)
const placeholderEmail = (login) => `${login}@eleve.codinghost.fr`;

// Vrai si l'email est un email technique (pas un vrai destinataire)
const isPlaceholderEmail = (email) =>
    !email ||
    /@eleve\.codinghost\.fr$/i.test(email) ||
    /_\d{10,}@codinghost\.fr$/i.test(email) ||   // ancien format login_timestamp@codinghost.fr
    /@codinghost\.dz$/i.test(email);

module.exports = { baseLogin, uniqueLogin, genPassword, genStaffPassword, placeholderEmail, isPlaceholderEmail };
