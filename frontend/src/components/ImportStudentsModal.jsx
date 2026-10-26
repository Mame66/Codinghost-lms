import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';
import api from '../api/axios';
import { AUDIENCES } from '../utils/audience';

// ════════════════════════════════════════════════════════════
// Import d'élèves depuis un export Kommo (CSV ou Excel)
// Étapes : 1. fichier → 2. correspondance des colonnes → 3. aperçu → 4. résultat
// ════════════════════════════════════════════════════════════

const FIELDS = {
    ENFANT: [
        { key: 'fullName',    label: "Nom complet de l'enfant", hint: 'si prénom et nom sont dans la même colonne' },
        { key: 'prenom',      label: "Prénom de l'enfant" },
        { key: 'nom',         label: "Nom de l'enfant" },
        { key: 'age',         label: 'Âge' },
        { key: 'parentNom',   label: 'Nom du parent' },
        { key: 'parentTel',   label: 'Téléphone du parent' },
        { key: 'parentEmail', label: 'Email du parent' },
    ],
    ADULTE: [
        { key: 'fullName',  label: 'Nom complet', hint: 'si prénom et nom sont dans la même colonne' },
        { key: 'prenom',    label: 'Prénom' },
        { key: 'nom',       label: 'Nom' },
        { key: 'email',     label: 'Email' },
        { key: 'telephone', label: 'Téléphone' },
    ],
};

// Mots-clés pour deviner les colonnes Kommo (FR / EN) — testés sur les titres sans accents
const GUESS = {
    fullName:  [/^nom complet/, /full ?name/, /^name$/, /^contact( name)?$/, /^nom du contact/],
    prenom:    [/prenom/, /first ?name/],
    nom:       [/^nom( de famille)?$/, /last ?name/, /surname/],
    age:       [/\bage\b/],
    email:     [/e-?mail/, /courriel/],
    telephone: [/telephone/, /phone/, /mobile/, /portable/, /^tel\b/],
    parent:    [/parent/, /tuteur/, /responsable/, /mere/, /pere/],
};

const norm = (s) => String(s ?? '').trim();
const key = (p, n) => `${norm(p).toLowerCase()}|${norm(n).toLowerCase()}`;
const normHeader = (h) => String(h).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const isChild = (n) => /enfant|eleve|child|student|kid/.test(n);
const stripChild = (n) => n.replace(/\s*(de l'|de l |du |d'|de |of )?(enfant|eleve|child|student|kid)s?\s*/g, ' ').trim();

const guessMapping = (headers, audience) => {
    const H = headers.map(raw => ({ raw, n: normHeader(raw) }));
    const used = new Set();
    const pick = (tests, filter = () => true) => {
        const f = H.find(h => !used.has(h.raw) && filter(h) && tests.some(r => r.test(h.n)));
        if (f) used.add(f.raw);
        return f?.raw;
    };
    const pickChild = (tests) => {
        const f = H.find(h => !used.has(h.raw) && isChild(h.n) && tests.some(r => r.test(stripChild(h.n))));
        if (f) used.add(f.raw);
        return f?.raw;
    };
    const map = {};

    if (audience === 'ENFANT') {
        // 1. colonnes qui parlent explicitement de l'enfant
        map.prenom = pickChild(GUESS.prenom);
        map.nom = pickChild(GUESS.nom);
        if (!map.prenom || !map.nom) map.fullName = pickChild([...GUESS.fullName, /^nom$/]);
        map.age = pick(GUESS.age);
        // 2. le contact Kommo = le parent
        const hasChildCols = map.prenom || map.nom || map.fullName;
        if (hasChildCols) {
            map.parentNom = pick([...GUESS.parent, ...GUESS.fullName, /^nom$/], h => !isChild(h.n));
        } else {
            // aucune colonne « enfant » : le contact est probablement l'enfant lui-même
            map.prenom = pick(GUESS.prenom);
            map.nom = pick(GUESS.nom);
            if (!map.prenom || !map.nom) map.fullName = pick(GUESS.fullName);
            map.parentNom = pick(GUESS.parent);
        }
        map.parentTel = pick(GUESS.telephone);
        map.parentEmail = pick(GUESS.email);
    } else {
        map.prenom = pick(GUESS.prenom, h => !isChild(h.n));
        map.nom = pick(GUESS.nom, h => !isChild(h.n));
        if (!map.prenom || !map.nom) map.fullName = pick(GUESS.fullName);
        map.email = pick(GUESS.email);
        map.telephone = pick(GUESS.telephone);
    }

    // Une seule colonne « Nom » sans prénom : c'est sans doute le nom complet
    if (map.nom && !map.prenom && !map.fullName) { map.fullName = map.nom; delete map.nom; }
    Object.keys(map).forEach(k => map[k] === undefined && delete map[k]);
    return map;
};

