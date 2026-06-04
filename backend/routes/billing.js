const express    = require('express');
const router     = express.Router();
const nodemailer = require('nodemailer');
const jwt        = require('jsonwebtoken');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Config email ──────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// ── Infos écoles par ville ────────────────────────────────
const SCHOOLS = {
    Thionville: {
        name:     'CodingHost Thionville',
        fullName: 'Coding Host SAS',
        address:  '6 rue de la Tour, 57100 Thionville',
        tel:      '06.21.68.09.20',
        email:    'thionville@codinghost.fr',
        tva:      'FR9492522576',
        siren:    '925225765',
        siret:    '92522576500013',
        iban:     'FR83 3000 2070 3400 0007 2134 A14',
        bic:      'CRLYFRPP',
        bank:     'LCL Crédit Lyonnais Thionville',
        sumup:    'https://pay.sumup.com/b2c/Q4D9OMBK',
        director: 'Annie Chaboisseau',
    },
    Metz: {
        name:     'CodingHost Metz',
        fullName: 'Coding Host SAS',
        address:  'Metz, France',
        tel:      '06.21.68.09.20',
        email:    'metz@codinghost.fr',
        tva:      'FR9492522576',
        siren:    '925225765',
        siret:    '92522576500013',
        iban:     'FR83 3000 2070 3400 0007 2134 A14',
        bic:      'CRLYFRPP',
        bank:     'LCL Crédit Lyonnais',
        sumup:    'https://pay.sumup.com/b2c/Q4D9OMBK',
        director: 'Annie Chaboisseau',
    },
};
const getSchool = (ville) => SCHOOLS[ville] || SCHOOLS.Thionville;

// ── Logo SVG inline ───────────────────────────────────────
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 360" width="180" height="46">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6C4CF5"/>
      <stop offset="50%" stop-color="#9B4DE1"/>
      <stop offset="100%" stop-color="#F4A340"/>
    </linearGradient>
  </defs>
  <rect x="40" y="60" width="260" height="170" rx="28" fill="none" stroke="url(#grad)" stroke-width="16"/>
  <text x="95" y="165" font-size="92" font-family="monospace" fill="url(#grad)" font-weight="700">&lt;/&gt;</text>
  <rect x="135" y="235" width="70" height="30" fill="url(#grad)"/>
  <rect x="110" y="265" width="120" height="12" fill="url(#grad)"/>
  <text x="360" y="175" font-family="Arial,sans-serif" font-weight="700" font-size="150" fill="#4B2FBF">Coding Host</text>
  <text x="360" y="245" font-family="Arial,sans-serif" font-size="46" fill="#4B2FBF" opacity="0.9">Centre de formation numérique • Enfants et adultes</text>
</svg>`;

// ── Helpers ───────────────────────────────────────────────
const fmt          = (n) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`;
const fmtDate      = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) : '—';
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const today        = () => new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

const getPdfFilename = (type, contract) => {
    const nom    = contract.student?.user?.nom?.toUpperCase().replace(/\s+/g,'-') || 'INCONNU';
    const prenom = contract.student?.user?.prenom?.replace(/\s+/g,'-') || '';
    const num    = contract.number;
    return `${type === 'invoice' ? 'Facture' : 'Contrat'}-${num}-${nom}-${prenom}.pdf`;
};

// ── Numéro de contrat ─────────────────────────────────────
const generateContractNumber = async (ville) => {
    const year   = new Date().getFullYear();
    const prefix = ville === 'Metz' ? 'CTR-MZ' : 'CTR-TH';
    const count  = await prisma.contract.count({ where: { number: { startsWith: `${prefix}-${year}` } } });
    return `${prefix}-${year}-${String(count + 1).padStart(3, '0')}`;
};

// ── Calcul échéances ──────────────────────────────────────
const computeInstallments = (totalAmount, depositAmount, paymentMode) => {
    const remaining = totalAmount - depositAmount;
    const now = new Date();
    if (paymentMode === 'ONCE') {
        return [{ number:1, amount:remaining, dueDate:new Date(now.getFullYear(), now.getMonth()+1, 5) }];
    }
    if (paymentMode === 'THREE_TIMES') {
        const m    = Math.round((remaining/3)*100)/100;
        const last = Math.round((remaining - m*2)*100)/100;
        return [
            { number:1, amount:m,    dueDate:new Date(now.getFullYear(), now.getMonth()+1, 5) },
            { number:2, amount:m,    dueDate:new Date(now.getFullYear(), now.getMonth()+2, 5) },
            { number:3, amount:last, dueDate:new Date(now.getFullYear(), now.getMonth()+3, 5) },
        ];
    }
    if (paymentMode === 'MONTHLY') {
        const monthly = 90;
        const nb = Math.ceil(remaining / monthly);
        return Array.from({length:nb}, (_,i) => ({
            number:  i+1,
            amount:  i===nb-1 ? Math.round((remaining-monthly*(nb-1))*100)/100 : monthly,
            dueDate: new Date(now.getFullYear(), now.getMonth()+i+1, 5),
        }));
    }
    return [];
};

