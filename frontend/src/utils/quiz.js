// ════════════════════════════════════════════════════════════
// Import de quiz depuis Excel / CSV
// Colonnes attendues : Question | A | B | C | D | Bonne réponse
// La bonne réponse peut être une lettre (B), un numéro (2) ou le texte exact.
// ════════════════════════════════════════════════════════════
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';

const norm = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const LETTERS = ['A', 'B', 'C', 'D'];

const readCsvText = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        let text = new TextDecoder('utf-8').decode(reader.result);
        if (text.includes('�')) text = new TextDecoder('windows-1252').decode(reader.result);
        resolve(text);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
});

// Lit un fichier (File ou Blob nommé) en tableau de lignes
export const readRows = async (file) => {
    const name = String(file.name || '').toLowerCase();
    if (name.endsWith('.xlsx')) {
        const rows = await readXlsxFile(file);
        return rows.map(r => r.map(c => (c == null ? '' : String(c))));
    }
    const text = await readCsvText(file);
    const parsed = Papa.parse(text.replace(/^﻿/, ''), { skipEmptyLines: 'greedy' });
    return parsed.data;
};

const detectColumns = (header) => {
    const h = header.map(norm);
    const idx = { question: -1, options: [], correct: -1 };
    h.forEach((c, i) => {
        if (idx.correct < 0 && /(bonne|correct|juste|solution|answer|reponse attendue)/.test(c)) { idx.correct = i; return; }
        if (idx.question < 0 && /(question|intitule|enonce)/.test(c)) { idx.question = i; return; }
        if (/^([abcd]|(reponse|choix|option|proposition)\s*[abcd1-4])$/.test(c)) idx.options.push(i);
    });
    return idx.question >= 0 && idx.options.length >= 2 ? idx : null;
};

const resolveCorrect = (raw, options) => {
    const v = norm(raw);
    if (!v) return -1;
    const li = LETTERS.findIndex(l => norm(l) === v || `reponse ${norm(l)}` === v);
    if (li >= 0 && li < options.length) return li;
    const n = parseInt(v);
    if (String(n) === v && n >= 1 && n <= options.length) return n - 1;
    return options.findIndex(o => norm(o) === v);
};

// → { questions: [{question, options, correct}], errors: ["Ligne 4 : ..."] }
export const rowsToQuestions = (rows) => {
    const clean = rows.filter(r => r.some(c => String(c ?? '').trim()));
    if (!clean.length) return { questions: [], errors: ['Le fichier est vide'] };
    let cols = detectColumns(clean[0]);
    let start = 1;
    if (!cols) { // pas d'en-tête : Question, A, B, C, D, Bonne réponse
        cols = { question: 0, options: [1, 2, 3, 4], correct: 5 };
        start = 0;
    }
    const questions = [], errors = [];
    clean.slice(start).forEach((r, i) => {
        const line = i + start + 1;
        const question = String(r[cols.question] ?? '').trim();
        const options = cols.options.map(ci => String(r[ci] ?? '').trim()).filter(Boolean).slice(0, 4);
        const correct = resolveCorrect(r[cols.correct], options);
        if (!question) return errors.push(`Ligne ${line} : question vide`);
        if (options.length < 2) return errors.push(`Ligne ${line} : il faut au moins 2 réponses`);
        if (correct < 0) return errors.push(`Ligne ${line} : bonne réponse introuvable (« ${r[cols.correct] ?? ''} »)`);
        questions.push({ question, options, correct });
    });
    return { questions, errors };
};

export const parseQuizFile = async (file) => rowsToQuestions(await readRows(file));

export const isQuizFileName = (name) => /^(quiz|qcm|questions?)([ _-][^/]*)?\.(csv|xlsx)$/i.test(String(name || '').split('/').pop());

// Modèle à télécharger (point-virgule + BOM : s'ouvre bien dans Excel FR)
export const downloadQuizTemplate = () => {
    const rows = [
        ['Question', 'A', 'B', 'C', 'D', 'Bonne réponse'],
        ['Quel bloc fait avancer le personnage ?', 'avancer de 10 pas', 'dire Bonjour', 'attendre 1 seconde', '', 'A'],
        ['Combien font 3 x 4 ?', '7', '12', '34', '', 'B'],
    ];
    const csv = '﻿' + rows.map(r => r.map(c => /[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'modele-quiz.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
