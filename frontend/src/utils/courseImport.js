// ════════════════════════════════════════════════════════════
// Import d'un cours complet depuis un dossier (PC) ou un ZIP (Google Drive)
//
//   Mon cours/                         → titre du cours
//     01 - Les bases/                  → module
//       Séance 1 - Découverte/         → leçon
//         Support élève.pdf            → fichier visible par les élèves
//         Guide prof.pptx              → réservé au prof (nom contenant prof/guide/corrigé…)
//         quiz.xlsx                    → quiz (Question | A | B | C | D | Bonne réponse)
//         liens.txt                    → un lien par ligne (« Titre | https://… »)
//         devoir.txt                   → active le devoir à rendre (texte = consignes)
//         objectifs.txt                → objectifs de la leçon
//
// Sans sous-dossiers de leçons, chaque dossier devient une leçon d'un module unique.
// Tout est optionnel.
// ════════════════════════════════════════════════════════════
import { isJunkFile, isTeacherOnlyPath, cleanTitle, naturalCompare, MAX_FILE_BYTES, guessMime } from './files';
import { isQuizFileName } from './quiz';

const base = (p) => p.split('/').pop();
const lower = (p) => base(p).toLowerCase();

export const specialKind = (path) => {
    const n = lower(path);
    if (isQuizFileName(n)) return 'quiz';
    if (/^(liens?|links?)\.(txt|md)$/.test(n)) return 'links';
    if (/^(devoir|devoirs|consignes?[ _-]devoir)\.(txt|md)$/.test(n)) return 'homework';
    if (/^objectifs?\.(txt|md)$/.test(n)) return 'objectives';
    if (/\.(url|webloc|gdoc|gslides|gsheet|gform|gdraw)$/.test(n)) return 'shortcut';
    return null;
};

// "Titre | https://…", "[prof] https://…", "https://…"
export const parseLinksText = (text) => {
    const out = [];
    String(text || '').split(/\r?\n/).forEach(line => {
        let l = line.trim();
        if (!l || l.startsWith('#')) return;
        let teacher = false;
        const tag = l.match(/^\[(prof|professeur|enseignant)\]\s*/i);
        if (tag) { teacher = true; l = l.slice(tag[0].length); }
        const m = l.match(/https?:\/\/\S+/);
        if (!m) return;
        const titre = l.slice(0, m.index).replace(/[\s|:\-–—>]+$/, '').trim();
        out.push({ url: m[0], titre, teacher });
    });
    return out;
};

// Raccourcis : .url (Windows), .webloc (Mac), .gdoc/.gslides… (Google Drive pour ordinateur)
export const parseShortcut = (name, text) => {
    const n = name.toLowerCase();
    const t = String(text || '');
    if (n.endsWith('.url')) return t.match(/^URL=(.+)$/m)?.[1]?.trim() || null;
    if (n.endsWith('.webloc')) return t.match(/<string>(https?:[^<]+)<\/string>/)?.[1] || null;
    try {
        const j = JSON.parse(t);
        if (j.url) return j.url;
        const id = j.doc_id || j.resource_id?.split(':').pop();
        if (!id) return null;
        const type = { '.gdoc': 'document', '.gslides': 'presentation', '.gsheet': 'spreadsheets', '.gform': 'forms', '.gdraw': 'drawings' }[n.match(/\.\w+$/)[0]];
        return `https://docs.google.com/${type}/d/${id}/edit`;
    } catch { return null; }
};

