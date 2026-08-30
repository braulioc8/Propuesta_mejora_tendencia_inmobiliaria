/* ==========================================
   TENDENCIA INMOBILIARIA - PHOTO GALLERY MODULE
   Interactive Lightbox with category filter,
   keyboard navigation, thumbnail carousel & zoom
   ========================================== */

import { PROPERTY_DATA } from './data.js';

let currentGalleryPhotos = [];
let currentPhotoIndex = 0;

export function openGalleryModal(propertyId, initialCategory = 'todos') {
    const property = PROPERTY_DATA.find(p => p.id === propertyId);
    if (!property || !property.gallery.length) return;

    currentGalleryPhotos = property.gallery;
    currentPhotoIndex = 0;

    const lightboxModal = document.getElementById("gallery-lightbox-modal");
    if (!lightboxModal) return;

    renderLightboxContent(property, initialCategory);
    lightboxModal.classList.add("active");
    
    // Bind Keyboard Shortcuts
    document.addEventListener("keydown", handleGalleryKeydown);
}

export function closeGalleryModal() {
    const lightboxModal = document.getElementById("gallery-lightbox-modal");
    if (lightboxModal) lightboxModal.classList.remove("active");
    document.removeEventListener("keydown", handleGalleryKeydown);
}

function handleGalleryKeydown(e) {
    if (e.key === "ArrowLeft") navigateGallery(-1);
    if (e.key === "ArrowRight") navigateGallery(1);
    if (e.key === "Escape") closeGalleryModal();
}

export function navigateGallery(direction) {
    if (!currentGalleryPhotos.length) return;
    currentPhotoIndex = (currentPhotoIndex + direction + currentGalleryPhotos.length) % currentGalleryPhotos.length;
    updateLightboxStage();
}

export function setGalleryIndex(index) {
    currentPhotoIndex = index;
    updateLightboxStage();
}

function updateLightboxStage() {
    const photo = currentGalleryPhotos[currentPhotoIndex];
    if (!photo) return;

    const stageImg = document.getElementById("lightbox-stage-img");
    const stageTitle = document.getElementById("lightbox-stage-title");
    const stageCounter = document.getElementById("lightbox-stage-counter");

    if (stageImg) stageImg.src = photo.url;
    if (stageTitle) stageTitle.textContent = photo.title;
    if (stageCounter) stageCounter.textContent = `${currentPhotoIndex + 1} / ${currentGalleryPhotos.length}`;

    // Update active thumb
    const thumbs = document.querySelectorAll(".lightbox-thumb");
    thumbs.forEach((t, i) => {
        if (i === currentPhotoIndex) t.classList.add("active");
        else t.classList.remove("active");
    });
}

export function filterGalleryCategory(category, propertyId) {
    const property = PROPERTY_DATA.find(p => p.id === propertyId);
    if (!property) return;

    if (category === 'todos') {
        currentGalleryPhotos = property.gallery;
    } else {
        currentGalleryPhotos = property.gallery.filter(g => g.category === category);
    }

    if (!currentGalleryPhotos.length) currentGalleryPhotos = property.gallery;
    currentPhotoIndex = 0;
    
    // Re-render thumbnails and stage
    renderLightboxContent(property, category);
}

function renderLightboxContent(property, selectedCat = 'todos') {
    const container = document.getElementById("gallery-lightbox-content");
    if (!container) return;

    const photo = currentGalleryPhotos[currentPhotoIndex] || property.gallery[0];

    container.innerHTML = `
        <div class="lightbox-body">
            <!-- Header Filter Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--color-text-main); margin: 0;">${property.title}</h3>
                    <span style="font-size: 0.85rem; color: var(--color-text-muted);">${property.location}</span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <span class="badge badge-gold">${photo.title}</span>
                </div>
            </div>

            <!-- Stage Image Box -->
            <div class="lightbox-main-stage">
                <button class="lightbox-nav-btn lightbox-prev" onclick="navigateGallery(-1)">&#10094;</button>
                <img id="lightbox-stage-img" src="${photo.url}" alt="${photo.title}">
                <button class="lightbox-nav-btn lightbox-next" onclick="navigateGallery(1)">&#10095;</button>
            </div>

            <!-- Stage Caption & Counter -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; color: var(--color-text-body); font-size: 0.9rem;">
                <span id="lightbox-stage-title" style="font-weight: 600;">${photo.title}</span>
                <span id="lightbox-stage-counter" class="badge badge-navy">${currentPhotoIndex + 1} / ${currentGalleryPhotos.length}</span>
            </div>

            <!-- Thumbnails Strip -->
            <div class="lightbox-thumbnails">
                ${currentGalleryPhotos.map((p, idx) => `
                    <div class="lightbox-thumb ${idx === currentPhotoIndex ? 'active' : ''}" onclick="setGalleryIndex(${idx})">
                        <img src="${p.url}" alt="${p.title}">
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Global Window Attachments
if (typeof window !== 'undefined') {
    window.openGalleryModal = openGalleryModal;
    window.closeGalleryModal = closeGalleryModal;
    window.filterGalleryCategory = filterGalleryCategory;
    window.navigateGallery = navigateGallery;
    window.setGalleryIndex = setGalleryIndex;
}
