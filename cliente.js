// ==================================================
// cliente.js - CEREBRO DEL LOBBY DIVIDIDO (CAJAS MÁGICAS)
// ==================================================

const Cliente = {
    init: function() {
        console.log("Cliente Mágico Iniciado");
        this.abrirPestana('jugar'); // Arranca en Jugar por defecto
    },

    abrirPestana: function(pestanaId) {
        // 1. Ocultar TODAS las pantallas
        document.querySelectorAll('.tab-top-content').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.tab-lower-content').forEach(el => el.style.display = 'none');
        
        // Ocultar botones flotantes de JUGAR (amigos/modos) y de PERFIL (historiales)
        document.querySelectorAll('.tab-jugar-box').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.tab-perfil-box').forEach(el => el.style.display = 'none');

        // 2. Apagar el brillo de todos los botones de las pestañas
        document.querySelectorAll('.magic-tab').forEach(btn => btn.classList.remove('active-glow'));

        // 3. Encender contenido si NO es la pestaña Jugar
        if (pestanaId !== 'jugar') {
            let topContent = document.getElementById('tab-' + pestanaId + '-top');
            if (topContent) topContent.style.display = 'block';

            let lowerContent = document.getElementById('tab-' + pestanaId + '-lower');
            if (lowerContent) lowerContent.style.display = 'block';
        }
        
        // 4. Lógicas de Pestañas Específicas
        if (pestanaId === 'jugar') {
            // Mostrar los modos de juego y la lista de amigos conectados
            document.querySelectorAll('.tab-jugar-box').forEach(el => el.style.display = 'flex');
        } else if (pestanaId === 'perfil') {
            // Mostrar las barras de historial y ligas
            document.querySelectorAll('.tab-perfil-box').forEach(el => el.style.display = 'flex');
        }
        
        // 5. Encender el brillo dorado en la pestaña tocada
        let btnActivo = document.getElementById('btn-nav-' + pestanaId);
        if (btnActivo) btnActivo.classList.add('active-glow');
    }
};
