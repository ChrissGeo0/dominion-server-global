const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http, { cors: { origin: "*" } });

// 1. Render nos da el puerto automáticamente
const PORT = process.env.PORT || 3000;

// 2. Le decimos que los archivos del juego están en esta misma carpeta
app.use(express.static(__dirname)); 

let jugadoresEnSala = {};

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

    socket.on('disconnect', () => {
        console.log(`🔴 ${jugadoresEnSala[socket.id]?.nombre} abandonó la sala.`);
        delete jugadoresEnSala[socket.id];
        io.emit('actualizar_sala', jugadoresEnSala);
    });
});

http.listen(PORT, () => {
    console.log(`🚀 Servidor Dominion activo en puerto ${PORT}`);
});
