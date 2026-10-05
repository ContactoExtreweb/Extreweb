// src/lib/site.js
export const SITE = {
  name: 'extreweb',
  url: 'https://extreweb.es',
  description:
    'Agencia de diseño y desarrollo web, SEO y soporte técnico en Don Benito, Villanueva de la Serena y Cáceres. Webs a medida, rápidas y pensadas para vender.',

  email: 'contactoextreweb@gmail.com',
  telephone: '+34628775619',   // formato internacional (lo pide el schema de Google)
  instagram: 'https://instagram.com/extreweb',
  // Ficha de Google (Perfil de Empresa). El cid sale del enlace de Maps de la ficha
  googleMaps: 'https://maps.google.com/?cid=15465466821035549424',
  // Perfiles EXTERNOS de la marca (Instagram, LinkedIn, Google Business…), nunca la propia web
  sameAs: ['https://instagram.com/extreweb', 'https://maps.google.com/?cid=15465466821035549424'],

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

  ogImage: '/og-portada.jpg', // 1200×630, en public/
};

// Zona de servicio lista para JSON-LD: cada ciudad como City + Extremadura como región
export const areaServedSchema = [
  ...SITE.areaServed.map((name) => ({ '@type': 'City', name })),
  { '@type': 'State', name: 'Extremadura' },
];