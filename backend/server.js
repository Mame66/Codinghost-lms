const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET manquant dans les variables d\'environnement. Arrêt du serveur.');
    process.exit(1);
}

const app = express();

// ── CORS : seuls les domaines autorisés peuvent appeler l'API ──
// Surcharger avec CORS_ORIGINS="https://a.fr,https://b.fr" si besoin.
const allowedOrigins = (process.env.CORS_ORIGINS ||
    'https://codinghost.fr,https://www.codinghost.fr,http://localhost:3000')
    .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        // Requêtes sans Origin (webhooks, curl, apps serveur) : autorisées
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
    },
}));
app.use(express.json({ limit: '5mb' })); // photos (base64) et imports d'élèves

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/content', require('./routes/content'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/homeworks', require('./routes/homeworks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/billing', require('./routes/billing'));

app.get('/', (req, res) => {
    res.json({ message: 'CodingHost LMS API ✅' });
});

// ── Gestion d'erreurs centralisée ──
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Données trop volumineuses' });
    }
    console.error(`❌ ${req.method} ${req.originalUrl}:`, err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Erreur serveur', error: err.message });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    });
}

module.exports = app;
