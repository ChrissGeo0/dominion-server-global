// ==================================================
// mecanicas.js - LÓGICA DE FÍSICAS, ATAQUES Y COLISIONES
// ==================================================

const Colisiones = {
    cellSize: 250, cells: {}, checkId: 0,
    
    init: function() {
        this.cells = {};
        WORLD.walls.forEach(w => {
            w.lastCheck = 0;
            let minX = Math.floor(w.x / this.cellSize), maxX = Math.floor((w.x + w.w) / this.cellSize);
            let minY = Math.floor(w.y / this.cellSize), maxY = Math.floor((w.y + w.h) / this.cellSize);
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    let key = x + ',' + y;
                    if (!this.cells[key]) this.cells[key] = [];
                    this.cells[key].push(w);
                }
            }
        });
    },
    
    getMurosCercanos: function(x, y, padding) {
        let minX = Math.floor((x - padding) / this.cellSize), maxX = Math.floor((x + padding) / this.cellSize);
        let minY = Math.floor((y - padding) / this.cellSize), maxY = Math.floor((y + padding) / this.cellSize);
        let found = []; this.checkId++;
        
        for (let cx = minX; cx <= maxX; cx++) {
            for (let cy = minY; cy <= maxY; cy++) {
                let cell = this.cells[cx + ',' + cy];
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        let w = cell[i];
                        if (w.lastCheck !== this.checkId) { w.lastCheck = this.checkId; found.push(w); }
                    }
                }
            }
        }
        return found;
    },
    
    distanciaAlMuro: function(x, y, angle, maxDist, padding = 0) {
        let steps = maxDist / 10;
        let sX = Math.cos(angle) * 10, sY = Math.sin(angle) * 10;
        let cx = x, cy = y;
        
        for(let i = 0; i < steps; i++) {
            cx += sX; cy += sY;
            let hit = false;
            
            if (padding > 0) {
                let murosLocales = this.getMurosCercanos(cx, cy, padding + 20);
                for(let j = 0; j < murosLocales.length; j++) {
                    let w = murosLocales[j];
                    if (cx > w.x - padding && cx < w.x + w.w + padding && cy > w.y - padding && cy < w.y + w.h + padding) {
                        hit = true; break;
                    }
                }
            } else {
                let cellX = Math.floor(cx / this.cellSize);
                let cellY = Math.floor(cy / this.cellSize);
                let cell = this.cells[cellX + ',' + cellY];
                if (cell) {
                    for(let j = 0; j < cell.length; j++) {
                        let w = cell[j];
                        if(cx > w.x && cx < w.x + w.w && cy > w.y && cy < w.y + w.h) {
                            hit = true; break;
                        }
                    }
                }
            }
            if (hit) return Math.max(0, i * 10);
        }
        return maxDist; 
    },
    
    aplicarMovimiento: function(entidad) {
        if (entidad.hp <= 0 || (entidad.stoneTimer && entidad.stoneTimer > 0) || (entidad.stunTimer && entidad.stunTimer > 0) || entidad.isHooked) return;
        if (Math.abs(entidad.vx) < 0.01 && Math.abs(entidad.vy) < 0.01) return;
        
        let hitbox = entidad.radius + 2;
        let nx = entidad.x + entidad.vx, ny = entidad.y + entidad.vy;
        let murosLocales = this.getMurosCercanos(entidad.x, entidad.y, 50);
        let wCount = murosLocales.length;
        let hitX = false, hitY = false;
        
        for(let i = 0; i < wCount; i++) {
            let w = murosLocales[i];
            if (!hitX && nx > w.x - hitbox && nx < w.x + w.w + hitbox && entidad.y > w.y - hitbox && entidad.y < w.y + w.h + hitbox) hitX = true;
            if (!hitY && entidad.x > w.x - hitbox && entidad.x < w.x + w.w + hitbox && ny > w.y - hitbox && ny < w.y + w.h + hitbox) hitY = true;
            if (hitX && hitY) break;
        }
        
        if (!hitX) entidad.x = nx; else entidad.vx = 0;
        if (!hitY) entidad.y = ny; else entidad.vy = 0;
        entidad.x = Math.max(25, Math.min(CONFIG.MAP_SIZE - 25, entidad.x));
        entidad.y = Math.max(25, Math.min(CONFIG.MAP_SIZE - 25, entidad.y));
    },
    
    lineaDeVision: function(x1, y1, x2, y2) {
        let dx = x2 - x1, dy = y2 - y1;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let steps = dist / 15, stepX = dx / steps, stepY = dy / steps;
        let cx = x1, cy = y1;
        
        for(let i = 0; i < steps; i++) {
            let cellX = Math.floor(cx / this.cellSize);
            let cellY = Math.floor(cy / this.cellSize);
            let cell = this.cells[cellX + ',' + cellY];
            
            if (cell) {
                for (let j = 0; j < cell.length; j++) {
                    let w = cell[j];
                    if (cx > w.x && cx < w.x + w.w && cy > w.y && cy < w.y + w.h) return false; 
                }
            }
            cx += stepX; cy += stepY;
        }
        return true; 
    },
    
    update: function(estadoGlobal) {
        if (!estadoGlobal) return;
        if (estadoGlobal.player && estadoGlobal.player.hp > 0) this.aplicarMovimiento(estadoGlobal.player);
        if (estadoGlobal.bots) estadoGlobal.bots.forEach(bot => this.aplicarMovimiento(bot));
    }
}; 

