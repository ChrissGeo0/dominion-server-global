// ==================================================
// ui_nav.js - NAVEGACIÓN, MENÚS Y PERSONALIZACIÓN
// ==================================================

window.UI = window.UI || {};

// Variables de estado de Menús
UI.settings = { sens: 1.0, opacity: 1.0, zoom: 1.0, camAngle: 90 };
UI.isEditingHUD = false; 
UI.activeScaleEl = null; 
UI.lastOrientation = 'portrait';

UI.init = function() {
    this.initDamagePool(); // Llama a la función que ahora vive en ui_hud.js
    this.lastOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    this.loadSettings();
    this.setupHUDDragging();
    
    window.addEventListener('resize', () => {
        let currentOri = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        if (this.lastOrientation !== currentOri) {
            this.lastOrientation = currentOri;
            this.applyHUDForCurrentOrientation();
        }
    });
};

UI.setupHUDDragging = function() {
    document.querySelectorAll('.hud-element').forEach(container => {
        container.onpointerdown = (e) => {
            if (this.isEditingHUD) {
                e.preventDefault();
                this.selectScaleElement(container); 
                container.setAttribute('data-drag', 'true');
                
                let rect = container.getBoundingClientRect();
                container.ox = e.clientX - rect.left; 
                container.oy = e.clientY - rect.top;
                
                if (window.getComputedStyle(container).transform !== 'none') {
                    container.style.transform = 'none';
                    container.style.left = rect.left + 'px';
                    container.style.top = rect.top + 'px';
                }
                
                container.setPointerCapture(e.pointerId); 
            }
        };
        container.onpointermove = (e) => {
            if (this.isEditingHUD && container.getAttribute('data-drag') === 'true') {
                e.preventDefault();
                container.style.bottom = 'auto'; 
                container.style.right = 'auto';
                container.style.left = (e.clientX - container.ox) + 'px'; 
                container.style.top = (e.clientY - container.oy) + 'px'; 
            }
        };
        const stopDrag = (e) => {
            if (this.isEditingHUD) { 
                container.removeAttribute('data-drag'); 
            }
        };
        container.onpointerup = stopDrag; 
        container.onpointercancel = stopDrag;
    });
};

UI.applyHUDForCurrentOrientation = function() {
    let ori = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    
    document.querySelectorAll('.hud-element').forEach(el => {
        el.style.left = ''; el.style.top = ''; el.style.right = ''; el.style.bottom = '';
        el.style.transform = ''; el.dataset.scale = "1.0";
    });

    try {
        let saved = localStorage.getItem('dominion_master');
        if (saved) {
            let s = JSON.parse(saved);
            let hudData = s['hud_' + ori]; 
            if (hudData) {
                hudData.forEach(elD => {
                    let el = document.getElementById(elD.id);
                    if (el) { 
                        if(elD.left) el.style.left = elD.left; 
                        if(elD.top) el.style.top = elD.top; 
                        if(elD.right) el.style.right = elD.right; 
                        if(elD.bottom) el.style.bottom = elD.bottom; 
                        el.dataset.scale = elD.scale; 
                        el.style.transform = `scale(${elD.scale})`; 
                    }
                });
            }
        }
    } catch(e) {}
    this.applyOpacity();
};

UI.loadSettings = function() {
    try {
        let saved = localStorage.getItem('dominion_master');
        if (saved) {
            let s = JSON.parse(saved);
            this.settings.sens = s.sens || 1.0; 
            this.settings.opacity = s.opacity || 1.0; 
            this.settings.zoom = s.zoom || 1.0; 
            this.settings.camAngle = s.camAngle || 90;
            
            let sensSlider = document.getElementById('sens-slider');
            if (sensSlider) sensSlider.value = this.settings.sens; 
            let sensVal = document.getElementById('sens-val');
            if (sensVal) sensVal.innerText = this.settings.sens.toFixed(1);
            
            let opSlider = document.getElementById('opacity-slider');
            if (opSlider) opSlider.value = this.settings.opacity; 
            let opVal = document.getElementById('opacity-val');
            if (opVal) opVal.innerText = this.settings.opacity.toFixed(1);
            
            let zoomSlider = document.getElementById('zoom-slider');
            if (zoomSlider) zoomSlider.value = this.settings.zoom; 
            let zoomVal = document.getElementById('zoom-val');
            if (zoomVal) zoomVal.innerText = this.settings.zoom.toFixed(1);
            
            let aSlider = document.getElementById('angle-slider'); 
            if(aSlider) { 
                aSlider.value = this.settings.camAngle; 
                document.getElementById('angle-val').innerText = this.settings.camAngle; 
            }
        }
    } catch(e) {}
    this.applyHUDForCurrentOrientation();
};

