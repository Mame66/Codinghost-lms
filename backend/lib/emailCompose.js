// ════════════════════════════════════════════════════════════
// Emails aux parents / élèves adultes : destinataires et variables
// ════════════════════════════════════════════════════════════
const { isPlaceholderEmail } = require('./credentials');
const { baseTemplate, SCHOOL } = require('../services/emailService');

const FRONT = () => (process.env.FRONTEND_URL || 'https://codinghost.fr').replace(/\/+$/, '');

// Variables proposées dans l'éditeur
const VARIABLES = [
    { key: 'destinataire',   label: 'Nom du destinataire',  exemple: 'Madame Martin', aide: 'Le parent (ou « Madame, Monsieur ») ; le prénom pour un adulte' },
    { key: 'prenom_eleve',   label: 'Prénom de l\'élève',   exemple: 'Lucas' },
    { key: 'nom_eleve',      label: 'Nom de l\'élève',      exemple: 'Martin' },
    { key: 'groupe',         label: 'Groupe',               exemple: 'Minecraft — Mercredi 14h' },
    { key: 'prof',           label: 'Enseignant du groupe', exemple: 'Mame Ciss' },
    { key: 'identifiant',    label: 'Identifiant de connexion', exemple: 'lucas.martin' },
    { key: 'lien_connexion', label: 'Lien de connexion',    exemple: 'https://codinghost.fr/login/enfants' },
    { key: 'ecole',          label: 'Nom de l\'école',      exemple: 'CodingHost' },
    { key: 'telephone_ecole', label: 'Téléphone de l\'école', exemple: SCHOOL.tel },
    { key: 'date',           label: 'Date du jour',         exemple: new Date().toLocaleDateString('fr-FR') },
];
const KNOWN = new Set(VARIABLES.map(v => v.key));

const VAR_RE = /\{\{\s*([a-z_]+)\s*\}\}/gi;
const unknownVariables = (...texts) => {
    const out = new Set();
    texts.forEach(t => { for (const m of String(t || '').matchAll(VAR_RE)) if (!KNOWN.has(m[1].toLowerCase())) out.add(m[1]); });
    return [...out];
};

const studentInclude = {
    user: { select: { id: true, prenom: true, nom: true, email: true, login: true } },
    enrollments: {
        include: { group: { select: { id: true, titre: true, audience: true, teacherId: true, supervisorId: true, teacher: { select: { prenom: true, nom: true } } } } },
        orderBy: { createdAt: 'asc' },
    },
};

// Qui reçoit l'email pour cet élève : ses parents (enfant) ou lui-même (adulte)
const resolveRecipient = (student, groupId) => {
    const enr = (groupId && student.enrollments.find(e => e.groupId === groupId)) || student.enrollments[0];
    const group = enr?.group || null;
    const u = student.user;
    const ownEmail = u.email && !isPlaceholderEmail(u.email) ? u.email : null;
    const type = group
        ? (group.audience === 'ADULTE' ? 'ADULTE' : 'PARENT')
        : (student.parentEmail || student.parentNom || (student.age && student.age < 18) ? 'PARENT' : 'ADULTE');
    const email = type === 'PARENT' ? (student.parentEmail || ownEmail) : (ownEmail || student.parentEmail);
    return {
        key: `${student.id}-${group?.id || 0}`,
        studentId: student.id,
        groupId: group?.id || null,
        type,
        nom: type === 'PARENT' ? (student.parentNom || `Parent de ${u.prenom}`) : `${u.prenom} ${u.nom}`,
        email: email || null,
        eleve: `${u.prenom} ${u.nom}`,
        groupe: group?.titre || null,
        vars: {
            destinataire: type === 'PARENT' ? (student.parentNom || 'Madame, Monsieur') : u.prenom,
            prenom_eleve: u.prenom,
            nom_eleve: u.nom,
            groupe: group?.titre || '',
            prof: group?.teacher ? `${group.teacher.prenom} ${group.teacher.nom}` : '',
            identifiant: u.login,
            lien_connexion: `${FRONT()}/login/${type === 'ADULTE' ? 'adultes' : 'enfants'}`,
        },
    };
};

const commonVars = () => ({
    ecole: SCHOOL.name,
    telephone_ecole: SCHOOL.tel,
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
});

const sampleVars = () => Object.fromEntries(VARIABLES.map(v => [v.key, v.exemple]));

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fillText = (text, vars) => String(text || '').replace(VAR_RE, (m, k) => {
    const v = vars[k.toLowerCase()];
    return v == null ? m : String(v);
});

// Texte saisi → HTML (paragraphes, **gras**, liens, listes « - »)
const bodyToHtml = (text, vars) => {
    // les variables sont insérées après échappement pour qu'une valeur ne puisse pas injecter du HTML
    const marker = (k) => `\u0000${k}\u0000`;
    const withMarkers = String(text || '').replace(VAR_RE, (m, k) => (vars[k.toLowerCase()] == null ? m : marker(k.toLowerCase())));
    let html = esc(withMarkers).replace(/\u0000([a-z_]+)\u0000/g, (m, k) => esc(vars[k]));
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" style="color:#6C47FF;font-weight:700">$1</a>');
    return html.replace(/\r/g, '').split(/\n{2,}/).map(par => {
        const lines = par.split('\n');
        if (lines.every(l => /^\s*[-•]\s+/.test(l))) {
            return `<ul style="margin:0 0 16px 20px;color:#4B5563;font-size:15px;line-height:1.7">${lines.map(l => `<li>${l.replace(/^\s*[-•]\s+/, '')}</li>`).join('')}</ul>`;
        }
        return `<p class="text">${lines.join('<br>')}</p>`;
    }).join('\n');
};

const renderEmail = (sujet, contenu, vars) => {
    const all = { ...commonVars(), ...vars };
    const subject = fillText(sujet, all).replace(/\s+/g, ' ').trim();
    return { subject, html: baseTemplate(bodyToHtml(contenu, all), esc(subject)) };
};

module.exports = {
    VARIABLES, unknownVariables, studentInclude, resolveRecipient, renderEmail, sampleVars, commonVars, fillText,
};
