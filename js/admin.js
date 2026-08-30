/* ==========================================
   TENDENCIA INMOBILIARIA - ADMIN ENGINE WITH KPIS, VIEWS COUNTER & EDIT MODE
   Pure Database Integration, Search & Filter Toolbar, Automatic Watermarking & WebP Canvas Compression
   ========================================== */

import '../css/design-tokens.css';
import '../css/components.css';
import '../css/main.css';

import { PROPERTY_DATA, saveNewProperty } from './data.js';
import { BENTO_ICONS } from './bento.js';
import { initAnimatedNavbar } from './navbar.js';

// Vector Stroke SVG Icons Set (100% Emojis Free)
const SVG_ICONS = {
    eye: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; flex-shrink: 0;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 13px; height: 13px; flex-shrink: 0;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 13px; height: 13px; flex-shrink: 0;"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    lock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; flex-shrink: 0;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    save: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; flex-shrink: 0;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; flex-shrink: 0;"><polyline points="20 6 9 17 4 12"/></svg>`
};

let adminMap = null;
let adminMarker = null;
let currentHeroImageBase64 = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85";
let galleryImagesBase64 = [];
let currentUser = null;
let editingPropertyId = null;

// Silent Session Auto-Refresh Helper
async function getValidAuthToken() {
    let token = localStorage.getItem("TENDENCIA_AUTH_TOKEN");
    const refreshToken = localStorage.getItem("TENDENCIA_REFRESH_TOKEN");

    if (!token && !refreshToken) return null;

    try {
        const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            return token;
        }
    } catch (e) {
        // Continue
    }

    if (refreshToken) {
        try {
            const refRes = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken })
            });

            if (refRes.ok) {
                const refData = await refRes.json();
                localStorage.setItem("TENDENCIA_AUTH_TOKEN", refData.token);
                localStorage.setItem("TENDENCIA_REFRESH_TOKEN", refData.refreshToken);
                localStorage.setItem("TENDENCIA_AUTH_USER", JSON.stringify(refData.user));
                currentUser = refData.user;
                return refData.token;
            }
        } catch (e) {
            console.error("Error silently refreshing token:", e);
        }
    }

    return null;
}

async function initAdminPage() {
    // 1. Setup UI, Realtime Preview & KPIs IMMEDIATELY from Database
    initAnimatedNavbar();
    setupFormVisibilityControls();
    setupTableFilters();
    setupRealtimePreview();
    renderPreviewCard();
    loadPublishedPropertiesTable();
    setupFormSubmit();

    // 2. Auth Check: Protect Admin Demo Access
    const storedToken = localStorage.getItem("TENDENCIA_AUTH_TOKEN");
    if (!storedToken) {
        window.location.href = "login.html";
        return;
    }
    currentUser = JSON.parse(localStorage.getItem("TENDENCIA_AUTH_USER")) || { name: "Asesor Admin Demo", email: "admin@demoinmobiliaria.com", role: "ADMIN" };

    renderAdminHeaderProfile();
    initLeafletMapPicker();
    initDragAndDropUploaders();
    setupTypologyManager();
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initAdminPage);
} else {
    initAdminPage();
}

function renderAdminHeaderProfile() {
    const navActions = document.querySelector(".navbar .nav-actions");
    if (navActions && currentUser) {
        const logoutBtn = document.createElement("button");
        logoutBtn.className = "btn btn-outline btn-sm";
        logoutBtn.style.cssText = "color: #e11d48; border-color: rgba(225, 29, 72, 0.3); font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;";
        logoutBtn.innerHTML = `${SVG_ICONS.lock} <span>${currentUser.name} (Cerrar Sesión)</span>`;
        logoutBtn.onclick = () => {
            localStorage.removeItem("TENDENCIA_AUTH_TOKEN");
            localStorage.removeItem("TENDENCIA_REFRESH_TOKEN");
            localStorage.removeItem("TENDENCIA_AUTH_USER");
            window.location.href = "login.html";
        };
        navActions.appendChild(logoutBtn);
    }
}

// ------------------------------------------
// 0. FORM VISIBILITY CONTROLS (COLLAPSED BY DEFAULT)
// ------------------------------------------
function setupFormVisibilityControls() {
    const btnToggle = document.getElementById("btn-toggle-new-prop-form");
    const btnClose = document.getElementById("btn-close-form");
    const formWrap = document.getElementById("form-container-wrapper");

    if (btnToggle && formWrap) {
        btnToggle.addEventListener("click", () => {
            editingPropertyId = null;
            resetFormToDefault();
            
            const titleEl = document.getElementById("form-editor-title");
            if (titleEl) titleEl.textContent = "Publicar Nueva Propiedad";

            formWrap.style.display = "block";
            
            const anchor = document.getElementById("form-section-anchor");
            if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });

            if (adminMap) {
                setTimeout(() => adminMap.invalidateSize(), 200);
            }
        });
    }

    if (btnClose && formWrap) {
        btnClose.addEventListener("click", () => {
            formWrap.style.display = "none";
            editingPropertyId = null;
            resetFormToDefault();
        });
    }
}

function showFormContainer(editorTitle = "Formulario de Publicación / Edición") {
    const formWrap = document.getElementById("form-container-wrapper");
    const titleEl = document.getElementById("form-editor-title");
    if (titleEl) titleEl.textContent = editorTitle;
    if (formWrap) {
        formWrap.style.display = "block";
        const anchor = document.getElementById("form-section-anchor");
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });

        if (adminMap) {
            setTimeout(() => adminMap.invalidateSize(), 200);
        }
    }
}

// ------------------------------------------
// 1. INTERACTIVE LEAFLET MAP PICKER
// ------------------------------------------
function initLeafletMapPicker() {
    const container = document.getElementById("admin-map-picker");
    if (!container || typeof L === 'undefined') return;

    const initialCoords = [-0.1730, -78.4775];

    adminMap = L.map('admin-map-picker').setView(initialCoords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(adminMap);

    adminMarker = L.marker(initialCoords, { draggable: true }).addTo(adminMap);
    adminMarker.bindPopup("<b>Ubicación Exacta</b><br>Arrastra el marcador o haz clic en el mapa").openPopup();

    function updateCoords(lat, lng) {
        document.getElementById("prop-lat").value = parseFloat(lat).toFixed(6);
        document.getElementById("prop-lng").value = parseFloat(lng).toFixed(6);
    }

    updateCoords(initialCoords[0], initialCoords[1]);

    adminMap.on('click', (e) => {
        const { lat, lng } = e.latlng;
        adminMarker.setLatLng([lat, lng]);
        updateCoords(lat, lng);
    });

    adminMarker.on('dragend', () => {
        const { lat, lng } = adminMarker.getLatLng();
        updateCoords(lat, lng);
    });
}

function updateMapMarkerCoords(lat, lng) {
    if (adminMap && adminMarker) {
        const coords = [parseFloat(lat), parseFloat(lng)];
        adminMarker.setLatLng(coords);
        adminMap.setView(coords, 14);
        document.getElementById("prop-lat").value = coords[0].toFixed(6);
        document.getElementById("prop-lng").value = coords[1].toFixed(6);
    }
}

// ------------------------------------------
// 2. AUTOMATIC WATERMARK & WEBP CANVAS COMPRESSOR ENGINE
// ------------------------------------------
function applyWatermarkAndCompress(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Maximum HD dimension optimization
                const maxDim = 1600;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                // DRAW ELEGANT EXECUTIVE WATERMARK
                const margin = Math.round(width * 0.03);
                const boxWidth = Math.round(width * 0.32);
                const boxHeight = Math.round(height * 0.065);
                const x = width - boxWidth - margin;
                const y = height - boxHeight - margin;

                // Semi-transparent background box
                ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
                if (ctx.roundRect) {
                    ctx.beginPath();
                    ctx.roundRect(x, y, boxWidth, boxHeight, 6);
                    ctx.fill();
                } else {
                    ctx.fillRect(x, y, boxWidth, boxHeight);
                }

                // Gold border accent
                ctx.strokeStyle = "#C5A059";
                ctx.lineWidth = Math.max(2, Math.round(width * 0.002));
                ctx.strokeRect(x, y, boxWidth, boxHeight);

                // Watermark Text
                const fontSize = Math.max(13, Math.round(height * 0.026));
                ctx.fillStyle = "#FFFFFF";
                ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", Arial, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("TENDENCIA INMOBILIARIA", x + (boxWidth / 2), y + (boxHeight / 2));

                // Export compressed WebP
                const webpBase64 = canvas.toDataURL("image/webp", 0.85);
                resolve(webpBase64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function initDragAndDropUploaders() {
    const heroZone = document.getElementById("hero-dropzone");
    const heroFileInput = document.getElementById("hero-file-input");
    const heroPreviewWrap = document.getElementById("hero-preview-container");
    const heroPreviewImg = document.getElementById("hero-preview-img");
    const btnRemoveHero = document.getElementById("btn-remove-hero");

    if (heroZone && heroFileInput) {
        heroZone.addEventListener("click", () => heroFileInput.click());

        ["dragenter", "dragover"].forEach(evt => {
            heroZone.addEventListener(evt, (e) => {
                e.preventDefault();
                heroZone.classList.add("dragover");
            });
        });

        ["dragleave", "drop"].forEach(evt => {
            heroZone.addEventListener(evt, (e) => {
                e.preventDefault();
                heroZone.classList.remove("dragover");
            });
        });

        heroZone.addEventListener("drop", (e) => {
            const files = e.dataTransfer.files;
            if (files && files[0]) {
                processHeroFile(files[0]);
            }
        });

        heroFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                processHeroFile(e.target.files[0]);
            }
        });

        if (btnRemoveHero) {
            btnRemoveHero.addEventListener("click", (e) => {
                e.stopPropagation();
                currentHeroImageBase64 = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85";
                document.getElementById("prop-hero-img").value = currentHeroImageBase64;
                heroPreviewWrap.style.display = "none";
                heroZone.style.display = "flex";
                renderPreviewCard();
            });
        }
    }

    async function processHeroFile(file) {
        if (!file.type.startsWith("image/")) return;
        try {
            const watermarkedWebP = await applyWatermarkAndCompress(file);
            currentHeroImageBase64 = watermarkedWebP;
            document.getElementById("prop-hero-img").value = currentHeroImageBase64;
            heroPreviewImg.src = currentHeroImageBase64;
            heroPreviewWrap.style.display = "block";
            heroZone.style.display = "none";
            renderPreviewCard();
        } catch (e) {
            console.error("Error processing hero watermark:", e);
        }
    }

    const galleryZone = document.getElementById("gallery-dropzone");
    const galleryFileInput = document.getElementById("gallery-file-input");

    if (galleryZone && galleryFileInput) {
        galleryZone.addEventListener("click", () => galleryFileInput.click());

        ["dragenter", "dragover"].forEach(evt => {
            galleryZone.addEventListener(evt, (e) => {
                e.preventDefault();
                galleryZone.classList.add("dragover");
            });
        });

        ["dragleave", "drop"].forEach(evt => {
            galleryZone.addEventListener(evt, (e) => {
                e.preventDefault();
                galleryZone.classList.remove("dragover");
            });
        });

        galleryZone.addEventListener("drop", (e) => {
            const files = Array.from(e.dataTransfer.files);
            processGalleryFiles(files);
        });

        galleryFileInput.addEventListener("change", (e) => {
            const files = Array.from(e.target.files);
            processGalleryFiles(files);
        });
    }

    async function processGalleryFiles(files) {
        for (const file of files) {
            if (!file.type.startsWith("image/")) continue;
            try {
                const watermarkedWebP = await applyWatermarkAndCompress(file);
                galleryImagesBase64.push(watermarkedWebP);
            } catch (e) {
                console.error("Error processing gallery watermark:", e);
            }
        }
        renderGalleryPreviewGrid();
    }

    function renderGalleryPreviewGrid() {
        const grid = document.getElementById("gallery-preview-grid");
        if (!grid) return;

        grid.innerHTML = galleryImagesBase64.map((src, idx) => `
            <div style="position: relative; width: 100px; height: 70px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--color-border-light);">
                <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" onclick="window.removeGalleryImg(${idx})" style="position: absolute; top: 0.2rem; right: 0.2rem; background: rgba(15,23,42,0.85); color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 0.7rem;">✕</button>
            </div>
        `).join('');
    }

    window.removeGalleryImg = function(index) {
        galleryImagesBase64.splice(index, 1);
        renderGalleryPreviewGrid();
    };
}

// ------------------------------------------
// 3. TYPOLOGY ROW MANAGER
// ------------------------------------------
function setupTypologyManager() {
    const container = document.getElementById("typologies-container");
    const addBtn = document.getElementById("btn-add-typology");
    if (!container || !addBtn) return;

    if (!container.children.length) {
        addTypologyRow();
    }

    addBtn.addEventListener("click", () => {
        addTypologyRow();
    });
}

function addTypologyRow(model = '', area = '', beds = '', baths = '', price = '') {
    const container = document.getElementById("typologies-container");
    if (!container) return;

    const rowId = `typology-row-${Date.now()}-${Math.random()}`;
    const row = document.createElement("div");
    row.className = "typology-input-row";
    row.id = rowId;
    row.style.cssText = "display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr auto; gap: 0.5rem; align-items: center; background: var(--color-bg-subtle); padding: 0.65rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border-light);";

    row.innerHTML = `
        <input type="text" class="form-input typo-model" value="${model}" placeholder="Modelo (Ej. Villa Zen 1 Planta)" style="padding: 0.45rem 0.65rem; font-size: 0.82rem;">
        <input type="text" class="form-input typo-area" value="${area}" placeholder="Area (145 m²)" style="padding: 0.45rem 0.65rem; font-size: 0.82rem;">
        <input type="number" class="form-input typo-beds" value="${beds}" placeholder="Hab (3)" style="padding: 0.45rem 0.65rem; font-size: 0.82rem;">
        <input type="number" class="form-input typo-baths" value="${baths}" placeholder="Baños (3)" style="padding: 0.45rem 0.65rem; font-size: 0.82rem;">
        <input type="text" class="form-input typo-price" value="${price}" placeholder="Precio ($189.000)" style="padding: 0.45rem 0.65rem; font-size: 0.82rem;">
        <button type="button" class="btn btn-outline btn-sm btn-remove-typo" style="color: var(--color-terracotta); border-color: var(--color-terracotta); padding: 0.4rem 0.6rem;">✕</button>
    `;

    row.querySelector(".btn-remove-typo").addEventListener("click", () => {
        row.remove();
    });

    container.appendChild(row);
}

// ------------------------------------------
// 4. REAL-TIME LIVE PREVIEW ENGINE
// ------------------------------------------
function setupRealtimePreview() {
    const fields = [
        "prop-title", "prop-type", "prop-price", "prop-status", "prop-urgency",
        "prop-city", "prop-location", "prop-area", "prop-bedrooms", "prop-bathrooms",
        "prop-parking"
    ];

    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            ["input", "change", "keyup", "paste"].forEach(evt => {
                el.addEventListener(evt, renderPreviewCard);
            });
        }
    });

    renderPreviewCard();
}

function renderPreviewCard() {
    const previewContainer = document.getElementById("live-card-preview");
    if (!previewContainer) return;

    const titleInput = document.getElementById("prop-title")?.value;
    const title = (titleInput && titleInput.trim()) ? titleInput.trim() : "Residencia Ejemplo de Lujo";

    const type = document.getElementById("prop-type")?.value || "casa";
    
    const priceVal = document.getElementById("prop-price")?.value;
    const priceRaw = parseFloat(priceVal);
    const priceFormatted = (!isNaN(priceRaw) && priceRaw > 0) 
        ? `$${priceRaw.toLocaleString('es-EC')}` 
        : "$189.000";

    const status = document.getElementById("prop-status")?.value || "Venta Inmediata";
    const urgencyTag = document.getElementById("prop-urgency")?.value || "Última Unidad";
    
    const locInput = document.getElementById("prop-location")?.value;
    const location = (locInput && locInput.trim()) ? locInput.trim() : "Sector Interoceánica, Tumbaco, Ecuador";

    const area = document.getElementById("prop-area")?.value || "145";
    const bedrooms = document.getElementById("prop-bedrooms")?.value || "3";
    const bathrooms = document.getElementById("prop-bathrooms")?.value || "3";
    const parking = document.getElementById("prop-parking")?.value || "2";

    const imgSrc = currentHeroImageBase64 || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85";

    previewContainer.innerHTML = `
        <div class="property-card" style="box-shadow: var(--shadow-luxury);">
            <div class="property-card-img-wrap">
                <img src="${imgSrc}" alt="${title}" class="property-card-img">
                <div class="property-card-badges">
                    <span class="badge badge-navy">${status}</span>
                    <span class="badge badge-gold">${urgencyTag}</span>
                </div>
            </div>
            <div class="property-card-body">
                <div class="property-card-price-row">
                    <span class="property-card-price" style="color: var(--color-primary);">${priceFormatted}</span>
                    <span class="property-card-type" style="text-transform: uppercase;">${type}</span>
                </div>
                <h3 class="property-card-title">${title}</h3>
                <div class="property-card-location">
                    ${BENTO_ICONS.mapPin}
                    <span>${location}</span>
                </div>

                <div class="property-card-specs">
                    <div class="spec-item">${BENTO_ICONS.ruler} <span>${area} m²</span></div>
                    ${bedrooms ? `<div class="spec-item">${BENTO_ICONS.bed} <span>${bedrooms} Hab.</span></div>` : ''}
                    ${bathrooms ? `<div class="spec-item">${BENTO_ICONS.bath} <span>${bathrooms} Baños</span></div>` : ''}
                    <div class="spec-item">${BENTO_ICONS.car} <span>${parking} Park</span></div>
                </div>

                <div class="property-card-footer">
                    <button type="button" class="btn btn-primary btn-md" style="flex: 1.2;">
                        ${BENTO_ICONS.home}
                        <span>Saber Más</span>
                    </button>
                    <button type="button" class="btn btn-whatsapp btn-md" style="flex: 1;">
                        ${BENTO_ICONS.phone}
                        <span>Contactar</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ------------------------------------------
// 5. FORM SUBMIT HANDLER (ROBUST SAVE OR EDIT)
// ------------------------------------------
function setupFormSubmit() {
    const form = document.getElementById("upload-property-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("prop-title")?.value.trim() || "Nueva Propiedad Residencial";
        const type = document.getElementById("prop-type")?.value || "casa";
        
        const priceNum = parseFloat(document.getElementById("prop-price")?.value) || 189000;
        const priceFormatted = `$${priceNum.toLocaleString('es-EC')}`;
        
        const status = document.getElementById("prop-status")?.value || "Venta Inmediata";
        const urgencyTag = document.getElementById("prop-urgency")?.value || "Última Unidad";
        const city = document.getElementById("prop-city")?.value.trim() || "Quito";
        const location = document.getElementById("prop-location")?.value.trim() || "Ecuador";
        const area = parseFloat(document.getElementById("prop-area")?.value) || 145;
        const bedrooms = parseInt(document.getElementById("prop-bedrooms")?.value) || null;
        const bathrooms = parseFloat(document.getElementById("prop-bathrooms")?.value) || null;
        const parking = parseInt(document.getElementById("prop-parking")?.value) || 1;
        const description = document.getElementById("prop-description")?.value.trim() || "Exclusiva residencia de alto nivel con terminados de lujo.";

        const lat = parseFloat(document.getElementById("prop-lat")?.value) || -0.1730;
        const lng = parseFloat(document.getElementById("prop-lng")?.value) || -78.4775;
        const coordinates = [lat, lng];

        const gallery = [
            { url: currentHeroImageBase64, title: "Vista Principal" },
            ...galleryImagesBase64.map((url, idx) => ({ url, title: `Foto ${idx + 2}` }))
        ];

        const typologies = [];
        document.querySelectorAll(".typology-input-row").forEach(row => {
            const model = row.querySelector(".typo-model")?.value.trim();
            const typoArea = row.querySelector(".typo-area")?.value.trim();
            const typoBeds = parseInt(row.querySelector(".typo-beds")?.value) || 0;
            const typoBaths = parseFloat(row.querySelector(".typo-baths")?.value) || 0;
            const typoPrice = row.querySelector(".typo-price")?.value.trim();

            if (model || typoArea || typoPrice) {
                typologies.push({
                    model: model || "Modelo Estándar",
                    area: typoArea || `${area} m²`,
                    bedrooms: typoBeds,
                    bathrooms: typoBaths,
                    price: typoPrice || priceFormatted,
                    status: "Disponible"
                });
            }
        });

        const downPayment = document.getElementById("prop-downpayment")?.value.trim() || `$${(priceNum * 0.2).toLocaleString('es-EC')} (20%)`;
        const estimatedMonthly = document.getElementById("prop-monthly")?.value.trim() || `$${Math.round(priceNum * 0.006).toLocaleString('es-EC')} / mes`;
        const biessEligible = document.getElementById("prop-biess")?.value === "true";

        const amenities = [];
        document.querySelectorAll("#amenities-checkboxes input[type='checkbox']:checked").forEach(cb => {
            const [icon, label] = cb.value.split('|');
            amenities.push({ icon, label });
        });

        let id = editingPropertyId;
        if (!id) {
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            id = `${slug}-${Date.now().toString().slice(-4)}`;
        }

        const propertyPayload = {
            id,
            title,
            type,
            status,
            urgencyTag,
            price: priceNum,
            priceFormatted,
            area,
            bedrooms,
            bathrooms,
            parking,
            city,
            location,
            coordinates,
            heroImage: currentHeroImageBase64,
            description,
            financials: { downPayment, estimatedMonthly, biessEligible },
            amenities: amenities.length ? amenities : [{ icon: "home", label: "Equipamiento Completo" }],
            gallery,
            typologies: typologies.length ? typologies : [
                { model: "Unidad Estándar", area: `${area} m²`, bedrooms: bedrooms || 0, bathrooms: bathrooms || 0, price: priceFormatted, status: "Disponible" }
            ]
        };

        const token = localStorage.getItem("TENDENCIA_AUTH_TOKEN");

        try {
            const method = editingPropertyId ? "PUT" : "POST";
            const url = editingPropertyId ? `/api/properties/${editingPropertyId}` : "/api/properties";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(propertyPayload)
            });

            if (res.ok) {
                const saved = await res.json();
                editingPropertyId = null;
                resetFormToDefault();

                const formWrap = document.getElementById("form-container-wrapper");
                if (formWrap) formWrap.style.display = "none";

                showSuccessModal(saved);
                loadPublishedPropertiesTable();
                return;
            }
        } catch (e) {
            console.warn("API server call failed, using localStorage fallback:", e);
        }

        // Local Storage Fallback
        saveNewProperty(propertyPayload);
        editingPropertyId = null;
        resetFormToDefault();

        const formWrap = document.getElementById("form-container-wrapper");
        if (formWrap) formWrap.style.display = "none";

        showSuccessModal(propertyPayload);
        loadPublishedPropertiesTable();
    });
}

