// ==================================================
// cliente.js - COMUNICACIÓN CON EL SERVIDOR CENTRAL
// ==================================================
const Cliente = {
    socket: null,
    conectado: false,

    init: function() {
        try {
            const SERVER_URL = "https://dominion-server-3dhx.onrender.com"; 
            
            this.socket = io(SERVER_URL, {
                reconnection: true,             
                reconnectionAttempts: 10,       
                reconnectionDelay: 2000         
            });

            this.socket.on('connect', () => {
                console.log('🌐 Satélite conectado al núcleo de Dominion');
                this.conectado = true;
                if (typeof STATE !== 'undefined') STATE.miSocketId = this.socket.id;
                
                // 🔥 EL TOQUE MÁGICO: Le gritamos al servidor que acabamos de entrar al lobby
                let equipoElegido = (window.seleccionActual && window.seleccionActual.bando) ? window.seleccionActual.bando : 1;
                this.socket.emit('unirse_sala', { nombre: 'CERO', equipo: equipoElegido });
                
                let uiAviso = document.getElementById('aviso-desconexion');
                if(uiAviso) uiAviso.style.display = 'none';
            });

            this.socket.on('disconnect', (razon) => {
                console.warn('⚠️ Conexión perdida:', razon);
                this.conectado = false;
                
                if (typeof STATE !== 'undefined' && STATE.screen === 'playing') {
                    let uiAviso = document.getElementById('aviso-desconexion');
                    if(uiAviso) {
                        uiAviso.innerText = "RECONECTANDO AL SERVIDOR...";
                        uiAviso.style.display = 'block';
                    }
                }
            });

            // ==================== LOBBY ====================
            this.socket.on('actualizar_sala', (jugadores) => {
                if (typeof UI !== 'undefined' && UI.actualizarSalaEspera) {
                    UI.actualizarSalaEspera(jugadores);
                }
            });

            this.socket.on('iniciar_partida_multijugador', () => {
                if (typeof Game !== 'undefined') {
                    Game.initMatch(window.seleccionActual.clase, false);
                }
            });

            // ==================== COMBATE EN ARENA ====================
            this.socket.on('nuevo_jugador_arena', (jugador) => {
                if (typeof STATE !== 'undefined') {
                    if (!STATE.jugadoresNube) STATE.jugadoresNube = {};
                    STATE.jugadoresNube[jugador.id] = jugador;
                }
            });

            this.socket.on('movimiento_enemigo', (datos) => {
                if (typeof STATE !== 'undefined' && STATE.jugadoresNube) {
                    if (STATE.jugadoresNube[datos.id]) {
                        STATE.jugadoresNube[datos.id].x = datos.x;
                        STATE.jugadoresNube[datos.id].y = datos.y;
                        STATE.jugadoresNube[datos.id].hp = datos.hp;
                        STATE.jugadoresNube[datos.id].lastAngle = datos.lastAngle;
                        STATE.jugadoresNube[datos.id].isAiming = datos.isAiming;
                        STATE.jugadoresNube[datos.id].active = datos.active;
                    } else {
                        STATE.jugadoresNube[datos.id] = datos;
                    }
                }
            });

            this.socket.on('disparo_enemigo', (datos) => {
                if (typeof Proyectiles !== 'undefined') {
                    Proyectiles.agregar(datos.x, datos.y, datos.angle, datos.speed, datos.damage, datos.range, datos.team, datos.color, datos.size);
                }
            });

            this.socket.on('actualizar_vida', (datos) => {
                if (datos.victimaId === this.socket.id && typeof STATE !== 'undefined' && STATE.player.hp > 0) {
                    STATE.player.hp -= datos.daño;
                    if (typeof UI !== 'undefined' && UI.showDamage) {
                        UI.showDamage(STATE.player.x, STATE.player.y, `-${datos.daño}`, '#ff3333');
                    }
                } 
            });

            this.socket.on('jugador_desconectado', (id) => {
                if (typeof STATE !== 'undefined' && STATE.jugadoresNube) {
                    delete STATE.jugadoresNube[id];
                }
            });

        } catch (e) {
            console.warn('⚠️ Radar desconectado. Jugando en modo offline.', e);
        }
    }
};

window.socket = Cliente.socket; 
