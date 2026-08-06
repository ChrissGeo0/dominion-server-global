// ==================================================
// audio.js - GESTOR DE MÚSICA Y EFECTOS DE SONIDO
// ==================================================

const AudioEngine = {
    bgmMatch: null,     
    bgmLobby: null,     
    sfxPool: {},        
    volMusica: 0.4,     
    volEfectos: 0.9,    
    isMuted: false,
    desbloqueado: false,
    currentTrack: null, 

    init: function() {
        this.bgmMatch = new Audio('audiomapa.mp3'); 
        this.bgmMatch.loop = true;
        
        this.bgmLobby = new Audio('audiolobby.mp3'); 
        this.bgmLobby.loop = true;

        // --- ARSENAL DE SONIDOS DE COMBATE ---
        this.sfxPool['ataque-SOUL-SNIPER'] = new Audio('flecha.mp3');
        this.sfxPool['ataque-SHADOWBLADE'] = new Audio('cuchilla.mp3');
        this.sfxPool['ataque-ASH-GUARD'] = new Audio('mazo.mp3');
        // === BUG FIX: SONIDO DE LA DRUIDA REGISTRADO ===
        this.sfxPool['ataque-NATURE-DRUID'] = new Audio('magia.mp3');
        
        // Sonidos del entorno
        this.sfxPool['torreta'] = new Audio('torreta.mp3');
        this.sfxPool['nexo'] = new Audio('nexo.mp3');
        // ----------------------------------------------
        
        const unlockAudio = () => {
            if (this.desbloqueado) return;
            
            // Muteamos solo la música para el desbloqueo silencioso
            this.bgmMatch.volume = 0; 
            this.bgmLobby.volume = 0;
            
            let p1 = this.bgmMatch.play().catch(e => {});
            let p2 = this.bgmLobby.play().catch(e => {});
            
            // Solo exigimos que las pistas de música respondan para desbloquear el motor
            Promise.all([p1, p2]).then(() => {
                this.bgmMatch.pause(); this.bgmMatch.currentTime = 0;
                this.bgmLobby.pause(); this.bgmLobby.currentTime = 0;
                
                this.bgmMatch.volume = this.volMusica; 
                this.bgmLobby.volume = this.volMusica; 
                this.desbloqueado = true;
                
                ['click', 'pointerdown', 'touchstart', 'keydown'].forEach(evt => {
                    document.removeEventListener(evt, unlockAudio, true);
                });
                console.log("¡Motor de Audio y Música Desbloqueados con Éxito! 🎧");
                
                let lobby = document.getElementById('classic-client');
                if (lobby && lobby.style.display !== 'none' && lobby.style.display !== '') {
                    this.playTrack(this.bgmLobby);
                }
            }).catch(e => {
                console.warn("Esperando interacción para audio...");
            });
        };
        
        ['click', 'pointerdown', 'touchstart', 'keydown'].forEach(evt => {
            document.addEventListener(evt, unlockAudio, true);
        });
    },

    playTrack: function(track) {
        if (this.isMuted || !track) return;
        if (this.currentTrack && this.currentTrack !== track) {
            this.currentTrack.pause();
        }
        this.currentTrack = track;
        this.currentTrack.play().catch(e => {});
    },

    stopAllMusic: function() {
        if (this.bgmMatch) { this.bgmMatch.pause(); this.bgmMatch.currentTime = 0; }
        if (this.bgmLobby) { this.bgmLobby.pause(); this.bgmLobby.currentTime = 0; }
        this.currentTrack = null;
    },

    playSFX: function(nombreEfecto, volumenPersonalizado = null) {
        if (this.isMuted || !this.sfxPool[nombreEfecto]) return;
        
        let sonidoCopia = this.sfxPool[nombreEfecto].cloneNode();
        sonidoCopia.volume = volumenPersonalizado !== null ? volumenPersonalizado : this.volEfectos;
        
        sonidoCopia.play().catch(e => {
            // Si falta algún archivo de mp3 de arma, no rompe el juego, solo lo ignora silenciosamente
        });
        
        sonidoCopia.onended = function() {
            sonidoCopia.remove();
        };
    },

    setVolumeMusica: function(valor) {
        this.volMusica = valor;
        if (this.bgmMatch) this.bgmMatch.volume = this.volMusica;
        if (this.bgmLobby) this.bgmLobby.volume = this.volMusica;
    },

    toggleMute: function() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            if (this.currentTrack) this.currentTrack.pause();
        } else if (this.currentTrack) {
            this.currentTrack.play();
        }
    }
};

// ==================================================
// AUTOMAGIA: Conexión con los estados del juego
// ==================================================
window.addEventListener('load', () => {
    AudioEngine.init();

    // 1. INICIAR MÚSICA PARTIDA
    if (typeof UI !== 'undefined' && UI.updateHUD) {
        const originalUpdateHUD = UI.updateHUD;
        UI.updateHUD = function(estadoGlobal) {
            if (estadoGlobal && estadoGlobal.screen === 'playing') {
                if (AudioEngine.currentTrack !== AudioEngine.bgmMatch && AudioEngine.desbloqueado) {
                    AudioEngine.playTrack(AudioEngine.bgmMatch);
                }
            }
            originalUpdateHUD.apply(this, arguments);
        };
    }

    // 2. VIGILANTE LOBBY / GAME OVER
    setInterval(() => {
        let lobby = document.getElementById('classic-client');
        let gameOver = document.getElementById('game-over-screen');
        
        let enLobby = lobby && lobby.style.display !== 'none' && lobby.style.display !== '';
        let enGameOver = gameOver && gameOver.style.display !== 'none' && gameOver.style.display !== '';

        if (enLobby) {
            if (AudioEngine.currentTrack !== AudioEngine.bgmLobby && AudioEngine.desbloqueado) {
                AudioEngine.playTrack(AudioEngine.bgmLobby);
            }
        } else if (enGameOver) {
            if (AudioEngine.currentTrack !== null) {
                AudioEngine.stopAllMusic();
            }
        }
    }, 1000); 

    // 3. AUTOMAGIA DE SFX: Interceptar Ataques según Personaje
    if (typeof Habilidades !== 'undefined' && Habilidades.executeAttack) {
        const ataqueOriginal = Habilidades.executeAttack;
        Habilidades.executeAttack = function(atacante, objetivo, stats, state) {
            
            let sonidoArma = 'ataque-' + atacante.class;

            if (atacante === state.player) {
                AudioEngine.playSFX(sonidoArma, 0.9);
            } else {
                let dx = atacante.x - state.player.x;
                let dy = atacante.y - state.player.y;
                let distancia = Math.sqrt(dx*dx + dy*dy);
                
                if (distancia < 1500) { 
                    let volBot = Math.max(0.05, 0.4 - (distancia / 2000));
                    AudioEngine.playSFX(sonidoArma, volBot);
                }
            }
            
            ataqueOriginal.apply(this, arguments);
        };
    }
});
