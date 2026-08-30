/* ==========================================
   TENDENCIA INMOBILIARIA - EXPRESS REST API SERVER WITH RLS, EDITING & VIEWS COUNTER
   Port 3001, JWT Dual Tokens, Views Increment & SQLite DB
   ========================================== */

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
    initDatabase,
    findUserByEmail,
    findUserById,
    saveRefreshToken,
    findRefreshToken,
    deleteRefreshToken,
    getAllPropertiesFromDb,
    getPropertyByIdFromDb,
    savePropertyInDb,
    deletePropertyFromDb
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'tendencia-secret-key-2026-luxury-realestate';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'tendencia-refresh-secret-key-2026-permanent-session';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize DB
initDatabase();

// Middleware: Verify JWT Access Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado: Token de sesión no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Sesión expirada o inválida' });
        }
        req.user = user;
        next();
    });
}

// ------------------------------------------
// AUTH ROUTES
// ------------------------------------------
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }

    const user = findUserByEmail(email.toLowerCase().trim());
    if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(tokenPayload, REFRESH_SECRET, { expiresIn: '30d' });
    
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    saveRefreshToken(refreshToken, user.id, expiresAt);

    res.json({
        message: 'Inicio de sesión exitoso',
        token,
        refreshToken,
        user: tokenPayload
    });
});

app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token no proporcionado' });
    }

    const storedToken = findRefreshToken(refreshToken);
    if (!storedToken) {
        return res.status(403).json({ error: 'Refresh token no válido o revocado' });
    }

    jwt.verify(refreshToken, REFRESH_SECRET, (err, userPayload) => {
        if (err) {
            deleteRefreshToken(refreshToken);
            return res.status(403).json({ error: 'Refresh token expirado' });
        }

        const user = findUserById(userPayload.id);
        if (!user) {
            return res.status(403).json({ error: 'Usuario no encontrado' });
        }

        const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
        
        const newAccessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
        const newRefreshToken = jwt.sign(tokenPayload, REFRESH_SECRET, { expiresIn: '30d' });

        deleteRefreshToken(refreshToken);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        saveRefreshToken(newRefreshToken, user.id, expiresAt);

        res.json({
            token: newAccessToken,
            refreshToken: newRefreshToken,
            user: tokenPayload
        });
    });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = findUserById(req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user });
});

// ------------------------------------------
// PROPERTY ROUTES WITH VIEWS COUNTER & EDITING
// ------------------------------------------
app.get('/api/properties', (req, res) => {
    try {
        const properties = getAllPropertiesFromDb();
        res.json(properties);
    } catch (e) {
        res.status(500).json({ error: 'Error al consultar las propiedades' });
    }
});

app.get('/api/properties/:id', (req, res) => {
    try {
        // Increment view count when fetching single property detail
        const property = getPropertyByIdFromDb(req.params.id, true);
        if (!property) {
            return res.status(404).json({ error: 'Propiedad no encontrada' });
        }
        res.json(property);
    } catch (e) {
        res.status(500).json({ error: 'Error al consultar la propiedad' });
    }
});

app.post('/api/properties', authenticateToken, (req, res) => {
    try {
        const newProp = req.body;
        if (!newProp.title || !newProp.price || !newProp.type) {
            return res.status(400).json({ error: 'Faltan datos obligatorios de la propiedad' });
        }
        
        newProp.createdByUserId = req.user.id;
        const saved = savePropertyInDb(newProp, req.user.id);
        res.status(201).json(saved);
    } catch (e) {
        console.error("Error saving property:", e);
        res.status(500).json({ error: 'Error interno al guardar la propiedad' });
    }
});

app.put('/api/properties/:id', authenticateToken, (req, res) => {
    try {
        const propData = req.body;
        propData.id = req.params.id;

        const existing = getPropertyByIdFromDb(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Propiedad no encontrada' });
        }

        if (req.user.role !== 'admin' && existing.createdByUserId !== req.user.id) {
            return res.status(403).json({ error: 'RLS Violation: No tienes permisos para editar esta propiedad' });
        }

        const saved = savePropertyInDb(propData, req.user.id);
        res.json(saved);
    } catch (e) {
        res.status(500).json({ error: 'Error al actualizar la propiedad' });
    }
});

app.delete('/api/properties/:id', authenticateToken, (req, res) => {
    try {
        const deleted = deletePropertyFromDb(req.params.id, req.user.id, req.user.role);
        if (!deleted) {
            return res.status(404).json({ error: 'Propiedad no encontrada' });
        }
        res.json({ message: 'Propiedad eliminada con éxito' });
    } catch (e) {
        if (e.statusCode === 403) {
            return res.status(403).json({ error: e.message });
        }
        res.status(500).json({ error: 'Error al eliminar la propiedad' });
    }
});

// Start Express API Server
app.listen(PORT, () => {
    console.log(`🚀 Servidor API de Tendencia Inmobiliaria (KPIs + Views + Editing) en http://localhost:${PORT}`);
});
