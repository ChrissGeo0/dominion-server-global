// ==================================================
// tutorial.js - MODO DE ENTRENAMIENTO (CON VOZ REFORZADA)
// ==================================================

const Tutorial = {
    active: false, step: 0, waypoint: null, dummyBot: null,
    
    texts: [
        "Novato... Soy CERO. Escúchame bien. Usa el joystick izquierdo y muévete hacia el pilar de luz verde brillante.",
        "Perfecto. He generado un dron enemigo. Se te ha activado el botón de apuntar. Usa tu joystick derecho (AIM) y destrúyelo.",
        "Nada mal. Ahora viene un dron más resistente. He desbloqueado tu Habilidad especial (SKILL). Úsala para hacerlo pedazos rápido.",
        "Bien hecho. Para dominar la arena, párate sobre el anillo de la torreta central y roba su energía.",
        "¡Excelente! El camino a su base está abierto. Hackeé el Nexo enemigo de arriba y le bajé los escudos a 30 de vida. ¡Ve y destrúyelo!"
    ],

    // FUNCIÓN DE VOZ ROBÓTICA REFORZADA
    speak: function(text) {
        if ('speechSynthesis' in window) {
            // Cancelamos cualquier audio acumulado para que no se sature
            window.speechSynthesis.resume();
            window.speechSynthesis.cancel(); 

            let msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'es-MX'; // Español latino
            msg.pitch = 0.4;    // Tono grave/robótico
            msg.rate = 1.05;    // Velocidad fluida
            
            // Intentamos forzar la voz en español si el dispositivo la tiene instalada
            let voces = window.speechSynthesis.getVoices();
            let vozEspañol = voces.find(v => v.lang.includes('es') || v.lang.includes('ES'));
            if (vozEspañol) {
                msg.voice = vozEspañol;
            }

            window.speechSynthesis.speak(msg);
        } else {
            console.log("Tu navegador no soporta síntesis de voz nativa.");
        }
    },

    init: function() {
        this.active = true; 
        this.step = 1; 
        this.waypoint = {x: 1825, y: 1400, radius: 100};
        STATE.isTutorial = true;
        
        // Despertar la API de voz obligatoriamente con el toque del botón
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // Bloquear todos los botones avanzados al inicio
        document.getElementById('atk-stick').style.opacity = '0';
        document.getElementById('atk-stick').style.pointerEvents = 'none';
        document.getElementById('skill-stick').style.opacity = '0';
        document.getElementById('skill-stick').style.pointerEvents = 'none';
        document.getElementById('recall-btn').style.opacity = '0';
        document.getElementById('recall-btn').style.pointerEvents = 'none';

        // Lanzar el primer mensaje (Voz + Texto)
        setTimeout(() => {
            UI.showRadio(this.texts[0]);
            this.speak(this.texts[0]);
        }, 1500);
    },

    update: function(p, estadoGlobal) {
        if(!this.active) return;
        
        let dx = p.x - (this.waypoint ? this.waypoint.x : 0);
        let dy = p.y - (this.waypoint ? this.waypoint.y : 0);
        let distSq = dx*dx + dy*dy;

        // FASE 1: LLEGAR AL CENTRO
        if (this.step === 1) {
            if (distSq < this.waypoint.radius * this.waypoint.radius) {
                this.step = 2; this.waypoint = null;
                
                document.getElementById('atk-stick').style.opacity = '1';
                document.getElementById('atk-stick').style.pointerEvents = 'auto';
                
                UI.showRadio(this.texts[1]);
                this.speak(this.texts[1]);
                
                IA.spawnBot(2, 'SOUL-SNIPER', CONFIG.ROLES['SOUL-SNIPER'], 'mid');
                this.dummyBot = estadoGlobal.bots[0];
                this.dummyBot.x = 1825; this.dummyBot.y = 1000;
                this.dummyBot.speed = 0; 
            }
        } 
        // FASE 2: DESTRUIR PRIMER BOT (ATAQUE BÁSICO)
        else if (this.step === 2) {
            if (this.dummyBot && this.dummyBot.hp <= 0) {
                this.step = 3; 
                document.getElementById('skill-stick').style.opacity = '1';
                document.getElementById('skill-stick').style.pointerEvents = 'auto';
                
                UI.showRadio(this.texts[2]);
                this.speak(this.texts[2]);

                IA.spawnBot(2, 'ASH-GUARD', CONFIG.ROLES['ASH-GUARD'], 'mid');
                this.dummyBot = estadoGlobal.bots[1];
                this.dummyBot.x = 1825; this.dummyBot.y = 900;
                this.dummyBot.maxHp = 500; 
                this.dummyBot.hp = 500;
                this.dummyBot.speed = 0;
            }
        }
        // FASE 3: DESTRUIR SEGUNDO BOT (CON HABILIDAD)
        else if (this.step === 3) {
            if (this.dummyBot && this.dummyBot.hp <= 0) {
                this.step = 4;
                this.dummyBot = null;
                this.waypoint = {x: 1827, y: 1735, radius: 170}; 
                
                UI.showRadio(this.texts[3]);
                this.speak(this.texts[3]);
            }
        }
        // FASE 4: CAPTURAR TORRETA
        else if (this.step === 4) {
            let t = WORLD.turrets[1];
            if (t.team === 1) { 
                this.step = 5;
                this.waypoint = {x: 1825, y: 3350, radius: 250}; 
                estadoGlobal.nexusRed = 30;
                
                UI.showRadio(this.texts[4]);
                this.speak(this.texts[4]);
            }
        } 
        // FASE 5: DESTRUIR NEXO
        else if (this.step === 5) {
            if (estadoGlobal.nexusRed <= 0) {
                this.active = false;
                this.waypoint = null;
                let msgFin = "¡Magnífico! Tienes lo necesario para sobrevivir en la Night Arena.";
                UI.showRadio(msgFin);
                this.speak(msgFin);
            }
        }
    }
};
