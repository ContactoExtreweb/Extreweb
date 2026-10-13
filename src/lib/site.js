// src/lib/site.js
// Dos marcas, una sola web (PLAN-FG-DIGITAL.md). La elige la variable de entorno PUBLIC_MARCA
// al hacer el build: sin valor = extreweb (extreweb.es) · 'fgdigital' = FG Digital (fgdigitalsl.com)
const FG = import.meta.env.PUBLIC_MARCA === 'fgdigital'

const instagram = 'https://www.instagram.com/fgdigital_sl'
const tiktok = 'https://www.tiktok.com/@fg.digital.sl'
// Ficha de Google (Perfil de Empresa). El cid sale del enlace de Maps de la ficha
const googleMaps = 'https://maps.google.com/?cid=15465466821035549424'

export const SITE = {
  marca: FG ? 'fgdigital' : 'extreweb', // lo que cambia de dibujo (Logo.astro, favicon)
  name: FG ? 'FG Digital' : 'extreweb',
  legalName: 'FG Digital SL', // titular de las DOS webs (legales y schema)
  // Los exige la LSSI en el aviso legal. Pendientes a 13/10/2026: mientras sean null no salen
  nif: null,
  registro: null, // p. ej. 'Registro Mercantil de Badajoz, tomo …, folio …, hoja BA-…'
  url: FG ? 'https://fgdigitalsl.com' : 'https://extreweb.es',
  description:
    'Agencia de diseño y desarrollo web, SEO y soporte técnico en Don Benito, Villanueva de la Serena y Cáceres. Webs a medida, rápidas y pensadas para vender.',

  email: FG ? 'pedro@fgdigitalsl.com' : 'contactoextreweb@gmail.com',
  telephone: '+34628775619',   // formato internacional (lo pide el schema de Google)
  instagram,
  tiktok,
  googleMaps,
  // Perfiles EXTERNOS de la marca (Instagram, LinkedIn, Google Business…), nunca la propia web
  sameAs: [instagram, tiktok, googleMaps],

  // Oferta para quien nos contacta desde la web (portada + contacto). Para quitarla: oferta: null
  oferta: {
    descuento: 10,
    codigo: 'WEB10', // lo dicen al llamar; en WhatsApp ya va escrito
    condiciones:
      'Para webs nuevas y servicios de redes sociales contratados tras contactar desde la web. En una web, sobre el importe total; en redes sociales, sobre la primera mensualidad. No acumulable con otras ofertas.',
  },

  locality: 'Villanueva de la Serena',
  region: 'Extremadura',
  country: 'ES',
  // Ciudades (en el schema van como City; Extremadura se añade aparte como región)
  areaServed: ['Villanueva de la Serena', 'Don Benito', 'Cáceres', 'Miajadas', 'Badajoz', 'Mérida', 'Plasencia', 'Trujillo', 'Navalmoral de la Mata', 'Coria', 'Zafra', 'Almendralejo'],

  founded: '2022',
  founders: [
    { name: 'Saúl Correyero Pañero', jobTitle: 'Desarrollo web y diseño', url: 'https://sauldev.es' },
    { name: 'Pedro Fernández Sánchez', jobTitle: 'Gestión, sistemas y redes' },
  ],

  // Catálogo de servicios (schema OfferCatalog). URLs con barra final.
  services: [
    { name: 'Diseño y desarrollo web', path: '/servicios/diseno-web/' },
    { name: 'Posicionamiento SEO', path: '/servicios/seo/' },
    { name: 'Gestión de redes sociales', path: '/servicios/redes-sociales/' },
    { name: 'Sistemas y soporte técnico', path: '/servicios/sistemas-soporte/' },
  ],

  ogImage: FG ? '/og-fgdigital.jpg' : '/og-portada.jpg', // 1200×630, en public/
  favicon: FG ? '/favicon-fg.svg' : '/favicon.svg', // también es el logo del schema
};

// Zona de servicio lista para JSON-LD: cada ciudad como City + Extremadura como región
export const areaServedSchema = [
  ...SITE.areaServed.map((name) => ({ '@type': 'City', name })),
  { '@type': 'State', name: 'Extremadura' },
];