/* ==========================================
   TENDENCIA INMOBILIARIA - FULL PROPERTIES CATALOG ENGINE
   Advanced Min/Max Price, Bedrooms, Bathrooms, Type, Sorting & Polygon Geofence Filters
   ========================================== */

import '../css/design-tokens.css';
import '../css/components.css';
import '../css/main.css';

import { PROPERTY_DATA, fetchPropertiesFromApi } from './data.js';
import { BENTO_ICONS } from './bento.js';
import { initAnimatedNavbar } from './navbar.js';

let allCatalogProperties = PROPERTY_DATA;
let polygonMap = null;
let mapPropertyMarkers = [];

// Polygon Drawing State
let isDrawingMode = false;
let drawnVertices = [];
let tempVertexMarkers = [];
let drawnPolyline = null;
let drawnPolygonOverlay = null;
let isFavoritesOnlyFilter = false;
let activeDrawnPolygonFilter = null; // Stored array of [lat, lng]

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
    updateFavoritesBadgeCount();
    renderFilteredCatalog();
};

function updateFavoritesBadgeCount() {
    const badge = document.getElementById("fav-count-num");
    if (badge) {
        badge.textContent = getFavorites().length;
    }
}

async function initPropertiesPage() {
    initAnimatedNavbar();

    // Fetch live properties from DB or fallback
    try {
        const liveProps = await fetchPropertiesFromApi();
        if (liveProps && liveProps.length) {
            allCatalogProperties = liveProps;
        }
    } catch (e) {
        console.warn("Using local property data store");
    }

    parseUrlQueryParamsAndLocalStorage();
    setupFilterListeners();
    setupMapDrawModalControls();
    updateFavoritesBadgeCount();
    renderFilteredCatalog();
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initPropertiesPage);
} else {
    initPropertiesPage();
}

function parseUrlQueryParamsAndLocalStorage() {
    const urlParams = new URLSearchParams(window.location.search);

    const typeParam = urlParams.get('type');
    const maxPriceParam = urlParams.get('maxPrice');
    const cityParam = urlParams.get('city');

    if (typeParam) {
        const el = document.getElementById("filter-type");
        if (el) el.value = typeParam;
    }
    if (maxPriceParam) {
        const el = document.getElementById("filter-max-price");
        if (el) el.value = maxPriceParam;
    }
    if (cityParam) {
        const el = document.getElementById("filter-keyword");
        if (el) el.value = cityParam;
    }

    // Check if drawn polygon was passed in localStorage
    const savedPolygon = localStorage.getItem("TENDENCIA_DRAWN_POLYGON");
    if (savedPolygon) {
        try {
            activeDrawnPolygonFilter = JSON.parse(savedPolygon);
            const badge = document.getElementById("drawn-zone-badge");
            if (badge) badge.style.display = "inline-flex";
        } catch (e) {}
    }
}

function setupFilterListeners() {
    const inputs = [
        "filter-keyword", "filter-type", "filter-min-price", "filter-max-price",
        "filter-bedrooms", "filter-bathrooms", "filter-sort-by"
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", renderFilteredCatalog);
            el.addEventListener("change", renderFilteredCatalog);
        }
    });

    const btnFavorites = document.getElementById("btn-toggle-favorites");
    if (btnFavorites) {
        btnFavorites.addEventListener("click", () => {
            isFavoritesOnlyFilter = !isFavoritesOnlyFilter;
            btnFavorites.style.background = isFavoritesOnlyFilter ? "var(--color-primary)" : "";
            btnFavorites.style.color = isFavoritesOnlyFilter ? "#FFFFFF" : "";
            renderFilteredCatalog();
        });
    }

    const btnReset = document.getElementById("btn-reset-filters");
    if (btnReset) {
        btnReset.addEventListener("click", () => {
            inputs.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    if (el.tagName === "SELECT") el.value = el.options[0].value;
                    else el.value = "";
                }
            });
            isFavoritesOnlyFilter = false;
            if (btnFavorites) {
                btnFavorites.style.background = "";
                btnFavorites.style.color = "";
            }
            activeDrawnPolygonFilter = null;
            localStorage.removeItem("TENDENCIA_DRAWN_POLYGON");
            const badge = document.getElementById("drawn-zone-badge");
            if (badge) badge.style.display = "none";
            renderFilteredCatalog();
        });
    }

    const btnClearBadge = document.getElementById("btn-clear-drawn-badge");
    if (btnClearBadge) {
        btnClearBadge.addEventListener("click", () => {
            activeDrawnPolygonFilter = null;
            localStorage.removeItem("TENDENCIA_DRAWN_POLYGON");
            const badge = document.getElementById("drawn-zone-badge");
            if (badge) badge.style.display = "none";
            renderFilteredCatalog();
        });
    }
}

