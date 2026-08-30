/* ==========================================
   TENDENCIA INMOBILIARIA - DEDICATED PROPERTY ENGINE
   Plusvalía.com Benchmark Renderer, Leaflet Interactive Map & Real-time Views Counter
   ========================================== */

import '../css/design-tokens.css';
import '../css/components.css';
import '../css/main.css';

import { PROPERTY_DATA } from './data.js';
import { BENTO_ICONS } from './bento.js';
import { initAnimatedNavbar } from './navbar.js';
import { openGalleryModal } from './gallery.js';

async function initPropertyDetail() {
    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get("id") || "dept-norte-quito";

    let property = null;

    try {
        const res = await fetch(`/api/properties/${propertyId}`);
        if (res.ok) {
            property = await res.json();
        }
    } catch (e) {
        console.warn("Express API server not reachable, using static property fallback.");
    }

    if (!property) {
        property = PROPERTY_DATA.find(p => p.id === propertyId) || PROPERTY_DATA[0];
    }

    renderPropertyDetailPage(property);
    initAnimatedNavbar();
    initMortgageCalculator(property);
}

function initMortgageCalculator(property) {
    const price = property.price || 80000;
    const slider = document.getElementById("calc-downpayment-slider");
    const yearsSelect = document.getElementById("calc-years-select");
    const rateSelect = document.getElementById("calc-rate-select");

    if (!slider || !yearsSelect || !rateSelect) return;

    function calculate() {
        const downPct = parseFloat(slider.value) || 20;
        const downVal = (price * downPct) / 100;
        const loanVal = price - downVal;
        const years = parseInt(yearsSelect.value) || 20;
        const annualRate = parseFloat(rateSelect.value) || 8.45;

        const monthlyRate = (annualRate / 100) / 12;
        const totalMonths = years * 12;

        let monthlyPayment = 0;
        if (monthlyRate > 0) {
            monthlyPayment = loanVal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        } else {
            monthlyPayment = loanVal / totalMonths;
        }

        const suggestedIncome = monthlyPayment / 0.40;

        const pctBadge = document.getElementById("calc-downpayment-pct-badge");
        if (pctBadge) pctBadge.textContent = `${downPct}%`;

        const downValEl = document.getElementById("calc-downpayment-val");
        if (downValEl) downValEl.textContent = `$${Math.round(downVal).toLocaleString("es-EC")}`;

        const monthlyPaymentEl = document.getElementById("calc-monthly-payment");
        if (monthlyPaymentEl) {
            monthlyPaymentEl.innerHTML = `$${Math.round(monthlyPayment).toLocaleString("es-EC")} <span style="font-size: 0.85rem; font-weight: 500; color: rgba(255,255,255,0.7);">/ mes</span>`;
        }

        const financedValEl = document.getElementById("calc-financed-val");
        if (financedValEl) financedValEl.textContent = `$${Math.round(loanVal).toLocaleString("es-EC")}`;

        const incomeValEl = document.getElementById("calc-income-val");
        if (incomeValEl) incomeValEl.textContent = `$${Math.round(suggestedIncome).toLocaleString("es-EC")} / mes`;

        const waBtn = document.getElementById("btn-calc-whatsapp");
        if (waBtn) {
            const text = `Hola, deseo consultar pre-calificación crediticia para ${property.title}. Precio: $${price.toLocaleString("es-EC")}, Entrada: $${Math.round(downVal).toLocaleString("es-EC")} (${downPct}%), Cuota Estimada: $${Math.round(monthlyPayment)}/mes a ${years} años.`;
            waBtn.href = `https://wa.me/593984585530?text=${encodeURIComponent(text)}`;
        }
    }

    slider.addEventListener("input", calculate);
    yearsSelect.addEventListener("change", calculate);
    rateSelect.addEventListener("change", calculate);

    calculate();
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initPropertyDetail);
} else {
    initPropertyDetail();
}