const Habilidades = {
    triggerAttack: function(entidad) {
        if (entidad.inTree) { 
            entidad.revealTimer = 120; 
            entidad.pingTimer = 18; 
            if (entidad.currentTree) {
                entidad.currentTree.active = false; 
                entidad.inTree = false;
                entidad.currentTree = null;
            }
        }
        if (entidad.active) {
            entidad.active = false;
            entidad.activeTimer = 0;
        }
    },
    
    aplicarDano: function(objetivo, cantidad, atacante, estadoGlobal) {
        if (objetivo.stoneTimer && objetivo.stoneTimer > 0) return;
        if (objetivo.hp > 0) {
            
            let danoRestante = cantidad;
            if (objetivo.shield && objetivo.shield > 0) {
                if (objetivo.shield >= danoRestante) {
                    objetivo.shield -= danoRestante;
                    danoRestante = 0;
                } else {
                    danoRestante -= objetivo.shield;
                    objetivo.shield = 0;
                }
            }
            
            let danoReal = Math.min(objetivo.hp, danoRestante);
            objetivo.hp -= danoReal;
            objetivo.damageTaken = (objetivo.damageTaken || 0) + danoReal;
            
            if (estadoGlobal.mode === 'playing') {
                let color = (atacante && atacante.team === 1) ? '#33ccff' : '#ff3333';
                if (danoRestante < cantidad && danoReal === 0) color = '#bbbbbb'; 
                else if (atacante && atacante.isHyperReady) color = '#ffeb3b';
                
                UI.showDamage(objetivo.x, objetivo.y, danoReal > 0 ? danoReal : "Escudo", color);
                
                if (!objetivo.isBallesta && (objetivo.isPlayer || (atacante && atacante.isPlayer))) {
                    STATE.cameraShake = (danoReal > 50) ? 20 : 10;
                    if(atacante && atacante.isPlayer && danoReal > 0) {
                        STATE.hitStopTimer = CONFIG.UX.hitStop;
                    }
                }
            }
            if (atacante && !atacante.isBallesta) atacante.damageDealt = (atacante.damageDealt || 0) + danoReal;
            
            if (objetivo.hp <= 0) {
                if (!objetivo.isBallesta) {
                    objetivo.deaths++;
                    let puntosPerdidos = objetivo.isPlayer ? 15 : 3;
                    objetivo.nexusLossDeaths = (objetivo.nexusLossDeaths || 0) + puntosPerdidos;
                    if (atacante && atacante !== objetivo && !atacante.isBallesta) {
                        atacante.kills++;
                        atacante.nexusDmgKills = (atacante.nexusDmgKills || 0) + puntosPerdidos;
                    }
                    if (objetivo.isPlayer !== undefined) objetivo.hitFlash = 5;
                }
            }
        }
    },
    
    ataqueCuerpoACuerpo: function(atacante, dStats, estadoGlobal) {
        let posiblesObjetivos = estadoGlobal.mode === 'playing' ? estadoGlobal.bots.concat(atacante === estadoGlobal.player ? [] : [estadoGlobal.player]) : estadoGlobal.bots;
        
        if (estadoGlobal.ballestas) {
            posiblesObjetivos = posiblesObjetivos.concat(estadoGlobal.ballestas.filter(b => b.hp > 0));
        }
        
        posiblesObjetivos.forEach(objetivo => {
            if (objetivo.hp > 0 && objetivo.team !== atacante.team) {
                
                let mismoArbol = (atacante.currentTree && objetivo.currentTree && atacante.currentTree === objetivo.currentTree);
                let esInvisible = objetivo.active || (objetivo.inTree && objetivo.revealTimer <= 0 && !mismoArbol);
                
                if (objetivo.isBallesta) esInvisible = false;
                
                if (esInvisible) return;
                
                let dx = objetivo.x - atacante.x, dy = objetivo.y - atacante.y;
                let distSq = dx * dx + dy * dy;
                let rangoEfectivo = dStats.range + objetivo.radius;
                
                if (distSq <= rangoEfectivo * rangoEfectivo) {
                    let anguloAlObjetivo = Math.atan2(dy, dx);
                    let difAngulo = Math.abs(anguloAlObjetivo - atacante.lastAngle);
                    if (difAngulo > Math.PI) difAngulo = 2 * Math.PI - difAngulo;
                    
                    if (difAngulo < dStats.spread && Colisiones.lineaDeVision(atacante.x, atacante.y, objetivo.x, objetivo.y)) {
                        this.aplicarDano(objetivo, atacante.normalDamage, atacante, estadoGlobal);
                    }
                }
            }
        });
    },
    
    executeAttack: function(atacante, objetivo, dStats, estadoGlobal) {
        if (objetivo) atacante.lastAngle = Math.atan2(objetivo.y - atacante.y, objetivo.x - atacante.x);
        this.triggerAttack(atacante);
        
        if (atacante.isPlayer && atacante.isHyperReady) STATE.cameraShake = 25;
        
        if (atacante.class === 'SOUL-SNIPER' || atacante.class === 'NATURE-DRUID' || atacante.class === 'FLAME-MAGE') {
            Proyectiles.disparar(atacante, dStats, estadoGlobal);
        } else {
            atacante.showAtk = atacante.isHyperReady ? 20 : 15;
            this.ataqueCuerpoACuerpo(atacante, dStats, estadoGlobal);
            estadoGlobal.effects.push({
                id: ++estadoGlobal.effectIdCounter, x: atacante.x, y: atacante.y, angle: atacante.lastAngle,
                life: 15, maxLife: 15, type: 'slash', team: atacante.team
            });
        }
        
        atacante.lastAtk = Date.now();
        if (atacante.isHyperReady) { atacante.isHyperReady = false; atacante.chargeTimer = 0; }
    },
    
    executeSkill: function(entidad, estadoGlobal) {
        entidad.mp -= entidad.skillCost; 
        entidad.cd = entidad.maxCd;
        this.triggerAttack(entidad);
        
        if (entidad.class === 'SOUL-SNIPER') {
            let dashAng;
            if (entidad.isPlayer) {
                dashAng = (entidad.team === 1) ? entidad.manualAimAngle + Math.PI : entidad.manualAimAngle;
                entidad.lastAngle = dashAng; 
            } else {
                dashAng = (entidad.hp > entidad.maxHp * 0.5) ? entidad.lastAngle : entidad.lastAngle + Math.PI;
            }
            
            let murosLocales = Colisiones.getMurosCercanos(entidad.x, entidad.y, 180);
            let wCount = murosLocales.length;
            let hitboxSeguro = entidad.radius + 5;
            
            for(let i = 0; i < 18; i++) {
                let nx = entidad.x + Math.cos(dashAng) * 10, ny = entidad.y + Math.sin(dashAng) * 10;
                let hit = false;
                for(let j = 0; j < wCount; j++) {
                    let w = murosLocales[j];
                    if (nx > w.x - hitboxSeguro && nx < w.x + w.w + hitboxSeguro && ny > w.y - hitboxSeguro && ny < w.y + w.h + hitboxSeguro) { hit = true; break; }
                }
                if(hit) break;
                entidad.x = nx; entidad.y = ny;
            }
        } 
        else if (entidad.class === 'SHADOWBLADE') {
            entidad.active = true; 
            entidad.activeTimer = 120; 
        } 
        else if (entidad.class === 'ASH-GUARD') {
            entidad.radarTimer = 42;
        }
        else if (entidad.class === 'NATURE-DRUID') {
            let allEnts = estadoGlobal.mode === 'playing' ? [estadoGlobal.player, ...estadoGlobal.bots] : estadoGlobal.bots;
            
            allEnts.forEach(t => {
                if (t.team === entidad.team && t.hp > 0) {
                    let dx = t.x - entidad.x; let dy = t.y - entidad.y;
                    if (dx * dx + dy * dy <= 400 * 400) {
                        t.speedBuffTimer = 90; 
                        t.shield = 70;         
                    }
                }
            });
            estadoGlobal.effects.push({
                id: ++estadoGlobal.effectIdCounter, x: entidad.x, y: entidad.y, angle: 0,
                life: 20, maxLife: 20, type: 'druid_buff', team: entidad.team
            });
        }
        else if (entidad.class === 'ABYSSAL-PIRATE') {
            if (!estadoGlobal.trampas) estadoGlobal.trampas = [];
            let misTrampas = estadoGlobal.trampas.filter(t => t.attacker && t.attacker.id === entidad.id);
            if (misTrampas.length >= 3) {
                let oldest = misTrampas[0]; 
                estadoGlobal.trampas = estadoGlobal.trampas.filter(t => t !== oldest);
            }
            estadoGlobal.trampas.push({
                x: entidad.x, y: entidad.y, team: entidad.team, attacker: entidad, life: 750, radius: 40
            });
        }
        else if (entidad.class === 'STEEL-MERCENARY') {
            if (!estadoGlobal.ballestas) estadoGlobal.ballestas = [];
            let misBallestas = estadoGlobal.ballestas.filter(b => b.attacker && b.attacker.id === entidad.id);
            if (misBallestas.length >= 2) {
                let oldest = misBallestas[0];
                estadoGlobal.ballestas = estadoGlobal.ballestas.filter(b => b !== oldest);
            }
            estadoGlobal.ballestas.push({
                id: ++estadoGlobal.effectIdCounter, isBallesta: true, x: entidad.x, y: entidad.y,
                team: entidad.team, attacker: entidad, life: 390, hp: 150, maxHp: 150, radius: 15, cd: 0, lastAngle: 0
            });
        }
        else if (entidad.class === 'RAGE-BRAWLER') {
            entidad.furyTimer = 150; 
            entidad.shield = 120; 
            estadoGlobal.effects.push({
                id: ++estadoGlobal.effectIdCounter, x: entidad.x, y: entidad.y, angle: 0,
                life: 20, maxLife: 20, type: 'fury_buff', team: entidad.team
            });
        }
        else if (entidad.class === 'FLAME-MAGE') {
            entidad.mageBuffTimer = 120; 
            estadoGlobal.bullets.push({
                id: ++estadoGlobal.bulletIdCounter, type: 'fuego',
                x: entidad.x, y: entidad.y, angle: entidad.lastAngle,
                life: 35, speed: 20, size: 15, damage: 120, 
                team: entidad.team, attacker: entidad, color: 0xff4500 
            });
        }
    },

    executeSkill2: function(entidad, estadoGlobal) {
        this.triggerAttack(entidad); 
        let tipo = entidad.skill2Type || 'gancho';
        
        if (tipo === 'piedra') {
            entidad.stoneTimer = 90; 
        } 
        else if (tipo === 'gancho') {
            estadoGlobal.bullets.push({
                id: ++estadoGlobal.bulletIdCounter, type: 'hook',
                x: entidad.x, y: entidad.y, angle: entidad.skill2Angle || entidad.lastAngle,
                life: 28, speed: 25, size: 10, damage: 35, 
                team: entidad.team, attacker: entidad, color: 0xfacc15 
            });
        }
        else if (tipo === 'stun') {
            estadoGlobal.bullets.push({
                id: ++estadoGlobal.bulletIdCounter, type: 'stun',
                x: entidad.x, y: entidad.y, angle: entidad.skill2Angle || entidad.lastAngle,
                life: 25, speed: 28, size: 12, damage: 20, 
                team: entidad.team, attacker: entidad, color: 0xffaa00 
            });
        }
        else if (tipo === 'hielo') {
            estadoGlobal.bullets.push({
                id: ++estadoGlobal.bulletIdCounter, type: 'hielo',
                x: entidad.x, y: entidad.y, angle: entidad.skill2Angle || entidad.lastAngle,
                life: 35, speed: 20, size: 15, damage: 30, 
                team: entidad.team, attacker: entidad, color: 0x00ffff 
            });
        }
        else if (tipo === 'purificar') {
            entidad.stoneTimer = 0;
            entidad.stunTimer = 0;
            entidad.slowTimer = 0;
            entidad.isHooked = false;
            entidad.hookAttacker = null;
            entidad.purifyTimer = 78; 
            estadoGlobal.effects.push({
                id: ++estadoGlobal.effectIdCounter, x: entidad.x, y: entidad.y, angle: 0,
                life: 20, maxLife: 20, type: 'purify', team: entidad.team
            });
        }
        // === FIX TELEPORT: ATRAVESAR MUROS CON 1000 DE RANGO ===
        else if (tipo === 'teleport') {
            let rangoMaximo = 1000;
            let angulo = entidad.skill2Angle !== undefined ? entidad.skill2Angle : entidad.lastAngle;
            
            let paddingSeguro = entidad.radius + 5;
            let distReal = rangoMaximo;
            
            // Calculamos el destino final simulado para ver si cruza el muro correctamente
            let targetX = entidad.x + Math.cos(angulo) * rangoMaximo;
            let targetY = entidad.y + Math.sin(angulo) * rangoMaximo;
            let murosDestino = Colisiones.getMurosCercanos(targetX, targetY, paddingSeguro);
            let destinoOcupado = false;
            
            for (let j = 0; j < murosDestino.length; j++) {
                let w = murosDestino[j];
                if (targetX > w.x - paddingSeguro && targetX < w.x + w.w + paddingSeguro &&
                    targetY > w.y - paddingSeguro && targetY < w.y + w.h + paddingSeguro) {
                    destinoOcupado = true;
                    break;
                }
            }
            
            // Si el destino aterriza DENTRO del muro, frenamos justo antes de chocar
            if (destinoOcupado) {
                distReal = Colisiones.distanciaAlMuro(entidad.x, entidad.y, angulo, rangoMaximo, paddingSeguro);
            }
            
            entidad.teleportTargetX = entidad.x + Math.cos(angulo) * distReal;
            entidad.teleportTargetY = entidad.y + Math.sin(angulo) * distReal;
            
            entidad.teleportTimer = 78;
            
            estadoGlobal.effects.push({
                id: ++estadoGlobal.effectIdCounter, x: entidad.x, y: entidad.y, angle: 0,
                life: 30, maxLife: 30, type: 'purify', team: entidad.team
            });
        }
    },
    
    updateEnvironment: function(estadoGlobal) {
        let allEnts = estadoGlobal.mode === 'playing' ? [estadoGlobal.player, ...estadoGlobal.bots] : estadoGlobal.bots;
        
        if (!estadoGlobal.ballestas) estadoGlobal.ballestas = [];
        for (let i = estadoGlobal.ballestas.length - 1; i >= 0; i--) {
            let b = estadoGlobal.ballestas[i];
            b.life--;
            
            if (b.hp <= 0 || b.life <= 0) {
                estadoGlobal.ballestas.splice(i, 1);
                continue;
            }
            
            if (b.cd > 0) b.cd--;
            if (b.cd <= 0) {
                let target = null; let minDist = 350 * 350; 
                for (let t of allEnts) {
                    if (t.hp > 0 && t.team !== b.team && !t.active && (!t.stoneTimer || t.stoneTimer <= 0)) {
                        if (t.inTree && t.revealTimer <= 0) continue;
                        
                        let dx = t.x - b.x, dy = t.y - b.y;
                        let distSq = dx*dx + dy*dy;
                        if (distSq <= minDist && Colisiones.lineaDeVision(b.x, b.y, t.x, t.y)) {
                            minDist = distSq; target = t;
                        }
                    }
                }
                if (target) {
                    b.lastAngle = Math.atan2(target.y - b.y, target.x - b.x);
                    b.cd = 72; 
                    estadoGlobal.bullets.push({
                        id: ++estadoGlobal.bulletIdCounter, x: b.x, y: b.y, angle: b.lastAngle,
                        life: 20, speed: 25, size: 8, damage: 35, team: b.team, attacker: b.attacker, color: 0xa1a1aa, type: 'ballesta'
                    });
                    
                    estadoGlobal.effects.push({
                        id: ++estadoGlobal.effectIdCounter, x: b.x, y: b.y, angle: b.lastAngle,
                        life: 10, maxLife: 10, type: 'slash', team: b.team
                    });
                }
            }
        }

        if (!estadoGlobal.trampas) estadoGlobal.trampas = [];
        for (let i = estadoGlobal.trampas.length - 1; i >= 0; i--) {
            let t = estadoGlobal.trampas[i];
            t.life--;
            let hit = false;
            
            allEnts.forEach(ent => {
                if (!hit && ent.hp > 0 && ent.team !== t.team && !ent.active && (!ent.stoneTimer || ent.stoneTimer <= 0)) {
                    let dx = ent.x - t.x, dy = ent.y - t.y;
                    if (dx*dx + dy*dy <= (t.radius + ent.radius)**2) {
                        ent.poisonTimer = 180; 
                        ent.poisonAttacker = t.attacker; 
                        hit = true;
                    }
                }
            });
            
            if (hit || t.life <= 0) {
                estadoGlobal.trampas.splice(i, 1); 
            }
        }

        allEnts.forEach(ent => {
            let roleMp = CONFIG.ROLES[ent.class].maxMp || 140;
            if (ent.maxMp !== roleMp) {
                ent.maxMp = roleMp;
                if (ent.mp > ent.maxMp) ent.mp = ent.maxMp;
            }

            if (ent.skill2Cd && ent.skill2Cd > 0) ent.skill2Cd--;
            if (ent.stoneTimer && ent.stoneTimer > 0) ent.stoneTimer--;
            if (ent.stunTimer && ent.stunTimer > 0) ent.stunTimer--;
            if (ent.slowTimer && ent.slowTimer > 0) ent.slowTimer--;
            if (ent.purifyTimer && ent.purifyTimer > 0) ent.purifyTimer--;
            
            if (ent.teleportTimer && ent.teleportTimer > 0) {
                ent.teleportTimer--;
                ent.vx = 0; ent.vy = 0; 
                
                if (ent.teleportTimer <= 0) {
                    ent.x = ent.teleportTargetX;
                    ent.y = ent.teleportTargetY;
                    
                    estadoGlobal.effects.push({
                        id: ++estadoGlobal.effectIdCounter, x: ent.x, y: ent.y, angle: 0,
                        life: 20, maxLife: 20, type: 'purify', team: ent.team
                    });
                }
            }

            if (ent.speedBuffTimer && ent.speedBuffTimer > 0) {
                ent.speedBuffTimer--;
                if (ent.speedBuffTimer <= 0) ent.shield = 0;
            }
            
            if (ent.furyTimer && ent.furyTimer > 0) {
                ent.furyTimer--;
                if (ent.furyTimer <= 0) ent.shield = 0; 
            }

            if (ent.mageBuffTimer && ent.mageBuffTimer > 0) {
                ent.mageBuffTimer--;
            }

            if (ent.poisonTimer && ent.poisonTimer > 0) {
                ent.poisonTimer--;
                ent.revealTimer = Math.max(ent.revealTimer, 10); 
                
                if (ent.poisonTimer % 30 === 0) { 
                    Habilidades.aplicarDano(ent, 17.5, ent.poisonAttacker, estadoGlobal);
                }
            }

            if (ent.isHooked && ent.hookAttacker) {
                let dx = ent.hookAttacker.x - ent.x; let dy = ent.hookAttacker.y - ent.y; let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 80) { ent.x += (dx / dist) * 18; ent.y += (dy / dist) * 18; } 
                else { ent.isHooked = false; ent.hookAttacker = null; }
            }

            if (ent.hp > 0 && ent.hp < ent.maxHp) {
                let myBase = ent.team === 1 ? {x: 1825, y: 300} : {x: 1825, y: 3350};
                let distBaseSq = (ent.x - myBase.x)**2 + (ent.y - myBase.y)**2;
                if (distBaseSq <= 450 * 450) {
                    ent.hp = Math.min(ent.maxHp, ent.hp + 0.5); 
                }
            }
        });

        allEnts.forEach(ent => {
            if (ent.hp > 0 && ent.radarTimer > 0 && ent.class === 'ASH-GUARD') {
                let r = 700 * (1 - (ent.radarTimer / 42)); 
                let rSq = r * r; 
                allEnts.forEach(t => {
                    if (t.hp > 0 && t.team !== ent.team) {
                        let distSq = (t.x - ent.x)*(t.x - ent.x) + (t.y - ent.y)*(t.y - ent.y);
                        if (distSq <= rSq) t.revealTimer = Math.max(t.revealTimer, 18);
                    }
                });
            }
        });
        
        if (estadoGlobal.mode === 'playing' && estadoGlobal.player) {
            let pTeam = estadoGlobal.player.team;  
            let allies = estadoGlobal.bots.filter(b => b.team === pTeam && b.hp > 0);
            if (estadoGlobal.player.hp > 0) allies.push(estadoGlobal.player);
            let alliedTurrets = WORLD.turrets.filter(t => t.team === pTeam);
            
            estadoGlobal.bots.forEach(bot => {
                if (bot.team === pTeam) {
                    bot.visible = true; 
                } else {
                    bot.visible = allies.some(a => {
                        let dx = bot.x - a.x, dy = bot.y - a.y;
                        let distSq = dx * dx + dy * dy;
                        let visionRange = a.isHyperReady ? a.hyperVis : (a.range * 0.6);
                        let estaEnCirculo = distSq <= (visionRange * visionRange);
                        
                        let linternaRange = a.isHyperReady ? a.hyperVis : a.range; 
                        let anguloAlBot = Math.atan2(dy, dx);
                        let difAngulo = Math.abs(anguloAlBot - a.lastAngle);
                        if (difAngulo > Math.PI) difAngulo = 2 * Math.PI - difAngulo;
                        let estaEnCono = (distSq <= (linternaRange * linternaRange)) && (difAngulo <= (a.fov / 2)); 
                        
                        return (estaEnCirculo || estaEnCono) && Colisiones.lineaDeVision(a.x, a.y, bot.x, bot.y);
                    });
                    
                    if (!bot.visible) {
                        bot.visible = alliedTurrets.some(t => {
                            let dx = bot.x - t.x, dy = bot.y - t.y;
                            let visionTorreta = t.range * 2.25; 
                            return (dx*dx + dy*dy) <= (visionTorreta * visionTorreta) && Colisiones.lineaDeVision(t.x, t.y, bot.x, bot.y);
                        });
                        
                        if (!bot.visible) {
                            let myBase = pTeam === 1 ? {x: 1825, y: 300} : {x: 1825, y: 3350};
                            let dx = bot.x - myBase.x, dy = bot.y - myBase.y;
                            if ((dx*dx + dy*dy) <= (450 * 450)) {
                                bot.visible = true;
                            }
                        }

                        if (!bot.visible && WORLD.pickups) {
                            bot.visible = WORLD.pickups.some(pk => {
                                if (!pk.active) return false;
                                let dx = bot.x - pk.x, dy = bot.y - pk.y;
                                let visionPickup = 120; 
                                return (dx*dx + dy*dy) <= (visionPickup * visionPickup) && Colisiones.lineaDeVision(pk.x, pk.y, bot.x, bot.y);
                            });
                        }
                    }
                }
            });
        }
        
        let bC = 0, rC = 0;
        WORLD.turrets.forEach(t => {
            let oldTeam = t.team;
            let rSq = t.range * t.range;
            let t1Ents = allEnts.filter(e => e.team === 1 && e.hp > 0 && ((e.x - t.x)*(e.x - t.x) + (e.y - t.y)*(e.y - t.y)) < rSq);
            let t2Ents = allEnts.filter(e => e.team === 2 && e.hp > 0 && ((e.x - t.x)*(e.x - t.x) + (e.y - t.y)*(e.y - t.y)) < rSq);
            
            let t1 = t1Ents.length > 0, t2 = t2Ents.length > 0;
            if (t1 && !t2) t.progress = Math.min(360, t.progress + 1.5);
            else if (t2 && !t1) t.progress = Math.max(-360, t.progress - 1.5);
            else {
                if (t.progress > 0) t.progress = Math.max(0, t.progress - 0.3);
                else if (t.progress < 0) t.progress = Math.min(0, t.progress + 0.3);
            }
            if (t.progress >= 360) t.team = 1;
            else if (t.progress <= -360) t.team = 2;
            else if (t.team === 1 && t.progress <= 0) t.team = 0;
            else if (t.team === 2 && t.progress >= 0) t.team = 0;
            
            if (t.team !== oldTeam && t.team !== 0) {
                let capturers = t.team === 1 ? t1Ents : t2Ents;
                capturers.forEach(c => c.turretsCaptured = (c.turretsCaptured || 0) + 1);
            }
            if (t.team === 1) bC++;
            if (t.team === 2) rC++;
        });
        
        if (bC > 0) estadoGlobal.stats.blue.turretFrames += bC; 
        if (rC > 0) estadoGlobal.stats.red.turretFrames += rC;
        if (estadoGlobal.matchFrames % 60 === 0) {
            if (bC > 0) { estadoGlobal.nexusRed = Math.max(0, estadoGlobal.nexusRed - bC); estadoGlobal.stats.red.pointsLostToTurrets += bC; }
            if (rC > 0) { estadoGlobal.nexusBlue = Math.max(0, estadoGlobal.nexusBlue - rC); estadoGlobal.stats.blue.pointsLostToTurrets += rC; }
        }
    }
}; 