// ════════════════════════════════════════════════════════════
// MIDDLEWARE FLEX — accepte token en header Authorization
// OU en query param ?token=... (fix téléchargement PDF)
// ════════════════════════════════════════════════════════════
const flexAuth = async (req, res, next) => {
    try {
        let token = null;
        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }
        if (!token) return res.status(401).json({ message: 'Non autorisé' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user    = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
};

// ══════════════════════════════════════════════════════════
// TEMPLATE EN-TÊTE PDF
// ══════════════════════════════════════════════════════════
const buildPdfHeader = (school, ville) => `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #5B2EE8">
    <div style="display:flex;flex-direction:column;gap:6px">
      ${LOGO_SVG}
      <div style="font-size:11px;color:#6B7280;margin-top:4px">${school.tel}</div>
      <div style="font-size:11px;color:#6B7280">${school.address}</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#374151;line-height:1.9">
      <div style="font-weight:700;font-size:13px;color:#1A1040">${school.fullName}</div>
      <div>TVA ${school.tva}</div>
      <div>Siren : ${school.siren}</div>
      <div>Siret : ${school.siret}</div>
      <div>${school.email}</div>
      <div style="margin-top:4px;background:#EDE8FF;color:#5B2EE8;padding:2px 8px;border-radius:4px;font-weight:700;display:inline-block">${ville}</div>
    </div>
  </div>`;

// ══════════════════════════════════════════════════════════
// GÉNÉRATION HTML — FACTURE
// ══════════════════════════════════════════════════════════
const generateInvoiceHTML = (contract) => {
    const school    = getSchool(contract.ville || 'Thionville');
    const ville     = contract.ville || 'Thionville';
    const prenom    = contract.student?.user?.prenom || '';
    const nom       = contract.student?.user?.nom    || '';
    const remaining = contract.totalAmount - contract.depositAmount;
    const installments = contract.installments || [];

    let scheduleHTML = '';
    if (installments.length > 0 && contract.paymentMode !== 'ONCE') {
        const rows = installments.map(i => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e8e0f5">${i.number}${i.number===1?'er':'e'} versement</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e8e0f5;font-weight:700">${fmt(i.amount)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e8e0f5">– ${fmtDateShort(i.dueDate)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e8e0f5">
          <span style="color:${i.status==='PAID'?'#059669':i.status==='LATE'?'#DC2626':'#D97706'};font-weight:700">
            ${i.status==='PAID'?'✅ Payé':i.status==='LATE'?'⚠️ En retard':'⏳ En attente'}
          </span>
        </td>
      </tr>`).join('');
        scheduleHTML = `
      <p style="margin:10px 0 6px;font-weight:700">Échéancier :</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:#F8F6FF">
          <th style="padding:6px 10px;text-align:left;font-size:11px;color:#6B7280">Versement</th>
          <th style="padding:6px 10px;text-align:left;font-size:11px;color:#6B7280">Montant</th>
          <th style="padding:6px 10px;text-align:left;font-size:11px;color:#6B7280">Date</th>
          <th style="padding:6px 10px;text-align:left;font-size:11px;color:#6B7280">Statut</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    }

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;background:#fff}
  .page{width:794px;min-height:1123px;margin:0 auto;padding:40px 50px;position:relative}
  .doc-title{text-align:center;margin-bottom:20px}
  .doc-title h1{font-size:17px;font-weight:700;color:#1A1040;text-transform:uppercase;letter-spacing:0.5px}
  .amount-block{background:#F8F6FF;border:1px solid #E5E0F5;border-radius:8px;padding:16px 20px;margin-bottom:18px}
  .payment-box{background:#1A1040;color:#fff;border-radius:8px;padding:16px 20px;margin-bottom:16px;font-size:12px;line-height:1.9}
  .payment-box a{color:#A78BFF}
  .payment-box b{color:#A78BFF}
  .note{background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 14px;font-size:12px;color:#7C6500;margin-bottom:16px;border-radius:0 6px 6px 0}
  .footer-legal{margin-top:20px;padding-top:12px;border-top:1px solid #e8e0f5;text-align:center;font-size:10px;color:#9CA3AF}
  table.main th{background:#1A1040;color:#fff;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
  table.main td{padding:10px 14px;border-bottom:1px solid #e8e0f5;vertical-align:top}
</style>
</head><body>
<div class="page">
  ${buildPdfHeader(school, ville)}
  <div class="doc-title"><h1>Devis / Facture — ${contract.number}</h1></div>

  <div style="margin-bottom:18px;font-size:13px;line-height:1.8">
    <div><strong>Mr/Mme :</strong> ${contract.parentName || '—'}</div>
    <div><strong>Email :</strong> ${contract.parentEmail || '—'}</div>
    <div style="margin-top:6px">Le ${fmtDate(contract.createdAt)}</div>
    <div style="margin-top:10px">Bonjour,<br>Merci d'avoir choisi ${school.name}, école de programmation pour enfants/adolescents.</div>
  </div>

  <table class="main" style="width:100%;border-collapse:collapse;margin-bottom:18px">
    <thead><tr>
      <th style="width:35%">Cours</th>
      <th style="width:25%">Nombre de cours</th>
      <th style="width:40%">Prix en euros</th>
    </tr></thead>
    <tbody><tr>
      <td>
        <div style="font-weight:700">${contract.courseName}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:4px">enfant/s : ${prenom} ${nom}</div>
        ${contract.courseDay ? `<div style="font-size:11px;color:#9CA3AF;margin-top:2px">${contract.courseDay}</div>` : ''}
        ${contract.courseStartDate ? `<div style="font-size:11px;color:#9CA3AF">à partir du ${contract.courseStartDate}</div>` : ''}
      </td>
      <td style="font-weight:700">${contract.nbCours} cours</td>
      <td>
        <div style="font-size:15px;font-weight:700">Prix Total : ${fmt(contract.totalAmount)}</div>
        <div style="color:#6B7280;font-size:12px">Total TTC : ${fmt(contract.totalAmount)}</div>
      </td>
    </tr></tbody>
  </table>

  <div class="amount-block">
    <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:15px;font-weight:700;color:#1A1040;border-bottom:1px solid #C4B5FD;margin-bottom:8px;padding-bottom:8px">
      <span>Prix total (${contract.nbCours} cours)</span><span>${fmt(contract.totalAmount)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:5px 0;color:#059669;font-weight:700">
      <span>Acompte payé${contract.depositPaidAt?` le ${fmtDateShort(contract.depositPaidAt)}`:''}${contract.depositMethod?` via ${contract.depositMethod}`:''}</span>
      <span>- ${fmt(contract.depositAmount)}</span>
    </div>
    <div style="border-top:1px dashed #C4B5FD;margin:8px 0"></div>
    <div style="display:flex;justify-content:space-between;padding:5px 0;color:#D97706;font-weight:700;font-size:14px">
      <span>Restant à payer</span><span>${fmt(remaining)}</span>
    </div>
    ${scheduleHTML}
    <div style="text-align:center;margin-top:12px;font-size:18px;color:#C4B5FD;letter-spacing:4px">==============</div>
  </div>

  <div class="payment-box">
    <div style="font-weight:700;margin-bottom:8px;color:#A78BFF;font-size:13px">Modalités de paiement</div>
    <div>*paiement 3 fois possible – 5% supplémentaires sont ajoutés sur le montant dû après 10 jours de non-paiement.</div>
    <div style="margin-top:8px">💳 Paiement par carte de crédit : <a href="${school.sumup}">${school.sumup}</a></div>
    <div style="margin-top:8px">
      <b>RIB – Virement instantané :</b><br>
      Titulaire : Coding Host Sas<br>Banque : ${school.bank}<br>
      Code BIC : ${school.bic}<br>IBAN : ${school.iban}<br>
      <span style="color:#fbbf24">! Communication : nom de l'enfant / cours</span>
    </div>
  </div>

  <div class="note">📌 Ce n'est qu'après le paiement que la place de votre enfant est <strong>définitivement réservée</strong>.</div>
  <div class="footer-legal">${school.fullName} · TVA ${school.tva} · Siren ${school.siren} · ${school.address}</div>
</div>
</body></html>`;
};

// ══════════════════════════════════════════════════════════
// GÉNÉRATION HTML — CONTRAT
// ══════════════════════════════════════════════════════════
const generateContractHTML = (contract) => {
    const school    = getSchool(contract.ville || 'Thionville');
    const ville     = contract.ville || 'Thionville';
    const prenom    = contract.student?.user?.prenom || '';
    const nom       = contract.student?.user?.nom    || '';
    const remaining = contract.totalAmount - contract.depositAmount;
    const signDate  = contract.signedAt ? fmtDate(contract.signedAt) : today();

    const paymentSection = () => {
        if (contract.paymentMode === 'THREE_TIMES') {
            const rows = (contract.installments||[]).map(i =>
                `<li>${i.number}${i.number===1?'er':'e'} versement : ${fmt(i.amount)}</li>`).join('');
            return `<p>☑ <strong>Paiement en 3 fois sans frais</strong></p><ul style="margin:8px 0 8px 24px;line-height:1.9">${rows}</ul>`;
        }
        if (contract.paymentMode === 'MONTHLY') {
            return `<p>☑ <strong>Paiement mensuel</strong></p><ul style="margin:8px 0 8px 24px;line-height:1.9"><li>Mensualités de 90 € jusqu'à règlement complet du solde.</li></ul>`;
        }
        return `<p>☑ <strong>Paiement en 1 fois</strong> : ${fmt(remaining)}</p>`;
    };

    const hdr = buildPdfHeader(school, ville);
    const pg  = (content) => `<div style="width:794px;padding:40px 50px;margin:0 auto;font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a">${hdr}${content}</div>`;

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}body{background:#fff}
  .section{margin-bottom:14px}.section-title{font-weight:700;margin-bottom:6px;color:#1A1040}
  p{line-height:1.7;margin-bottom:6px}
  .highlight{background:#F8F6FF;border-left:3px solid #5B2EE8;padding:10px 14px;border-radius:0 6px 6px 0;margin:10px 0}
  .page-break{page-break-after:always}
  .footer{text-align:center;font-size:10px;color:#9CA3AF;margin-top:24px;padding-top:12px;border-top:1px solid #e8e0f5}
</style>
</head><body>

${pg(`
  <h2 style="font-size:15px;font-weight:700;text-align:center;margin:16px 0;color:#1A1040;text-transform:uppercase;letter-spacing:0.5px">
    Contrat entre l'école et les parents pour le cours de programmation
  </h2>
  <p>Ce contrat est établi entre l'école <strong>${school.name}</strong> et les parents/tuteurs légaux <strong>${contract.parentName||'—'}</strong> pour la participation de l'enfant <strong>${prenom} ${nom}</strong> au cours : <strong>${contract.courseName}</strong>.</p>

  <div class="section" style="margin-top:16px">
    <div class="section-title">1. Forfait choisi :</div>
    <div class="highlight">
      Le forfait choisi est de <strong>${contract.nbCours} séances${contract.courseDay?` chaque ${contract.courseDay}`:''}</strong>${contract.courseStartDate?` à partir du ${contract.courseStartDate}`:''}.
      Paiement total : <strong>${fmt(contract.totalAmount)} pour ${contract.nbCours} séances</strong>
      ${contract.depositPaidAt?` · Acompte <strong>${fmt(contract.depositAmount)} payé le ${fmtDateShort(contract.depositPaidAt)}</strong>`:` · Acompte de <strong>${fmt(contract.depositAmount)}</strong>`}
      · Reste à payer : <strong>${fmt(remaining)}</strong>.
    </div>
  </div>
  <div class="section"><div class="section-title">2. Modalités de paiement du solde :</div>${paymentSection()}
    <p style="margin-top:8px"><strong>Le client s'engage à respecter le plan de paiement choisi.</strong></p></div>
  <div class="section"><div class="section-title">3. Notification d'absence :</div>
    <p>Les parents informent l'école au moins deux jours ouvrables à l'avance. Maladie : avant 9h00 le jour même.</p></div>
  <div class="section"><div class="section-title">4. Utilisation des matériaux :</div>
    <p>Le matériel et les accès sont exclusivement destinés à l'enfant. En cas de partage, expulsion immédiate.</p></div>
  <div class="section"><div class="section-title">5. Description du cours :</div>
    <p>L'école s'engage à dispenser les cours tels que décrits et acceptés par les parents.</p></div>
  <div class="section"><div class="section-title">6. Communication en cas d'absence :</div>
    <p>En cas d'absence de l'enseignant, l'école informera les parents dans les meilleurs délais.</p></div>
  <div class="footer">${school.fullName} · TVA ${school.tva} · Siren ${school.siren} · ${school.address}</div>
`)}

<div class="page-break"></div>

${pg(`
  <div class="section"><div class="section-title">7. Responsabilité médicale :</div>
    <p>L'école n'est pas responsable des allergies ou maladies non signalées lors de l'inscription.</p></div>
  <div class="section"><div class="section-title">8. Absences :</div>
    <p>Les cours manqués ne sont pas remboursables. La plateforme CodingHost reste accessible via le login de l'enfant.</p></div>
  <div class="section"><div class="section-title">9. Transfert de groupe :</div>
    <p>L'enfant peut rejoindre un autre groupe du même niveau selon disponibilité.</p></div>
  <div class="section"><div class="section-title">10. Remboursement :</div>
    <p>100% des séances restantes remboursées si interruption valable. <strong>Aucun remboursement après un mois de participation.</strong></p></div>
  <div class="section"><div class="section-title">11. Préavis :</div>
    <p>Préavis d'un mois et demi requis. L'enfant peut continuer pendant ce délai.</p></div>
  <div class="section"><div class="section-title">12. Sécurité :</div>
    <p>L'école est responsable de la sécurité uniquement pendant les heures de cours.</p></div>
  <div class="section"><div class="section-title">13. Vacances scolaires :</div>
    <p>Pas de cours pendant les vacances. Des stages sont organisés.</p></div>

  <p style="margin-top:16px">Les parties reconnaissent avoir lu et compris les termes de ce contrat.</p>
  <p style="margin-top:6px"><strong>Fait en double exemplaire, à ${ville} le ${signDate}</strong></p>

  <div style="display:flex;justify-content:space-between;margin-top:36px;gap:40px">
    <div style="flex:1;border-top:1px solid #1A1040;padding-top:10px">
      <p style="font-size:12px;color:#6B7280">Signature du représentant de l'école :</p>
      <p style="margin-top:8px;font-weight:700">${school.director}</p>
      <p style="font-size:11px;color:#6B7280">Directrice</p>
    </div>
    <div style="flex:1;border-top:1px solid #1A1040;padding-top:10px">
      <p style="font-size:12px;color:#6B7280">Signature du parent/tuteur légal :</p>
      <p style="margin-top:28px;font-size:12px;color:#9CA3AF">_________________________ (nom/prénom)</p>
    </div>
  </div>
  <div class="footer">${school.fullName} · TVA ${school.tva} · Siren ${school.siren} · ${school.address}</div>
`)}

</body></html>`;
};

// ── HTML → PDF via Puppeteer ──────────────────────────────
const htmlToPdf = async (html) => {
    const puppeteer = require('puppeteer');
    const browser   = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] });
    const page      = await browser.newPage();
    await page.setContent(html, { waitUntil:'networkidle0' });
    const pdf = await page.pdf({ format:'A4', printBackground:true, margin:{top:'0',right:'0',bottom:'0',left:'0'} });
    await browser.close();
    return pdf;
};

const contractInclude = {
    student:      { include: { user: { select:{id:true,prenom:true,nom:true,email:true,login:true} } } },
    group:        { select: {id:true, titre:true, ville:true} },
    installments: { orderBy: {number:'asc'} },
    emailLogs:    { orderBy: {sentAt:'desc'}, take:5 },
};

// ══════════════════════════════════════════════════════════
// ROUTES — CONTRATS
// ══════════════════════════════════════════════════════════

router.get('/contracts', protect, allowRoles('ADMIN','TEACHER'), async (req, res) => {
    try {
        const { status, groupId, search, ville } = req.query;
        const where = {};
        if (status)  where.status  = status;
        if (groupId) where.groupId = parseInt(groupId);
        if (ville)   where.ville   = ville;
        if (search) {
            where.OR = [
                { number:     { contains: search, mode:'insensitive' } },
                { parentName: { contains: search, mode:'insensitive' } },
                { courseName: { contains: search, mode:'insensitive' } },
                { student: { user: { nom:    { contains: search, mode:'insensitive' } } } },
                { student: { user: { prenom: { contains: search, mode:'insensitive' } } } },
            ];
        }
        const contracts = await prisma.contract.findMany({ where, include:contractInclude, orderBy:{createdAt:'desc'} });
        res.json(contracts);
    } catch(err) { res.status(500).json({message:'Erreur serveur', error:err.message}); }
});

router.get('/contracts/:id', protect, allowRoles('ADMIN','TEACHER'), async (req, res) => {
    try {
        const contract = await prisma.contract.findUnique({ where:{id:parseInt(req.params.id)}, include:contractInclude });
        if (!contract) return res.status(404).json({message:'Contrat non trouvé'});
        res.json(contract);
    } catch(err) { res.status(500).json({message:'Erreur serveur', error:err.message}); }
});

router.post('/contracts', protect, allowRoles('ADMIN','TEACHER'), async (req, res) => {
    const { studentId, groupId, parentName, parentEmail, parentSignature,
        schoolYear, courseName, courseDay, courseStartDate, nbCours,
        totalAmount, depositAmount, depositMethod, depositPaidAt,
        paymentMode, notes, signedAt, ville } = req.body;
    try {
        const villeNorm = ville || 'Thionville';
        const number    = await generateContractNumber(villeNorm);
        const contract  = await prisma.contract.create({
            data: {
                number, ville: villeNorm,
                studentId:       parseInt(studentId),
                groupId:         parseInt(groupId),
                parentName:      parentName      || null,
                parentEmail:     parentEmail     || null,
                parentSignature: parentSignature || null,
                schoolYear:      schoolYear      || '2025-2026',
                courseName,
                courseDay:       courseDay       || null,
                courseStartDate: courseStartDate || null,
                nbCours:         parseInt(nbCours) || 32,
                totalAmount:     parseFloat(totalAmount),
                depositAmount:   parseFloat(depositAmount || 100),
                depositMethod:   depositMethod   || null,
                depositPaidAt:   depositPaidAt   ? new Date(depositPaidAt) : null,
                paymentMode:     paymentMode     || 'ONCE',
                status:          depositPaidAt   ? 'ACTIVE' : 'DRAFT',
                notes:           notes           || null,
                signedAt:        signedAt        ? new Date(signedAt) : null,
            },
            include: contractInclude,
        });
        const instData = computeInstallments(parseFloat(totalAmount), parseFloat(depositAmount||100), paymentMode||'ONCE');
        if (instData.length > 0) {
            await prisma.installment.createMany({ data: instData.map(i => ({...i, contractId:contract.id})) });
        }
        const full = await prisma.contract.findUnique({ where:{id:contract.id}, include:contractInclude });
        res.status(201).json(full);
    } catch(err) { console.error(err); res.status(500).json({message:'Erreur serveur', error:err.message}); }
});

router.put('/contracts/:id', protect, allowRoles('ADMIN','TEACHER'), async (req, res) => {
    try {
        const data = {};
        ['status','parentName','parentEmail','parentSignature','courseName','courseDay',
            'courseStartDate','nbCours','totalAmount','depositAmount','depositMethod',
            'depositPaidAt','paymentMode','notes','signedAt','schoolYear','ville'].forEach(f => {
            if (req.body[f] !== undefined) data[f] = req.body[f];
        });
        if (data.depositPaidAt) data.depositPaidAt = new Date(data.depositPaidAt);
        if (data.signedAt)      data.signedAt      = new Date(data.signedAt);
        if (data.totalAmount)   data.totalAmount   = parseFloat(data.totalAmount);
        if (data.depositAmount) data.depositAmount = parseFloat(data.depositAmount);
        if (data.nbCours)       data.nbCours       = parseInt(data.nbCours);
        if (data.depositPaidAt && !data.status) data.status = 'ACTIVE';
        const contract = await prisma.contract.update({ where:{id:parseInt(req.params.id)}, data, include:contractInclude });
        res.json(contract);
    } catch(err) { res.status(500).json({message:'Erreur serveur', error:err.message}); }
});

router.delete('/contracts/:id', protect, allowRoles('ADMIN'), async (req, res) => {
    try {
        await prisma.contract.delete({ where:{id:parseInt(req.params.id)} });
        res.json({message:'Contrat supprimé'});
    } catch(err) { res.status(500).json({message:'Erreur serveur', error:err.message}); }
});

// ══════════════════════════════════════════════════════════
// ROUTES PDF — flexAuth (header OU ?token= dans l'URL)
// ══════════════════════════════════════════════════════════

router.get('/contracts/:id/invoice-pdf', flexAuth, async (req, res) => {
    try {
        const contract = await prisma.contract.findUnique({ where:{id:parseInt(req.params.id)}, include:contractInclude });
        if (!contract) return res.status(404).json({message:'Contrat non trouvé'});
        const pdf      = await htmlToPdf(generateInvoiceHTML(contract));
        const filename = getPdfFilename('invoice', contract);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdf);
    } catch(err) { console.error('invoice-pdf error:', err); res.status(500).json({message:'Erreur PDF', error:err.message}); }
});

router.get('/contracts/:id/contract-pdf', flexAuth, async (req, res) => {
    try {
        const contract = await prisma.contract.findUnique({ where:{id:parseInt(req.params.id)}, include:contractInclude });
        if (!contract) return res.status(404).json({message:'Contrat non trouvé'});
        const pdf      = await htmlToPdf(generateContractHTML(contract));
        const filename = getPdfFilename('contract', contract);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdf);
    } catch(err) { console.error('contract-pdf error:', err); res.status(500).json({message:'Erreur PDF', error:err.message}); }
});

// ══════════════════════════════════════════════════════════
// ROUTES — ÉCHÉANCES
// ══════════════════════════════════════════════════════════

router.put('/installments/:id/pay', protect, allowRoles('ADMIN','TEACHER'), async (req, res) => {
    const { paidAmount, method, reference, paidAt } = req.body;
    try {
        const installment = await prisma.installment.update({
            where: {id:parseInt(req.params.id)},
            data: {
                status:     'PAID',
                paidAt:     paidAt ? new Date(paidAt) : new Date(),
                paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
                method:     method    || null,
                reference:  reference || null,
            },
            include: { contract: { include: contractInclude } },
        });
        const all = await prisma.installment.findMany({ where:{contractId:installment.contractId} });
        if (all.every(i => i.status === 'PAID')) {
            await prisma.contract.update({ where:{id:installment.contractId}, data:{status:'COMPLETED'} });
        }
        res.json(installment);
    } catch(err) { res.status(500).json({message:'Erreur', error:err.message}); }
});

router.post('/installments/check-late', protect, allowRoles('ADMIN'), async (req, res) => {
    try {
        const result = await prisma.installment.updateMany({
            where: { status:'PENDING', dueDate:{lt:new Date()} },
            data:  { status:'LATE' },
        });
        res.json({ updated:result.count, message:`${result.count} échéance(s) mise(s) en retard` });
    } catch(err) { res.status(500).json({message:'Erreur', error:err.message}); }
});

// ══════════════════════════════════════════════════════════
// WEBHOOK SUMUP
// ══════════════════════════════════════════════════════════

router.post('/webhook/sumup', async (req, res) => {
    try {
        const event = req.body;
        console.log('📩 Webhook SumUp reçu:', JSON.stringify(event));

        if (!event || event.status !== 'PAID') {
            return res.status(200).json({ received:true, processed:false, reason:'Not a payment event' });
        }

        const webhook = await prisma.sumupWebhook.create({
            data: {
                eventId:   event.id || `${Date.now()}`,
                type:      event.event_type || 'checkout.completed',
                amount:    parseFloat(event.amount || 0),
                currency:  event.currency || 'EUR',
                reference: event.checkout_reference || null,
                status:    'PAID',
                rawData:   event,
                processed: false,
            }
        }).catch(() => null);

        if (!webhook) {
            return res.status(200).json({ received:true, processed:false, reason:'Duplicate event' });
        }

        const reference = event.checkout_reference || '';
        const amount    = parseFloat(event.amount || 0);

        const pendingInstallments = await prisma.installment.findMany({
            where: { status: { in: ['PENDING','LATE'] }, amount: { gte:amount-1, lte:amount+1 } },
            include: { contract: { include: contractInclude } },
            orderBy: { dueDate:'asc' },
        });

        let matched = null;
        if (reference && pendingInstallments.length > 0) {
            const refLower = reference.toLowerCase();
            matched = pendingInstallments.find(inst => {
                const nom    = (inst.contract.student?.user?.nom    || '').toLowerCase();
                const prenom = (inst.contract.student?.user?.prenom || '').toLowerCase();
                return refLower.includes(nom) || refLower.includes(prenom);
            });
        }
        if (!matched && pendingInstallments.length > 0) matched = pendingInstallments[0];

        if (matched) {
            await prisma.installment.update({
                where: {id:matched.id},
                data:  { status:'PAID', paidAt:new Date(), paidAmount:amount, method:'SumUp (automatique)', reference:event.id||null }
            });
            const allInst = await prisma.installment.findMany({ where:{contractId:matched.contractId} });
            if (allInst.every(i => i.status === 'PAID')) {
                await prisma.contract.update({ where:{id:matched.contractId}, data:{status:'COMPLETED'} });
            }
            await prisma.sumupWebhook.update({ where:{id:webhook.id}, data:{processed:true} });

            if (matched.contract.parentEmail && process.env.EMAIL_USER) {
                const c      = matched.contract;
                const prenom = c.student?.user?.prenom || '';
                const nom    = c.student?.user?.nom    || '';
                const school = getSchool(c.ville || 'Thionville');
                try {
                    const pdf = await htmlToPdf(generateInvoiceHTML(c));
                    await transporter.sendMail({
                        from:    `"CodingHost" <${process.env.EMAIL_USER}>`,
                        to:      c.parentEmail,
                        subject: `[CodingHost] ✅ Paiement reçu ${Number(amount).toFixed(2)} € — ${prenom} ${nom}`,
                        html:    `<p>Bonjour ${c.parentName||''},</p><p>Paiement de <strong>${Number(amount).toFixed(2).replace('.',',')} €</strong> via SumUp reçu pour <strong>${prenom} ${nom}</strong>. Facture en pièce jointe.</p><br><p>${school.director}<br>${school.name}</p>`,
                        attachments: [{ filename:getPdfFilename('invoice',c), content:pdf, contentType:'application/pdf' }],
                    });
                } catch(emailErr) { console.error('Email reçu auto:', emailErr.message); }
            }
            console.log(`✅ Webhook SumUp traité : échéance #${matched.id} — ${amount} €`);
        } else {
            console.log(`⚠️ Webhook SumUp : aucune échéance pour montant ${amount} €`);
        }

        res.status(200).json({ received:true, processed:!!matched, matchedInstallment:matched?.id });
    } catch(err) {
        console.error('Webhook SumUp error:', err);
        res.status(500).json({ message:'Erreur webhook', error:err.message });
    }
});

// ══════════════════════════════════════════════════════════
// ROUTES — EMAILS
// ══════════════════════════════════════════════════════════

const sendWithPdf = async (contract, pdfType, emailData) => {
    const html     = pdfType === 'invoice' ? generateInvoiceHTML(contract) : generateContractHTML(contract);
    const pdf      = await htmlToPdf(html);
    const filename = getPdfFilename(pdfType, contract);
    await transporter.sendMail({ ...emailData, attachments: [{ filename, content:pdf, contentType:'application/pdf' }] });
    await prisma.emailLog.create({
        data: { contractId:contract.id, to:emailData.to, subject:emailData.subject, type:emailData.type, success:true }
    });
};

router.post('/contracts/:id/send-invoice', protect, allowRoles('ADMIN','TEACHER'), async (req, res) => {
    try {
        const contract = await prisma.contract.findUnique({ where:{id:parseInt(req.params.id)}, include:contractInclude });
        if (!contract)             return res.status(404).json({message:'Contrat non trouvé'});
        if (!contract.parentEmail) return res.status(400).json({message:'Email parent manquant'});
        const school = getSchool(contract.ville || 'Thionville');
        const prenom = contract.student?.user?.prenom || '';
        const nom    = contract.student?.user?.nom    || '';
        await sendWithPdf(contract, 'invoice', {
            from:    `"CodingHost" <${process.env.EMAIL_USER}>`,
            to:      contract.parentEmail,
            subject: `[CodingHost] Facture — ${nom.toUpperCase()} ${prenom} — ${contract.courseName}`,
            type:    'INVOICE',
            html:    `<p>Bonjour ${contract.parentName||''},</p><p>Facture en pièce jointe.</p><p>Paiement en ligne : <a href="${school.sumup}">${school.sumup}</a></p><br><p>${school.director}<br>${school.name}</p>`,
        });
        res.json({ message:'Facture envoyée', to:contract.parentEmail });
    } catch(err) { res.status(500).json({message:'Erreur', error:err.message}); }
});

router.post('/contracts/:id/send-contract', protect, allowRoles('ADMIN','TEACHER'), async (req, res) => {
    try {
        const contract = await prisma.contract.findUnique({ where:{id:parseInt(req.params.id)}, include:contractInclude });
        if (!contract)             return res.status(404).json({message:'Contrat non trouvé'});
        if (!contract.parentEmail) return res.status(400).json({message:'Email parent manquant'});
        const school = getSchool(contract.ville || 'Thionville');
        const prenom = contract.student?.user?.prenom || '';
        const nom    = contract.student?.user?.nom    || '';
        await sendWithPdf(contract, 'contract', {
            from:    `"CodingHost" <${process.env.EMAIL_USER}>`,
            to:      contract.parentEmail,
            subject: `[CodingHost] Contrat d'inscription — ${nom.toUpperCase()} ${prenom}`,
            type:    'CONTRACT',
            html:    `<p>Bonjour ${contract.parentName||''},</p><p>Contrat en pièce jointe. Merci de nous retourner un exemplaire signé.</p><br><p>${school.director}<br>${school.name} · ${school.tel}</p>`,
        });
        res.json({ message:'Contrat envoyé', to:contract.parentEmail });
    } catch(err) { res.status(500).json({message:'Erreur', error:err.message}); }
});

router.post('/installments/:id/send-receipt', protect, allowRoles('ADMIN','TEACHER'), async (req, res) => {
    try {
        const inst = await prisma.installment.findUnique({ where:{id:parseInt(req.params.id)}, include:{contract:{include:contractInclude}} });
        if (!inst)                     return res.status(404).json({message:'Non trouvée'});
        if (!inst.contract.parentEmail) return res.status(400).json({message:'Email manquant'});
        const c      = inst.contract;
        const school = getSchool(c.ville || 'Thionville');
        const prenom = c.student?.user?.prenom || '';
        const nom    = c.student?.user?.nom    || '';
        const paid   = (c.installments||[]).filter(i=>i.status==='PAID').reduce((a,i)=>a+(i.paidAmount||i.amount),0) + c.depositAmount;
        const rest   = Math.max(0, c.totalAmount - paid);
        await sendWithPdf(c, 'invoice', {
            from:    `"CodingHost" <${process.env.EMAIL_USER}>`,
            to:      c.parentEmail,
            subject: `[CodingHost] ✅ Reçu paiement ${Number(inst.paidAmount||inst.amount).toFixed(2).replace('.',',')} € — ${nom.toUpperCase()} ${prenom}`,
            type:    'RECEIPT',
            html:    `<p>Bonjour ${c.parentName||''},</p><p>Paiement de <strong>${Number(inst.paidAmount||inst.amount).toFixed(2).replace('.',',')} €</strong> reçu pour ${prenom} ${nom}.</p>${rest>0?`<p>Reste à payer : <strong>${Number(rest).toFixed(2).replace('.',',')} €</strong></p>`:'<p style="color:green"><strong>🎉 Compte soldé !</strong></p>'}<p>Facture en pièce jointe.</p><br><p>${school.director}<br>${school.name}</p>`,
        });
        res.json({ message:'Reçu envoyé', to:c.parentEmail });
    } catch(err) { res.status(500).json({message:'Erreur', error:err.message}); }
});

router.post('/installments/:id/send-reminder', protect, allowRoles('ADMIN','TEACHER'), async (req, res) => {
    try {
        const inst = await prisma.installment.findUnique({ where:{id:parseInt(req.params.id)}, include:{contract:{include:contractInclude}} });
        if (!inst)                     return res.status(404).json({message:'Non trouvée'});
        if (!inst.contract.parentEmail) return res.status(400).json({message:'Email manquant'});
        const c        = inst.contract;
        const school   = getSchool(c.ville || 'Thionville');
        const prenom   = c.student?.user?.prenom || '';
        const nom      = c.student?.user?.nom    || '';
        const daysLate = Math.floor((new Date()-new Date(inst.dueDate))/(1000*60*60*24));
        const penalty  = daysLate>10 ? Math.round(inst.amount*0.05*100)/100 : 0;
        await transporter.sendMail({
            from:    `"CodingHost" <${process.env.EMAIL_USER}>`,
            to:      c.parentEmail,
            subject: `[CodingHost] ⚠️ Rappel paiement — ${nom.toUpperCase()} ${prenom} — ${daysLate}j retard`,
            html:    `<p>Bonjour ${c.parentName||''},</p><p>Paiement de <strong>${Number(inst.amount).toFixed(2).replace('.',',')} €</strong> en retard de <strong>${daysLate} jour(s)</strong> pour ${prenom} ${nom}.</p>${penalty>0?`<p style="color:red">⚠️ Pénalité +5% : ${Number(penalty).toFixed(2).replace('.',',')} €<br>Total : ${Number(inst.amount+penalty).toFixed(2).replace('.',',')} €</p>`:''}<p>Paiement : <a href="${school.sumup}">${school.sumup}</a></p><p>IBAN : ${school.iban}</p><br><p>${school.director}<br>${school.name}</p>`,
        });
        await prisma.emailLog.create({ data:{contractId:c.id,to:c.parentEmail,subject:`Rappel`,type:'REMINDER',success:true} });
        res.json({ message:'Rappel envoyé', to:c.parentEmail });
    } catch(err) { res.status(500).json({message:'Erreur', error:err.message}); }
});

router.post('/reminders/send-all', protect, allowRoles('ADMIN'), async (req, res) => {
    try {
        const lateInst = await prisma.installment.findMany({ where:{status:'LATE'}, include:{contract:{include:contractInclude}} });
        const results  = [];
        for (const inst of lateInst) {
            if (!inst.contract.parentEmail) continue;
            try {
                const c      = inst.contract;
                const school = getSchool(c.ville || 'Thionville');
                const prenom = c.student?.user?.prenom || '';
                const nom    = c.student?.user?.nom    || '';
                const days   = Math.floor((new Date()-new Date(inst.dueDate))/(1000*60*60*24));
                const pen    = days>10 ? Math.round(inst.amount*0.05*100)/100 : 0;
                await transporter.sendMail({
                    from:    `"CodingHost" <${process.env.EMAIL_USER}>`,
                    to:      c.parentEmail,
                    subject: `[CodingHost] ⚠️ Rappel — ${nom.toUpperCase()} ${prenom} — ${days}j retard`,
                    html:    `<p>Bonjour,</p><p>${Number(inst.amount).toFixed(2).replace('.',',')} € en retard de ${days} jours pour ${prenom} ${nom}.</p>${pen>0?`<p>Pénalité +5% : ${Number(pen).toFixed(2).replace('.',',')} €</p>`:''}<p>Paiement : <a href="${school.sumup}">${school.sumup}</a></p>`,
                });
                results.push({ id:inst.id, success:true });
            } catch(e) { results.push({ id:inst.id, success:false, error:e.message }); }
        }
        res.json({ sent:results.filter(r=>r.success).length, total:lateInst.length, results });
    } catch(err) { res.status(500).json({message:'Erreur', error:err.message}); }
});

// ══════════════════════════════════════════════════════════
// ROUTES — STATISTIQUES
// ══════════════════════════════════════════════════════════

router.get('/stats', protect, allowRoles('ADMIN','TEACHER'), async (req, res) => {
    try {
        const { ville } = req.query;
        const whereC = ville ? { ville } : {};
        const whereI = ville ? { contract:{ ville } } : {};

        const [totalC, activeC, completedC, pendingI, lateI, paidI, deposits] = await Promise.all([
            prisma.contract.count({ where:whereC }),
            prisma.contract.count({ where:{...whereC, status:'ACTIVE'} }),
            prisma.contract.count({ where:{...whereC, status:'COMPLETED'} }),
            prisma.installment.findMany({ where:{status:'PENDING', ...whereI} }),
            prisma.installment.findMany({
                where:{status:'LATE', ...whereI},
                include:{ contract:{ include:{ student:{ include:{ user:{ select:{prenom:true,nom:true} } } } } } }
            }),
            prisma.installment.findMany({ where:{status:'PAID', ...whereI} }),
            prisma.contract.aggregate({ _sum:{depositAmount:true}, where:{depositPaidAt:{not:null}, ...whereC} }),
        ]);

        const totalRevenue  = paidI.reduce((s,i)=>s+(i.paidAmount||i.amount),0) + (deposits._sum.depositAmount||0);
        const pendingAmount = pendingI.reduce((s,i)=>s+i.amount,0);
        const lateAmount    = lateI.reduce((s,i)=>s+i.amount,0);

        res.json({
            totalContracts:totalC, activeContracts:activeC, completedContracts:completedC,
            totalRevenue, pendingAmount, lateAmount,
            lateCount:    lateI.length,
            pendingCount: pendingI.length,
            lateStudents: lateI.map(i => ({
                installmentId: i.id, contractId:i.contractId,
                student:  `${i.contract.student.user.prenom} ${i.contract.student.user.nom}`,
                amount:   i.amount, dueDate:i.dueDate,
                daysLate: Math.floor((new Date()-new Date(i.dueDate))/(1000*60*60*24)),
                email:    i.contract.parentEmail,
                ville:    i.contract.ville,
            })),
        });
    } catch(err) { res.status(500).json({message:'Erreur', error:err.message}); }
});

router.get('/dashboard-summary', protect, async (req, res) => {
    try {
        const [totalRevenue, lateCount, pendingCount, thisMonthPaid] = await Promise.all([
            prisma.installment.aggregate({ _sum:{paidAmount:true}, where:{status:'PAID'} }),
            prisma.installment.count({ where:{status:'LATE'} }),
            prisma.installment.count({ where:{status:'PENDING'} }),
            prisma.installment.aggregate({
                _sum:{paidAmount:true},
                where:{ status:'PAID', paidAt:{ gte:new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }
            }),
        ]);
        const deposits = await prisma.contract.aggregate({ _sum:{depositAmount:true}, where:{depositPaidAt:{not:null}} });
        res.json({
            totalRevenue:     (totalRevenue._sum.paidAmount||0) + (deposits._sum.depositAmount||0),
            lateCount, pendingCount,
            thisMonthRevenue: thisMonthPaid._sum.paidAmount || 0,
        });
    } catch(err) { res.status(500).json({message:'Erreur', error:err.message}); }
});

module.exports = router;