function renderPropertyDetailPage(property) {
    if (!property) return;

    // Update Document Title
    document.title = `${property.title} | Tendencia Inmobiliaria`;

    // Breadcrumb
    const bcTitle = document.getElementById("breadcrumb-title");
    if (bcTitle) bcTitle.textContent = property.title;

    const svgEye = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px; height:13px;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

    // Header Container
    const headerWrap = document.getElementById("property-header-container");
    if (headerWrap) {
        headerWrap.innerHTML = `
            <div>
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; flex-wrap: wrap;">
                    <span class="badge badge-navy">${property.status}</span>
                    <span class="badge badge-gold">${property.urgencyTag}</span>
                    <span class="badge badge-outline" style="font-size: 0.72rem; display: inline-flex; align-items: center; gap: 0.3rem;">
                        ${svgEye}
                        <span>${property.views || 0} Vistas</span>
                    </span>
                </div>
                <h1 class="property-title-main" style="font-family: var(--font-heading); font-size: 2.1rem; margin-bottom: 0.4rem; color: var(--color-text-main);">${property.title}</h1>
                <p style="color: var(--color-text-muted); display: flex; align-items: center; gap: 0.4rem; font-size: 0.92rem;">
                    ${BENTO_ICONS.mapPin}
                    <span>${property.location}</span>
                </p>
            </div>
            <div style="text-align: right;" class="property-price-wrap">
                <span style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 700;">Precio de Venta</span>
                <div class="property-price-main" style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 700; color: var(--color-primary);">${property.priceFormatted}</div>
            </div>
        `;
    }

    // Photo Gallery Showcase
    const galleryWrap = document.getElementById("property-gallery-container");
    const photos = property.gallery || [];
    if (galleryWrap) {
        galleryWrap.innerHTML = `
            <div class="gallery-hero-grid">
                <div class="gallery-hero-main" onclick="openGalleryModal('${property.id}')">
                    <img src="${photos[0] ? photos[0].url : property.heroImage}" alt="${property.title}">
                    <div class="gallery-hero-overlay">
                        <span class="badge badge-gold" style="width: fit-content; margin-bottom: 0.5rem;">Vista Principal</span>
                        <h3 style="font-family: var(--font-heading); color: #fff; font-size: 1.5rem;">${property.title}</h3>
                    </div>
                </div>
                <div class="gallery-side-grid">
                    ${photos.slice(1, 4).map((p, idx) => `
                        <div class="gallery-side-item" onclick="openGalleryModal('${property.id}')">
                            <img src="${p.url}" alt="${p.title}">
                        </div>
                    `).join('')}
                    <div class="gallery-side-item" onclick="openGalleryModal('${property.id}')">
                        <img src="${photos[4] ? photos[4].url : property.heroImage}" alt="Ver todas">
                        <div class="gallery-more-badge">
                            <span>+ ${photos.length} Fotos</span>
                            <span style="font-size: 0.72rem; font-weight: 500; text-transform: uppercase;">Ver Galería HD</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Bento Horizontal Resumen Strip
    const bentoStrip = document.getElementById("property-bento-strip-container");
    if (bentoStrip) {
        bentoStrip.innerHTML = `
            <div class="bento-hero-strip">
                <div class="bento-hero-metric-card">
                    <div class="bento-hero-metric-icon">${BENTO_ICONS.ruler}</div>
                    <div>
                        <div class="bento-hero-metric-val">${property.area} m²</div>
                        <div class="bento-hero-metric-lbl">Totales</div>
                    </div>
                </div>
                ${property.bedrooms ? `
                    <div class="bento-hero-metric-card">
                        <div class="bento-hero-metric-icon">${BENTO_ICONS.bed}</div>
                        <div>
                            <div class="bento-hero-metric-val">${property.bedrooms}</div>
                            <div class="bento-hero-metric-lbl">Dormitorios</div>
                        </div>
                    </div>
                ` : ''}
                ${property.bathrooms ? `
                    <div class="bento-hero-metric-card">
                        <div class="bento-hero-metric-icon">${BENTO_ICONS.bath}</div>
                        <div>
                            <div class="bento-hero-metric-val">${property.bathrooms}</div>
                            <div class="bento-hero-metric-lbl">Baños</div>
                        </div>
                    </div>
                ` : ''}
                <div class="bento-hero-metric-card">
                    <div class="bento-hero-metric-icon">${BENTO_ICONS.car}</div>
                    <div>
                        <div class="bento-hero-metric-val">${property.parking}</div>
                        <div class="bento-hero-metric-lbl">Parqueadero</div>
                    </div>
                </div>
                <div class="bento-hero-metric-card">
                    <div class="bento-hero-metric-icon">${BENTO_ICONS.key}</div>
                    <div>
                        <div class="bento-hero-metric-val" style="font-size: 0.92rem;">${property.status}</div>
                        <div class="bento-hero-metric-lbl">Estado</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render Left Column (68% Width) - Plusvalía Benchmark Modules
    const leftColumn = document.getElementById("property-content-left");
    if (leftColumn) {
        leftColumn.innerHTML = `
            <!-- BLOQUE 1: RESUMEN EJECUTIVO -->
            <div class="bento-compact-tile">
                <div class="bento-tile-title-compact">${BENTO_ICONS.fileText} Resumen de la Propiedad</div>
                <p style="font-size: 0.92rem; color: var(--color-text-body); line-height: 1.7; word-break: break-word;">
                    ${property.description}
                </p>
            </div>

            <!-- BLOQUE 2: CARACTERÍSTICAS GENERALES & SERVICIOS -->
            <div class="bento-compact-tile">
                <div class="bento-tile-title-compact">${BENTO_ICONS.ruler} Características Generales y Servicios</div>
                <div class="plusvalia-spec-grid">
                    <div class="plusvalia-spec-item">
                        <div class="plusvalia-spec-item-icon-box">${BENTO_ICONS.building}</div>
                        <div>
                            <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Tipo de Inmueble</span>
                            <strong style="font-size: 0.88rem; color: var(--color-text-main); text-transform: capitalize;">${property.type}</strong>
                        </div>
                    </div>
                    <div class="plusvalia-spec-item">
                        <div class="plusvalia-spec-item-icon-box">${BENTO_ICONS.ruler}</div>
                        <div>
                            <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Superficie Total</span>
                            <strong style="font-size: 0.88rem; color: var(--color-text-main);">${property.area} m²</strong>
                        </div>
                    </div>
                    <div class="plusvalia-spec-item">
                        <div class="plusvalia-spec-item-icon-box">${BENTO_ICONS.bed}</div>
                        <div>
                            <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Dormitorios</span>
                            <strong style="font-size: 0.88rem; color: var(--color-text-main);">${property.bedrooms || 'N/A'}</strong>
                        </div>
                    </div>
                    <div class="plusvalia-spec-item">
                        <div class="plusvalia-spec-item-icon-box">${BENTO_ICONS.bath}</div>
                        <div>
                            <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Baños Completos</span>
                            <strong style="font-size: 0.88rem; color: var(--color-text-main);">${property.bathrooms || 'N/A'}</strong>
                        </div>
                    </div>
                    <div class="plusvalia-spec-item">
                        <div class="plusvalia-spec-item-icon-box">${BENTO_ICONS.car}</div>
                        <div>
                            <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Estacionamientos</span>
                            <strong style="font-size: 0.88rem; color: var(--color-text-main);">${property.parking} vehículo(s)</strong>
                        </div>
                    </div>
                    <div class="plusvalia-spec-item">
                        <div class="plusvalia-spec-item-icon-box">${BENTO_ICONS.shield}</div>
                        <div>
                            <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Disponibilidad</span>
                            <strong style="font-size: 0.88rem; color: var(--color-primary);">${property.status}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <!-- BLOQUE 3: TIPOLOGÍAS Y UNIDADES DISPONIBLES -->
            ${property.typologies && property.typologies.length ? `
                <div class="bento-compact-tile">
                    <div class="bento-tile-title-compact">${BENTO_ICONS.building} Modelos y Unidades Disponibles</div>
                    
                    <div class="typologies-table-desktop">
                        <div class="table-responsive-wrapper">
                            <table class="typologies-table">
                                <thead>
                                    <tr>
                                        <th>Modelo / Unidad</th>
                                        <th>Superficie</th>
                                        <th>Habitaciones</th>
                                        <th>Baños</th>
                                        <th>Precio Desde</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${property.typologies.map(t => `
                                        <tr>
                                            <td><strong>${t.model}</strong></td>
                                            <td>${t.area}</td>
                                            <td>${t.bedrooms}</td>
                                            <td>${t.bathrooms}</td>
                                            <td><strong style="color: var(--color-primary);">${t.price}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="typologies-cards-mobile">
                        ${property.typologies.map(t => `
                            <div class="typology-mobile-card">
                                <div class="typology-mobile-header">
                                    <span class="typology-mobile-name">${t.model}</span>
                                </div>
                                <div class="typology-mobile-grid">
                                    <div class="typology-mobile-row">
                                        <span class="typology-mobile-lbl">Superficie Total</span>
                                        <strong class="typology-mobile-val">${t.area}</strong>
                                    </div>
                                    <div class="typology-mobile-row">
                                        <span class="typology-mobile-lbl">Habitaciones</span>
                                        <strong class="typology-mobile-val">${t.bedrooms} Hab</strong>
                                    </div>
                                    <div class="typology-mobile-row">
                                        <span class="typology-mobile-lbl">Baños Completos</span>
                                        <strong class="typology-mobile-val">${t.bathrooms} Baños</strong>
                                    </div>
                                    <div class="typology-mobile-row">
                                        <span class="typology-mobile-lbl">Precio Desde</span>
                                        <strong class="typology-mobile-val" style="color: var(--color-primary); font-size: 0.95rem;">${t.price}</strong>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- BLOQUE 4: CALCULADORA INTERACTIVA DE CRÉDITO HIPOTECARIO (BIESS / BANCOS) -->
            <div class="bento-compact-tile" id="mortgage-calculator-tile" style="background: var(--color-surface-white); border: 1.5px solid var(--color-border-gold);">
                <div class="bento-tile-title-compact" style="color: var(--color-primary); justify-content: space-between;">
                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                        ${BENTO_ICONS.dollar} Calculadora de Crédito Hipotecario
                    </span>
                    <span class="badge badge-gold" style="font-size: 0.72rem;">BIESS & Bancos</span>
                </div>

                <p style="font-size: 0.84rem; color: var(--color-text-muted); margin-bottom: 1.25rem;">
                    Simula la cuota mensual para la compra de <strong>${property.title}</strong> ajustando la entrada inicial, tasa y plazo.
                </p>

                <!-- Calculator Form Controls -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
                    
                    <!-- Entrada Inicial Slider -->
                    <div style="background: var(--color-bg-subtle); padding: 0.95rem; border-radius: var(--radius-md); border: 1px solid var(--color-border-light);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-main);">Entrada Inicial</label>
                            <span id="calc-downpayment-pct-badge" style="font-size: 0.82rem; font-weight: 800; color: var(--color-accent-gold);">20%</span>
                        </div>
                        <input type="range" id="calc-downpayment-slider" min="10" max="50" step="5" value="20" style="width: 100%; accent-color: var(--color-accent-gold); cursor: pointer;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--color-text-muted); margin-top: 0.35rem;">
                            <span>Mín: 10%</span>
                            <strong id="calc-downpayment-val" style="color: var(--color-primary);">$16.000</strong>
                            <span>Máx: 50%</span>
                        </div>
                    </div>

                    <!-- Plazo (Años) -->
                    <div style="background: var(--color-bg-subtle); padding: 0.95rem; border-radius: var(--radius-md); border: 1px solid var(--color-border-light);">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-main); display: block; margin-bottom: 0.5rem;">Plazo del Crédito</label>
                        <select id="calc-years-select" class="form-select" style="padding: 0.45rem 0.65rem; font-size: 0.85rem; width: 100%;">
                            <option value="10">10 Años (120 meses)</option>
                            <option value="15">15 Años (180 meses)</option>
                            <option value="20" selected>20 Años (240 meses - Estándar)</option>
                            <option value="25">25 Años (300 meses - BIESS)</option>
                        </select>
                    </div>

                    <!-- Tasa de Interés (%) -->
                    <div style="background: var(--color-bg-subtle); padding: 0.95rem; border-radius: var(--radius-md); border: 1px solid var(--color-border-light);">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-main); display: block; margin-bottom: 0.5rem;">Tipo de Institución / Tasa</label>
                        <select id="calc-rate-select" class="form-select" style="padding: 0.45rem 0.65rem; font-size: 0.85rem; width: 100%;">
                            <option value="5.99">5.99% - BIESS (Vivienda VIP)</option>
                            <option value="8.45" selected>8.45% - Banco Privado Estándar</option>
                            <option value="9.50">9.50% - Hipotecario Directo</option>
                        </select>
                    </div>

                </div>

                <!-- Recalculated Output Box -->
                <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #FFFFFF; padding: 1.25rem; border-radius: var(--radius-lg); box-shadow: 0 8px 24px rgba(15,23,42,0.18); display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; align-items: center;">
                    <div>
                        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--color-accent-gold); font-weight: 700;">Cuota Mensual Estimada</span>
                        <div id="calc-monthly-payment" style="font-size: 1.8rem; font-weight: 800; color: #FFFFFF; font-family: var(--font-heading); margin-top: 0.1rem;">
                            $492.35 <span style="font-size: 0.85rem; font-weight: 500; color: rgba(255,255,255,0.7);">/ mes</span>
                        </div>
                    </div>
                    <div>
                        <span style="font-size: 0.72rem; color: rgba(255,255,255,0.7); display: block;">Monto a Financiar:</span>
                        <strong id="calc-financed-val" style="font-size: 0.95rem; color: #FFFFFF;">$64.000</strong>
                        <span style="font-size: 0.72rem; color: rgba(255,255,255,0.7); display: block; margin-top: 0.35rem;">Ingreso Familiar Sugerido:</span>
                        <strong id="calc-income-val" style="font-size: 0.88rem; color: var(--color-accent-gold);">$1.230 / mes</strong>
                    </div>
                    <div style="display: flex; justify-content: flex-end;">
                        <a id="btn-calc-whatsapp" href="#" target="_blank" class="btn btn-whatsapp btn-sm" style="width: 100%; text-align: center; justify-content: center;">
                            ${BENTO_ICONS.phone}
                            <span>Pre-Calificar por WhatsApp</span>
                        </a>
                    </div>
                </div>
            </div>

            <!-- BLOQUE 5: EQUIPAMIENTO & AMENIDADES -->
            <div class="bento-compact-tile">
                <div class="bento-tile-title-compact">${BENTO_ICONS.checkCircle} Equipamiento y Amenidades Incluidas</div>
                <div class="bento-amenity-matrix">
                    ${property.amenities.map(a => `
                        <div class="bento-amenity-chip">
                            ${BENTO_ICONS[a.icon] || BENTO_ICONS.checkCircle}
                            <span>${a.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- BLOQUE 6: MAPA DE UBICACIÓN INTERACTIVO & RADAR DE SERVICIOS CERCANOS -->
            <div class="bento-compact-tile">
                <div class="bento-tile-title-compact">${BENTO_ICONS.mapPin} Ubicación Exacta y Radar de Entorno</div>
                
                <!-- Radar POI Chips Bar -->
                <div class="poi-chips-bar" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; width: 100%; margin-bottom: 0.2rem;">
                        📍 Servicios y Puntos de Interés Cercanos:
                    </span>
                    <span class="badge badge-navy" style="font-size: 0.76rem;">🏫 Unidades Educativas (3 min)</span>
                    <span class="badge badge-gold" style="font-size: 0.76rem;">🛒 Supermercados & Malls (5 min)</span>
                    <span class="badge badge-navy" style="font-size: 0.76rem;">🌳 Parques Recreativos (4 min)</span>
                    <span class="badge badge-gold" style="font-size: 0.76rem;">🏥 Centros de Salud (8 min)</span>
                </div>

                <div id="property-detail-map" style="height: 360px; border-radius: var(--radius-lg); border: 1px solid var(--color-border-light); z-index: 1;"></div>
            </div>
        `;

        // Initialize Map for Property Coordinates & POI Radar
        if (typeof L !== 'undefined' && property.coordinates) {
            setTimeout(() => {
                const mapContainer = document.getElementById('property-detail-map');
                if (mapContainer) {
                    const map = L.map('property-detail-map').setView(property.coordinates, 15);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap'
                    }).addTo(map);

                    // Property Main Marker
                    L.marker(property.coordinates).addTo(map)
                        .bindPopup(`<b>${property.title}</b><br>${property.location}`)
                        .openPopup();

                    // POI Radar Markers
                    const c = property.coordinates;
                    const poiList = [
                        { name: "Colegio / Unidad Educativa", type: "🏫", coords: [c[0] + 0.0025, c[1] + 0.003] },
                        { name: "Supermercado & Centro Comercial", type: "🛒", coords: [c[0] - 0.003, c[1] + 0.0025] },
                        { name: "Parque Recreativo", type: "🌳", coords: [c[0] + 0.003, c[1] - 0.002] },
                        { name: "Hospital / Clínica de Salud", type: "🏥", coords: [c[0] - 0.0025, c[1] - 0.0035] }
                    ];

                    poiList.forEach(poi => {
                        L.marker(poi.coords).addTo(map)
                            .bindPopup(`<b>${poi.type} ${poi.name}</b><br>Punto de interés cercano`);
                    });
                }
            }, 100);
        }
    }

    // Render Right Column (32% Width) - Sticky Lead Capture Card & PDF Download
    const rightColumn = document.getElementById("property-content-right");
    if (rightColumn) {
        rightColumn.innerHTML = `
            <div style="position: sticky; top: 90px; display: flex; flex-direction: column; gap: 1rem;">
                <div class="contact-info-card" style="box-shadow: var(--shadow-luxury);">
                    <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem;">
                        <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80" alt="Asesor VIP" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-primary);">
                        <div>
                            <h4 style="font-size: 1rem; color: var(--color-primary); font-family: var(--font-heading);">Asesor Inmobiliario VIP</h4>
                            <span style="font-size: 0.78rem; color: var(--color-emerald); font-weight: 600;">● En línea para atención inmediata</span>
                        </div>
                    </div>

                    <form id="lead-capture-form" onsubmit="event.preventDefault(); alert('¡Solicitud enviada! Un asesor VIP se contactará contigo por WhatsApp.');">
                        <div class="form-group">
                            <label class="form-label">Nombre Completo *</label>
                            <input type="text" class="form-input" placeholder="Ej. Carlos Mendoza" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Teléfono / WhatsApp *</label>
                            <input type="tel" class="form-input" placeholder="Ej. 0984585530" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mensaje</label>
                            <textarea class="form-input" rows="3">Hola, me interesa recibir más información sobre "${property.title}" (${property.priceFormatted}).</textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-md btn-full" style="margin-bottom: 0.5rem;">
                            <span>Solicitar Información VIP</span>
                        </button>
                        <a href="https://wa.me/593984585530?text=Hola,%20deseo%20consultar%20sobre%20${encodeURIComponent(property.title)}" target="_blank" class="btn btn-emerald btn-whatsapp btn-md btn-full" style="margin-bottom: 0.5rem;">
                            ${BENTO_ICONS.phone}
                            <span>Contactar por WhatsApp</span>
                        </a>
                        <button type="button" class="btn btn-outline btn-md btn-full" onclick="window.print()" style="border-color: var(--color-primary); color: var(--color-primary);" title="Descargar Dossier PDF de la Propiedad">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            <span>Descargar Brochure PDF</span>
                        </button>
                    </form>
                </div>
            </div>
        `;
    }
}
