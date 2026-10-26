// ════════════════════════════════════════════════════════════
// Fichiers de cours : types, envoi direct vers le stockage,
// liens Google Drive / YouTube, règles d'import de dossiers.
// ════════════════════════════════════════════════════════════
import api from '../api/axios';

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export const formatSize = (b) => {
    if (b == null) return '';
    if (b < 1024) return `${b} o`;
    if (b < 1024 * 1024) return `${Math.round(b / 1024)} Ko`;
    if (b < 1024 * 1024 * 1024) return `${(b / 1048576).toFixed(b < 10 * 1048576 ? 1 : 0)} Mo`;
    return `${(b / 1073741824).toFixed(2)} Go`;
};

const ext = (name) => (String(name || '').match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();

const MIME = {
    pdf: 'application/pdf',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    odt: 'application/vnd.oasis.opendocument.text', odp: 'application/vnd.oasis.opendocument.presentation', ods: 'application/vnd.oasis.opendocument.spreadsheet',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
    zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed',
    txt: 'text/plain', md: 'text/plain', csv: 'text/csv', html: 'text/plain', css: 'text/plain',
    py: 'text/plain', js: 'text/plain', json: 'application/json', lua: 'text/plain', java: 'text/plain', c: 'text/plain', cpp: 'text/plain',
    sb3: 'application/x.scratch.sb3', mcworld: 'application/octet-stream', rbxl: 'application/octet-stream',
};
export const guessMime = (name, fallback) => MIME[ext(name)] || fallback || 'application/octet-stream';

// Catégorie d'affichage d'un fichier
export const KINDS = {
    pdf:   { label: 'PDF',          color: '#DC2626', bg: '#FEF2F2', emoji: '📕' },
    ppt:   { label: 'Présentation', color: '#C2410C', bg: '#FFF7ED', emoji: '📙' },
    word:  { label: 'Document',     color: '#1D4ED8', bg: '#EFF6FF', emoji: '📘' },
    excel: { label: 'Tableur',      color: '#047857', bg: '#ECFDF5', emoji: '📗' },
    image: { label: 'Image',        color: '#7C3AED', bg: '#F5F3FF', emoji: '🖼️' },
    video: { label: 'Vidéo',        color: '#BE185D', bg: '#FDF2F8', emoji: '🎬' },
    audio: { label: 'Audio',        color: '#0E7490', bg: '#ECFEFF', emoji: '🎧' },
    zip:   { label: 'Archive',      color: '#92400E', bg: '#FEF3C7', emoji: '🗜️' },
    scratch: { label: 'Scratch',    color: '#C2410C', bg: '#FFEDD5', emoji: '🐱' },
    code:  { label: 'Script',       color: '#0F172A', bg: '#F1F5F9', emoji: '💻' },
    text:  { label: 'Texte',        color: '#475569', bg: '#F8FAFC', emoji: '📄' },
    link:  { label: 'Lien',         color: '#0369A1', bg: '#E0F2FE', emoji: '🔗' },
    drive: { label: 'Google Drive', color: '#15803D', bg: '#F0FDF4', emoji: '🟢' },
    youtube: { label: 'YouTube',    color: '#DC2626', bg: '#FEF2F2', emoji: '▶️' },
    other: { label: 'Fichier',      color: '#6B7280', bg: '#F3F4F6', emoji: '📎' },
};

export const fileKind = (name, mime) => {
    const e = ext(name);
    if (e === 'pdf') return 'pdf';
    if (['ppt', 'pptx', 'odp', 'key'].includes(e)) return 'ppt';
    if (['doc', 'docx', 'odt', 'rtf'].includes(e)) return 'word';
    if (['xls', 'xlsx', 'ods'].includes(e)) return 'excel';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(e)) return 'image';
    if (['mp4', 'webm', 'mov', 'm4v', 'avi', 'mkv'].includes(e)) return 'video';
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(e)) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return 'zip';
    if (['sb3', 'sb2', 'sb'].includes(e)) return 'scratch';
    if (['py', 'js', 'html', 'css', 'lua', 'java', 'c', 'cpp', 'cs', 'json', 'ts', 'php', 'sql', 'sh'].includes(e)) return 'code';
    if (['txt', 'md', 'csv'].includes(e)) return 'text';
    if (mime?.startsWith('image/')) return 'image';
    if (mime?.startsWith('video/')) return 'video';
    return 'other';
};

export const resourceKind = (r) => {
    if (r.kind === 'LINK') {
        const info = linkInfo(r.url);
        return info.provider === 'youtube' ? 'youtube' : info.provider.startsWith('google') ? 'drive' : 'link';
    }
    return fileKind(r.fileName, r.mimeType);
};

