const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Générer login automatique
const genLogin = (prenom, nom) => {
    const p = prenom.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.');
    const n = nom.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.');
    return `${p}.${n}`;
};

// Générer mot de passe automatique
const genPassword = (prenom, nom) => {
    const initiales = (prenom[0] + nom[0]).toUpperCase();
    const num = Math.floor(1000 + Math.random() * 8999);
    const syms = ['!', '@', '#', '*'];
    const sym = syms[Math.floor(Math.random() * syms.length)];
    return `${initiales}${num}${sym}`;
};

// LOGIN
const login = async (req, res) => {
    const { login, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { login } });

        if (!user) {
            return res.status(400).json({ message: 'Login ou mot de passe incorrect' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ message: 'Login ou mot de passe incorrect' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, nom: user.nom, prenom: user.prenom },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                login: user.login,
                role: user.role,
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

// REGISTER (admin seulement)
const register = async (req, res) => {
    const { nom, prenom, email, role, age, parentNom, parentTel, parentEmail } = req.body;

    try {
        const login = genLogin(prenom, nom);
        const plainPassword = genPassword(prenom, nom);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const user = await prisma.user.create({
            data: {
                nom,
                prenom,
                email: email || `${login}@codinghost.dz`,
                login,
                password: hashedPassword,
                role: role || 'STUDENT',
            }
        });

        // Si c'est un étudiant, créer le profil Student
        if (role === 'STUDENT' || !role) {
            await prisma.student.create({
                data: {
                    userId: user.id,
                    age: age || null,
                    parentNom: parentNom || null,
                    parentTel: parentTel || null,
                    parentEmail: parentEmail || null,
                }
            });
        }

        res.status(201).json({
            message: 'Compte créé avec succès',
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                login: user.login,
                role: user.role,
            },
            credentials: {
                login,
                password: plainPassword,
            }
        });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ message: 'Login ou email déjà utilisé' });
        }
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

// ME (récupérer l'utilisateur connecté)
const me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, nom: true, prenom: true, email: true, login: true, role: true }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { login, register, me };