/* ==========================================
   TENDENCIA INMOBILIARIA - MAIN APPLICATION ENGINE
   Plusvalía-Style Polygon Map Area Search MODAL, Filtering, Catalog Rendering & Smooth Animations
   ========================================== */

import '../css/design-tokens.css';
import '../css/components.css';
import '../css/main.css';

import { PROPERTY_DATA, fetchPropertiesFromApi } from './data.js';
import { BENTO_ICONS } from './bento.js';
import { initAnimatedNavbar } from './navbar.js';
import { openGalleryModal } from './gallery.js';

let allPropertiesStore = PROPERTY_DATA;
let polygonMap = null;
let mapPropertyMarkers = [];

// Polygon Drawing State
let isDrawingMode = false;
let drawnVertices = []; // Array of [lat, lng]
let tempVertexMarkers = [];
let drawnPolyline = null;
let drawnPolygonOverlay = null;

async function initApp() {
    if (document.body) {
        document.body.classList.add('js-active');
    }
    
    initAnimatedNavbar();
    initContactForm();
    initScrollReveal();
    initSearchForm();

    // Fetch live properties from DB or fallback
    try {
        const liveProps = await fetchPropertiesFromApi();
        if (liveProps && liveProps.length) {
            allPropertiesStore = liveProps;
        }
    } catch (e) {
        console.warn("Using local property data store");
    }

    initCatalog('todos');
    setupMapDrawModalControls();
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

// Smooth Scroll Reveal via IntersectionObserver
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });

    document.querySelectorAll(".reveal-on-scroll").forEach(el => observer.observe(el));
}

// ------------------------------------------
// 1. MAP DRAW MODAL & POLYGON SEARCH ENGINE
// ------------------------------------------
function setupMapDrawModalControls() {
    const btnOpen = document.getElementById("btn-open-map-draw-modal");
    const btnHeroOpen = document.getElementById("btn-hero-open-map-modal");
    const btnClose = document.getElementById("btn-close-map-modal");
    const btnApply = document.getElementById("btn-apply-modal-filter");
    const btnClearBadge = document.getElementById("btn-clear-drawn-badge");
    const modal = document.getElementById("map-draw-modal");

    function openModal() {
        if (!modal) return;
        modal.style.display = "flex";
        modal.classList.add("active");

        isDrawingMode = true;

        if (!polygonMap) {
            initPolygonSearchMap();
        }

        const statusText = document.getElementById("draw-status-text");
        if (statusText) {
            statusText.innerHTML = "Haz clics directamente en el mapa para delimitar los vértices de tu zona.";
        }

        setTimeout(() => {
            if (polygonMap) {
                polygonMap.invalidateSize(true);
                polygonMap.getContainer().style.cursor = "crosshair";
            }
        }, 100);

        setTimeout(() => {
            if (polygonMap) {
                polygonMap.invalidateSize(true);
            }
        }, 300);
    }

    if (btnOpen) btnOpen.addEventListener("click", openModal);
    if (btnHeroOpen) btnHeroOpen.addEventListener("click", openModal);

    if (btnClose && modal) {
        btnClose.addEventListener("click", () => {
            modal.style.display = "none";
            modal.classList.remove("active");
        });
    }

    if (btnApply && modal) {
        btnApply.addEventListener("click", () => {
            modal.style.display = "none";
            modal.classList.remove("active");

            if (drawnVertices.length >= 3) {
                const matching = allPropertiesStore.filter(p => {
                    const coords = p.coordinates || [-0.1730, -78.4775];
                    return isPointInPolygon(coords, drawnVertices);
                });

                renderCatalogCardsGrid(matching);

                const drawnBadge = document.getElementById("drawn-zone-badge");
                const drawnText = document.getElementById("drawn-zone-text");
                if (drawnBadge && drawnText) {
                    drawnText.textContent = `Zona Dibujada (${matching.length} en área)`;
                    drawnBadge.style.display = "inline-flex";
                }
            }
        });
    }

    if (btnClearBadge) {
        btnClearBadge.addEventListener("click", () => {
            clearDrawnPolygon();
            const drawnBadge = document.getElementById("drawn-zone-badge");
            if (drawnBadge) drawnBadge.style.display = "none";
            initCatalog('todos');
        });
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
                modal.classList.remove("active");
            }
        });
    }
}

