/* ==========================================
   TENDENCIA INMOBILIARIA - DATA STORE ENGINE
   Standalone LocalStorage Data Store & REST API Fallback Engine
   ========================================== */

const INITIAL_PROPERTIES = [
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
        coordinates: [-0.1730, -78.4775],
        heroImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85",
        description: "Exclusivo departamento residencial con terminados de alta gama, iluminación natural perimetral y vista panorámica. Ubicado en el corazón financiero y empresarial del Norte de Quito.",
        financials: { downPayment: "$16.000 (20%)", estimatedMonthly: "$490 / mes", biessEligible: true },
        amenities: [
            { icon: "shield", label: "Seguridad Privada 24/7" },
            { icon: "car", label: "Parqueadero Subterráneo" },
            { icon: "building", label: "Ascensor de Alta Velocidad" },
            { icon: "sun", label: "Terraza Verde Comunal" }
        ],
        gallery: [
            { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85", title: "Fachada del Edificio" },
            { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85", title: "Sala de Estar Principal" }
        ],
        typologies: [
            { model: "Suite Ejecutiva", area: "45 m²", bedrooms: 1, bathrooms: 1, price: "$58.000", status: "Disponible" },
            { model: "Dep. 2 Dormitorios", area: "70 m²", bedrooms: 2, bathrooms: 1, price: "$80.000", status: "Última Unidad" }
        ]
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
        coordinates: [-0.1780, -78.4890],
        heroImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85",
        description: "Casa moderna de arquitectura contemporánea con amplios ventanales, acabados en madera tratada y patio privado independiente. Entorno seguro y residencial de alta plusvalía.",
        financials: { downPayment: "$27.000 (20%)", estimatedMonthly: "$780 / mes", biessEligible: true },
        amenities: [
            { icon: "trees", label: "Patio Privado" },
            { icon: "flame", label: "Área de BBQ" }
        ],
        gallery: [
            { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85", title: "Fachada Principal" }
        ],
        typologies: [
            { model: "Casa Tipo A 120m²", area: "120 m²", bedrooms: 3, bathrooms: 2.5, price: "$135.000", status: "Disponible" }
        ]
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
        coordinates: [-0.2150, -78.4050],
        heroImage: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
        description: "Residencias independientes de una sola planta con arquitectura de inspiración japonesa minimalista. Techos altos, ventilación natural, jardines internos Zen y máxima privacidad en el mejor clima de Tumbaco.",
        financials: { downPayment: "$37.800 (20%)", estimatedMonthly: "$1.100 / mes", biessEligible: false },
        amenities: [
            { icon: "trees", label: "Jardines Zen con Iluminación LED" }
        ],
        gallery: [
            { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85", title: "Vista Exterior Zen" }
        ],
        typologies: [
            { model: "Villa Zen 1 Planta", area: "145 m²", bedrooms: 3, bathrooms: 3, price: "$189.000", status: "Disponible" }
        ]
    },
    {
        id: "penthouse-la-carolina",
        title: "Penthouse Vista 360° La Carolina",
        type: "departamento",
        status: "Venta Inmediata",
        urgencyTag: "Exclusivo",
        price: 245000,
        priceFormatted: "$245.000",
        area: 185,
        bedrooms: 4,
        bathrooms: 3.5,
        parking: 3,
        city: "Quito",
        location: "Av. República de El Salvador & Shyris, Quito, Ecuador",
        coordinates: [-0.1800, -78.4820],
        heroImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85",
        description: "Penthouse dúplex panorámico con terraza privada solárium, acabados italianos de mármol y domótica automatizada. Frente al Parque La Carolina.",
        financials: { downPayment: "$49.000 (20%)", estimatedMonthly: "$1.450 / mes", biessEligible: false },
        amenities: [
            { icon: "sun", label: "Solárium Privado 360°" },
            { icon: "shield", label: "Seguridad Inteligente" }
        ],
        gallery: [
            { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85", title: "Vista Penthouse" }
        ],
        typologies: [
            { model: "Penthouse Dúplex", area: "185 m²", bedrooms: 4, bathrooms: 3.5, price: "$245.000", status: "Disponible" }
        ]
    },
    {
        id: "casa-cumbaya-miravalle",
        title: "Casa Campestre Miravalle Cumbayá",
        type: "casa",
        status: "Entrega Inmediata",
        urgencyTag: "Oportunidad VIP",
        price: 320000,
        priceFormatted: "$320.000",
        area: 280,
        bedrooms: 4,
        bathrooms: 4.5,
        parking: 3,
        city: "Cumbayá",
        location: "Sector Miravalle 2, Cumbayá, Quito, Ecuador",
        coordinates: [-0.1980, -78.4420],
        heroImage: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=85",
        description: "Espectacular propiedad de diseño de autor con piscina temperada privada, amplios jardines y acabados en piedra volcánica. Entorno exclusivo y tranquilo a 5 minutos del USFQ.",
        financials: { downPayment: "$64.000 (20%)", estimatedMonthly: "$1.890 / mes", biessEligible: false },
        amenities: [
            { icon: "sun", label: "Piscina Temperada Privada" },
            { icon: "trees", label: "Jardines Extensos" }
        ],
        gallery: [
            { url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=85", title: "Piscina y Fachada" }
        ],
        typologies: [
            { model: "Casa Quinta Miravalle", area: "280 m²", bedrooms: 4, bathrooms: 4.5, price: "$320.000", status: "Disponible" }
        ]
    },
    {
        id: "dept-gonzalez-suarez",
        title: "Suite Panorámica González Suárez",
        type: "departamento",
        status: "Venta Inmediata",
        urgencyTag: "Vista al Valle",
        price: 115000,
        priceFormatted: "$115.000",
        area: 65,
        bedrooms: 1,
        bathrooms: 1.5,
        parking: 1,
        city: "Quito",
        location: "Av. González Suárez & Coruña, Quito, Ecuador",
        coordinates: [-0.2010, -78.4750],
        heroImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=85",
        description: "Suite ejecutiva amoblada con balcón de cristal templado mirando al Valle de Guápulo. Edificio inteligente con gimnasio spa, jacuzzis y piscina en rooftop.",
        financials: { downPayment: "$23.000 (20%)", estimatedMonthly: "$670 / mes", biessEligible: true },
        amenities: [
            { icon: "building", label: "Rooftop Spa & Jacuzzi" },
            { icon: "shield", label: "Acceso Biométrico" }
        ],
        gallery: [
            { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=85", title: "Suite Interior" }
        ],
        typologies: [
            { model: "Suite Luxury", area: "65 m²", bedrooms: 1, bathrooms: 1.5, price: "$115.000", status: "Disponible" }
        ]
    },
    {
        id: "casa-conocoto-los-chillos",
        title: "Quinta Residencial Conocoto",
        type: "casa",
        status: "Entrega Inmediata",
        urgencyTag: "Clima Cálido",
        price: 155000,
        priceFormatted: "$155.000",
        area: 210,
        bedrooms: 4,
        bathrooms: 3,
        parking: 3,
        city: "Quito",
        location: "Sector Conocoto, Valle de los Chillos, Quito, Ecuador",
        coordinates: [-0.3020, -78.4810],
        heroImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=85",
        description: "Hermosa casa de estilo rústico moderno en conjunto privado seguro. Árboles frutales, pérgola con horno de pan y BBQ, clima cálido y libre de ruido.",
        financials: { downPayment: "$31.000 (20%)", estimatedMonthly: "$890 / mes", biessEligible: true },
        amenities: [
            { icon: "flame", label: "Pérgola BBQ y Horno" },
            { icon: "trees", label: "Huerto y Árboles Frutales" }
        ],
        gallery: [
            { url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=85", title: "Jardín Exterior" }
        ],
        typologies: [
            { model: "Casa Conocoto 210m²", area: "210 m²", bedrooms: 4, bathrooms: 3, price: "$155.000", status: "Disponible" }
        ]
    },
    {
        id: "lote-monteserrin",
        title: "Terreno Urbanizado Monteserrín",
        type: "lote",
        status: "Venta Inmediata",
        urgencyTag: "Excelente Cos",
        price: 98000,
        priceFormatted: "$98.000",
        area: 350,
        bedrooms: 0,
        bathrooms: 0,
        parking: 0,
        city: "Quito",
        location: "Sector Udla Park & Monteserrín, Quito, Ecuador",
        coordinates: [-0.1650, -78.4680],
        heroImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85",
        description: "Lote plano 100% urbanizado con todos los servicios básicos, garita de control de accesos y COS apto para edificar residencia hasta de 4 pisos.",
        financials: { downPayment: "$19.600 (20%)", estimatedMonthly: "$580 / mes", biessEligible: true },
        amenities: [
            { icon: "shield", label: "Urbanización Cerrada" },
            { icon: "sun", label: "Todos los Servicios Básicos" }
        ],
        gallery: [
            { url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85", title: "Vista del Lote" }
        ],
        typologies: [
            { model: "Lote 350m²", area: "350 m²", bedrooms: 0, bathrooms: 0, price: "$98.000", status: "Disponible" }
        ]
    },
    {
        id: "dept-quito-tenis",
        title: "Departamento Familiar Quito Tenis",
        type: "departamento",
        status: "Entrega Inmediata",
        urgencyTag: "Sector Exclusivo",
        price: 178000,
        priceFormatted: "$178.000",
        area: 135,
        bedrooms: 3,
        bathrooms: 2.5,
        parking: 2,
        city: "Quito",
        location: "Sector Quito Tenis, Av. Brasil, Quito, Ecuador",
        coordinates: [-0.1620, -78.4920],
        heroImage: "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=1200&q=85",
        description: "Amplio departamento familiar en zona de alta seguridad y parques privados. Dormitorio master con walk-in closet, sala de estar independiente y acabados de lujo.",
        financials: { downPayment: "$35.600 (20%)", estimatedMonthly: "$1.020 / mes", biessEligible: true },
        amenities: [
            { icon: "shield", label: "Guardiánica 24 Horas" },
            { icon: "car", label: "2 Parqueaderos + Bodega" }
        ],
        gallery: [
            { url: "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=1200&q=85", title: "Living Room Quito Tenis" }
        ],
        typologies: [
            { model: "Dep. 135m² 3Hab", area: "135 m²", bedrooms: 3, bathrooms: 2.5, price: "$178.000", status: "Disponible" }
        ]
    },
    {
        id: "residencia-san-rafael",
        title: "Villa Familiar San Rafael",
        type: "casa",
        status: "Venta Inmediata",
        urgencyTag: "Cerca a Malls",
        price: 142000,
        priceFormatted: "$142.000",
        area: 160,
        bedrooms: 3,
        bathrooms: 2.5,
        parking: 2,
        city: "Quito",
        location: "Av. General Rumiñahui, San Rafael, Valle de los Chillos, Ecuador",
        coordinates: [-0.3150, -78.4620],
        heroImage: "https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=85",
        description: "Moderna casa independiente dentro de urbanización privada cerca de San Luis Shopping. Acabados de primera, pérgola cubierta y parqueadero para 2 vehículos.",
        financials: { downPayment: "$28.400 (20%)", estimatedMonthly: "$830 / mes", biessEligible: true },
        amenities: [
            { icon: "shield", label: "Control de Accesos" },
            { icon: "trees", label: "Áreas Verdes Infantiles" }
        ],
        gallery: [
            { url: "https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=85", title: "Fachada San Rafael" }
        ],
        typologies: [
            { model: "Villa San Rafael", area: "160 m²", bedrooms: 3, bathrooms: 2.5, price: "$142.000", status: "Disponible" }
        ]
    }
];

export function getLocalPropertiesStore() {
    try {
        const stored = localStorage.getItem('DEMO_PROPERTIES_STORE');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn("Could not parse LocalStorage properties, initializing defaults.");
    }
    localStorage.setItem('DEMO_PROPERTIES_STORE', JSON.stringify(INITIAL_PROPERTIES));
    return INITIAL_PROPERTIES;
}

export function savePropertiesStore(propertiesList) {
    try {
        localStorage.setItem('DEMO_PROPERTIES_STORE', JSON.stringify(propertiesList));
        return true;
    } catch (e) {
        console.error("Error saving properties store:", e);
        return false;
    }
}

export function saveNewProperty(property) {
    try {
        const store = getLocalPropertiesStore();
        const existingIdx = store.findIndex(p => p.id === property.id);
        if (existingIdx >= 0) {
            store[existingIdx] = property;
        } else {
            store.unshift(property);
        }
        savePropertiesStore(store);
        return true;
    } catch (e) {
        console.error("Error saving new property:", e);
        return false;
    }
}

export function deletePropertyById(propertyId) {
    try {
        let store = getLocalPropertiesStore();
        store = store.filter(p => p.id !== propertyId);
        savePropertiesStore(store);
        return true;
    } catch (e) {
        console.error("Error deleting property:", e);
        return false;
    }
}

export function getAllProperties() {
    return getLocalPropertiesStore();
}

export async function fetchPropertiesFromApi() {
    try {
        const res = await fetch("/api/properties");
        if (res.ok) {
            const data = await res.json();
            if (data && data.length) return data;
        }
    } catch (e) {
        // Fallback to standalone LocalStorage store
    }
    return getAllProperties();
}

export const PROPERTY_DATA = getAllProperties();

if (typeof window !== 'undefined') {
    window.PROPERTY_DATA = PROPERTY_DATA;
    window.saveNewProperty = saveNewProperty;
    window.deletePropertyById = deletePropertyById;
    window.fetchPropertiesFromApi = fetchPropertiesFromApi;
}