const Proyectiles = {
    disparar: function(atacante, stats, estadoGlobal) {
        let idBala = ++estadoGlobal.bulletIdCounter;
        
        let colorBala = atacante.team === 1 ? 0x00ffff : 0xff3333;
        if (atacante.class === 'NATURE-DRUID') colorBala = 0x4ade80; 
        if (atacante.class === 'FLAME-MAGE') colorBala = 0xffa500; 
        
        estadoGlobal.bullets.push({
            id: idBala, x: atacante.x, y: atacante.y, angle: atacante.lastAngle, 
            life: Math.ceil(stats.range / 45), speed: 45, size: atacante.isHyperReady ? 15 : 10, 
            damage: atacante.normalDamage, team: atacante.team, hyper: atacante.isHyperReady, 
            attacker: atacante, color: colorBala 
        });
    },
    
    update: function(estadoGlobal) {
        if (!estadoGlobal || !estadoGlobal.bullets) return;
        let allEnts = [estadoGlobal.player, ...estadoGlobal.bots];
        let validTargets = allEnts.filter(t => t.hp > 0 && !t.active);
        
        if (estadoGlobal.ballestas) {
            validTargets = validTargets.concat(estadoGlobal.ballestas.filter(b => b.hp > 0));
        }
        
        for (let i = estadoGlobal.bullets.length - 1; i >= 0; i--) { 
            let b = estadoGlobal.bullets[i];
            let hit = false;
            
            if (b.type === 'hook') {
                b.x += Math.cos(b.angle) * b.speed; b.y += Math.sin(b.angle) * b.speed;
                let hitWall = false; let murosLocales = Colisiones.getMurosCercanos(b.x, b.y, b.speed + 10);
                for (let j = 0; j < murosLocales.length; j++) { let w = murosLocales[j]; if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) { hitWall = true; break; } }
                if (hitWall) { hit = true; }
                else {
                    for (let t of validTargets) {
                        if (t.team !== b.team && t.purifyTimer <= 0 && (!t.stoneTimer || t.stoneTimer <= 0)) {
                            let dx = b.x - t.x, dy = b.y - t.y; let rad = t.radius + 15; 
                            if ((dx*dx + dy*dy) < (rad * rad)) { t.isHooked = true; t.hookAttacker = b.attacker; Habilidades.aplicarDano(t, b.damage, b.attacker, estadoGlobal); hit = true; break; }
                        }
                    }
                }
                if (hit || --b.life <= 0) estadoGlobal.bullets.splice(i, 1);
                continue; 
            }

            if (b.type === 'stun') {
                b.x += Math.cos(b.angle) * b.speed; b.y += Math.sin(b.angle) * b.speed;
                let hitWall = false; let murosLocales = Colisiones.getMurosCercanos(b.x, b.y, b.speed + 10);
                for (let j = 0; j < murosLocales.length; j++) { let w = murosLocales[j]; if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) { hitWall = true; break; } }
                if (hitWall) { hit = true; }
                else {
                    for (let t of validTargets) {
                        if (t.team !== b.team && t.purifyTimer <= 0 && (!t.stoneTimer || t.stoneTimer <= 0)) {
                            let dx = b.x - t.x, dy = b.y - t.y; let rad = t.radius + 15;
                            if ((dx*dx + dy*dy) < (rad * rad)) {
                                t.stunTimer = 78; 
                                Habilidades.aplicarDano(t, b.damage, b.attacker, estadoGlobal);
                                hit = true; break;
                            }
                        }
                    }
                }
                if (hit || --b.life <= 0) estadoGlobal.bullets.splice(i, 1);
                continue;
            }

            if (b.type === 'hielo') {
                b.x += Math.cos(b.angle) * b.speed; b.y += Math.sin(b.angle) * b.speed;
                let hitWall = false; let murosLocales = Colisiones.getMurosCercanos(b.x, b.y, b.speed + 10);
                for (let j = 0; j < murosLocales.length; j++) { let w = murosLocales[j]; if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) { hitWall = true; break; } }
                
                let hitTarget = false;
                if (!hitWall) {
                    for (let t of validTargets) {
                        if (t.team !== b.team && t.purifyTimer <= 0 && (!t.stoneTimer || t.stoneTimer <= 0)) {
                            let dx = b.x - t.x, dy = b.y - t.y; let rad = t.radius + 15;
                            if ((dx*dx + dy*dy) < (rad * rad)) { hitTarget = true; break; }
                        }
                    }
                }

                if (hitWall || hitTarget || --b.life <= 0) {
                    for (let t of validTargets) {
                        if (t.team !== b.team && t.purifyTimer <= 0 && (!t.stoneTimer || t.stoneTimer <= 0)) {
                            let dx = b.x - t.x, dy = b.y - t.y;
                            if ((dx*dx + dy*dy) < (180 * 180)) { 
                                t.slowTimer = 90; 
                                Habilidades.aplicarDano(t, b.damage, b.attacker, estadoGlobal);
                            }
                        }
                    }
                    estadoGlobal.effects.push({
                        id: ++estadoGlobal.effectIdCounter, x: b.x, y: b.y, angle: 0,
                        life: 15, maxLife: 15, type: 'hielo_aoe', team: b.team
                    });
                    estadoGlobal.bullets.splice(i, 1);
                }
                continue;
            }
            
            if (b.type === 'fuego') {
                b.x += Math.cos(b.angle) * b.speed; b.y += Math.sin(b.angle) * b.speed;
                let hitWall = false; let murosLocales = Colisiones.getMurosCercanos(b.x, b.y, b.speed + 10);
                for (let j = 0; j < murosLocales.length; j++) { let w = murosLocales[j]; if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) { hitWall = true; break; } }
                
                let hitTarget = false;
                if (!hitWall) {
                    for (let t of validTargets) {
                        if (t.team !== b.team && t.purifyTimer <= 0 && (!t.stoneTimer || t.stoneTimer <= 0)) {
                            let dx = b.x - t.x, dy = b.y - t.y; let rad = t.radius + 15;
                            if ((dx*dx + dy*dy) < (rad * rad)) { hitTarget = true; break; }
                        }
                    }
                }

                if (hitWall || hitTarget || --b.life <= 0) {
                    for (let t of validTargets) {
                        if (t.team !== b.team && t.purifyTimer <= 0 && (!t.stoneTimer || t.stoneTimer <= 0)) {
                            let dx = b.x - t.x, dy = b.y - t.y;
                            if ((dx*dx + dy*dy) < (180 * 180)) { 
                                Habilidades.aplicarDano(t, b.damage, b.attacker, estadoGlobal);
                            }
                        }
                    }
                    estadoGlobal.effects.push({
                        id: ++estadoGlobal.effectIdCounter, x: b.x, y: b.y, angle: 0,
                        life: 15, maxLife: 15, type: 'fuego_aoe', team: b.team
                    });
                    estadoGlobal.bullets.splice(i, 1);
                }
                continue;
            }

            if (b.type === 'ballesta') {
                let steps = Math.ceil(b.speed / 5); 
                let sX = (Math.cos(b.angle) * b.speed) / steps;
                let sY = (Math.sin(b.angle) * b.speed) / steps;
                let murosLocales = Colisiones.getMurosCercanos(b.x, b.y, b.speed + 10);
                let wCount = murosLocales.length;
                
                for (let s = 0; s < steps; s++) {
                    b.x += sX; b.y += sY; 
                    for (let j = 0; j < wCount; j++) {
                        let w = murosLocales[j];
                        if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) { hit = true; break; }
                    }
                    if (hit) break;
                    
                    for (let t of validTargets) { 
                        if (t.team !== b.team) { 
                            let dx = b.x - t.x, dy = b.y - t.y;
                            let rad = t.radius + 5;
                            if ((dx*dx + dy*dy) < (rad * rad)) { 
                                Habilidades.aplicarDano(t, b.damage, b.attacker, estadoGlobal);
                                hit = true; break; 
                            }
                        }
                    }
                    if(hit) break; 
                }
                if (hit || --b.life <= 0) estadoGlobal.bullets.splice(i, 1); 
                continue;
            }

            let steps = Math.ceil(b.speed / 5); 
            let sX = (Math.cos(b.angle) * b.speed) / steps;
            let sY = (Math.sin(b.angle) * b.speed) / steps;
            let murosLocales = Colisiones.getMurosCercanos(b.x, b.y, b.speed + 10);
            let wCount = murosLocales.length;
            
            for (let s = 0; s < steps; s++) {
                b.x += sX; b.y += sY; 
                for (let j = 0; j < wCount; j++) {
                    let w = murosLocales[j];
                    if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) { hit = true; break; }
                }
                if (hit) break;
                
                for (let t of validTargets) { 
                    if (t.team !== b.team) { 
                        let dx = b.x - t.x, dy = b.y - t.y;
                        let rad = t.radius + 5;
                        if ((dx*dx + dy*dy) < (rad * rad)) { 
                            Habilidades.aplicarDano(t, b.damage, b.attacker, estadoGlobal);
                            hit = true; break; 
                        }
                    }
                }
                if(hit) break; 
            }
            if (hit || --b.life <= 0) estadoGlobal.bullets.splice(i, 1); 
        }
    }
};
