const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http, { cors: { origin: "*" } });

const PORT = 3000;
app.use(express.static(path.join(__dirname, '../dominion of beta 5')));

// La libreta de Termux: Aquí anotaremos quién está y en qué equipo
let jugadoresEnSala = {};

io.on('connection', (socket) => {
    // Si eres el primero, te llamas "CERO (Host)", si no, "Jugador X"
    let numJugadores = Object.keys(jugadoresEnSala).length;
    let nombreJugador = numJugadores === 0 ? "CERO (Host)" : "Jugador " + (numJugadores + 1);
    
    // Anotamos al jugador en el equipo AZUL (1) por defecto
    jugadoresEnSala[socket.id] = { nombre: nombreJugador, equipo: 1 };
    console.log(`🟢 ${nombreJugador} entró a la sala.`);
    
    // Le mandamos la libreta actualizada a todos los celulares
    io.emit('actualizar_sala', jugadoresEnSala);

    // Cuando alguien toca "UNIRSE AL AZUL" o "ROJO", actualizamos y avisamos
    socket.on('cambiar_equipo', (nuevoEquipo) => {
        if(jugadoresEnSala[socket.id]) {
            jugadoresEnSala[socket.id].equipo = nuevoEquipo;
            io.emit('actualizar_sala', jugadoresEnSala); // Grito a todos: ¡Alguien cambió de bando!
        }
    });

    socket.on('arrancar_partida', () => {
        console.log('🔥 ¡El líder dio la orden! Arrancando...');
        io.emit('iniciar_juego_todos'); 
    });

    socket.on('disconnect', () => {
        console.log(`🔴 ${jugadoresEnSala[socket.id]?.nombre} abandonó la sala.`);
        delete jugadoresEnSala[socket.id];
        io.emit('actualizar_sala', jugadoresEnSala); // Grito a todos: ¡Alguien se fue!
    });
});

http.listen(PORT, () => {
    console.log(`🚀 Servidor Dominion activo y escuchando en el puerto ${PORT}`);
    console.log(`Sala de espera abierta...`);
});
