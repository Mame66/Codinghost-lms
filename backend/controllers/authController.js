const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { uniqueLogin, genPassword, placeholderEmail } = require('../lib/credentials');
const { getStudentAudience } = require('../lib/access');

const ESPACES = ['ENFANT', 'ADULTE', 'EQUIPE'];
const ESPACE_LABEL = { ENFANT: 'Enfants', ADULTE: 'Adultes' };

const publicUser = (user, audience = null) => ({
    id:        user.id,
    nom:       user.nom,
    prenom:    user.prenom,
    email:     user.email,
    login:     user.login,
    role:      user.role,
    avatarUrl: user.avatarUrl || null,
    telephone: user.telephone || null,
    audience,
});

// LOGIN
// body: { login, password, espace? }   espace = ENFANT | ADULTE | EQUIPE
const login = async (req, res) => {
    const loginVal = String(req.body.login || '').trim();
    const password = String(req.body.password || '');
    const espace   = ESPACES.includes(req.body.espace) ? req.body.espace : null;

    if (!loginVal || !password) {
        return res.status(400).json({ message: 'Login et mot de passe obligatoires' });
    }

    try {
        // Insensible à la casse : "Lucas.Martin" = "lucas.martin"
        const user = await prisma.user.findFirst({
            where: { login: { equals: loginVal, mode: 'insensitive' } },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Login ou mot de passe incorrect' });
        }
        if (user.actif === false) {
            return res.status(403).json({ message: 'Ce compte est désactivé. Contactez l\'école.' });
        }

        let audience = null;
        if (user.role === 'STUDENT') {
            audience = await getStudentAudience(user.id);

            if (espace === 'EQUIPE') {
                return res.status(403).json({
                    code: 'WRONG_SPACE',
                    message: 'Cet espace est réservé à l\'équipe pédagogique.',
                    espace: audience || 'ENFANT',
                });
            }
            if ((espace === 'ENFANT' || espace === 'ADULTE') && audience && audience !== espace) {
                return res.status(403).json({
                    code: 'WRONG_SPACE',
                    message: `Ce compte appartient à l'espace ${ESPACE_LABEL[audience]}.`,
                    espace: audience,
                });
            }
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, nom: user.nom, prenom: user.prenom },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user: publicUser(user, audience) });
    } catch (err) {
        console.error('login error:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// REGISTER (admin seulement) — conservé pour compatibilité
const register = async (req, res) => {
    const { nom, prenom, email, role, age, parentNom, parentTel, parentEmail } = req.body;
    if (!nom || !prenom) return res.status(400).json({ message: 'Nom et prénom obligatoires' });

    try {
        const loginVal = await uniqueLogin(prisma, prenom, nom);
        const plainPassword = genPassword(prenom, nom);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const isStudent = !role || role === 'STUDENT';

        const user = await prisma.user.create({
            data: {
                nom, prenom,
                email: email || placeholderEmail(loginVal),
                login: loginVal,
                password: hashedPassword,
                plainPassword: isStudent ? plainPassword : null,
                role: role || 'STUDENT',
            }
        });

        if (isStudent) {
            await prisma.student.create({
                data: {
                    userId: user.id,
                    age: age ? parseInt(age) : null,
                    parentNom: parentNom || null,
                    parentTel: parentTel || null,
                    parentEmail: parentEmail || null,
                }
            });
        }

        res.status(201).json({
            message: 'Compte créé avec succès',
            user: { id: user.id, nom: user.nom, prenom: user.prenom, login: user.login, role: user.role },
            credentials: { login: loginVal, password: plainPassword },
        });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ message: 'Login ou email déjà utilisé' });
        }
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

// ME (utilisateur connecté)
const me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
        const audience = user.role === 'STUDENT' ? await getStudentAudience(user.id) : null;
        res.json(publicUser(user, audience));
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { login, register, me, publicUser };