const readCsv = (file) => new Promise((resolve, reject) => {
    const parse = (encoding) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
        reader.onload = () => {
            const text = String(reader.result || '');
            // Fichier en Windows-1252 (Excel français) : on relit avec le bon encodage
            if (encoding === 'UTF-8' && text.includes('�')) return parse('windows-1252');
            const res = Papa.parse(text.replace(/^﻿/, ''), { header: true, skipEmptyLines: 'greedy', transformHeader: h => norm(h) });
            resolve({ headers: (res.meta.fields || []).filter(Boolean), rows: res.data });
        };
        reader.readAsText(file, encoding);
    };
    parse('UTF-8');
});

const readXlsx = async (file) => {
    const raw = await readXlsxFile(file);
    if (!raw.length) return { headers: [], rows: [] };
    const headers = raw[0].map((h, i) => norm(h) || `Colonne ${i + 1}`);
    const rows = raw.slice(1)
        .filter(r => r.some(c => norm(c) !== ''))
        .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] instanceof Date ? r[i].toLocaleDateString('fr-FR') : norm(r[i])])));
    return { headers, rows };
};

const downloadCsv = (filename, lines) => {
    const csv = lines.map(l => l.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

export default function ImportStudentsModal({ audience = 'ENFANT', groups = [], existingStudents = [], onClose, onDone }) {
    const A = AUDIENCES[audience];
    const fields = FIELDS[audience];
    const fileRef = useRef(null);

    const [step, setStep] = useState(1);
    const [fileName, setFileName] = useState('');
    const [headers, setHeaders] = useState([]);
    const [rows, setRows] = useState([]);
    const [mapping, setMapping] = useState({});
    const [nameOrder, setNameOrder] = useState('PRENOM_NOM');
    const [groupId, setGroupId] = useState('');
    const [sendEmails, setSendEmails] = useState(false);
    const [excluded, setExcluded] = useState(() => new Set());
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    const audienceGroups = groups.filter(g => g.audience === audience);

    // ── 1. Lecture du fichier ──
    const handleFile = async (file) => {
        if (!file) return;
        setError('');
        setBusy(true);
        try {
            const isExcel = /\.xlsx$/i.test(file.name);
            const isCsv = /\.(csv|txt)$/i.test(file.name);
            if (!isExcel && !isCsv) throw new Error('Format non pris en charge : utilisez un fichier .csv ou .xlsx (les anciens .xls doivent être réenregistrés en .xlsx)');
            const data = isExcel ? await readXlsx(file) : await readCsv(file);
            if (!data.headers.length || !data.rows.length) throw new Error('Le fichier est vide ou sa première ligne ne contient pas les titres des colonnes.');
            if (data.rows.length > 1000) throw new Error(`Le fichier contient ${data.rows.length} lignes : 1000 maximum par import. Découpez-le en plusieurs fichiers.`);
            setFileName(file.name);
            setHeaders(data.headers);
            setRows(data.rows);
            setMapping(guessMapping(data.headers, audience));
            setExcluded(new Set());
            setStep(2);
        } catch (e) {
            setError(e.message || 'Fichier illisible');
        }
        setBusy(false);
    };

    // ── 2→3. Construction des lignes à importer ──
    const prepared = useMemo(() => {
        const existing = new Set(existingStudents.map(s => key(s.user?.prenom, s.user?.nom)));
        const seen = new Set();
        return rows.map((r, i) => {
            const get = (k) => (mapping[k] ? norm(r[mapping[k]]) : '');
            let prenom = get('prenom');
            let nom = get('nom');
            const full = get('fullName');
            if ((!prenom || !nom) && full) {
                const parts = full.split(/\s+/).filter(Boolean);
                if (parts.length === 1) { prenom = prenom || parts[0]; }
                else if (nameOrder === 'PRENOM_NOM') { prenom = prenom || parts[0]; nom = nom || parts.slice(1).join(' '); }
                else { nom = nom || parts[0]; prenom = prenom || parts.slice(1).join(' '); }
            }
            const row = {
                _line: i + 2, prenom, nom,
                age: get('age'), email: get('email'), telephone: get('telephone'),
                parentNom: get('parentNom'), parentTel: get('parentTel'), parentEmail: get('parentEmail'),
            };
            const k = key(prenom, nom);
            let status = 'OK';
            if (!prenom || !nom) status = 'MISSING';
            else if (existing.has(k)) status = 'EXISTS';
            else if (seen.has(k)) status = 'DUPLICATE';
            if (status === 'OK') seen.add(k);
            return { ...row, status };
        });
    }, [rows, mapping, nameOrder, existingStudents]);

    const toImport = prepared.filter((r, i) => r.status === 'OK' && !excluded.has(i));
    const counts = prepared.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
    const hasName = mapping.fullName || (mapping.prenom && mapping.nom);

    // ── 3→4. Envoi ──
    const runImport = async () => {
        if (toImport.length === 0) return;
        setBusy(true);
        setError('');
        try {
            const payload = toImport.map(({ status, ...r }) => r);
            const r = await api.post('/students/import', { rows: payload, groupId: groupId || null, sendEmails, skipDuplicates: true });
            setResult(r.data);
            setStep(4);
            onDone?.();
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur pendant l\'import');
        }
        setBusy(false);
    };

    const exportCredentials = () => {
        downloadCsv(`identifiants-${A.slug}-${new Date().toISOString().slice(0, 10)}.csv`, [
            ['Prénom', 'Nom', 'Login', 'Mot de passe', 'Groupe', 'Adresse de connexion'],
            ...result.created.map(c => [c.prenom, c.nom, c.login, c.password, c.groupe || '', `codinghost.fr/login/${A.slug}`]),
        ]);
    };

    const STATUS = {
        OK:        { label: 'À importer', color: '#059669', bg: '#ECFDF5' },
        EXISTS:    { label: 'Déjà inscrit', color: '#8B6200', bg: '#FFFBEB' },
        DUPLICATE: { label: 'Doublon dans le fichier', color: '#8B6200', bg: '#FFFBEB' },
        MISSING:   { label: 'Nom manquant', color: '#DC2626', bg: '#FEF2F2' },
    };

    return (
        <div style={s.overlay} onClick={() => !busy && onClose?.()}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
                {/* En-tête + étapes */}
                <div style={s.head}>
                    <div>
                        <div style={{ ...s.kicker, color: A.color }}>Import · Élèves {A.label.toLowerCase()}</div>
                        <h2 style={s.title}>Importer depuis Kommo</h2>
                    </div>
                    <button style={s.close} onClick={onClose} disabled={busy} aria-label="Fermer">×</button>
                </div>
                <div style={s.steps}>
                    {['Fichier', 'Colonnes', 'Vérification', 'Résultat'].map((l, i) => (
                        <div key={l} style={{ ...s.step, color: step >= i + 1 ? A.color : '#9CA3AF', borderColor: step >= i + 1 ? A.color : '#E5E7EB' }}>
                            <span style={{ ...s.stepNum, background: step >= i + 1 ? A.color : '#E5E7EB', color: step >= i + 1 ? '#fff' : '#6B7280' }}>{i + 1}</span>{l}
                        </div>
                    ))}
                </div>

                {error && <div style={s.error}>{error}</div>}

                {/* ── ÉTAPE 1 ── */}
                {step === 1 && (
                    <div>
                        <div
                            style={{ ...s.drop, borderColor: dragOver ? A.color : '#D6D3E8', background: dragOver ? A.bg : '#FAFAFE' }}
                            onClick={() => fileRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}>
                            <div style={{ fontSize: 34, marginBottom: 6 }}>📄</div>
                            <div style={{ fontWeight: 800, color: '#1A1040', fontSize: 15 }}>{busy ? 'Lecture…' : 'Glissez votre fichier ici ou cliquez pour le choisir'}</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Formats acceptés : .csv ou .xlsx — 1000 lignes maximum</div>
                            <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx" style={{ display: 'none' }} onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
                        </div>
                        <div style={s.help}>
                            <strong>Depuis Kommo :</strong> ouvrez <em>Contacts</em> (ou <em>Leads</em>), filtrez si besoin, puis menu <em>⋯ → Exporter</em> et choisissez CSV ou Excel.
                            La première ligne du fichier doit contenir les titres des colonnes.
                        </div>
                    </div>
                )}

                {/* ── ÉTAPE 2 ── */}
                {step === 2 && (
                    <div>
                        <p style={s.p}><strong>{fileName}</strong> — {rows.length} ligne(s), {headers.length} colonne(s). Indiquez quelle colonne correspond à chaque information :</p>
                        <div style={s.mapGrid}>
                            {fields.map(f => (
                                <div key={f.key} style={s.mapRow}>
                                    <div>
                                        <div style={s.mapLabel}>{f.label}</div>
                                        {f.hint && <div style={s.mapHint}>{f.hint}</div>}
                                    </div>
                                    <select style={s.select} value={mapping[f.key] || ''} onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value || undefined }))}>
                                        <option value="">— Ignorer —</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                        {mapping.fullName && (
                            <div style={{ ...s.mapRow, marginTop: 10 }}>
                                <div style={s.mapLabel}>Ordre dans « {mapping.fullName} »</div>
                                <select style={s.select} value={nameOrder} onChange={e => setNameOrder(e.target.value)}>
                                    <option value="PRENOM_NOM">Prénom puis Nom (ex : Lucas Martin)</option>
                                    <option value="NOM_PRENOM">Nom puis Prénom (ex : Martin Lucas)</option>
                                </select>
                            </div>
                        )}
                        {!hasName && <div style={{ ...s.error, marginTop: 12 }}>Choisissez au moins le nom complet, ou le prénom ET le nom.</div>}
                        <div style={s.foot}>
                            <button style={s.btnSec} onClick={() => setStep(1)}>← Autre fichier</button>
                            <button style={{ ...s.btnPri, background: A.color, opacity: hasName ? 1 : 0.5 }} disabled={!hasName} onClick={() => setStep(3)}>Vérifier les données →</button>
                        </div>
                    </div>
                )}

                {/* ── ÉTAPE 3 ── */}
                {step === 3 && (
                    <div>
                        <div style={s.summary}>
                            <span style={{ ...s.pill, color: '#059669', background: '#ECFDF5' }}>{toImport.length} à importer</span>
                            {counts.EXISTS > 0 && <span style={{ ...s.pill, color: '#8B6200', background: '#FFFBEB' }}>{counts.EXISTS} déjà inscrit(s)</span>}
                            {counts.DUPLICATE > 0 && <span style={{ ...s.pill, color: '#8B6200', background: '#FFFBEB' }}>{counts.DUPLICATE} doublon(s)</span>}
                            {counts.MISSING > 0 && <span style={{ ...s.pill, color: '#DC2626', background: '#FEF2F2' }}>{counts.MISSING} sans nom</span>}
                        </div>

                        <div style={s.options}>
                            <label style={s.optLabel}>
                                Groupe d'inscription
                                <select style={s.select} value={groupId} onChange={e => setGroupId(e.target.value)}>
                                    <option value="">— Aucun groupe pour l'instant —</option>
                                    {audienceGroups.map(g => <option key={g.id} value={g.id}>{g.titre}{g.ville ? ` (${g.ville})` : ''}</option>)}
                                </select>
                            </label>
                            <label style={{ ...s.optLabel, flexDirection: 'row', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                                <input type="checkbox" checked={sendEmails} onChange={e => setSendEmails(e.target.checked)} />
                                Envoyer les identifiants par email ({audience === 'ENFANT' ? 'au parent' : "à l'élève"}, si l'email est renseigné)
                            </label>
                        </div>
                        {!groupId && (
                            <div style={s.warn}>Sans groupe, ces élèves n'apparaîtront que dans le filtre « sans groupe » et ne verront aucun cours. Vous pourrez les assigner plus tard.</div>
                        )}

                        <div style={s.tableWrap}>
                            <table style={s.table}>
                                <thead>
                                    <tr>
                                        <th style={s.th}></th><th style={s.th}>Ligne</th><th style={s.th}>Prénom</th><th style={s.th}>Nom</th>
                                        {audience === 'ENFANT'
                                            ? <><th style={s.th}>Âge</th><th style={s.th}>Parent</th><th style={s.th}>Tél. parent</th><th style={s.th}>Email parent</th></>
                                            : <><th style={s.th}>Email</th><th style={s.th}>Téléphone</th></>}
                                        <th style={s.th}>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prepared.slice(0, 300).map((r, i) => {
                                        const st = STATUS[r.status];
                                        const importable = r.status === 'OK';
                                        return (
                                            <tr key={i} style={{ borderTop: '1px solid #F3F4F6', opacity: importable && !excluded.has(i) ? 1 : 0.55 }}>
                                                <td style={s.td}>
                                                    <input type="checkbox" disabled={!importable} checked={importable && !excluded.has(i)}
                                                           onChange={() => setExcluded(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })} />
                                                </td>
                                                <td style={{ ...s.td, color: '#9CA3AF' }}>{r._line}</td>
                                                <td style={s.td}>{r.prenom || '—'}</td>
                                                <td style={s.td}>{r.nom || '—'}</td>
                                                {audience === 'ENFANT'
                                                    ? <><td style={s.td}>{r.age || '—'}</td><td style={s.td}>{r.parentNom || '—'}</td><td style={s.td}>{r.parentTel || '—'}</td><td style={s.td}>{r.parentEmail || '—'}</td></>
                                                    : <><td style={s.td}>{r.email || '—'}</td><td style={s.td}>{r.telephone || '—'}</td></>}
                                                <td style={s.td}><span style={{ ...s.pill, color: st.color, background: st.bg }}>{st.label}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {prepared.length > 300 && <div style={{ padding: 10, fontSize: 12, color: '#6B7280' }}>… et {prepared.length - 300} autre(s) ligne(s)</div>}
                        </div>

                        <div style={s.foot}>
                            <button style={s.btnSec} onClick={() => setStep(2)} disabled={busy}>← Colonnes</button>
                            <button style={{ ...s.btnPri, background: A.color, opacity: busy || !toImport.length ? 0.6 : 1 }} disabled={busy || !toImport.length} onClick={runImport}>
                                {busy ? 'Import en cours…' : `Importer ${toImport.length} élève(s)`}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── ÉTAPE 4 ── */}
                {step === 4 && result && (
                    <div>
                        <div style={s.summary}>
                            <span style={{ ...s.pill, color: '#059669', background: '#ECFDF5', fontSize: 13 }}>✅ {result.created.length} élève(s) créé(s)</span>
                            {result.skipped.length > 0 && <span style={{ ...s.pill, color: '#8B6200', background: '#FFFBEB', fontSize: 13 }}>{result.skipped.length} ignoré(s)</span>}
                            {result.errors.length > 0 && <span style={{ ...s.pill, color: '#DC2626', background: '#FEF2F2', fontSize: 13 }}>{result.errors.length} erreur(s)</span>}
                        </div>
                        {result.created.length > 0 && (
                            <>
                                <div style={s.warn}>Téléchargez maintenant la liste des identifiants : elle contient les mots de passe générés.</div>
                                <div style={s.tableWrap}>
                                    <table style={s.table}>
                                        <thead><tr><th style={s.th}>Élève</th><th style={s.th}>Login</th><th style={s.th}>Mot de passe</th><th style={s.th}>Groupe</th></tr></thead>
                                        <tbody>
                                            {result.created.map(c => (
                                                <tr key={c.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                                                    <td style={s.td}>{c.prenom} {c.nom}</td>
                                                    <td style={{ ...s.td, fontFamily: 'monospace' }}>{c.login}</td>
                                                    <td style={{ ...s.td, fontFamily: 'monospace', color: A.color, fontWeight: 700 }}>{c.password}</td>
                                                    <td style={s.td}>{c.groupe || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                        {(result.skipped.length > 0 || result.errors.length > 0) && (
                            <details style={{ marginTop: 12, fontSize: 13, color: '#374151' }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Voir les lignes non importées</summary>
                                <ul style={{ margin: '8px 0 0 18px', lineHeight: 1.7 }}>
                                    {[...result.skipped, ...result.errors].map((x, i) => (
                                        <li key={i}>Ligne {x.line} — {x.prenom} {x.nom} : {x.raison}</li>
                                    ))}
                                </ul>
                            </details>
                        )}
                        <div style={s.foot}>
                            {result.created.length > 0 && <button style={s.btnSec} onClick={exportCredentials}>⬇ Télécharger les identifiants (CSV)</button>}
                            <button style={{ ...s.btnPri, background: A.color }} onClick={onClose}>Terminer</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,10,30,0.5)', backdropFilter: 'blur(4px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal: { background: '#fff', borderRadius: 18, padding: '24px 26px', width: 900, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
    head: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    kicker: { fontSize: 11, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' },
    title: { fontSize: 22, fontWeight: 800, color: '#1A1040', margin: '4px 0 0' },
    close: { border: 'none', background: '#F3F4F6', width: 32, height: 32, borderRadius: 8, fontSize: 20, cursor: 'pointer', color: '#6B7280' },
    steps: { display: 'flex', gap: 8, margin: '18px 0', flexWrap: 'wrap' },
    step: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, paddingBottom: 6, borderBottom: '2px solid', flex: 1, minWidth: 120 },
    stepNum: { width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 },
    error: { background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12 },
    warn: { background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600, margin: '10px 0' },
    drop: { border: '2px dashed', borderRadius: 14, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s' },
    help: { marginTop: 14, fontSize: 13, color: '#4B5563', lineHeight: 1.6, background: '#F8F6FF', borderRadius: 10, padding: '12px 14px' },
    p: { fontSize: 13, color: '#374151', margin: '0 0 14px' },
    mapGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 10 },
    mapRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#FAFAFE', border: '1px solid #EEEBF8', borderRadius: 10, padding: '10px 12px' },
    mapLabel: { fontSize: 13, fontWeight: 700, color: '#1A1040' },
    mapHint: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    select: { padding: '8px 10px', border: '1.5px solid #E5E0F5', borderRadius: 8, fontSize: 13, color: '#1A1040', background: '#fff', fontFamily: 'inherit', minWidth: 200, maxWidth: '100%' },
    summary: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
    pill: { display: 'inline-flex', padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' },
    options: { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', margin: '8px 0' },
    optLabel: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#374151' },
    tableWrap: { border: '1px solid #EEEBF8', borderRadius: 12, overflow: 'auto', maxHeight: 340, marginTop: 10 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { position: 'sticky', top: 0, background: '#F8F6FF', textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
    td: { padding: '8px 10px', color: '#1A1040', whiteSpace: 'nowrap' },
    foot: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, flexWrap: 'wrap' },
    btnPri: { padding: '10px 18px', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
    btnSec: { padding: '10px 16px', border: '1.5px solid #E5E0F5', borderRadius: 10, background: '#fff', color: '#1A1040', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
};
