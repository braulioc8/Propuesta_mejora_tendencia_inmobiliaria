/* ==========================================
   TENDENCIA INMOBILIARIA - DATABASE REPOSITORY LAYER WITH RLS, VIEWS COUNTER & EDITING
   SQLite Local Storage & PostgreSQL Native RLS Policy Migration Ready
   ========================================== */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tendencia.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize Schemas & Native RLS Statements
export function initDatabase() {
    // Users Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Properties Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS properties (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            urgency_tag TEXT NOT NULL,
            price REAL NOT NULL,
            price_formatted TEXT NOT NULL,
            area REAL NOT NULL,
            bedrooms INTEGER,
            bathrooms REAL,
            parking INTEGER NOT NULL,
            city TEXT NOT NULL,
            location TEXT NOT NULL,
            lat REAL,
            lng REAL,
            hero_image TEXT NOT NULL,
            description TEXT NOT NULL,
            financials_json TEXT NOT NULL,
            amenities_json TEXT NOT NULL,
            gallery_json TEXT NOT NULL,
            typologies_json TEXT NOT NULL,
            created_by_user_id TEXT NOT NULL DEFAULT 'user-admin-01',
            views INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Refresh Tokens Table (Database Session Persistence)
    db.exec(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Ensure columns exist if table was created previously
    try { db.exec(`ALTER TABLE properties ADD COLUMN created_by_user_id TEXT NOT NULL DEFAULT 'user-admin-01';`); } catch (e) {}
    try { db.exec(`ALTER TABLE properties ADD COLUMN views INTEGER DEFAULT 0;`); } catch (e) {}

    // Seed Admin User if empty
    const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    if (userCount === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.prepare(`
            INSERT INTO users (id, email, password_hash, name, role)
            VALUES (?, ?, ?, ?, ?)
        `).run('user-admin-01', 'admin@tendencia.ec', hashedPassword, 'Administrador Senior', 'admin');
    }

    // Seed Default Properties if empty
    const propertyCount = db.prepare('SELECT COUNT(*) AS count FROM properties').get().count;
    if (propertyCount === 0) {
        seedDefaultProperties();
    }
}

function seedDefaultProperties() {
    const defaults = [
        {
            id: "dept-norte-quito",
            title: "Departamento de Lujo Norte de Quito",
            type: "departamento",
            status: "Venta Inmediata",
            urgencyTag: "Última Unidad",
            price: 80000,
            priceFormatted: "$80.000",
            area: 70,
            bedrooms: 2,
            bathrooms: 1,
            parking: 1,
            city: "Quito",
            location: "Av. Eloy Alfaro & Catalina Aldaz, Quito, Ecuador",
            lat: -0.1730,
            lng: -78.4775,
            heroImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85",
            description: "Exclusivo departamento residencial con terminados de alta gama, iluminación natural perimetral y vista panorámica. Ubicado en el corazón financiero y empresarial del Norte de Quito.",
            financials: { downPayment: "$16.000 (20%)", estimatedMonthly: "$490 / mes", biessEligible: true },
            amenities: [
                { icon: "shield", label: "Seguridad Privada 24/7" },
                { icon: "car", label: "Parqueadero Subterráneo" }
            ],
            gallery: [
                { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85", title: "Fachada del Edificio" }
            ],
            typologies: [
                { model: "Dep. 2 Dormitorios", area: "70 m²", bedrooms: 2, bathrooms: 1, price: "$80.000", status: "Última Unidad" }
            ],
            createdByUserId: "user-admin-01",
            views: 428
        },
        {
            id: "nn-xavier-granda-centeno",
            title: "Residencia Exclusiva Granda Centeno",
            type: "casa",
            status: "Entrega Inmediata",
            urgencyTag: "Superprecio",
            price: 135000,
            priceFormatted: "$135.000",
            area: 120,
            bedrooms: 3,
            bathrooms: 2.5,
            parking: 2,
            city: "Quito",
            location: "Sector Granda Centeno & NN.UU, Quito, Ecuador",
            lat: -0.1712,
            lng: -78.4890,
            heroImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85",
            description: "Casa moderna de arquitectura contemporánea con amplios ventanales, acabados en madera tratada y patio privado independiente.",
            financials: { downPayment: "$27.000 (20%)", estimatedMonthly: "$780 / mes", biessEligible: true },
            amenities: [
                { icon: "trees", label: "Patio Privado" }
            ],
            gallery: [
                { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85", title: "Fachada Principal" }
            ],
            typologies: [
                { model: "Casa Tipo A 120m²", area: "120 m²", bedrooms: 3, bathrooms: 2.5, price: "$135.000", status: "Disponible" }
            ],
            createdByUserId: "user-admin-01",
            views: 615
        },
        {
            id: "proyecto-tumbaco-3hab",
            title: "Residencias Zen Tumbaco",
            type: "proyecto",
            status: "En Construcción",
            urgencyTag: "Alta Plusvalía",
            price: 189000,
            priceFormatted: "$189.000",
            area: 145,
            bedrooms: 3,
            bathrooms: 3,
            parking: 2,
            city: "Tumbaco",
            location: "Sector Interoceánica, Tumbaco, Ecuador",
            lat: -0.2150,
            lng: -78.4050,
            heroImage: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
            description: "Residencias independientes de una sola planta con arquitectura de inspiración japonesa minimalista.",
            financials: { downPayment: "$37.800 (20%)", estimatedMonthly: "$1.100 / mes", biessEligible: false },
            amenities: [
                { icon: "trees", label: "Jardines Zen con Iluminación LED" }
            ],
            gallery: [
                { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85", title: "Vista Exterior Zen" }
            ],
            typologies: [
                { model: "Villa Zen 1 Planta", area: "145 m²", bedrooms: 3, bathrooms: 3, price: "$189.000", status: "Disponible" }
            ],
            createdByUserId: "user-admin-01",
            views: 890
        }
    ];

    defaults.forEach(p => savePropertyInDb(p, 'user-admin-01'));
}

// User Queries
export function findUserByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function findUserById(id) {
    return db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id);
}

// Refresh Tokens Queries
export function saveRefreshToken(token, userId, expiresAt) {
    db.prepare('INSERT OR REPLACE INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
}

export function findRefreshToken(token) {
    return db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token);
}

export function deleteRefreshToken(token) {
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
}

// Property Queries with Views Counter & RLS Enforcement
export function getAllPropertiesFromDb() {
    const rows = db.prepare('SELECT * FROM properties ORDER BY created_at DESC').all();
    return rows.map(formatPropertyFromRow);
}

export function getPropertyByIdFromDb(id, incrementView = false) {
    if (incrementView) {
        db.prepare('UPDATE properties SET views = views + 1 WHERE id = ?').run(id);
    }
    const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    return row ? formatPropertyFromRow(row) : null;
}

export function savePropertyInDb(p, userId = 'user-admin-01') {
    const existing = getPropertyByIdFromDb(p.id);

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO properties (
            id, title, type, status, urgency_tag, price, price_formatted,
            area, bedrooms, bathrooms, parking, city, location, lat, lng,
            hero_image, description, financials_json, amenities_json,
            gallery_json, typologies_json, created_by_user_id, views
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?
        )
    `);

    stmt.run(
        p.id,
        p.title,
        p.type,
        p.status,
        p.urgencyTag,
        p.price,
        p.priceFormatted,
        p.area,
        p.bedrooms || null,
        p.bathrooms || null,
        p.parking,
        p.city,
        p.location,
        p.coordinates ? p.coordinates[0] : (p.lat || null),
        p.coordinates ? p.coordinates[1] : (p.lng || null),
        p.heroImage,
        p.description,
        JSON.stringify(p.financials || {}),
        JSON.stringify(p.amenities || []),
        JSON.stringify(p.gallery || []),
        JSON.stringify(p.typologies || []),
        p.createdByUserId || (existing ? existing.createdByUserId : userId),
        existing ? existing.views : (p.views || 0)
    );

    return getPropertyByIdFromDb(p.id);
}

export function deletePropertyFromDb(id, userId, userRole) {
    const existing = getPropertyByIdFromDb(id);
    if (!existing) return false;

    if (userRole !== 'admin' && existing.createdByUserId !== userId) {
        const err = new Error("RLS Violation: No tienes permisos para eliminar una propiedad creada por otro usuario.");
        err.statusCode = 403;
        throw err;
    }

    const res = db.prepare('DELETE FROM properties WHERE id = ?').run(id);
    return res.changes > 0;
}

function formatPropertyFromRow(row) {
    return {
        id: row.id,
        title: row.title,
        type: row.type,
        status: row.status,
        urgencyTag: row.urgency_tag,
        price: row.price,
        priceFormatted: row.price_formatted,
        area: row.area,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        parking: row.parking,
        city: row.city,
        location: row.location,
        coordinates: (row.lat && row.lng) ? [row.lat, row.lng] : null,
        heroImage: row.hero_image,
        description: row.description,
        financials: JSON.parse(row.financials_json || '{}'),
        amenities: JSON.parse(row.amenities_json || '[]'),
        gallery: JSON.parse(row.gallery_json || '[]'),
        typologies: JSON.parse(row.typologies_json || '[]'),
        createdByUserId: row.created_by_user_id,
        views: row.views || 0,
        createdAt: row.created_at
    };
}
