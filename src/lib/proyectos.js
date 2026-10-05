// src/lib/proyectos.js — los proyectos que enseña la web (portada, /proyectos/ y el
// anillo del hero). Para añadir uno: la captura en public/proyectos/ en tres tamaños
// (Nombre.webp 1905×953, Nombre-1200.webp y Nombre-800.webp) y una entrada aquí.
//
// link: null mientras la web no esté publicada (o no sepamos su dirección): la
// tarjeta se enseña igual, pero sin enlace.
export const PROYECTOS = [
  {
    title: 'CarMeet',
    category: 'Comunidad Automotriz',
    image: '/proyectos/Car-MeetESP.webp',
    link: 'https://carmeet.es',
    color: '#f43f5e',
    desc: 'Diseño de interfaz moderna para gestión de eventos, rutas y perfiles.',
  },
  {
    title: 'Fichar365',
    category: 'SaaS / RRHH',
    image: '/proyectos/Fichar.webp',
    link: 'https://fichar365.com',
    color: '#3b82f6',
    desc: 'Software integral con enfoque en la usabilidad y rapidez para empresas.',
  },
  {
    title: 'Guadicar Multimarcas',
    category: 'Concesionario',
    image: '/proyectos/Guadicar.webp',
    link: 'https://guadicar.es',
    color: '#eab308',
    desc: 'Catálogo digital avanzado con optimización extrema para SEO local.',
  },
  {
    title: 'IMTEX',
    category: 'Impermeabilización y estructuras',
    image: '/proyectos/Imtex.webp',
    link: null, // la nueva aún no está en imtexsl.com (sigue la antigua)
    color: '#ef4444',
    desc: 'Web técnica con una cubierta en 3D que enseña, paso a paso, cómo se repara e impermeabiliza.',
  },
  {
    title: 'Físicas Élite',
    category: 'Academia de oposiciones',
    image: '/proyectos/Fisicas-Elite.webp',
    link: 'https://fisicaelite.vercel.app/', // provisional hasta que compren el dominio
    color: '#c9a227',
    desc: 'Preparación física de oposiciones en Cáceres, con área de alumnos, pago online y el temario en vídeo.',
  },
  {
    title: 'Taller M. Guzmán',
    category: 'Chapa y pintura',
    image: '/proyectos/Guzman.webp',
    link: 'https://project-r5m3o.vercel.app/',
    color: '#10b981',
    desc: 'Web del taller con galería de trabajos y presupuesto por formulario o WhatsApp.',
  },
  {
    title: 'Toldos Pallares',
    category: 'Web Corporativa',
    image: '/proyectos/Toldos-Pallares.webp',
    link: 'https://toldospallares.com',
    color: '#a855f7',
    desc: 'Presencia digital líder centrada en destacar captación de leads.',
  },
]
