const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http, { cors: { origin: "*" } });

// En Render, el puerto lo da el sistema automático. 
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, '../dominion of beta 5')));

let jugadoresEnSala = {};
let jugadoresEnPartida = {}; // Aquí guardaremos X, Y, Vida y Ángulo de todos

io.on('connection', (socket) => {
    let numJugadores = Object.keys(jugadoresEnSala).length;
    let nombreJugador = numJugadores === 0 ? "CERO (Host)" : "Jugador " + (numJugadores + 1);
    
    jugadoresEnSala[socket.id] = { nombre: nombreJugador, equipo: 1 };
    console.log(`🟢 ${nombreJugador} entró a la sala.`);
    
    io.emit('actualizar_sala', jugadoresEnSala);

    socket.on('cambiar_equipo', (nuevoEquipo) => {
        if(jugadoresEnSala[socket.id]) {
            jugadoresEnSala[socket.id].equipo = nuevoEquipo;
            io.emit('actualizar_sala', jugadoresEnSala); 
        }
    });

    socket.on('arrancar_partida', () => {
        console.log('🔥 ¡El líder dio la orden! Arrancando...');
        io.emit('iniciar_juego_todos'); 
    });

    // === NUEVA MAGIA DE BATALLA ===
    socket.on('entrar_arena', (datos) => {
        // Un jugador cargó el mapa, lo registramos en la arena
        jugadoresEnPartida[socket.id] = datos;
    });

    socket.on('mover_jugador', (datos) => {
        // Recibimos la nueva posición y la actualizamos en la nube
        if(jugadoresEnPartida[socket.id]) {
            Object.assign(jugadoresEnPartida[socket.id], datos);
        }
    });

    socket.on('disparar', (datosBala) => {
        // Si alguien dispara, le mandamos la bala a TODOS los demás casi a la velocidad de la luz
        socket.broadcast.emit('bala_enemiga', datosBala);
    });

    socket.on('disconnect', () => {
        console.log(`🔴 ${jugadoresEnSala[socket.id]?.nombre || 'Alguien'} abandonó la conexión.`);
        delete jugadoresEnSala[socket.id];
        delete jugadoresEnPartida[socket.id];
        io.emit('actualizar_sala', jugadoresEnSala); 
    });
});

// === EL LATIDO DEL SERVIDOR ===
// Esto empuja el mapa a todos los celulares 30 veces por segundo (30 FPS)
setInterval(() => {
    if(Object.keys(jugadoresEnPartida).length > 0) {
        io.emit('tick_servidor', jugadoresEnPartida);
    }
}, 1000 / 30);

http.listen(PORT, () => {
    console.log(`🚀 Servidor Dominion activo y escuchando en el puerto ${PORT}`);
});
