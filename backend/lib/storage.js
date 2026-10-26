// ════════════════════════════════════════════════════════════
// Photos de profil — Supabase Storage (API REST, sans dépendance)
// Variables Railway nécessaires :
//   SUPABASE_URL               ex: https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  clé "service_role" (Project Settings → API)
//   SUPABASE_AVATAR_BUCKET     optionnel, défaut "avatars"
// Le bucket est créé automatiquement (public) au premier envoi.
// ════════════════════════════════════════════════════════════
const BUCKET = process.env.SUPABASE_AVATAR_BUCKET || 'avatars';
const MAX_BYTES = 2 * 1024 * 1024; // 2 Mo
const ALLOWED = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const baseUrl = () => (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isConfigured = () => !!(baseUrl() && key());

const headers = (extra = {}) => ({
    Authorization: `Bearer ${key()}`,
    apikey: key(),
    ...extra,
});

const readyBuckets = new Set();
const createBucket = async (id, { isPublic, sizeLimit }) => {
    if (readyBuckets.has(id)) return;
    const res = await fetch(`${baseUrl()}/storage/v1/bucket`, {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id, name: id, public: isPublic, file_size_limit: sizeLimit }),
    });
    // 200 = créé ; 400/409 = existe déjà
    if (!res.ok && ![400, 409].includes(res.status)) {
        throw new Error(`Création du bucket « ${id} » impossible (${res.status}) : ${await res.text()}`);
    }
    readyBuckets.add(id);
};
const ensureBucket = () => createBucket(BUCKET, { isPublic: true, sizeLimit: MAX_BYTES });

// "data:image/jpeg;base64,...." → { buffer, contentType }
const parseDataUrl = (dataUrl) => {
    const m = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl || ''));
    if (!m) throw Object.assign(new Error('Image invalide'), { status: 400 });
    const contentType = m[1];
    if (!ALLOWED[contentType]) throw Object.assign(new Error('Format accepté : JPG, PNG ou WEBP'), { status: 400 });
    const buffer = Buffer.from(m[2], 'base64');
    if (buffer.length > MAX_BYTES) throw Object.assign(new Error('Image trop lourde (2 Mo max)'), { status: 400 });
    return { buffer, contentType };
};

const publicPrefix = () => `${baseUrl()}/storage/v1/object/public/${BUCKET}/`;

const uploadAvatar = async (userId, dataUrl) => {
    if (!isConfigured()) {
        throw Object.assign(new Error('Stockage des photos non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants sur le serveur)'), { status: 503 });
    }
    const { buffer, contentType } = parseDataUrl(dataUrl);
    await ensureBucket();
    const path = `users/${userId}/${Date.now()}.${ALLOWED[contentType]}`;
    const res = await fetch(`${baseUrl()}/storage/v1/object/${BUCKET}/${path}`, {
        method: 'POST',
        headers: headers({ 'Content-Type': contentType, 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000' }),
        body: buffer,
    });
    if (!res.ok) throw new Error(`Envoi de la photo impossible (${res.status}) : ${await res.text()}`);
    return `${publicPrefix()}${path}`;
};

// Supprime l'ancienne photo si elle est dans notre bucket (erreurs ignorées)
const deleteAvatar = async (url) => {
    try {
        if (!url || !isConfigured() || !url.startsWith(publicPrefix())) return;
        const path = url.slice(publicPrefix().length);
        await fetch(`${baseUrl()}/storage/v1/object/${BUCKET}`, {
            method: 'DELETE',
            headers: headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ prefixes: [path] }),
        });
    } catch (e) {
        console.warn('Suppression ancienne photo :', e.message);
    }
};

// ════════════════════════════════════════════════════════════
// Fichiers de cours et devoirs rendus — bucket PRIVÉ
// Les fichiers ne transitent pas par le serveur : le navigateur
// envoie directement à Supabase avec une URL signée à usage unique,
// et chaque téléchargement passe par une URL signée temporaire.
//   SUPABASE_FILES_BUCKET  optionnel, défaut "course-files"
// ════════════════════════════════════════════════════════════
const FILES_BUCKET = process.env.SUPABASE_FILES_BUCKET || 'course-files';
const MAX_FILE_BYTES = 50 * 1024 * 1024;            // limite Supabase (offre gratuite)
const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024;     // 1 Go (offre gratuite)

const notConfigured = () => Object.assign(
    new Error('Stockage des fichiers non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants sur le serveur)'),
    { status: 503 },
);

const ensureFilesBucket = () => createBucket(FILES_BUCKET, { isPublic: false, sizeLimit: MAX_FILE_BYTES });

// "Séance 1 — Présentation (prof).pptx" → "Seance_1_Presentation_prof_.pptx"
const safeFileName = (name) => {
    const clean = String(name || 'fichier')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9._-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^[._]+/, '');
    return (clean || 'fichier').slice(-120);
};

const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

const newObjectPath = (prefix, fileName) =>
    `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileName(fileName)}`;

// URL d'envoi signée (valable 2 h) : le navigateur y envoie le fichier en PUT
const createUploadUrl = async (path) => {
    if (!isConfigured()) throw notConfigured();
    await ensureFilesBucket();
    const res = await fetch(`${baseUrl()}/storage/v1/object/upload/sign/${FILES_BUCKET}/${encodePath(path)}`, {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: '{}',
    });
    if (!res.ok) throw new Error(`URL d'envoi impossible (${res.status}) : ${await res.text()}`);
    const data = await res.json();
    return { path, uploadUrl: `${baseUrl()}/storage/v1${data.url}` };
};

// URL de lecture signée (1 h par défaut). download = nom de fichier → force le téléchargement
const createDownloadUrl = async (path, { download, expiresIn = 3600 } = {}) => {
    if (!isConfigured()) throw notConfigured();
    const res = await fetch(`${baseUrl()}/storage/v1/object/sign/${FILES_BUCKET}/${encodePath(path)}`, {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ expiresIn }),
    });
    if (res.status === 404 || res.status === 400) {
        throw Object.assign(new Error('Fichier introuvable dans le stockage'), { status: 404 });
    }
    if (!res.ok) throw new Error(`Lien de téléchargement impossible (${res.status}) : ${await res.text()}`);
    const data = await res.json();
    const signed = data.signedURL || data.signedUrl;
    let url = `${baseUrl()}/storage/v1${signed}`;
    if (download) url += `${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(download)}`;
    return url;
};

// Suppression (erreurs ignorées : un fichier orphelin ne doit pas bloquer)
const removeFiles = async (paths) => {
    const list = [...new Set((paths || []).filter(Boolean))];
    if (list.length === 0 || !isConfigured()) return;
    try {
        await fetch(`${baseUrl()}/storage/v1/object/${FILES_BUCKET}`, {
            method: 'DELETE',
            headers: headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ prefixes: list }),
        });
    } catch (e) {
        console.warn('Suppression fichiers :', e.message);
    }
};

module.exports = {
    isConfigured, uploadAvatar, deleteAvatar, parseDataUrl,
    FILES_BUCKET, MAX_FILE_BYTES, STORAGE_QUOTA_BYTES,
    safeFileName, newObjectPath, createUploadUrl, createDownloadUrl, removeFiles,
};