function initPolygonSearchMap() {
    const mapContainer = document.getElementById("search-polygon-map");
    if (!mapContainer || typeof L === 'undefined') return;

    if (polygonMap) {
        try { polygonMap.remove(); } catch (e) {}
        polygonMap = null;
    }

    if (mapContainer._leaflet_id) {
        mapContainer._leaflet_id = null;
    }

    const defaultCenter = [-0.1730, -78.4775]; // Quito / Tumbaco Valley

    polygonMap = L.map('search-polygon-map').setView(defaultCenter, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(polygonMap);

    renderMapPropertyPins(allPropertiesStore);

    isDrawingMode = true;
    polygonMap.getContainer().style.cursor = "crosshair";
    setupPolygonDrawingEvents();
}

function renderMapPropertyPins(properties) {
    if (!polygonMap) return;

    // Clear previous markers
    mapPropertyMarkers.forEach(m => polygonMap.removeLayer(m));
    mapPropertyMarkers = [];

    properties.forEach(p => {
        const coords = p.coordinates || [-0.1730, -78.4775];
        const marker = L.marker(coords).addTo(polygonMap);

        marker.bindPopup(`
            <div style="max-width: 220px; font-family: var(--font-body);">
                <img src="${p.heroImage}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 4px; margin-bottom: 0.4rem;">
                <strong style="font-size: 0.9rem; color: var(--color-primary); display: block; line-height: 1.2;">${p.title}</strong>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block; margin-bottom: 0.4rem;">${p.location}</span>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: var(--color-primary); font-size: 0.95rem;">${p.priceFormatted}</strong>
                    <a href="propiedad.html?id=${p.id}" target="_blank" class="btn btn-primary btn-sm" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Ver Ficha</a>
                </div>
            </div>
        `);

        mapPropertyMarkers.push(marker);
    });
}

function setupPolygonDrawingEvents() {
    const btnFinish = document.getElementById("btn-finish-polygon");
    const btnClear = document.getElementById("btn-clear-drawn-area");
    const statusText = document.getElementById("draw-status-text");
    const countBadge = document.getElementById("drawn-count-badge");

    if (btnFinish) {
        btnFinish.addEventListener("click", () => {
            finishDrawingPolygon();
        });
    }

    if (btnClear) {
        btnClear.addEventListener("click", () => {
            clearDrawnPolygon();
        });
    }

    polygonMap.on('click', (e) => {
        if (!isDrawingMode) return;

        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        drawnVertices.push([lat, lng]);

        // Place small vertex marker
        const vMarker = L.circleMarker([lat, lng], {
            radius: 5,
            color: '#0F172A',
            fillColor: '#C5A059',
            fillOpacity: 1
        }).addTo(polygonMap);

        tempVertexMarkers.push(vMarker);

        if (statusText) {
            statusText.innerHTML = `<strong>Puntos marcados: ${drawnVertices.length}</strong>. Continúa haciendo clics para cerrar la zona.`;
        }

        // Render Polyline / Polygon preview
        if (drawnVertices.length >= 2) {
            if (drawnPolyline) polygonMap.removeLayer(drawnPolyline);
            drawnPolyline = L.polyline(drawnVertices, { color: '#0F172A', weight: 3, dashArray: '6, 6' }).addTo(polygonMap);
        }

        if (drawnVertices.length >= 3) {
            if (drawnPolygonOverlay) polygonMap.removeLayer(drawnPolygonOverlay);
            drawnPolygonOverlay = L.polygon(drawnVertices, {
                color: '#0F172A',
                weight: 2,
                fillColor: '#C5A059',
                fillOpacity: 0.35
            }).addTo(polygonMap);

            if (btnFinish) btnFinish.style.display = "inline-flex";

            const matchingProperties = allPropertiesStore.filter(p => {
                const coords = p.coordinates || [-0.1730, -78.4775];
                return isPointInPolygon(coords, drawnVertices);
            });

            if (countBadge) {
                countBadge.textContent = `${matchingProperties.length} propiedades encontradas en la zona`;
                countBadge.style.display = "inline-block";
            }
        }
    });

    function finishDrawingPolygon() {
        if (drawnVertices.length < 3) {
            alert("Debes hacer al menos 3 clics en el mapa para formar una zona poligonal válida.");
            return;
        }

        isDrawingMode = false;
        const mapDiv = document.getElementById("search-polygon-map");
        if (mapDiv) mapDiv.style.cursor = "";

        if (statusText) statusText.innerHTML = `<strong>Zona Cerrada:</strong> Haz clic en 'Aplicar Filtro' para ver los resultados.`;
    }

    function clearDrawnPolygonLayersOnly() {
        drawnVertices = [];
        tempVertexMarkers.forEach(m => polygonMap.removeLayer(m));
        tempVertexMarkers = [];

        if (drawnPolyline) {
            polygonMap.removeLayer(drawnPolyline);
            drawnPolyline = null;
        }
        if (drawnPolygonOverlay) {
            polygonMap.removeLayer(drawnPolygonOverlay);
            drawnPolygonOverlay = null;
        }
    }
}

function clearDrawnPolygon() {
    isDrawingMode = false;
    drawnVertices = [];
    tempVertexMarkers.forEach(m => {
        if (polygonMap) polygonMap.removeLayer(m);
    });
    tempVertexMarkers = [];

    if (polygonMap && drawnPolyline) {
        polygonMap.removeLayer(drawnPolyline);
        drawnPolyline = null;
    }
    if (polygonMap && drawnPolygonOverlay) {
        polygonMap.removeLayer(drawnPolygonOverlay);
        drawnPolygonOverlay = null;
    }

    const btnText = document.getElementById("draw-btn-text");
    if (btnText) btnText.textContent = "Empezar a Dibujar";
    
    const btnDrawToggle = document.getElementById("btn-draw-polygon-mode");
    if (btnDrawToggle) btnDrawToggle.classList.replace("btn-gold", "btn-primary");

    const btnFinish = document.getElementById("btn-finish-polygon");
    const btnClear = document.getElementById("btn-clear-drawn-area");
    const countBadge = document.getElementById("drawn-count-badge");
    const statusText = document.getElementById("draw-status-text");

    if (btnFinish) btnFinish.style.display = "none";
    if (btnClear) btnClear.style.display = "none";
    if (countBadge) countBadge.style.display = "none";

    if (statusText) statusText.innerHTML = 'Presiona <strong>"Empezar a Dibujar"</strong> y haz clics en el mapa para delimitar tu área.';

    const mapDiv = document.getElementById("search-polygon-map");
    if (mapDiv) mapDiv.style.cursor = "";
}

// Ray-Casting Algorithm for Point-in-Polygon Geofencing
function isPointInPolygon(point, polygon) {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// ------------------------------------------
// 2. CATALOG RENDERING & FILTERING
// ------------------------------------------
function initCatalog(filterType = 'todos') {
    let filtered = [...allPropertiesStore];
    if (filterType !== 'todos') {
        filtered = filtered.filter(p => p.type === filterType);
    }
    // Sort by views descending and display top 3 most viewed properties
    filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    const top3MostViewed = filtered.slice(0, 3);
    renderCatalogCardsGrid(top3MostViewed);
}

function renderCatalogCardsGrid(properties) {
    const catalogGrid = document.getElementById("property-catalog-grid");
    if (!catalogGrid) return;

    if (!properties.length) {
        catalogGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--color-text-muted);">
                <p style="font-size: 1.2rem;">No se encontraron propiedades en el área delimitada o categoría seleccionada.</p>
                <button class="btn btn-outline btn-md" style="margin-top: 1rem;" onclick="initCatalog('todos')">Ver Todo el Catálogo</button>
            </div>
        `;
        return;
    }

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem("DEMO_FAVORITES") || "[]");
    } catch(e) {
        return [];
    }
}

function isFavorite(id) {
    return getFavorites().includes(id);
}

if (typeof window !== 'undefined') {
    window.toggleFavoriteProperty = function(id, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        let favs = getFavorites();
        if (favs.includes(id)) {
            favs = favs.filter(favId => favId !== id);
        } else {
            favs.push(id);
        }
        localStorage.setItem("DEMO_FAVORITES", JSON.stringify(favs));
        if (typeof initCatalog === 'function') {
            initCatalog();
        }
    };
}

    catalogGrid.innerHTML = properties.map(property => `
        <div class="property-card reveal-on-scroll">
            <div class="property-card-img-wrap">
                <a href="propiedad.html?id=${property.id}" target="_blank">
                    <img src="${property.heroImage}" alt="${property.title}" class="property-card-img" loading="lazy">
                </a>
                <button type="button" class="btn-card-heart ${isFavorite(property.id) ? 'active' : ''}" onclick="toggleFavoriteProperty('${property.id}', event)" title="Guardar en Favoritos">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isFavorite(property.id) ? '#E11D48' : 'none'}" stroke="${isFavorite(property.id) ? '#E11D48' : '#FFFFFF'}" stroke-width="2" style="width: 18px; height: 18px;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </button>
                <div class="property-card-badges">
                    <span class="badge badge-navy">${property.status}</span>
                    <span class="badge badge-gold">${property.urgencyTag}</span>
                </div>
                <div class="watermark-overlay">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span>DEMO INMOBILIARIA</span>
                </div>
            </div>
            <div class="property-card-body">
                <div class="property-card-price-row">
                    <span class="property-card-price">${property.priceFormatted}</span>
                    <span class="property-card-type">${property.type}</span>
                </div>
                <h3 class="property-card-title">
                    <a href="propiedad.html?id=${property.id}" target="_blank" style="color: inherit; text-decoration: none;">
                        ${property.title}
                    </a>
                </h3>
                <div class="property-card-location">
                    ${BENTO_ICONS.mapPin}
                    <span>${property.location}</span>
                </div>

                <div class="property-card-specs">
                    <div class="spec-item" title="Superficie Total">
                        ${BENTO_ICONS.ruler}
                        <span>${property.area} m²</span>
                    </div>
                    ${property.bedrooms ? `
                        <div class="spec-item" title="Habitaciones">
                            ${BENTO_ICONS.bed}
                            <span>${property.bedrooms} Hab.</span>
                        </div>
                    ` : ''}
                    ${property.bathrooms ? `
                        <div class="spec-item" title="Baños">
                            ${BENTO_ICONS.bath}
                            <span>${property.bathrooms} Baños</span>
                        </div>
                    ` : ''}
                    <div class="spec-item" title="Estacionamientos">
                        ${BENTO_ICONS.car}
                        <span>${property.parking} Park</span>
                    </div>
                </div>

                <div class="property-card-footer">
                    <a href="propiedad.html?id=${property.id}" target="_blank" class="btn btn-primary btn-md" style="flex: 1;">
                        ${BENTO_ICONS.home}
                        <span>Saber Más</span>
                    </a>
                    <a href="https://wa.me/593984585530?text=Hola,%20deseo%20más%20información%20sobre:%20${encodeURIComponent(property.title)}" target="_blank" class="btn btn-whatsapp btn-md btn-contact-card" title="Contactar por WhatsApp">
                        ${BENTO_ICONS.phone}
                        <span class="contact-btn-text">Contactar</span>
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    initScrollReveal();
}

function filterCatalogCategory(category, element) {
    document.querySelectorAll('.catalog-filter-bar .filter-chip').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    initCatalog(category);
}

// Hero Search Form Logic -> Redirects seamlessly to propiedades.html catalog
function initSearchForm() {
    const searchForm = document.getElementById("hero-search-form");
    if (!searchForm) return;

    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const typeVal = document.getElementById("search-type")?.value || "";
        const maxPriceVal = document.getElementById("search-max-price")?.value || "";
        const cityVal = document.getElementById("search-city")?.value.trim() || "";

        const queryParams = new URLSearchParams();
        if (typeVal) queryParams.set("type", typeVal);
        if (maxPriceVal) queryParams.set("maxPrice", maxPriceVal);
        if (cityVal) queryParams.set("city", cityVal);

        window.location.href = `propiedades.html?${queryParams.toString()}`;
    });
}

// Appointment Contact Form
function initContactForm() {
    const form = document.getElementById("appointment-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("contact-name").value;
        const phone = document.getElementById("contact-phone").value;
        const interest = document.getElementById("contact-interest").value;

        const message = `Hola braulio estoy probando la demo de tu web de inmobiliaria!! (Cliente: ${name}, Tel: ${phone}, Interés: ${interest})`;
        window.open(`https://wa.me/593997721460?text=${encodeURIComponent(message)}`, '_blank');
    });
}

if (typeof window !== 'undefined') {
    window.filterCatalogCategory = filterCatalogCategory;
    window.initCatalog = initCatalog;
    window.openGalleryModal = openGalleryModal;
}