// Ce que le navigateur sait afficher directement
export const previewMode = (kind) => ({
    pdf: 'iframe', image: 'image', video: 'video', audio: 'audio',
    ppt: 'office', word: 'office', excel: 'office', code: 'text', text: 'text',
}[kind] || 'none');

// ── Liens Google Drive, Docs, Slides, YouTube ───────────────
export const linkInfo = (url) => {
    const u = String(url || '');
    let m;
    if ((m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/))) {
        return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${m[1]}` };
    }
    if ((m = u.match(/docs\.google\.com\/(presentation|document|spreadsheets|forms)\/d\/([\w-]+)/))) {
        const type = m[1];
        const embed = type === 'presentation' ? `https://docs.google.com/presentation/d/${m[2]}/embed`
            : type === 'forms' ? `https://docs.google.com/forms/d/${m[2]}/viewform?embedded=true`
            : `https://docs.google.com/${type}/d/${m[2]}/preview`;
        return { provider: `google-${type}`, embedUrl: embed };
    }
    if ((m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/))) {
        return { provider: 'google-drive', embedUrl: `https://drive.google.com/file/d/${m[1]}/preview` };
    }
    if (/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//.test(u)) {
        return { provider: 'google-folder', embedUrl: null };
    }
    if (/canva\.com\/design\/[^/]+\/[^/]+\/view/.test(u)) {
        return { provider: 'canva', embedUrl: u.replace(/\/view.*$/, '/view?embed') };
    }
    return { provider: 'web', embedUrl: null };
};

// ── Règles d'import de dossiers ─────────────────────────────
// Un fichier dont le nom (ou un dossier parent) contient l'un de ces mots
// est réservé au professeur.
export const TEACHER_ONLY_RE = /(^|[^a-z])(prof|profs|professeur|enseignant|teacher|guide|corrige|corriges|correction|solution|solutions|reponses)([^a-z]|$)/i;
export const isTeacherOnlyPath = (path) =>
    TEACHER_ONLY_RE.test(String(path || '').normalize('NFD').replace(/[̀-ͯ]/g, ''));

export const isJunkFile = (name) =>
    /^(\.|~\$|thumbs\.db$|desktop\.ini$|__macosx$)/i.test(name) || /\/__MACOSX\//.test(name);

// "02 - Les boucles" → "Les boucles" ; "Leçon 3_Variables" reste lisible
export const cleanTitle = (name) => {
    const base = String(name || '').replace(/\.[a-z0-9]{1,5}$/i, '');
    const t = base.replace(/^\s*\d{1,3}\s*[-_.)]\s*/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    return t || base;
};

export const naturalCompare = (a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true, sensitivity: 'base' });

// ── Envoi d'un fichier ──────────────────────────────────────
// Le fichier part directement du navigateur vers Supabase (URL signée),
// sans passer par le serveur → pas de limite de taille côté Railway.
export const putToSignedUrl = (uploadUrl, file, onProgress) => new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('cacheControl', '3600');
    const blob = file.type ? file : new Blob([file], { type: guessMime(file.name) });
    fd.append('', blob, file.name);
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300)
        ? resolve()
        : reject(new Error(`Envoi refusé par le stockage (${xhr.status}) ${xhr.responseText?.slice(0, 120) || ''}`));
    xhr.onerror = () => reject(new Error('Connexion interrompue pendant l\'envoi'));
    xhr.send(fd);
});

// Ajoute un fichier à une leçon : URL signée → envoi → enregistrement
export const uploadLessonFile = async (lessonId, file, { visibility = 'STUDENT', titre } = {}, onProgress) => {
    if (file.size > MAX_FILE_BYTES) {
        throw new Error(`« ${file.name} » fait ${formatSize(file.size)} : limite 50 Mo. Mettez-le sur Google Drive et ajoutez le lien.`);
    }
    const { data } = await api.post(`/content/lessons/${lessonId}/upload-url`, { fileName: file.name, size: file.size });
    await putToSignedUrl(data.uploadUrl, file, onProgress);
    const res = await api.post(`/content/lessons/${lessonId}/resources`, {
        kind: 'FILE', storagePath: data.path, fileName: file.name, size: file.size,
        mimeType: file.type || guessMime(file.name), visibility, titre,
    });
    return res.data;
};

export const errMsg = (err, fallback = 'Erreur') =>
    err?.response?.data?.message || err?.message || fallback;

// Ouvre une URL signée dans un nouvel onglet (téléchargement)
export const openSigned = async (endpoint) => {
    const w = window.open('', '_blank');
    try {
        const { data } = await api.get(endpoint);
        if (w) w.location.href = data.url; else window.location.href = data.url;
    } catch (e) {
        if (w) w.close();
        throw e;
    }
};
