/**
 * iceModules.js
 * Wrapper para manejar la importación de Ice y módulos generados
 */

// Ice y compunet ya están cargados globalmente desde los script tags en index.html
const Ice = window.Ice;
const compunet = window.compunet;

// Verificar que Ice se cargó correctamente
if (!Ice) {
    throw new Error('Ice no está disponible. Asegúrate de que Ice.js se cargó en index.html');
}

console.log('Ice (desde window.Ice):', Ice);
console.log('compunet (desde window.compunet):', compunet);

if (!Ice._ModuleRegistry) {
    throw new Error('Ice._ModuleRegistry no está disponible');
}

if (!compunet) {
    throw new Error('compunet no está disponible. Asegúrate de que chat.js se cargó en index.html');
}

// Exportar
export { Ice };
export { compunet };
