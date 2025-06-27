/**
 * Utilidades para transformación de texto en formularios
 * Convierte automáticamente campos de texto a mayúsculas
 */

/**
 * Aplica la transformación a mayúsculas a un campo de texto
 * @param {HTMLInputElement|HTMLTextAreaElement} input - El elemento input o textarea a transformar
 */
function applyUppercaseTransform(input) {
    // Convertir el valor actual a mayúsculas
    input.value = input.value.toUpperCase();
    
    // Aplicar estilo para mostrar en mayúsculas mientras se escribe
    input.style.textTransform = 'uppercase';
}

/**
 * Inicializa la transformación a mayúsculas para campos específicos
 * @param {string} selector - Selector CSS para los campos a transformar
 */
function initializeUppercaseFields(selector = '.uppercase-field') {
    const inputs = document.querySelectorAll(selector);
    
    inputs.forEach(input => {
        // Aplicar transformación al valor actual
        applyUppercaseTransform(input);
        
        // Aplicar transformación al escribir
        input.addEventListener('input', function() {
            applyUppercaseTransform(this);
        });
        
        // Aplicar transformación al perder el foco
        input.addEventListener('blur', function() {
            applyUppercaseTransform(this);
        });
    });
}

/**
 * Aplica transformación a mayúsculas a campos específicos por ID
 * @param {Array<string>} fieldIds - Array de IDs de campos a transformar
 */
function applyUppercaseToFields(fieldIds) {
    fieldIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            applyUppercaseTransform(input);
            
            input.addEventListener('input', function() {
                applyUppercaseTransform(this);
            });
            
            input.addEventListener('blur', function() {
                applyUppercaseTransform(this);
            });
        }
    });
}

/**
 * Convierte un string a mayúsculas para mostrar en la interfaz
 * @param {string} text - Texto a convertir
 * @returns {string} Texto en mayúsculas
 */
function toUpperCase(text) {
    return text ? text.toUpperCase() : '';
}

export { 
    applyUppercaseTransform, 
    initializeUppercaseFields, 
    applyUppercaseToFields, 
    toUpperCase 
}; 