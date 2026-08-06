// ==================================================
// ia.js - CEREBRO TÁCTICO (LIMPIO Y OPTIMIZADO)
// ==================================================

const IA = {
    init: function(isSimulation = false, estadoGlobal = STATE) {
        if (estadoGlobal.isTutorial) return; 
        
        let pClass = estadoGlobal.player ? estadoGlobal.player.class : ''; 
        let pTeam = estadoGlobal.player ? estadoGlobal.player.team : 1;
        let eTeam = pTeam === 1 ? 2 : 1; 
        
        // --- CONFIGURACIÓN DEL EQUIPO ENEMIGO (3 BOTS) ---
        let classesEnemigas = ['ASH-GUARD', 'SHADOWBLADE', 'SOUL-SNIPER']; 
        
        if (estadoGlobal.dificultad === 'medio') {
            classesEnemigas = ['ASH-GUARD', 'FLAME-MAGE', 'STEEL-MERCENARY']; 
        } else if (estadoGlobal.dificultad === 'hades') {
            classesEnemigas = ['RAGE-BRAWLER', 'FLAME-MAGE', 'STEEL-MERCENARY']; 
        }
        
        let lanes = { 'ASH-GUARD': 'top', 'SHADOWBLADE': 'mid', 'SOUL-SNIPER': 'bot', 'NATURE-DRUID': 'bot', 'ABYSSAL-PIRATE': 'mid', 'STEEL-MERCENARY': 'top', 'RAGE-BRAWLER': 'bot', 'FLAME-MAGE': 'mid' }; 
        
        classesEnemigas.forEach(c => this.spawnBot(eTeam, c, CONFIG.ROLES[c], lanes[c] || 'mid'));
        
        // --- CONFIGURACIÓN DEL EQUIPO ALIADO (JUGADOR + 2 BOTS = 3VS3) ---
        let poolAliada = ['ASH-GUARD', 'NATURE-DRUID', 'SOUL-SNIPER', 'SHADOWBLADE', 'ABYSSAL-PIRATE', 'STEEL-MERCENARY', 'RAGE-BRAWLER', 'FLAME-MAGE'];
        let botsAliadosSpawneados = 0;
        let limiteAliados = isSimulation ? 3 : 2; 

        poolAliada.forEach(c => { 
            if ((isSimulation || c !== pClass) && botsAliadosSpawneados < limiteAliados) {
                this.spawnBot(pTeam, c, CONFIG.ROLES[c], lanes[c] || 'mid'); 
                botsAliadosSpawneados++;
            }
        });
    },
    
    spawnBot: function(team, roleClass, stats, lane) {
        let startX = team === 1 ? 1825 : 1825;
        let startY = team === 1 ? 300 : 3350;
        
        STATE.bots.push({
            id: 'bot_' + STATE.bots.length,
            isBot: true, team: team, class: roleClass, lane: lane,
            x: startX, y: startY, 
            hp: stats.maxHp, maxHp: stats.maxHp, mp: stats.maxMp || 140, maxMp: stats.maxMp || 140,
            baseSpeed: stats.speed, speed: stats.speed, radius: stats.radius, atkRange: stats.atkRange, atkSpread: stats.atkSpread, 
            atkSpeed: stats.atkSpeed, hyperRange: stats.hyperRange, hyperSpread: stats.hyperSpread, hyperVis: stats.hyperVis, 
            normalDamage: stats.normalDamage, fov: stats.fov, range: stats.range, skillCost: stats.skillCost, 
            maxCd: stats.maxCd, cd: 0, vx: 0, vy: 0, aimAngle: 0, lastAngle: 0, chargeTimer: 0, isHyperReady: false, 
            lastAtk: 0, showAtk: 0, deadTimer: 0, target: null, inTree: false, currentTree: null, revealTimer: 0, pingTimer: 0, 
            hitFlash: 0, radarTimer: 0, visible: true, active: false, activeTimer: 0, kills: 0, deaths: 0, damageDealt: 0, 
            damageTaken: 0, turretsCaptured: 0, nexusDmgKills: 0, nexusLossDeaths: 0, controlFrames: 0, 
            nexusDmgControl: 0, aimingAtk: false, isGuarding: false, lastPos: { x: startX, y: startY }, 
            stuckTimer: 0, stuckAngle: 0,
            stoneTimer: 0, stunTimer: 0, slowTimer: 0, purifyTimer: 0,
            shield: 0, speedBuffTimer: 0, poisonTimer: 0, poisonAttacker: null, furyTimer: 0, mageBuffTimer: 0
        });
    },

    obtenerEnemigosEnRango: function(ent, range, estadoGlobal) {
        let targets = estadoGlobal.mode === 'playing' ? [estadoGlobal.player, ...estadoGlobal.bots] : estadoGlobal.bots;
        
        if (estadoGlobal.ballestas) {
            targets = targets.concat(estadoGlobal.ballestas.filter(b => b.hp > 0));
        }
        
        let rSq = range * range;
        
        return targets.filter(e => {
            if (e.team === ent.team || e.hp <= 0) return false;
            
            let esInvisible = false;
            if (e.active) esInvisible = true;
            
            let mismoArbol = (ent.currentTree && e.currentTree && ent.currentTree === e.currentTree);
            if (e.inTree && e.revealTimer <= 0 && !mismoArbol) esInvisible = true;
            if (e.poisonTimer && e.poisonTimer > 0) esInvisible = false;
            if (e.isBallesta) esInvisible = false; 
            
            if (esInvisible) return false;
            
            let distSq = ((e.x - ent.x)*(e.x - ent.x) + (e.y - ent.y)*(e.y - ent.y));
            if (distSq > rSq) return false;
            
            return Colisiones.lineaDeVision(ent.x, ent.y, e.x, e.y);
        });
    },

    obtenerStatsDinamicas: function(ent, isMoving) {
        let s = { range: ent.atkRange, spread: ent.atkSpread, fov: ent.fov };
        if (isMoving) { 
            s.spread = ent.atkSpread * 2.0; 
            s.range = ent.atkRange * 0.8; 
        } else if (ent.isHyperReady) { 
            s.range = ent.hyperRange; 
            s.spread = ent.hyperSpread; 
        }
        if (ent.isAimingRight || (ent.isBot && ent.aimingAtk)) s.range = s.range * 1.15;
        return s;
    },

    update: function(estadoGlobal) {
        let alliesAll = estadoGlobal.mode === 'playing' ? [estadoGlobal.player, ...estadoGlobal.bots] : estadoGlobal.bots;
        
        estadoGlobal.bots.forEach(bot => {
            
            if (estadoGlobal.isTutorial) {
                bot.vx = 0; bot.vy = 0; bot.aimingAtk = false; 
                return;
            }

            if (bot.hp <= 0) {
                if (bot.deadTimer === 0) {
                    bot.deadTimer = 300;
                    if (bot.team === 1) { 
                        estadoGlobal.nexusBlue = Math.max(0, estadoGlobal.nexusBlue - 3); 
                        estadoGlobal.stats.blue.pointsLostToDeaths += 3; 
                    }
                    if (bot.team === 2) { 
                        estadoGlobal.nexusRed = Math.max(0, estadoGlobal.nexusRed - 3); 
                        estadoGlobal.stats.red.pointsLostToDeaths += 3; 
                    }
                    bot.x = bot.team === 1 ? 1825 : 1825; 
                    bot.y = bot.team === 1 ? 300 : 3350;
                    bot.vx = 0; bot.vy = 0; 
                }
                if (--bot.deadTimer <= 0) { 
                    bot.hp = bot.maxHp; bot.mp = bot.maxMp; bot.deadTimer = 0; 
                    bot.aimingAtk = false; bot.chargeTimer = 0; bot.isHyperReady = false; bot.target = null;
                    bot.isGuarding = false; bot.stuckTimer = 0; bot.inTree = false; bot.currentTree = null;
                    bot.shield = 0; bot.speedBuffTimer = 0; bot.poisonTimer = 0; bot.furyTimer = 0; bot.mageBuffTimer = 0;
                }
                return;
            }

            bot.speed = bot.baseSpeed;
            if (bot.speedBuffTimer > 0) bot.speed *= 1.25;
            if (bot.furyTimer > 0) bot.speed *= 1.15;
            if (bot.mageBuffTimer > 0) bot.speed *= 1.15; // === VELOCIDAD DEL MAGO ===
            if (bot.slowTimer > 0) bot.speed *= 0.35; 
            if (bot.purifyTimer > 0) bot.speed *= 1.3;

            if (bot.stunTimer > 0) {
                bot.vx = 0; bot.vy = 0;
                bot.aimingAtk = false; bot.isGuarding = false;
                return; 
            }
            
            bot.inTree = false;
            bot.currentTree = null;
            if (WORLD.trees) {
                for(let i=0; i < WORLD.trees.length; i++) {
                    let t = WORLD.trees[i];
                    if (t.active) {
                        let dx = bot.x - t.x; let dy = bot.y - t.y;
                        if(dx*dx + dy*dy < 70*70) { 
                            bot.inTree = true; bot.currentTree = t; break; 
                        }
                    }
                }
            }
            
            if (bot.revealTimer > 0) bot.revealTimer--;
            if (bot.cd > 0) bot.cd--;
            if (bot.mp < bot.maxMp) bot.mp = Math.min(bot.maxMp, bot.mp + CONFIG.MANA_REGEN);
            
            if (bot.activeTimer > 0) {
                bot.activeTimer--;
                if (bot.activeTimer <= 0) bot.active = false;
            }
            
            let base = bot.team === 1 ? {x:1825,y:300} : {x:1825,y:3350};
            let distBaseSq = (bot.x - base.x)*(bot.x - base.x) + (bot.y - base.y)*(bot.y - base.y);
            if (distBaseSq < 150 * 150 && bot.hp < bot.maxHp) bot.hp = Math.min(bot.maxHp, bot.hp + 0.5);
            
            if (estadoGlobal.matchFrames % 15 === 0 || !bot.target) {
                let enemies = this.obtenerEnemigosEnRango(bot, bot.range, estadoGlobal).sort((a,b) => {
                    let distA = (bot.x - a.x)*(bot.x - a.x) + (bot.y - a.y)*(bot.y - a.y);
                    let distB = (bot.x - b.x)*(bot.x - b.x) + (bot.y - b.y)*(bot.y - b.y);
                    return distA - distB; 
                });
                
                bot.isGuarding = false;
                if (bot.hp < bot.maxHp * 0.35) {
                    bot.target = base; 
                } else {
                    let aliadoTirador = null;
                    if (bot.class === 'ASH-GUARD' || bot.class === 'NATURE-DRUID') {
                        aliadoTirador = alliesAll.find(a => a.team === bot.team && a.class === 'SOUL-SNIPER' && a.hp > 0 && a.id !== bot.id);
                    }
                    if (aliadoTirador) {
                        let enemiesThreatening = enemies.filter(e => {
                            return ((e.x - aliadoTirador.x)*(e.x - aliadoTirador.x) + (e.y - aliadoTirador.y)*(e.y - aliadoTirador.y)) < 500 * 500; 
                        });
                        if (enemiesThreatening.length > 0) {
                            bot.target = enemiesThreatening[0]; 
                        } else if (enemies.length > 0) {
                            bot.target = enemies[0]; 
                        } else {
                            bot.target = aliadoTirador; 
                            bot.isGuarding = true;
                        }
                    } else if (enemies.length > 0) {
                        bot.target = enemies[0]; 
                    } else {
                        let enemyBase = bot.team === 1 ? {x:1825,y:3350} : {x:1825,y:300};
                        let targetTurret = null;
                        if (WORLD.turrets.length > 0) {
                            let validTurrets = WORLD.turrets.filter(t => t.team !== bot.team);
                            if (validTurrets.length > 0) {
                                validTurrets.sort((a,b) => {
                                    let distA = (bot.x - a.x)*(bot.x - a.x) + (bot.y - a.y)*(bot.y - a.y);
                                    let distB = (bot.x - b.x)*(bot.x - b.x) + (bot.y - b.y)*(bot.y - b.y);
                                    return distA - distB;
                                });
                                targetTurret = validTurrets[0];
                            }
                        }
                        bot.target = targetTurret ? targetTurret : enemyBase;
                    }
                }
            }
            
            let isMoving = false;
            if (bot.target) {
                let dxT = bot.target.x - bot.x, dyT = bot.target.y - bot.y;
                let distSq = dxT*dxT + dyT*dyT;
                let ang = Math.atan2(dyT, dxT);
                
                let shouldStop = false;
                if (bot.isGuarding && bot.target && bot.target.class === 'SOUL-SNIPER') {
                    if (distSq < 150 * 150) shouldStop = true; 
                } else if (bot.target.hp !== undefined) {
                    if (distSq < (bot.atkRange * 0.8) * (bot.atkRange * 0.8)) shouldStop = true;
                } else if (bot.target.range !== undefined) { 
                    if (distSq < (bot.target.range * 0.5) * (bot.target.range * 0.5)) shouldStop = true;
                }
                
                if (shouldStop) {
                    isMoving = false;
                    bot.vx = 0; bot.vy = 0;
                } else {
                    isMoving = true;
                    let bestAng = ang; 
                    
                    if (estadoGlobal.matchFrames % 15 === 0) { 
                        let distMovedSq = (bot.x - bot.lastPos.x)*(bot.x - bot.lastPos.x) + (bot.y - bot.lastPos.y)*(bot.y - bot.lastPos.y);
                        if (distMovedSq < 15) { 
                            bot.stuckTimer = 25; 
                            bot.stuckAngle = ang + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2); 
                        }
                        bot.lastPos = { x: bot.x, y: bot.y };
                    }
                    
                    if (bot.stuckTimer > 0) {
                        bot.stuckTimer--;
                        bestAng = bot.stuckAngle;
                    } else {
                        let maxDist = 0; let bMargin = bot.radius + 15;
                        let murosLocales = Colisiones.getMurosCercanos(bot.x, bot.y, 250); 
                        let wCount = murosLocales.length;
                        let anglesToTest = [0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9, 1.2, -1.2, 1.5, -1.5, 1.8, -1.8, 2.2, -2.2, 2.6, -2.6, Math.PI];
                        
                        for (let off of anglesToTest) {
                            let a = ang + off; let fDist = 240;
                            let cosA = Math.cos(a), sinA = Math.sin(a);
                            for (let i = 20; i <= 240; i += 20) {
                                let rx = bot.x + cosA * i, ry = bot.y + sinA * i;
                                let hit = false;
                                for(let j=0; j < wCount; j++) {
                                    let w = murosLocales[j];
                                    if (rx > w.x - bMargin && rx < w.x+w.w+bMargin && ry > w.y - bMargin && ry < w.y+w.h+bMargin) { hit = true; break; }
                                }
                                if (hit) { fDist = i; break; }
                            }
                            if (fDist === 240) { bestAng = a; break; }
                            if (fDist > maxDist) { maxDist = fDist; bestAng = a; }
                        }
                    }
                    bot.vx = Math.cos(bestAng) * bot.speed; bot.vy = Math.sin(bestAng) * bot.speed; bot.lastAngle = bestAng;
                }
            } else { 
                bot.vx = 0; bot.vy = 0; 
            }
            
            let atkEnemies = this.obtenerEnemigosEnRango(bot, bot.atkRange, estadoGlobal).sort((a,b) => {
                let distA = (bot.x - a.x)*(bot.x - a.x) + (bot.y - a.y)*(bot.y - a.y);
                let distB = (bot.x - b.x)*(bot.x - b.x) + (bot.y - b.y)*(bot.y - b.y);
                return distA - distB;
            });
            
            if (atkEnemies.length > 0) {
                bot.aimingAtk = true;
                if (!bot.isHyperReady) bot.chargeTimer = 0;
                if (Date.now() - bot.lastAtk > bot.atkSpeed) Habilidades.executeAttack(bot, atkEnemies[0], this.obtenerStatsDinamicas(bot, isMoving), estadoGlobal);
            } else {
                bot.aimingAtk = false;
                if (++bot.chargeTimer >= 150) { bot.isHyperReady = true; bot.chargeTimer = 150; }
            }
            
            if (bot.cd <= 0 && bot.mp >= bot.skillCost) {
                if (bot.class === 'NATURE-DRUID') {
                    let aliadosHeridos = alliesAll.filter(a => a.team === bot.team && a.hp > 0 && a.hp < a.maxHp * 0.75 && ((a.x - bot.x)**2 + (a.y - bot.y)**2) <= 400*400);
                    if (aliadosHeridos.length > 0 || (bot.hp < bot.maxHp * 0.6 && bot.target)) {
                        Habilidades.executeSkill(bot, estadoGlobal);
                    }
                } 
                else if (bot.class === 'ABYSSAL-PIRATE') {
                    if (bot.target) {
                        let objType = bot.target.range ? 'torreta' : (bot.target.hp ? 'personaje' : 'base');
                        if (objType === 'torreta' && !isMoving) {
                            Habilidades.executeSkill(bot, estadoGlobal); 
                        } else if (objType === 'personaje' && bot.hp < bot.maxHp * 0.5 && isMoving) {
                            Habilidades.executeSkill(bot, estadoGlobal); 
                        }
                    }
                }
                else if (bot.class === 'STEEL-MERCENARY') {
                    if (bot.target) {
                        let objType = bot.target.range ? 'torreta' : (bot.target.hp ? 'personaje' : 'base');
                        if ((objType === 'torreta' && !isMoving) || (objType === 'personaje' && isMoving)) {
                            Habilidades.executeSkill(bot, estadoGlobal); 
                        }
                    }
                }
                else if (bot.class === 'RAGE-BRAWLER') {
                    if (bot.target && bot.target.hp) {
                        let dx = bot.target.x - bot.x, dy = bot.target.y - bot.y;
                        if (dx*dx + dy*dy <= 400 * 400) {
                            Habilidades.executeSkill(bot, estadoGlobal); 
                        }
                    }
                }
                // === NUEVA IA PARA EL MAGO DE FUEGO ===
                else if (bot.class === 'FLAME-MAGE') {
                    if (bot.target && bot.target.hp) {
                        let dx = bot.target.x - bot.x, dy = bot.target.y - bot.y;
                        // Si está peleando de cerca o media distancia, lanza la bola de fuego
                        if (dx*dx + dy*dy <= 500 * 500) {
                            Habilidades.executeSkill(bot, estadoGlobal); 
                        }
                    }
                }
                else if (bot.aimingAtk && Date.now() - bot.lastAtk > bot.atkSpeed) {
                    Habilidades.executeSkill(bot, estadoGlobal);
                }
            }
        });
    }
};
