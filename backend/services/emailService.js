const nodemailer = require('nodemailer');

// ── Transporteur Gmail ────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

// ── Infos école ───────────────────────────────────────────
const SCHOOL = {
    name:    'CodingHost',
    address: '6 rue de la Tour, 57100 Thionville',
    tel:     '06.21.68.09.20',
    email:   process.env.EMAIL_USER || 'codinghost2025@gmail.com',
    website: 'https://codinghost.fr',
};

// ── Template de base HTML ─────────────────────────────────
const baseTemplate = (content, title = 'CodingHost') => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #F3F4F6; color: #1F2937; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #6C47FF, #4F35CC); padding: 32px 40px; text-align: center; }
        .logo { font-size: 28px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
        .logo span { color: #C4B5FD; }
        .header-sub { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 22px; font-weight: 800; color: #1A1040; margin-bottom: 12px; }
        .text { font-size: 15px; color: #4B5563; line-height: 1.7; margin-bottom: 16px; }
        .card { background: #F8F7FF; border: 1px solid #E5E0FF; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
        .card-title { font-size: 12px; font-weight: 700; color: #6C47FF; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EDE8FF; font-size: 14px; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #6B7280; font-weight: 500; }
        .info-value { color: #1A1040; font-weight: 700; }
        .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6C47FF, #4F35CC); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 20px 0; }
        .alert { padding: 14px 18px; border-radius: 10px; margin: 16px 0; font-size: 14px; font-weight: 600; }
        .alert-warning { background: #FFFBEB; border-left: 4px solid #F59E0B; color: #92400E; }
        .alert-success { background: #ECFDF5; border-left: 4px solid #10B981; color: #065F46; }
        .alert-danger  { background: #FEF2F2; border-left: 4px solid #EF4444; color: #991B1B; }
        .alert-info    { background: #EFF6FF; border-left: 4px solid #3B82F6; color: #1E40AF; }
        .divider { height: 1px; background: #F3F4F6; margin: 24px 0; }
        .footer { background: #1A1040; padding: 24px 40px; text-align: center; }
        .footer p { font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.8; }
        .footer a { color: #A78BFF; text-decoration: none; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; }
        .badge-purple { background: #EDE8FF; color: #6C47FF; }
        .badge-green  { background: #ECFDF5; color: #059669; }
        .badge-red    { background: #FEF2F2; color: #DC2626; }
        .badge-yellow { background: #FFFBEB; color: #D97706; }
        .credentials { background: #1A1040; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
        .cred-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .cred-row:last-child { border-bottom: none; }
        .cred-label { color: rgba(255,255,255,0.6); }
        .cred-value { color: #A78BFF; font-weight: 700; font-family: monospace; font-size: 15px; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="header">
        <div class="logo">Coding<span>Host</span></div>
        <div class="header-sub">Académie de programmation pour enfants et adolescents</div>
    </div>
    <div class="body">
        ${content}
    </div>
    <div class="footer">
        <p>
            <strong style="color:#fff">${SCHOOL.name}</strong><br>
            ${SCHOOL.address} · ${SCHOOL.tel}<br>
            <a href="${SCHOOL.website}">${SCHOOL.website}</a>
        </p>
        <p style="margin-top:12px">Vous recevez cet email car vous êtes inscrit à CodingHost.</p>
    </div>
</div>
</body>
</html>`;

// ════════════════════════════════════════════════════════════
// 1. EMAIL BIENVENUE + IDENTIFIANTS
// ════════════════════════════════════════════════════════════
const sendWelcomeEmail = async ({ to, parentName, studentName, login, password, groupName, courseName }) => {
    const content = `
        <div class="greeting">Bienvenue chez CodingHost ! 🎉</div>
        <p class="text">Bonjour <strong>${parentName || studentName}</strong>,</p>
        <p class="text">Nous sommes ravis d'accueillir <strong>${studentName}</strong> dans notre académie de programmation. Voici les informations de connexion à la plateforme CodingHost :</p>

        <div class="credentials">
            <div class="card-title" style="color:#A78BFF">Identifiants de connexion</div>
            <div class="cred-row">
                <span class="cred-label">🌐 Plateforme</span>
                <span class="cred-value">codinghost.fr</span>
            </div>
            <div class="cred-row">
                <span class="cred-label">👤 Login</span>
                <span class="cred-value">${login}</span>
            </div>
            <div class="cred-row">
                <span class="cred-label">🔑 Mot de passe</span>
                <span class="cred-value">${password}</span>
            </div>
        </div>

        ${groupName ? `
        <div class="card">
            <div class="card-title">Inscription</div>
            <div class="info-row"><span class="info-label">Groupe</span><span class="info-value">${groupName}</span></div>
            ${courseName ? `<div class="info-row"><span class="info-label">Cours</span><span class="info-value">${courseName}</span></div>` : ''}
        </div>` : ''}

        <div class="alert alert-info">
            💡 Conservez précieusement ces identifiants. L'élève en aura besoin pour accéder à ses cours, exercices et devoirs.
        </div>

        <a href="${SCHOOL.website}" class="btn">Accéder à la plateforme →</a>

        <div class="divider"></div>
        <p class="text" style="font-size:13px;color:#9CA3AF">En cas de problème de connexion, contactez-nous à <a href="mailto:${SCHOOL.email}">${SCHOOL.email}</a></p>
    `;

    return transporter.sendMail({
        from: `"CodingHost" <${process.env.EMAIL_USER}>`,
        to,
        subject: `🎉 Bienvenue chez CodingHost — Identifiants de connexion de ${studentName}`,
        html: baseTemplate(content, 'Bienvenue chez CodingHost'),
    });
};

// ════════════════════════════════════════════════════════════
// 2. EMAIL DEVOIR ASSIGNÉ
// ════════════════════════════════════════════════════════════
const sendHomeworkAssignedEmail = async ({ to, studentName, taskTitle, courseName, groupName, dueDate }) => {
    const content = `
        <div class="greeting">Nouveau devoir assigné 📚</div>
        <p class="text">Bonjour <strong>${studentName}</strong>,</p>
        <p class="text">Un nouveau devoir vient d'être assigné dans ta classe. Connecte-toi sur CodingHost pour le consulter et le soumettre.</p>

        <div class="card">
            <div class="card-title">Détails du devoir</div>
            <div class="info-row"><span class="info-label">📝 Devoir</span><span class="info-value">${taskTitle}</span></div>
            <div class="info-row"><span class="info-label">📚 Cours</span><span class="info-value">${courseName || '—'}</span></div>
            <div class="info-row"><span class="info-label">👥 Groupe</span><span class="info-value">${groupName || '—'}</span></div>
            ${dueDate ? `<div class="info-row"><span class="info-label">📅 Date limite</span><span class="info-value">${new Date(dueDate).toLocaleDateString('fr-FR', {day:'2-digit',month:'long',year:'numeric'})}</span></div>` : ''}
        </div>

        <div class="alert alert-warning">
            ⏰ N'oublie pas de rendre ton devoir dans les temps !
        </div>

        <a href="${SCHOOL.website}" class="btn">Voir le devoir →</a>
    `;

    return transporter.sendMail({
        from: `"CodingHost" <${process.env.EMAIL_USER}>`,
        to,
        subject: `📚 Nouveau devoir : ${taskTitle}`,
        html: baseTemplate(content, 'Nouveau devoir'),
    });
};

// ════════════════════════════════════════════════════════════
// 3. EMAIL DEVOIR CORRIGÉ + NOTE
// ════════════════════════════════════════════════════════════
const sendHomeworkCorrectedEmail = async ({ to, studentName, taskTitle, note, maxNote = 20, comment, teacherName }) => {
    const percentage = maxNote > 0 ? Math.round((note / maxNote) * 100) : 0;
    const isGood = percentage >= 60;
    const badgeClass = percentage >= 80 ? 'badge-green' : percentage >= 60 ? 'badge-yellow' : 'badge-red';

    const content = `
        <div class="greeting">Ton devoir a été corrigé ! ✅</div>
        <p class="text">Bonjour <strong>${studentName}</strong>,</p>
        <p class="text">Ton professeur ${teacherName ? `<strong>${teacherName}</strong>` : ''} vient de corriger ton devoir. Voici ton résultat :</p>

        <div class="card" style="text-align:center;padding:28px">
            <div class="card-title">Ta note</div>
            <div style="font-size:56px;font-weight:900;color:${percentage>=80?'#059669':percentage>=60?'#D97706':'#DC2626'};line-height:1">
                ${note}<span style="font-size:24px;color:#9CA3AF">/${maxNote}</span>
            </div>
            <div style="margin-top:12px">
                <span class="badge ${badgeClass}" style="font-size:14px;padding:6px 16px">${percentage}% ${percentage>=80?'🌟 Excellent !':percentage>=60?'👍 Bien !':'💪 À améliorer'}</span>
            </div>
        </div>

        <div class="card">
            <div class="card-title">Détails</div>
            <div class="info-row"><span class="info-label">📝 Devoir</span><span class="info-value">${taskTitle}</span></div>
            <div class="info-row"><span class="info-label">📊 Note</span><span class="info-value">${note}/${maxNote}</span></div>
            <div class="info-row"><span class="info-label">📈 Pourcentage</span><span class="info-value">${percentage}%</span></div>
        </div>

        ${comment ? `
        <div class="card">
            <div class="card-title">💬 Commentaire du professeur</div>
            <p style="font-size:14px;color:#374151;line-height:1.7;font-style:italic">"${comment}"</p>
        </div>` : ''}

        <div class="alert ${isGood ? 'alert-success' : 'alert-warning'}">
            ${isGood ? '🎉 Félicitations ! Continue comme ça !' : '💡 Ne te décourage pas ! Relis le cours et n\'hésite pas à poser des questions.'}
        </div>

        <a href="${SCHOOL.website}" class="btn">Voir mon devoir corrigé →</a>
    `;

    return transporter.sendMail({
        from: `"CodingHost" <${process.env.EMAIL_USER}>`,
        to,
        subject: `✅ Devoir corrigé : ${taskTitle} — Note : ${note}/${maxNote}`,
        html: baseTemplate(content, 'Devoir corrigé'),
    });
};

// ════════════════════════════════════════════════════════════
// 4. EMAIL ABSENCE
// ════════════════════════════════════════════════════════════
const sendAbsenceEmail = async ({ to, parentName, studentName, groupName, date, teacherName }) => {
    const content = `
        <div class="greeting">Absence signalée ⚠️</div>
        <p class="text">Bonjour <strong>${parentName || 'cher parent'}</strong>,</p>
        <p class="text">Nous vous informons que <strong>${studentName}</strong> a été marqué(e) <strong>absent(e)</strong> lors de la séance du :</p>

        <div class="card">
            <div class="card-title">Détails de l'absence</div>
            <div class="info-row"><span class="info-label">👤 Élève</span><span class="info-value">${studentName}</span></div>
            <div class="info-row"><span class="info-label">📅 Date</span><span class="info-value">${new Date(date).toLocaleDateString('fr-FR', {weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</span></div>
            <div class="info-row"><span class="info-label">👥 Groupe</span><span class="info-value">${groupName || '—'}</span></div>
            ${teacherName ? `<div class="info-row"><span class="info-label">👨‍🏫 Professeur</span><span class="info-value">${teacherName}</span></div>` : ''}
        </div>

        <div class="alert alert-warning">
            📌 Si cette absence est justifiée, merci de nous contacter rapidement à <a href="mailto:${SCHOOL.email}">${SCHOOL.email}</a> ou au ${SCHOOL.tel}.
        </div>

        <div class="alert alert-info">
            💻 Les cours manqués sont disponibles sur la plateforme CodingHost. L'élève peut continuer ses exercices en ligne avec son login.
        </div>

        <a href="${SCHOOL.website}" class="btn">Accéder à la plateforme →</a>
    `;

    return transporter.sendMail({
        from: `"CodingHost" <${process.env.EMAIL_USER}>`,
        to,
        subject: `⚠️ Absence signalée — ${studentName} — ${new Date(date).toLocaleDateString('fr-FR')}`,
        html: baseTemplate(content, 'Absence signalée'),
    });
};

// ════════════════════════════════════════════════════════════
// 5. EMAIL RAPPEL PAIEMENT
// ════════════════════════════════════════════════════════════
const sendPaymentReminderEmail = async ({ to, parentName, studentName, amount, dueDate, daysLate, contractNumber, penalty = 0 }) => {
    const total = amount + penalty;
    const content = `
        <div class="greeting">Rappel de paiement ⏰</div>
        <p class="text">Bonjour <strong>${parentName || 'cher parent'}</strong>,</p>
        <p class="text">Nous vous rappelons qu'un paiement pour l'inscription de <strong>${studentName}</strong> est en attente.</p>

        <div class="card">
            <div class="card-title">Détails du paiement</div>
            <div class="info-row"><span class="info-label">👤 Élève</span><span class="info-value">${studentName}</span></div>
            ${contractNumber ? `<div class="info-row"><span class="info-label">📄 Contrat</span><span class="info-value">${contractNumber}</span></div>` : ''}
            <div class="info-row"><span class="info-label">💰 Montant</span><span class="info-value">${Number(amount).toFixed(2).replace('.',',')} €</span></div>
            <div class="info-row"><span class="info-label">📅 Date d'échéance</span><span class="info-value">${new Date(dueDate).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}</span></div>
            <div class="info-row"><span class="info-label">⏱️ Retard</span><span class="info-value" style="color:#DC2626">${daysLate} jour(s)</span></div>
            ${penalty > 0 ? `<div class="info-row"><span class="info-label">⚠️ Pénalité (+5%)</span><span class="info-value" style="color:#DC2626">+ ${Number(penalty).toFixed(2).replace('.',',')} €</span></div>` : ''}
            <div class="info-row" style="background:#FEF2F2;margin:4px -4px;padding:8px 4px;border-radius:6px">
                <span class="info-label" style="font-weight:700;color:#DC2626">Total à régler</span>
                <span class="info-value" style="color:#DC2626;font-size:16px">${Number(total).toFixed(2).replace('.',',')} €</span>
            </div>
        </div>

        ${daysLate > 10 ? `
        <div class="alert alert-danger">
            ⚠️ Une pénalité de 5% a été appliquée car le paiement est en retard de plus de 10 jours.
        </div>` : `
        <div class="alert alert-warning">
            💡 Merci de régulariser votre situation dans les plus brefs délais pour éviter des frais supplémentaires.
        </div>`}

        <div class="card">
            <div class="card-title">Moyens de paiement</div>
            <div class="info-row"><span class="info-label">💳 En ligne</span><span class="info-value"><a href="https://pay.sumup.com/b2c/Q4D9OMBK" style="color:#6C47FF">Payer par carte</a></span></div>
            <div class="info-row"><span class="info-label">🏦 Virement</span><span class="info-value">FR83 3000 2070 3400 0007 2134 A14</span></div>
            <div class="info-row"><span class="info-label">📝 Communication</span><span class="info-value">${studentName}</span></div>
        </div>

        <a href="https://pay.sumup.com/b2c/Q4D9OMBK" class="btn">Payer maintenant →</a>
    `;

    return transporter.sendMail({
        from: `"CodingHost" <${process.env.EMAIL_USER}>`,
        to,
        subject: `⏰ Rappel paiement — ${studentName} — ${Number(total).toFixed(2).replace('.',',')} € — ${daysLate}j de retard`,
        html: baseTemplate(content, 'Rappel de paiement'),
    });
};

// ════════════════════════════════════════════════════════════
// 6. EMAIL NOTIFICATION GÉNÉRALE
// ════════════════════════════════════════════════════════════
const sendNotificationEmail = async ({ to, title, message, type = 'info', ctaText, ctaUrl }) => {
    const alertClass = { info:'alert-info', success:'alert-success', warning:'alert-warning', danger:'alert-danger' }[type] || 'alert-info';
    const emoji = { info:'ℹ️', success:'✅', warning:'⚠️', danger:'🚨' }[type] || 'ℹ️';

    const content = `
        <div class="greeting">${emoji} ${title}</div>
        <div class="alert ${alertClass}">
            ${message}
        </div>
        ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="btn">${ctaText} →</a>` : ''}
    `;

    return transporter.sendMail({
        from: `"CodingHost" <${process.env.EMAIL_USER}>`,
        to,
        subject: `${emoji} ${title} — CodingHost`,
        html: baseTemplate(content, title),
    });
};

// ════════════════════════════════════════════════════════════
// 7. EMAIL RÉSUMÉ HEBDOMADAIRE PARENT
// ════════════════════════════════════════════════════════════
const sendWeeklySummaryEmail = async ({ to, parentName, studentName, weekData }) => {
    const { presences = 0, absences = 0, devoirsRendus = 0, devoirsEnAttente = 0, moyenneNotes, groupName } = weekData;

    const content = `
        <div class="greeting">Résumé de la semaine 📊</div>
        <p class="text">Bonjour <strong>${parentName || 'cher parent'}</strong>,</p>
        <p class="text">Voici le résumé de la semaine de <strong>${studentName}</strong> chez CodingHost :</p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0">
            <div style="background:#ECFDF5;border-radius:12px;padding:16px;text-align:center">
                <div style="font-size:32px;font-weight:900;color:#059669">${presences}</div>
                <div style="font-size:12px;color:#065F46;font-weight:700;margin-top:4px">✅ Présences</div>
            </div>
            <div style="background:${absences>0?'#FEF2F2':'#F3F4F6'};border-radius:12px;padding:16px;text-align:center">
                <div style="font-size:32px;font-weight:900;color:${absences>0?'#DC2626':'#9CA3AF'}">${absences}</div>
                <div style="font-size:12px;color:${absences>0?'#991B1B':'#6B7280'};font-weight:700;margin-top:4px">❌ Absences</div>
            </div>
            <div style="background:#EFF6FF;border-radius:12px;padding:16px;text-align:center">
                <div style="font-size:32px;font-weight:900;color:#1D4ED8">${devoirsRendus}</div>
                <div style="font-size:12px;color:#1E40AF;font-weight:700;margin-top:4px">📝 Devoirs rendus</div>
            </div>
            <div style="background:${devoirsEnAttente>0?'#FFFBEB':'#F3F4F6'};border-radius:12px;padding:16px;text-align:center">
                <div style="font-size:32px;font-weight:900;color:${devoirsEnAttente>0?'#D97706':'#9CA3AF'}">${devoirsEnAttente}</div>
                <div style="font-size:12px;color:${devoirsEnAttente>0?'#92400E':'#6B7280'};font-weight:700;margin-top:4px">⏳ En attente</div>
            </div>
        </div>

        ${moyenneNotes !== undefined ? `
        <div class="card" style="text-align:center">
            <div class="card-title">Moyenne des notes</div>
            <div style="font-size:48px;font-weight:900;color:${moyenneNotes>=14?'#059669':moyenneNotes>=10?'#D97706':'#DC2626'}">${Number(moyenneNotes).toFixed(1)}<span style="font-size:20px;color:#9CA3AF">/20</span></div>
        </div>` : ''}

        <a href="${SCHOOL.website}" class="btn">Voir le détail sur CodingHost →</a>
    `;

    return transporter.sendMail({
        from: `"CodingHost" <${process.env.EMAIL_USER}>`,
        to,
        subject: `📊 Résumé de la semaine — ${studentName} — CodingHost`,
        html: baseTemplate(content, 'Résumé hebdomadaire'),
    });
};

// ════════════════════════════════════════════════════════════
// LOGGER — sauvegarder l'historique des emails
// ════════════════════════════════════════════════════════════
const logEmail = async (prisma, { type, to, subject, studentId = null, success, error = null }) => {
    try {
        await prisma.emailLog.create({
            data: { type, to, subject, success, error: error ? String(error) : null }
        });
    } catch (err) {
        console.error('Erreur log email:', err.message);
    }
};

// ════════════════════════════════════════════════════════════
// FONCTION UTILITAIRE — envoyer avec gestion d'erreur
// ════════════════════════════════════════════════════════════
const sendSafe = async (fn, logData, prisma) => {
    try {
        await fn();
        if (prisma && logData) await logEmail(prisma, { ...logData, success: true });
        return { success: true };
    } catch (err) {
        console.error(`❌ Email error [${logData?.type}]:`, err.message);
        if (prisma && logData) await logEmail(prisma, { ...logData, success: false, error: err.message });
        return { success: false, error: err.message };
    }
};

module.exports = {
    sendWelcomeEmail,
    sendHomeworkAssignedEmail,
    sendHomeworkCorrectedEmail,
    sendAbsenceEmail,
    sendPaymentReminderEmail,
    sendNotificationEmail,
    sendWeeklySummaryEmail,
    sendSafe,
    logEmail,
};