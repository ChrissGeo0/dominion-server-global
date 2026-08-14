// ==================================================
// server.js - BACKEND Y MULTIJUGADOR (Modo Pruebas)
// ==================================================
const express = require('express');
const app = express();
const http = require('http').createServer(app);

// Configuración de red
const io = require('socket.io')(http, {
    cors: { origin: "*" },
    pingTimeout: 10000,
    pingInterval: 5000
});

const PORT = process.env.PORT || 3000; 

let jugadoresEnSala = {};

io.on('connection', (socket) => {
    console.log(`🟢 Guerrero conectado: ${socket.id}`);

    // === LOBBY ===
    socket.on('unirse_sala', (datos) => {
        jugadoresEnSala[socket.id] = { ...datos, id: socket.id, listo: false };
        io.emit('actualizar_sala', jugadoresEnSala);
    });

    socket.on('cambiar_equipo', (equipo) => {
        if (jugadoresEnSala[socket.id]) {
            jugadoresEnSala[socket.id].equipo = equipo;
            io.emit('actualizar_sala', jugadoresEnSala);
        }
    });

    socket.on('jugador_listo', (estado) => {
        if (jugadoresEnSala[socket.id]) {
            jugadoresEnSala[socket.id].listo = estado;
            io.emit('actualizar_sala', jugadoresEnSala);
            
            let arrayJugadores = Object.values(jugadoresEnSala);
            let todosListos = arrayJugadores.length > 0 && arrayJugadores.every(j => j.listo);
            
            // 🔥 SOLUCIÓN: Permite iniciar la partida aunque estés tú solo probando (>= 1)
            if (todosListos && arrayJugadores.length >= 1) {
                io.emit('iniciar_partida_multijugador');
            }
        }
    });

    // === COMBATE ===
    socket.on('entrar_arena', (datos) => {
        if (jugadoresEnSala[socket.id]) {
            jugadoresEnSala[socket.id] = { ...jugadoresEnSala[socket.id], ...datos };
            socket.broadcast.emit('nuevo_jugador_arena', jugadoresEnSala[socket.id]);
        }
    });

    socket.on('mover_jugador', (datos) => {
        socket.broadcast.emit('movimiento_enemigo', { id: socket.id, ...datos });
    });

    socket.on('disparar', (datos) => {
        socket.broadcast.emit('disparo_enemigo', { id: socket.id, ...datos });
    });

    socket.on('registrar_impacto', (datos) => {
        io.emit('actualizar_vida', datos);
    });

    // === DESCONEXIÓN ===
    socket.on('disconnect', () => {
        console.log(`🔴 Guerrero desconectado: ${socket.id}`);
        delete jugadoresEnSala[socket.id];
        io.emit('actualizar_sala', jugadoresEnSala);
        io.emit('jugador_desconectado', socket.id);
    });
});

http.listen(PORT, () => {
    console.log(`🚀 Servidor Dominion operando en el puerto ${PORT}`);
});