UI.saveSettings = function() {
    let ori = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    let hudData = [];
    document.querySelectorAll('.hud-element').forEach(el => { 
        if (el.style.left || el.style.top || el.style.right || el.style.bottom || el.style.transform !== '') {
            hudData.push({ 
                id: el.id, left: el.style.left, top: el.style.top, right: el.style.right, 
                bottom: el.style.bottom, scale: el.dataset.scale || "1.0" 
            }); 
        }
    });
    try { 
        let saved = localStorage.getItem('dominion_master');
        let s = saved ? JSON.parse(saved) : {};
        s.sens = this.settings.sens; s.opacity = this.settings.opacity;
        s.zoom = this.settings.zoom; s.camAngle = this.settings.camAngle;
        s['hud_' + ori] = hudData; 
        localStorage.setItem('dominion_master', JSON.stringify(s)); 
    } catch(e) {}
};

UI.toggleSettings = function() {
    if (this.isEditingHUD) return;
    let m = document.getElementById('settings-menu'); 
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
};

UI.updateCameraZoom = function(v) { this.settings.zoom = parseFloat(v); document.getElementById('zoom-val').innerText = this.settings.zoom.toFixed(1); };
UI.updateCameraAngle = function(v) { this.settings.camAngle = parseInt(v); document.getElementById('angle-val').innerText = this.settings.camAngle; };
UI.updateSens = function(v) { this.settings.sens = parseFloat(v); document.getElementById('sens-val').innerText = parseFloat(v).toFixed(1); };
UI.updateOpacity = function(v) { this.settings.opacity = parseFloat(v); document.getElementById('opacity-val').innerText = this.settings.opacity.toFixed(1); this.applyOpacity(); };

UI.applyOpacity = function() {
    let mop = 1.0 - (1.0 - this.settings.opacity) * 0.666;
    document.querySelectorAll('.hud-element').forEach(el => { 
        el.style.opacity = (el.id === 'minimap-container') ? mop : this.settings.opacity; 
    });
};

UI.startHUDCustomization = function() {
    document.getElementById('settings-menu').style.display = 'none'; 
    this.isEditingHUD = true; this.activeScaleEl = null;
    document.getElementById('hud-save-overlay').style.display = 'flex'; 
    document.getElementById('scale-control').style.display = 'none';
    if (STATE.screen === 'lobby') document.getElementById('lobby').style.display = 'none';
    
    document.querySelectorAll('.hud-element').forEach(el => { 
        if (el.id === 'top-hud' || el.id === 'settings-btn' || el.id === 'tutorial-radio') el.style.display = 'flex';
        else el.style.display = 'block'; 
        
        el.style.opacity = 1.0; el.style.borderColor = '#ffeb3b'; 
        if (el.id !== 'minimap-container' && el.id !== 'top-hud' && el.id !== 'settings-btn' && el.id !== 'tutorial-radio') {
            el.style.backgroundColor = 'rgba(255, 235, 59, 0.15)'; 
        }
        if (!el.dataset.scale) el.dataset.scale = "1.0"; 
    });
};

UI.selectScaleElement = function(el) {
    this.activeScaleEl = el; 
    document.getElementById('scale-control').style.display = 'block';
    let cs = el.dataset.scale || "1.0"; 
    document.getElementById('scale-slider').value = cs; 
    document.getElementById('scale-val').innerText = cs;
    document.querySelectorAll('.hud-element').forEach(e => e.style.borderColor = '#ffeb3b'); 
    el.style.borderColor = '#ff3333';
};

UI.updateElementScale = function(v) { 
    if (this.activeScaleEl) { 
        this.activeScaleEl.dataset.scale = v; 
        document.getElementById('scale-val').innerText = v; 
        this.activeScaleEl.style.transform = `scale(${v})`; 
    } 
};

UI.saveHUD = function() {
    this.isEditingHUD = false; 
    document.getElementById('hud-save-overlay').style.display = 'none'; 
    this.applyOpacity();
    
    document.querySelectorAll('.hud-element').forEach(el => {
        if (STATE.screen === 'lobby') el.style.display = 'none';
        if (el.classList.contains('stick-container')) {
            if (el.id === 'atk-stick') el.style.borderColor = 'rgba(255, 60, 60, 0.3)'; 
            else if (el.id === 'skill-stick') el.style.borderColor = 'rgba(60, 150, 255, 0.3)'; 
            else if (el.id === 'recall-btn') el.style.borderColor = 'rgba(255, 255, 0, 0.4)'; 
            else el.style.borderColor = 'rgba(255,255,255,0.15)';
            el.style.backgroundColor = 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)';
        } else if (el.id === 'settings-btn' || el.id === 'tutorial-radio') {
            el.style.borderColor = '#00ffff';
        } else { 
            el.style.borderColor = 'transparent'; el.style.backgroundColor = 'transparent';
        }
    });
    
    this.saveSettings();
    if (STATE.screen === 'lobby') document.getElementById('lobby').style.display = 'flex';
};

UI.resetHUD = function() { localStorage.removeItem('dominion_master'); location.reload(); };