function resetFormToDefault() {
    const form = document.getElementById("upload-property-form");
    if (form) form.reset();

    currentHeroImageBase64 = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85";
    galleryImagesBase64 = [];
    
    document.getElementById("hero-preview-container").style.display = "none";
    document.getElementById("hero-dropzone").style.display = "flex";
    document.getElementById("gallery-preview-grid").innerHTML = "";

    const btnSubmit = form.querySelector("button[type='submit']");
    if (btnSubmit) {
        btnSubmit.innerHTML = `
            ${SVG_ICONS.save}
            <span>Publicar Propiedad en Catálogo (Guardar en SQLite)</span>
        `;
    }

    renderPreviewCard();
}

function showSuccessModal(property) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop active";
    backdrop.style.cssText = "z-index: 999999; display: flex;";

    backdrop.innerHTML = `
        <div class="modal-container" style="max-width: 580px; text-align: center; padding: 2.5rem 1.5rem;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(5, 150, 105, 0.12); color: var(--color-emerald); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                ${SVG_ICONS.check}
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 1.8rem; color: var(--color-primary); margin-bottom: 0.5rem;">¡Propiedad Procesada con Éxito!</h2>
            
            <div style="background: #FFFBEB; border: 1.5px solid var(--color-accent-gold); border-radius: var(--radius-md); padding: 0.95rem; margin: 1rem 0 1.5rem 0; text-align: left;">
                <div style="font-weight: 700; color: var(--color-primary); font-size: 0.85rem; margin-bottom: 0.25rem;">
                    Aviso Modo Demostración (Memoria Local):
                </div>
                <div style="font-size: 0.82rem; color: var(--color-text-muted); line-height: 1.5;">
                    Los cambios realizados en <strong>"${property.title}"</strong> se han guardado en la memoria local (localStorage) de tu navegador. Al ser una versión de demostración, los servicios de base de datos remota no están activos y la base de datos global no se actualizará.
                </div>
            </div>

            <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
                <a href="propiedad.html?id=${property.id}" target="_blank" class="btn btn-primary btn-md">
                    Ver Ficha Técnica Dedicada
                </a>
                <button type="button" class="btn btn-outline btn-md" onclick="this.closest('.modal-backdrop').remove()">
                    Volver al Panel
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);
}

// ------------------------------------------
// 6. EXECUTIVE KPI DASHBOARD & PROPERTIES MANAGEMENT TABLE WITH SEARCH, FILTERS & SORT
// ------------------------------------------
function setupTableFilters() {
    const searchInput = document.getElementById("admin-search-input");
    const filterType = document.getElementById("admin-filter-type");
    const filterStatus = document.getElementById("admin-filter-status");
    const sortBy = document.getElementById("admin-sort-by");

    [searchInput, filterType, filterStatus, sortBy].forEach(el => {
        if (el) {
            el.addEventListener("input", renderFilteredPropertiesTable);
            el.addEventListener("change", renderFilteredPropertiesTable);
        }
    });
}

function renderFilteredPropertiesTable() {
    const properties = window.adminLoadedProperties || PROPERTY_DATA;
    const searchVal = document.getElementById("admin-search-input")?.value.toLowerCase().trim() || "";
    const typeVal = document.getElementById("admin-filter-type")?.value || "all";
    const statusVal = document.getElementById("admin-filter-status")?.value || "all";
    const sortVal = document.getElementById("admin-sort-by")?.value || "default";

    let filtered = [...properties];

    // 1. Search Query
    if (searchVal) {
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(searchVal) ||
            p.location.toLowerCase().includes(searchVal) ||
            p.city.toLowerCase().includes(searchVal)
        );
    }

    // 2. Type Filter
    if (typeVal !== "all") {
        filtered = filtered.filter(p => p.type === typeVal);
    }

    // 3. Status Filter
    if (statusVal !== "all") {
        filtered = filtered.filter(p => p.status === statusVal);
    }

    // 4. Sorting
    if (sortVal === "views-desc") {
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortVal === "price-asc") {
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortVal === "price-desc") {
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    renderPropertiesTableRows(filtered);
}

function renderPropertiesTableRows(properties) {
    const tableBody = document.getElementById("table-body-properties");
    if (!tableBody) return;

    if (!properties.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
                    No se encontraron propiedades que coincidan con la búsqueda o filtros aplicados.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = properties.map(p => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <img src="${p.heroImage}" style="width: 48px; height: 36px; border-radius: var(--radius-sm); object-fit: cover;">
                    <div>
                        <strong>${p.title}</strong>
                        <span style="display: block; font-size: 0.75rem; color: var(--color-text-muted);">${p.location}</span>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-navy">${p.type}</span></td>
            <td><strong style="color: var(--color-primary);">${p.priceFormatted}</strong></td>
            <td>
                <span class="badge badge-gold" style="gap: 0.35rem; display: inline-flex; align-items: center;">
                    ${SVG_ICONS.eye}
                    <span>${p.views || 0} Vistas</span>
                </span>
            </td>
            <td>
                <span class="badge badge-outline" style="font-size: 0.68rem;">${p.status}</span>
            </td>
            <td>
                <div style="display: flex; gap: 0.4rem;">
                    <button type="button" class="btn btn-outline btn-sm" onclick="window.editAdminProperty('${p.id}')" style="color: var(--color-primary); border-color: var(--color-primary); display: inline-flex; align-items: center; gap: 0.3rem;">
                        ${SVG_ICONS.edit} <span>Editar</span>
                    </button>
                    <a href="propiedad.html?id=${p.id}" target="_blank" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 0.3rem;">
                        ${SVG_ICONS.eye} <span>Ver</span>
                    </a>
                    <button type="button" class="btn btn-outline btn-sm" onclick="window.deleteAdminProperty('${p.id}')" style="color: #e11d48; border-color: rgba(225,29,72,0.3); display: inline-flex; align-items: center; gap: 0.3rem;">
                        ${SVG_ICONS.trash} <span>Eliminar</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadPublishedPropertiesTable() {
    let properties = await fetchPropertiesFromApi();
    window.adminLoadedProperties = properties;

    // Calculate Realtime Portfolio KPIs
    const totalProps = properties.length;
    const totalViews = properties.reduce((acc, p) => acc + (p.views || 0), 0);
    const totalPortfolio = properties.reduce((acc, p) => acc + (p.price || 0), 0);
    const estimatedLeads = Math.round(totalViews * 0.08);

    // Update KPI Elements
    const elProps = document.getElementById("kpi-total-props");
    const elViews = document.getElementById("kpi-total-views");
    const elLeads = document.getElementById("kpi-total-leads");
    const elPortfolio = document.getElementById("kpi-total-portfolio");

    if (elProps) elProps.textContent = totalProps;
    if (elViews) elViews.textContent = totalViews.toLocaleString('es-EC');
    if (elLeads) elLeads.textContent = `~${estimatedLeads}`;
    if (elPortfolio) elPortfolio.textContent = `$${totalPortfolio.toLocaleString('es-EC')}`;

    renderFilteredPropertiesTable();
}

// EDIT PROPERTY HANDLER
window.editAdminProperty = function(id) {
    const properties = window.adminLoadedProperties || PROPERTY_DATA;
    const p = properties.find(prop => prop.id === id);
    if (!p) return;

    editingPropertyId = p.id;

    document.getElementById("prop-title").value = p.title || "";
    document.getElementById("prop-type").value = p.type || "casa";
    document.getElementById("prop-price").value = p.price || "";
    document.getElementById("prop-status").value = p.status || "Venta Inmediata";
    document.getElementById("prop-urgency").value = p.urgencyTag || "Última Unidad";
    document.getElementById("prop-city").value = p.city || "Quito";
    document.getElementById("prop-location").value = p.location || "";
    document.getElementById("prop-area").value = p.area || "";
    document.getElementById("prop-bedrooms").value = p.bedrooms || "";
    document.getElementById("prop-bathrooms").value = p.bathrooms || "";
    document.getElementById("prop-parking").value = p.parking || "1";
    document.getElementById("prop-description").value = p.description || "";

    if (p.financials) {
        document.getElementById("prop-downpayment").value = p.financials.downPayment || "";
        document.getElementById("prop-monthly").value = p.financials.estimatedMonthly || "";
        document.getElementById("prop-biess").value = p.financials.biessEligible ? "true" : "false";
    }

    if (p.heroImage) {
        currentHeroImageBase64 = p.heroImage;
        document.getElementById("prop-hero-img").value = p.heroImage;
        document.getElementById("hero-preview-img").src = p.heroImage;
        document.getElementById("hero-preview-container").style.display = "block";
        document.getElementById("hero-dropzone").style.display = "none";
    }

    if (p.coordinates && p.coordinates.length === 2) {
        updateMapMarkerCoords(p.coordinates[0], p.coordinates[1]);
    }

    const typoContainer = document.getElementById("typologies-container");
    if (typoContainer) {
        typoContainer.innerHTML = "";
        if (p.typologies && p.typologies.length) {
            p.typologies.forEach(t => {
                addTypologyRow(t.model, t.area, t.bedrooms, t.bathrooms, t.price);
            });
        } else {
            addTypologyRow();
        }
    }

    const form = document.getElementById("upload-property-form");
    const btnSubmit = form.querySelector("button[type='submit']");
    if (btnSubmit) {
        btnSubmit.innerHTML = `
            ${SVG_ICONS.save}
            <span>Guardar Cambios en la Propiedad</span>
        `;
    }

    showFormContainer(`Editando: ${p.title}`);
    renderPreviewCard();
};

window.deleteAdminProperty = async function(id) {
    if (!confirm("¿Estás seguro de eliminar esta propiedad?")) return;

    const token = await getValidAuthToken();
    try {
        const res = await fetch(`/api/properties/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            alert("Aviso Modo Demo: Propiedad eliminada. Los cambios se guardan en la memoria local (localStorage) de tu navegador. La base de datos remota no se actualizará.");
            loadPublishedPropertiesTable();
            return;
        }
    } catch (e) {
        // Fallback
    }

    deletePropertyById(id);
    alert("Aviso Modo Demo: Propiedad eliminada de la memoria local (localStorage) de tu navegador. Al ser una versión de demostración, los servicios de base de datos no están activos.");
    loadPublishedPropertiesTable();
};
