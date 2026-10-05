// src/lib/redes-datos.js
// Mes de ejemplo de la página de Redes Sociales: "Horno Almendro", un obrador inventado.
// Lo usan RedesAnimadas.astro (calendario en el HTML, sin JS) y redes-animadas.js (la animación).

// Octubre de 2026 empieza en jueves (lunes = 0)
export const PRIMERO = 3
export const DIAS = 31

// Las 8 publicaciones del mes: día, diseño (ver DISENOS en redes-animadas.js), redes y pie de foto
export const MES = [
    { dia: 2, d: 'masaMadre', redes: ['ig', 'fb'], pie: 'Nuestra hogaza reposa 48 horas antes de entrar al horno. Sin prisas.', gustas: 214 },
    { dia: 6, d: 'horario', redes: ['ig', 'fb'], pie: 'Desde este lunes abrimos a las 7:00 para que el pan te pille de camino.', gustas: 168 },
    { dia: 9, d: 'receta', redes: ['ig'], pie: 'Receta del domingo: migas extremeñas con nuestro pan del día anterior.', gustas: 302 },
    { dia: 14, d: 'obrador', redes: ['ig'], pie: 'A las 4:30 ya huele a pan. Así empieza el día en el obrador.', gustas: 187 },
    { dia: 17, d: 'oferta', redes: ['ig', 'fb'], pie: 'Barra + café por 2,50 € todas las mañanas de octubre.', gustas: 421 },
    { dia: 21, d: 'sorteo', redes: ['ig', 'fb'], pie: 'Sorteamos una cesta de otoño. Comenta a quién se la regalarías.', gustas: 356 },
    { dia: 26, d: 'encuesta', redes: ['ig'], pie: '¿Masa madre o pan de pueblo? Te leemos en comentarios.', gustas: 243 },
    { dia: 30, d: 'bunuelos', redes: ['ig', 'fb'], pie: 'Buñuelos y huesos de santo, ya a la venta. Encárgalos por mensaje.', gustas: 389 },
]

// Publicaciones de septiembre que ya estaban en el perfil
export const ANTIGUAS = ['viejo1', 'viejo2', 'viejo3']

// Informe del mes (datos de ejemplo: la página lo dice)
export const INFORME = { publicaciones: 8, redes: 2, alcance: 12400, interacciones: 1380, semanas: [38, 55, 47, 82, 64] }
