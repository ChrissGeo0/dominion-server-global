// ==================================================
// cliente.js - COMUNICACIÓN CON EL SERVIDOR CENTRAL
// ==================================================
const Cliente = {
    socket: null,
    conectado: false,

    init: function() {
        try {
            // 🔥 CONEXIÓN GLOBAL AL SERVIDOR DE RENDER CON RECONEXIÓN AUTOMÁTICA
            const SERVER_URL = "https://dominion-server-3dhx.onrender.com"; 
            
            // Inyectamos los parámetros de reconexión para redes móviles inestables
            this.socket = io(SERVER_URL, {
                reconnection: true,             // Activa la reconexión automática
                reconnectionAttempts: 10,       // Intenta reconectar hasta 10 veces
                reconnectionDelay: 2000         // Espera 2 segundos entre intentos
            });

            this.socket.on('connect', () => {
                console.log('🌐 Satélite conectado al núcleo de Dominion');
                this.conectado = true;
                if (typeof STATE !== 'undefined') STATE.miSocketId = this.socket.id;
                
                // Ocultar mensaje de reconexión si existiera en la interfaz
                let uiAviso = document.getElementById('aviso-desconexion');
                if(uiAviso) uiAviso.style.display = 'none';
            });

            // === MANEJO DE CAÍDAS DE RED (WIFI/DATOS) ===
            this.socket.on('disconnect', (razon) => {
                console.warn('⚠️ Conexión perdida:', razon);
                this.conectado = false;
                
                // Si estamos a mitad de partida, podemos mostrar un aviso visual (opcional)
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
                    Game.initMatch(STATE.player.class, false);
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

            // ⚔️ ÁRBITRO DE DAÑO MULTIJUGADOR
            this.socket.on('actualizar_vida', (datos) => {
                // Si el servidor dice que YO recibí un golpe
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

// Exponemos el socket de forma global para que game.js pueda enviar datos
window.socket = Cliente.socket; 