function renderFilteredCatalog() {
    let properties = [...allCatalogProperties];

    const keyword = document.getElementById("filter-keyword")?.value.toLowerCase().trim() || "";
    const type = document.getElementById("filter-type")?.value || "all";
    const minPrice = parseFloat(document.getElementById("filter-min-price")?.value) || 0;
    const maxPrice = parseFloat(document.getElementById("filter-max-price")?.value) || Infinity;
    const minBeds = document.getElementById("filter-bedrooms")?.value || "all";
    const minBaths = document.getElementById("filter-bathrooms")?.value || "all";
    const sortBy = document.getElementById("filter-sort-by")?.value || "default";

    // Favorites Filter
    if (isFavoritesOnlyFilter) {
        properties = properties.filter(p => isFavorite(p.id));
    }

    // 1. Keyword / City / Location Filter
    if (keyword) {
        properties = properties.filter(p =>
            p.title.toLowerCase().includes(keyword) ||
            p.location.toLowerCase().includes(keyword) ||
            p.city.toLowerCase().includes(keyword) ||
            p.description.toLowerCase().includes(keyword)
        );
    }

    // 2. Property Type Filter
    if (type !== "all") {
        properties = properties.filter(p => p.type === type);
    }

    // 3. Min & Max Price Range Filter
    properties = properties.filter(p => (p.price || 0) >= minPrice && (p.price || 0) <= maxPrice);

    // 4. Bedrooms Filter
    if (minBeds !== "all") {
        const bedsNum = parseInt(minBeds);
        properties = properties.filter(p => (p.bedrooms || 0) >= bedsNum);
    }

    // 5. Bathrooms Filter
    if (minBaths !== "all") {
        const bathsNum = parseFloat(minBaths);
        properties = properties.filter(p => (p.bathrooms || 0) >= bathsNum);
    }

    // 6. Polygon Map Area Geofencing Filter
    if (activeDrawnPolygonFilter && activeDrawnPolygonFilter.length >= 3) {
        properties = properties.filter(p => {
            const coords = p.coordinates || [-0.1730, -78.4775];
            return isPointInPolygon(coords, activeDrawnPolygonFilter);
        });
    }

    // 7. Sorting
    if (sortBy === "price-asc") {
        properties.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-desc") {
        properties.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "views-desc") {
        properties.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    const grid = document.getElementById("catalog-grid") || document.getElementById("all-properties-grid");
    const countBadge = document.getElementById("catalog-count") || document.getElementById("results-count-text");

    if (countBadge) {
        countBadge.textContent = `${properties.length} Propiedad${properties.length !== 1 ? 'es' : ''} Encontrada${properties.length !== 1 ? 's' : ''}`;
    }

    if (!grid) return;

    if (!properties.length) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--color-surface-white); border-radius: var(--radius-lg); border: 1px solid var(--color-border-light);">
                <h3 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--color-primary); margin-bottom: 0.5rem;">No encontramos propiedades con los filtros seleccionados</h3>
                <p style="color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">Intenta ampliar el rango de presupuesto o limpiar los filtros activos.</p>
                <button type="button" class="btn btn-primary btn-md" onclick="document.getElementById('btn-reset-filters').click()">Limpiar Todos los Filtros</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = properties.map(p => `
        <div class="property-card">
            <div class="property-card-img-wrap">
                <a href="propiedad.html?id=${p.id}" target="_blank">
                    <img src="${p.heroImage}" alt="${p.title}" class="property-card-img" loading="lazy">
                </a>
                <button type="button" class="btn-card-heart ${isFavorite(p.id) ? 'active' : ''}" onclick="toggleFavoriteProperty('${p.id}', event)" title="Guardar en Favoritos">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isFavorite(p.id) ? '#E11D48' : 'none'}" stroke="${isFavorite(p.id) ? '#E11D48' : '#FFFFFF'}" stroke-width="2" style="width: 18px; height: 18px;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </button>
                <div class="property-card-badges">
                    <span class="badge badge-navy">${p.status}</span>
                    <span class="badge badge-gold">${p.urgencyTag}</span>
                </div>
                <div class="watermark-overlay">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span>DEMO INMOBILIARIA</span>
                </div>
            </div>
            <div class="property-card-body">
                <div class="property-card-price-row">
                    <span class="property-card-price">${p.priceFormatted}</span>
                    <span class="property-card-type">${p.type}</span>
                </div>
                <h3 class="property-card-title">
                    <a href="propiedad.html?id=${p.id}" target="_blank" style="color: inherit; text-decoration: none;">
                        ${p.title}
                    </a>
                </h3>
                <div class="property-card-location">
                    ${BENTO_ICONS.mapPin}
                    <span>${p.location}</span>
                </div>

                <div class="property-card-specs">
                    <div class="spec-item">${BENTO_ICONS.ruler} <span>${p.area} m²</span></div>
                    ${p.bedrooms ? `<div class="spec-item">${BENTO_ICONS.bed} <span>${p.bedrooms} Hab.</span></div>` : ''}
                    ${p.bathrooms ? `<div class="spec-item">${BENTO_ICONS.bath} <span>${p.bathrooms} Baños</span></div>` : ''}
                    <div class="spec-item">${BENTO_ICONS.car} <span>${p.parking} Park</span></div>
                </div>

                <div class="property-card-footer">
                    <a href="propiedad.html?id=${p.id}" target="_blank" class="btn btn-primary btn-md" style="flex: 1;">
                        ${BENTO_ICONS.home}
                        <span>Saber Más</span>
                    </a>
                    <a href="https://wa.me/593984585530?text=Hola,%20deseo%20más%20información%20sobre:%20${encodeURIComponent(p.title)}" target="_blank" class="btn btn-whatsapp btn-md btn-contact-card" title="Contactar por WhatsApp">
                        ${BENTO_ICONS.phone}
                        <span class="contact-btn-text">Contactar</span>
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// ------------------------------------------
// POLYGON MAP AREA SEARCH MODAL CONTROLS
// ------------------------------------------
function setupMapDrawModalControls() {
    const btnOpen = document.getElementById("btn-open-map-modal");
    const btnMobileOpen = document.getElementById("btn-open-map-modal-mobile");
    const btnClose = document.getElementById("btn-close-map-modal");
    const btnApply = document.getElementById("btn-apply-modal-filter");
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
    if (btnMobileOpen) btnMobileOpen.addEventListener("click", openModal);

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
                activeDrawnPolygonFilter = [...drawnVertices];
                localStorage.setItem("TENDENCIA_DRAWN_POLYGON", JSON.stringify(activeDrawnPolygonFilter));
                
                const badge = document.getElementById("drawn-zone-badge");
                if (badge) badge.style.display = "inline-flex";

                renderFilteredCatalog();
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

    polygonMap = L.map('search-polygon-map').setView([-0.1730, -78.4775], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(polygonMap);

    allCatalogProperties.forEach(p => {
        const coords = p.coordinates || [-0.1730, -78.4775];
        L.marker(coords).addTo(polygonMap).bindPopup(`
            <b>${p.title}</b><br>${p.priceFormatted}
        `);
    });

    isDrawingMode = true;
    polygonMap.getContainer().style.cursor = "crosshair";
    setupPolygonDrawingEvents();
}

function setupPolygonDrawingEvents() {
    const btnFinish = document.getElementById("btn-finish-polygon");
    const btnClear = document.getElementById("btn-clear-drawn-area");
    const statusText = document.getElementById("draw-status-text");

    polygonMap.on('click', (e) => {
        if (!isDrawingMode) return;
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        drawnVertices.push([lat, lng]);

        const vMarker = L.circleMarker([lat, lng], { radius: 5, color: '#0F172A', fillColor: '#C5A059', fillOpacity: 1 }).addTo(polygonMap);
        tempVertexMarkers.push(vMarker);

        if (statusText) {
            statusText.innerHTML = `<strong>Puntos marcados: ${drawnVertices.length}</strong>. Continúa haciendo clics para cerrar tu zona.`;
        }

        if (drawnVertices.length >= 2) {
            if (drawnPolyline) polygonMap.removeLayer(drawnPolyline);
            drawnPolyline = L.polyline(drawnVertices, { color: '#0F172A', weight: 3, dashArray: '6, 6' }).addTo(polygonMap);
        }

        if (drawnVertices.length >= 3) {
            if (drawnPolygonOverlay) polygonMap.removeLayer(drawnPolygonOverlay);
            drawnPolygonOverlay = L.polygon(drawnVertices, { color: '#0F172A', weight: 2, fillColor: '#C5A059', fillOpacity: 0.35 }).addTo(polygonMap);
            if (btnFinish) btnFinish.style.display = "inline-flex";
        }
    });

    if (btnFinish) {
        btnFinish.addEventListener("click", () => {
            if (drawnVertices.length < 3) return alert("Marca al menos 3 puntos en el mapa para cerrar la zona.");
            isDrawingMode = false;
            if (polygonMap) polygonMap.getContainer().style.cursor = "";
            if (statusText) statusText.innerHTML = "<strong>Zona Cerrada:</strong> Haz clic en 'Aplicar Filtro' para filtrar el catálogo.";
        });
    }

    if (btnClear) {
        btnClear.addEventListener("click", () => {
            isDrawingMode = true;
            drawnVertices = [];
            tempVertexMarkers.forEach(m => polygonMap.removeLayer(m));
            tempVertexMarkers = [];
            if (drawnPolyline) polygonMap.removeLayer(drawnPolyline);
            if (drawnPolygonOverlay) polygonMap.removeLayer(drawnPolygonOverlay);
            if (polygonMap) polygonMap.getContainer().style.cursor = "crosshair";
            if (btnFinish) btnFinish.style.display = "none";
            if (statusText) statusText.innerHTML = "Haz clics directamente en el mapa para delimitar los vértices de tu zona.";
        });
    }
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