// entries : [{ path: 'Cours/Module/Leçon/fichier.pdf', size }]
// → { titre, modules: [{ titre, lessons: [{ titre, files: [...], specials: [...] }] }], skipped: [...] }
export const buildPlan = (entries, fallbackTitle = 'Cours importé') => {
    const files = entries
        .map(e => ({ ...e, path: e.path.replace(/\\/g, '/').replace(/^\/+/, '') }))
        .filter(e => e.path && !e.path.split('/').some(seg => isJunkFile(seg)));
    if (!files.length) return { titre: fallbackTitle, modules: [], skipped: [] };

    // Dossier racine commun = titre du cours
    let titre = fallbackTitle;
    const first = files[0].path.split('/')[0];
    if (files.every(f => f.path.includes('/') && f.path.split('/')[0] === first)) {
        titre = cleanTitle(first);
        files.forEach(f => { f.rel = f.path.split('/').slice(1); });
    } else {
        files.forEach(f => { f.rel = f.path.split('/'); });
    }

    const tops = new Map(); // dossier de 1er niveau → { direct: [], sub: Map }
    const rootFiles = [];
    files.forEach(f => {
        if (f.rel.length === 1) return rootFiles.push(f);
        const top = f.rel[0];
        if (!tops.has(top)) tops.set(top, { direct: [], sub: new Map() });
        const t = tops.get(top);
        if (f.rel.length === 2) t.direct.push(f);
        else {
            const sub = f.rel[1];
            if (!t.sub.has(sub)) t.sub.set(sub, []);
            t.sub.get(sub).push(f);
        }
    });

    const skipped = [];
    // fichiers d'une leçon ; "inner" = chemin à l'intérieur de la leçon
    const makeLesson = (lessonTitle, list, depth) => {
        const lesson = { titre: cleanTitle(lessonTitle), files: [], specials: [] };
        list.sort((a, b) => naturalCompare(a.path, b.path)).forEach(f => {
            const inner = f.rel.slice(depth).join('/');
            const sp = specialKind(inner);
            if (sp && f.size <= 512 * 1024) { lesson.specials.push({ ...f, kind: sp, inner }); return; }
            if (f.size > MAX_FILE_BYTES) { skipped.push({ path: f.path, reason: 'plus de 50 Mo : mettez-le sur Drive et ajoutez le lien dans liens.txt' }); return; }
            lesson.files.push({
                ...f, inner,
                titre: cleanTitle(base(inner)),
                visibility: isTeacherOnlyPath(inner) ? 'TEACHER' : 'STUDENT',
                include: true,
                mimeType: guessMime(base(inner)),
            });
        });
        return lesson;
    };

    const topNames = [...tops.keys()].sort(naturalCompare);
    const threeLevels = topNames.some(k => tops.get(k).sub.size > 0);
    const modules = [];

    if (threeLevels) {
        if (rootFiles.length) modules.push({ titre: 'Documents généraux', lessons: [makeLesson('Documents', rootFiles, 0)] });
        topNames.forEach(name => {
            const t = tops.get(name);
            const lessons = [];
            if (t.direct.length) lessons.push(makeLesson('Documents du module', t.direct, 1));
            [...t.sub.keys()].sort(naturalCompare).forEach(sub => lessons.push(makeLesson(sub, t.sub.get(sub), 2)));
            modules.push({ titre: cleanTitle(name), lessons });
        });
    } else {
        const lessons = [];
        if (rootFiles.length) lessons.push(makeLesson(topNames.length ? 'Documents généraux' : titre, rootFiles, 0));
        topNames.forEach(name => lessons.push(makeLesson(name, tops.get(name).direct, 1)));
        modules.push({ titre: topNames.length ? titre : 'Module 1', lessons });
    }
    // modules / leçons vides (que des fichiers ignorés)
    const cleaned = modules
        .map(m => ({ ...m, lessons: m.lessons.filter(l => l.files.length || l.specials.length) }))
        .filter(m => m.lessons.length);
    return { titre, modules: cleaned, skipped };
};

// Lit les fichiers spéciaux d'une leçon (quiz, liens, devoir, objectifs)
export const resolveSpecials = async (lesson, parseQuizFile) => {
    const out = { links: [], quiz: [], quizErrors: [], homework: null, objectives: null };
    for (const sp of lesson.specials) {
        let file;
        try { file = await sp.getFile(); }
        catch { out.quizErrors.push(`${sp.inner} : fichier illisible, ignoré`); continue; }
        if (sp.kind === 'quiz') {
            try {
                const r = await parseQuizFile(file);
                out.quiz.push(...r.questions);
                out.quizErrors.push(...r.errors.map(e => `${sp.inner} — ${e}`));
            } catch { out.quizErrors.push(`${sp.inner} : fichier illisible`); }
            continue;
        }
        let text;
        try { text = await file.text(); }
        catch { out.quizErrors.push(`${sp.inner} : fichier illisible, ignoré`); continue; }
        if (sp.kind === 'links') {
            parseLinksText(text).forEach(l => out.links.push({ ...l, teacher: l.teacher || isTeacherOnlyPath(sp.inner) }));
        } else if (sp.kind === 'shortcut') {
            const url = parseShortcut(base(sp.inner), text);
            if (url) out.links.push({ url, titre: cleanTitle(base(sp.inner)), teacher: isTeacherOnlyPath(sp.inner) });
        } else if (sp.kind === 'homework') {
            out.homework = text.trim() || 'Rendez votre travail ici.';
        } else if (sp.kind === 'objectives') {
            out.objectives = text.trim() || null;
        }
    }
    return out;
};
