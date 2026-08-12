// ==================================================
// game.js - CEREBRO, BUCLE Y ESTADO DEL JUEGO
// ==================================================

const Game = {
    selectedTeam: 1, 
    loadingInterval: null,
    
    init: function() {
        if(typeof UI !== 'undefined') UI.init(); 
        if(typeof Controles !== 'undefined') Controles.init(); 
        const canvas = document.getElementById('gameCanvas');
        if(typeof Motor3D !== 'undefined') Motor3D.init(canvas); 
        if(typeof Colisiones !== 'undefined') Colisiones.init();
        if(typeof Cliente !== 'undefined') Cliente.init();
    },
    
    setTeam: function(teamId) {
        this.selectedTeam = teamId;
        const btnBlue = document.getElementById('btn-team-blue');
        const btnRed = document.getElementById('btn-team-red');
        if (btnBlue && btnRed) {
            if (teamId === 1) {
                btnBlue.classList.add('active-blue'); btnBlue.classList.remove('active-red');
                btnRed.classList.remove('active-red'); btnRed.classList.remove('active-blue');
            } else {
                btnRed.classList.add('active-red'); btnRed.classList.remove('active-blue');
                btnBlue.classList.remove('active-blue'); btnBlue.classList.remove('active-red');
            }
        }
    },
    
    showLoadingScreen: function(role, callback) {
        document.getElementById('classic-client').style.display = 'none';
        const loadingScreen = document.getElementById('loading-screen');
        const loadingBar = document.getElementById('loading-bar');
        if(loadingScreen) loadingScreen.style.display = 'flex';
        
        if (loadingBar) {
            if (role === 'IA') { 
                loadingBar.style.background = '#0f0'; 
                loadingBar.style.boxShadow = `0 0 15px #0f0`; 
            } else { 
                loadingBar.style.background = '#38bdf8'; 
                loadingBar.style.boxShadow = `0 0 15px #38bdf8`; 
            }
        }
        
        let progress = 0;
        if (this.loadingInterval) clearInterval(this.loadingInterval);
        
        this.loadingInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100; 
                if(loadingBar) loadingBar.style.width = '100%'; 
                clearInterval(this.loadingInterval);
                setTimeout(() => { 
                    if(loadingScreen) loadingScreen.style.display = 'none'; 
                    callback(); 
                }, 600);
            } else { 
                if(loadingBar) loadingBar.style.width = progress + '%'; 
            }
        }, 150);
    },
    
    initTutorial: function() {
        this.selectedTeam = 1;
        this.initMatch('SOUL-SNIPER', true);
    },
    
    initMatch: function(role, isTutorial = false) {
        this.showLoadingScreen(role, () => {
            document.querySelectorAll('.stick-container').forEach(el => el.removeAttribute('data-drag'));
            document.querySelectorAll('.bar-container').forEach(e => e.remove()); 
            
            let s = CONFIG.ROLES[role]; 
            let p = STATE.player;
            
            p.team = this.selectedTeam; 
            p.class = role; p.baseSpeed = s.speed; p.speed = s.speed; p.fov = s.fov; p.range = s.range; p.atkRange = s.atkRange; 
            p.normalDamage = s.normalDamage; p.atkSpread = s.atkSpread; p.atkSpeed = s.atkSpeed; 
            p.hyperRange = s.hyperRange; p.hyperSpread = s.hyperSpread; p.hyperVis = s.hyperVis; 
            p.hp = s.maxHp; p.maxHp = s.maxHp; p.radius = s.radius; p.mp = 140; p.maxMp = 140; 
            p.skillCost = s.skillCost; p.maxCd = s.maxCd; p.chargeTimer = 0; p.isHyperReady = false; 
            p.aimingAtk = false; p.isAimingRight = false; p.manualAimAngle = 0; 
            
            p.skill2Cd = 0; p.aimingSkill2 = false; p.wasAimingSkill2 = false; p.autoAimingSkill2 = false; p.isHooked = false; p.hookAttacker = null;
            
            p.stoneTimer = 0; p.stunTimer = 0; p.slowTimer = 0; p.purifyTimer = 0;
            p.shield = 0; p.speedBuffTimer = 0;
            p.poisonTimer = 0; p.furyTimer = 0; 
            p.mageBuffTimer = 0; p.teleportTimer = 0; 

            p.x = p.team === 1 ? 1825 : 1825; 
            p.y = p.team === 1 ? 300 : 3350; 
            
            p.deadTimer = 0; p.active = false; p.activeTimer = 0; p.radarTimer = 0; 
            p.kills = 0; p.deaths = 0; p.damageDealt = 0; p.damageTaken = 0; p.turretsCaptured = 0; 
            p.nexusDmgKills = 0; p.nexusLossDeaths = 0; p.controlFrames = 0; p.nexusDmgControl = 0; 
            p.hasTarget = false; p.cancelAtk = false; p.vx = 0; p.vy = 0; p.inputX = 0; p.inputY = 0;
            
            STATE.mode = 'playing'; STATE.screen = 'playing'; STATE.matchFrames = CONFIG.MATCH_FRAMES; 
            STATE.nexusBlue = 500; STATE.nexusRed = 500; STATE.bullets = []; STATE.bots = []; 
            STATE.effects = []; STATE.trampas = []; STATE.ballestas = []; STATE.cameraShake = 0; STATE.hitStopTimer = 0; 
            STATE.bulletIdCounter = 0; STATE.effectIdCounter = 0; STATE.isTutorial = isTutorial;
            
            if(typeof WORLD !== 'undefined' && WORLD.trees) WORLD.trees.forEach(t => t.active = true);
            if(typeof IA !== 'undefined') IA.init(false, STATE); 
            if(typeof WORLD !== 'undefined' && WORLD.turrets) WORLD.turrets.forEach(t => { t.progress = 0; t.team = 0; });
            if(typeof WORLD !== 'undefined' && WORLD.pickups) WORLD.pickups.forEach(p => { p.active = true; p.respawnTimer = 0; }); 
            
            // === MAGIA MULTIJUGADOR: AVISAR QUE ENTRAMOS AL MAPA ===
            if (typeof socket !== 'undefined' && !isTutorial) {
                socket.emit('entrar_arena', {
                    x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp, mp: p.mp, maxMp: p.maxMp,
                    class: p.class, team: p.team, lastAngle: p.lastAngle
                });
            }

            document.querySelectorAll('.hud-element').forEach(el => { 
                if (el.id === 'top-hud' || el.id === 'settings-btn' || el.id === 'tutorial-radio' || el.id === 'guide-btn') el.style.display = 'flex';
                else el.style.display = 'block'; 
            });
            
            if (isTutorial && typeof Tutorial !== 'undefined') {
                Tutorial.init();
            } else {
                if(typeof Tutorial !== 'undefined') Tutorial.active = false;
                if(typeof UI !== 'undefined' && UI.hideRadio) UI.hideRadio();
                let atkStick = document.getElementById('atk-stick');
                let skillStick = document.getElementById('skill-stick');
                let recallBtn = document.getElementById('recall-btn');
                let stick2 = document.getElementById('skill-stick-2');

                if(atkStick) { atkStick.style.opacity = '1'; atkStick.style.pointerEvents = 'auto'; }
                if(skillStick) { skillStick.style.opacity = '1'; skillStick.style.pointerEvents = 'auto'; }
                if(recallBtn) { recallBtn.style.opacity = '1'; recallBtn.style.pointerEvents = 'auto'; }
                if(stick2) { stick2.style.opacity = '1'; stick2.style.pointerEvents = 'auto'; }
            }
            if (STATE.animationFrameId) cancelAnimationFrame(STATE.animationFrameId);
            this.tick();
        });
    },
    
    initSimulation: function() {
        this.showLoadingScreen('IA', () => {
            document.querySelectorAll('.bar-container').forEach(e => e.remove()); 
            STATE.mode = 'simulation'; STATE.screen = 'simulation'; STATE.matchFrames = CONFIG.MATCH_FRAMES; 
            STATE.nexusBlue = 500; STATE.nexusRed = 500; STATE.bullets = []; STATE.bots = []; STATE.effects = []; 
            STATE.trampas = []; STATE.ballestas = [];
            STATE.bulletIdCounter = 0; STATE.effectIdCounter = 0; 
            STATE.stats = { blue: { turretFrames: 0, pointsLostToTurrets: 0, pointsLostToDeaths: 0 }, red: { turretFrames: 0, pointsLostToTurrets: 0, pointsLostToDeaths: 0 } };
            STATE.isTutorial = false;
            
            if(typeof Tutorial !== 'undefined') Tutorial.active = false;
            if(typeof WORLD !== 'undefined' && WORLD.trees) WORLD.trees.forEach(t => t.active = true);
            if(typeof WORLD !== 'undefined' && WORLD.turrets) WORLD.turrets.forEach(t => { t.progress = 0; t.team = 0; });
            if(typeof WORLD !== 'undefined' && WORLD.pickups) WORLD.pickups.forEach(p => { p.active = true; p.respawnTimer = 0; });
            
            let p = STATE.player; 
            p.hp = 0; p.maxHp = 100; p.x = -1000; p.y = -1000; p.deadTimer = 9999999; p.active = false; 
            if(typeof IA !== 'undefined') IA.init(true, STATE);
            
            let simScreen = document.getElementById('simulation-screen');
            let simConsole = document.getElementById('sim-console');
            if(simScreen) simScreen.style.display = 'flex'; 
            if(simConsole) simConsole.innerHTML = '<div style="color:#0f0;">[SISTEMA] INICIANDO SIMULACIÓN DE IA...</div>';
            
            if (STATE.animationFrameId) cancelAnimationFrame(STATE.animationFrameId);
            this.tick();
        });
    },
    
    stopSimulation: function() { 
        STATE.screen = 'lobby'; 
        let simScreen = document.getElementById('simulation-screen');
        let classicClient = document.getElementById('classic-client');
        if(simScreen) simScreen.style.display = 'none'; 
        if(classicClient) classicClient.style.display = 'flex'; 
    },
    
    endMatch: function() {
        document.querySelectorAll('.bar-container').forEach(e => e.remove());
        STATE.screen = 'gameover'; 
        document.querySelectorAll('.stick-container').forEach(el => el.removeAttribute('data-drag'));
        if (window.PointerEvent) {
            document.querySelectorAll('.stick-container').forEach(el => { 
                if (el.hasPointerCapture) { 
                    try { el.releasePointerCapture(1); el.releasePointerCapture(2); } catch(e){} 
                } 
            });
        }
        document.querySelectorAll('.hud-element').forEach(el => el.style.display = 'none'); 
        let simScreen = document.getElementById('simulation-screen');
        if(simScreen) simScreen.style.display = 'none'; 
        if(typeof UI !== 'undefined' && UI.hideRadio) UI.hideRadio();
        
        if (STATE.mode === 'playing' && !STATE.isTutorial && typeof Perfil !== 'undefined') {
            let p = STATE.player;
            let isVictory = (p.team === 1 && STATE.nexusBlue > STATE.nexusRed) || (p.team === 2 && STATE.nexusRed > STATE.nexusBlue);
            
            let pScore = (p.kills * 15) + (p.turretsCaptured * 25) + ((p.damageDealt || 0) * 0.05) - (p.deaths * 10);
            let isMvp = true;
            
            if (STATE.bots) {
                for (let b of STATE.bots) {
                    let bScore = (b.kills * 15) + ((b.turretsCaptured || 0) * 25) + ((b.damageDealt || 0) * 0.05) - (b.deaths * 10);
                    if (bScore > pScore) { isMvp = false; break; }
                }
            }
            
            try {
                Perfil.registrarPartida({
                    kills: p.kills || 0,
                    deaths: p.deaths || 0,                 
                    dañoCausado: p.damageDealt || 0,       
                    dañoRecibido: p.damageTaken || 0,      
                    torretas: p.turretsCaptured || 0,
                    victoria: isVictory,
                    mvp: isMvp,
                    clase: p.class 
                });
            } catch(e) { console.warn("Aviso:", e); }
        }

        this.proceedToStats();
    },

    proceedToStats: function() {
        let titleEl = document.getElementById('stats-title');
        if (titleEl && STATE.player) {
            let p = STATE.player;
            let isVictory = false;
            
            if (p.team === 1 && STATE.nexusBlue > STATE.nexusRed) isVictory = true;
            if (p.team === 2 && STATE.nexusRed > STATE.nexusBlue) isVictory = true;

            if (isVictory) {
                titleEl.innerText = "¡VICTORIA!";
                titleEl.style.color = "#ffeb3b"; 
                titleEl.style.textShadow = "0 0 15px #ffeb3b, 0 2px 5px #000";
            } else {
                titleEl.innerText = "DERROTA";
                titleEl.style.color = "#ff3333"; 
                titleEl.style.textShadow = "0 0 15px #ff3333, 0 2px 5px #000";
            }
        }

        if (typeof UI !== 'undefined' && UI.renderStats) {
            UI.renderStats(STATE); 
            UI.toggleStatsView('main'); 
        }
        
        let goScreen = document.getElementById('game-over-screen');
        if (goScreen) {
            goScreen.style.display = 'block'; 
        }
    },
    
    returnToLobby: function() { 
        let goScreen = document.getElementById('game-over-screen');
        let classicClient = document.getElementById('classic-client');
        if(goScreen) goScreen.style.display = 'none'; 
        if(classicClient) classicClient.style.display = 'flex'; 
        STATE.screen = 'lobby'; STATE.bullets = []; STATE.bots = []; STATE.effects = []; STATE.trampas = []; STATE.ballestas = [];
    },
    
    updateLogic: function() {
        if (STATE.nexusBlue <= 0 || STATE.nexusRed <= 0 || STATE.matchFrames <= 0) { 
            this.endMatch(); 
            return; 
        }
        
        let p = STATE.player;
        let myBase = p.team === 1 ? {x: 1825, y: 300} : {x: 1825, y: 3350}; 
        
        if (p.hp > 0 && STATE.mode === 'playing') {
            
            p.speed = p.baseSpeed;
            if (p.speedBuffTimer > 0) p.speed *= 1.25; 
            if (p.furyTimer > 0) p.speed *= 1.15; 
            if (p.mageBuffTimer > 0) p.speed *= 1.15;
            
            if (p.slowTimer > 0) p.speed *= 0.35; 
            if (p.purifyTimer > 0) p.speed *= 1.3; 

            let moveInputX = 0; let moveInputY = 0;

            if (p.stunTimer > 0 || p.teleportTimer > 0) {
                p.vx = 0; p.vy = 0;
                p.aimingAtk = false; p.aimingSkill = false; p.aimingSkill2 = false;
                p.cancelAtk = true;
            } else {
                let isBlue = (p.team === 1);
                moveInputX = (isBlue ? -p.inputX : p.inputX) * p.speed;
                moveInputY = (isBlue ? -p.inputY : p.inputY) * p.speed;
                
                p.vx += (moveInputX - p.vx) * (1.0 - CONFIG.UX.friction); 
                p.vy += (moveInputY - p.vy) * (1.0 - CONFIG.UX.friction);
            }
            
            if (p.skillOverrideTimer > 0) p.skillOverrideTimer--;
            if (p.radarTimer > 0) p.radarTimer--; 
            if (p.revealTimer > 0) p.revealTimer--; 
            if (p.pingTimer > 0) p.pingTimer--;
            
            if (p.activeTimer > 0) {
                p.activeTimer--;
                if (p.activeTimer <= 0) p.active = false;
            }
            
            p.inTree = false; p.currentTree = null;
            if (typeof WORLD !== 'undefined' && WORLD.trees) {
                let tCount = WORLD.trees.length;
                for(let i=0; i < tCount; i++) {
                    let t = WORLD.trees[i];
                    if (t.active) {
                        let dx = p.x - t.x; let dy = p.y - t.y;
                        if (dx*dx + dy*dy < 70*70) { p.inTree = true; p.currentTree = t; break; }
                    }
                }
            }
            
            if (p.recalling) {
                if (Math.abs(p.vx) > 0.5 || Math.abs(p.vy) > 0.5 || p.hp < p.lastHp || p.aimingSkill || p.aimingSkill2) { 
                    p.recalling = false; p.recallTimer = 0; 
                } else if (--p.recallTimer <= 0) { 
                    p.x = myBase.x; p.y = myBase.y; p.hp = p.maxHp; p.mp = p.maxMp; p.recalling = false; 
                }
            }
            p.lastHp = p.hp;
            
            let roleMp = CONFIG.ROLES[p.class].maxMp || 140;
            if (p.maxMp !== roleMp) { p.maxMp = roleMp; if (p.mp > p.maxMp) p.mp = p.maxMp; }
            if (p.mp < p.maxMp) p.mp = Math.min(p.maxMp, p.mp + CONFIG.MANA_REGEN);
            
            if (p.cd > 0) p.cd--;
            
            if (p.aimingSkill2 && p.skillOverrideTimer === 0) { 
                let rangoTal = 0;
                if(p.skill2Type === 'gancho') rangoTal = 700;
                if(p.skill2Type === 'stun') rangoTal = 600;
                if(p.skill2Type === 'hielo') rangoTal = 700; 
                if(p.skill2Type === 'teleport') rangoTal = 1300; 
                
                if (p.autoAimingSkill2 && p.skill2Type !== 'teleport') {
                    let enemiesTal = (typeof IA !== 'undefined' && rangoTal > 0) ? IA.obtenerEnemigosEnRango(p, rangoTal, STATE) : [];
                    if (enemiesTal.length > 0) {
                        enemiesTal.sort((a,b) => ((p.x - a.x)**2 + (p.y - a.y)**2) - ((p.x - b.x)**2 + (p.y - b.y)**2));
                        p.skill2Angle = Math.atan2(enemiesTal[0].y - p.y, enemiesTal[0].x - p.x);
                    } else {
                        p.skill2Angle = (p.team === 1) ? p.manualAimAngle + Math.PI : p.manualAimAngle;
                    }
                } else {
                    p.skill2Angle = (p.team === 1) ? p.manualAimAngle + Math.PI : p.manualAimAngle; 
                }
                p.lastAngle = p.skill2Angle; 
            } else if ((p.isAimingRight || p.aimingSkill) && p.skillOverrideTimer === 0) {
                p.lastAngle = (p.team === 1) ? p.manualAimAngle + Math.PI : p.manualAimAngle; 
            } else if (Math.abs(p.vx) > 0.1 || Math.abs(p.vy) > 0.1) { 
                p.lastAngle = Math.atan2(p.vy, p.vx); 
            }
            
            let isMoving = (Math.abs(p.vx) > 0.1 || Math.abs(p.vy) > 0.1);
            let dStats = (typeof IA !== 'undefined') ? IA.obtenerStatsDinamicas(p, isMoving) : { range: p.range, spread: p.atkSpread };
            
            if (p.aimingAtk) { 
                p.fov = dStats.spread * 1.30; p.range = dStats.range; 
            } else { 
                p.fov = CONFIG.ROLES[p.class].fov; p.range = CONFIG.ROLES[p.class].range; 
            }
            
            let enemiesInRange = (typeof IA !== 'undefined') ? IA.obtenerEnemigosEnRango(p, dStats.range, STATE) : [];
            let enemiesInCone = enemiesInRange.filter(e => {
                let dx = e.x - p.x; let dy = e.y - p.y; 
                let anguloAlObjetivo = Math.atan2(dy, dx); 
                let difAngulo = Math.abs(anguloAlObjetivo - p.lastAngle);
                if (difAngulo > Math.PI) difAngulo = 2 * Math.PI - difAngulo;
                return difAngulo <= dStats.spread; 
            });
            
            p.hasTarget = enemiesInCone.length > 0;
            
            if (p.aimingAtk && p.hasTarget && !p.cancelAtk) { 
                if (Date.now() - p.lastAtk > p.atkSpeed && typeof Habilidades !== 'undefined') {
                    Habilidades.executeAttack(p, enemiesInCone[0], dStats, STATE); 
                }
            }

            if (!p.aimingSkill2 && p.wasAimingSkill2) {
                if (!p.cancelAtk && p.skill2Cd <= 0) {
                    let rangoTalento = 0;
                    if(p.skill2Type === 'gancho') { rangoTalento = 700; p.skill2MaxCd = 780; }
                    if(p.skill2Type === 'stun') { rangoTalento = 600; p.skill2MaxCd = 780; }
                    if(p.skill2Type === 'hielo') { rangoTalento = 700; p.skill2MaxCd = 780; }
                    if(p.skill2Type === 'purificar') { rangoTalento = 50; p.skill2MaxCd = 780; } 
                    if(p.skill2Type === 'teleport') { rangoTalento = 1300; p.skill2MaxCd = 900; }
                    
                    if (rangoTalento > 0) {
                        p.skill2Cd = p.skill2MaxCd;
                        if(typeof Habilidades !== 'undefined') Habilidades.executeSkill2(p, STATE);
                        p.skillOverrideTimer = 15;
                    }
                }
            }
            p.wasAimingSkill2 = p.aimingSkill2;

            if (!p.aimingAtk && !p.aimingSkill && !p.aimingSkill2) { 
                if (++p.chargeTimer >= 150) { p.isHyperReady = true; p.chargeTimer = 150; } 
            } else { 
                if (!p.isHyperReady) p.chargeTimer = 0; 
            }
        } else if (p.deadTimer === 0 && STATE.mode !== 'simulation') {
            p.deadTimer = 300; 
            if (p.team === 1) { 
                STATE.nexusBlue = Math.max(0, STATE.nexusBlue - 15); 
                STATE.stats.blue.pointsLostToDeaths += 15; 
            } else { 
                STATE.nexusRed = Math.max(0, STATE.nexusRed - 15); 
                STATE.stats.red.pointsLostToDeaths += 15; 
            }
            p.x = myBase.x; p.y = myBase.y; p.vx = 0; p.vy = 0; p.inputX = 0; p.inputY = 0; 
            p.recalling = false; p.active = false; p.radarTimer = 0; p.inTree = false; p.currentTree = null;
            p.furyTimer = 0; p.mageBuffTimer = 0; p.shield = 0; p.teleportTimer = 0;
            
            let mK = document.getElementById('move-knob'); if(mK) mK.style.transform = `translate(-50%, -50%)`;
            let aK = document.getElementById('atk-knob'); if(aK) aK.style.transform = `translate(-50%, -50%)`;
        } else if (STATE.mode !== 'simulation' && --p.deadTimer <= 0) { 
            p.hp = p.maxHp; p.mp = p.maxMp; p.deadTimer = 0; p.aimingAtk = false; p.chargeTimer = 0; 
            p.isHyperReady = false; p.hasTarget = false; p.shield = 0; p.speedBuffTimer = 0; p.poisonTimer = 0; p.teleportTimer = 0;
        }
        
        if (typeof WORLD !== 'undefined' && WORLD.pickups) {
            WORLD.pickups.forEach(pickup => {
                if (!pickup.active) {
                    if (pickup.respawnTimer > 0) pickup.respawnTimer--;
                    if (pickup.respawnTimer <= 0) pickup.active = true;
                } else {
                    let allChars = [STATE.player, ...STATE.bots].filter(e => e.hp > 0);
                    for (let char of allChars) {
                        let dx = pickup.x - char.x; let dy = pickup.y - char.y;
                        if (dx*dx + dy*dy < 2500) { 
                            pickup.active = false; pickup.respawnTimer = 900; 
                            if (pickup.type === 'hp') {
                                char.hp = Math.min(char.maxHp, char.hp + 50);
                                if (char === STATE.player && typeof UI !== 'undefined') UI.showDamage(char.x, char.y, "+50", "#ffea00");
                            } else {
                                char.mp = Math.min(char.maxMp, char.mp + 50);
                                if (char === STATE.player && typeof UI !== 'undefined') UI.showDamage(char.x, char.y, "+50", "#7b68ee");
                            }
                            break; 
                        }
                    }
                }
            });
        }
        
        // === OCULTAMOS LOS JUGADORES DE RED A LA IA PARA QUE NO LOS CONTROLE ===
        let botsOriginales = [];
        if (STATE.bots) {
            botsOriginales = STATE.bots.filter(b => !b.isNetworkPlayer);
        }
        STATE.bots = botsOriginales;

        if(typeof IA !== 'undefined') IA.update(STATE); 
        
        // === MAGIA MULTIJUGADOR: INYECTAMOS A TUS AMIGOS EN EL MAPA ===
        if (STATE.mode === 'playing' && !STATE.isTutorial && typeof socket !== 'undefined') {
            if (STATE.matchFrames % 2 === 0) { // 30 veces por segundo
                socket.emit('mover_jugador', {
                    x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp, mp: p.mp, maxMp: p.maxMp,
                    lastAngle: p.lastAngle, class: p.class, team: p.team,
                    isAiming: (p.aimingAtk || p.aimingSkill || p.aimingSkill2),
                    poisonTimer: p.poisonTimer, active: p.active
                });
            }
            
            if (STATE.jugadoresNube) {
                let networkBots = [];
                for (let id in STATE.jugadoresNube) {
                    if (id !== STATE.miSocketId) {
                        let jN = STATE.jugadoresNube[id];
                        let bConf = CONFIG.ROLES[jN.class] || CONFIG.ROLES['SOUL-SNIPER'];
                        networkBots.push({
                            id: 'net_' + id, isBot: false, isNetworkPlayer: true,
                            team: jN.team, class: jN.class,
                            x: jN.x, y: jN.y, hp: jN.hp, maxHp: jN.maxHp, mp: jN.mp, maxMp: jN.maxMp,
                            lastAngle: jN.lastAngle, aimingAtk: jN.isAiming,
                            poisonTimer: jN.poisonTimer || 0, active: jN.active || false,
                            radius: bConf.radius, fov: bConf.fov, range: bConf.range,
                            speed: bConf.speed, baseSpeed: bConf.speed, visible: true
                        });
                    }
                }
                // Añadimos a tus amigos reales al mapa para que puedas verlos y golpearlos
                STATE.bots = STATE.bots.concat(networkBots);
            }
        }

        if(typeof Colisiones !== 'undefined') Colisiones.update(STATE); 
        if(typeof Habilidades !== 'undefined') Habilidades.updateEnvironment(STATE); 
        if(typeof Proyectiles !== 'undefined') Proyectiles.update(STATE);
        
        if (STATE.isTutorial && typeof Tutorial !== 'undefined') { 
            Tutorial.update(p, STATE); 
        }
        
        if (STATE.effects) { 
            for (let i = STATE.effects.length - 1; i >= 0; i--) { 
                if (--STATE.effects[i].life <= 0) STATE.effects.splice(i, 1); 
            } 
        }
        
        STATE.matchFrames--;
    },
    
    updateCooldownsUI: function() {
        if (!STATE.player || STATE.player.hp <= 0) return;
        let p = STATE.player;
        
        let atkTime = p.atkSpeed - (Date.now() - p.lastAtk);
        let atkBg = document.getElementById('atk-cd-bg');
        let atkText = document.getElementById('atk-cd-text');
        
        if (atkTime > 0) {
            if(atkBg) atkBg.style.display = 'block';
            if(atkText) { 
                atkText.style.display = 'block'; 
                atkText.innerText = (atkTime / 1000).toFixed(1); 
            }
        } else {
            if(atkBg) atkBg.style.display = 'none';
            if(atkText) atkText.style.display = 'none';
        }

        let s1Bg = document.getElementById('skill-cd-bg');
        let s1Text = document.getElementById('skill-cd-text');
        if (p.cd > 0) {
            if(s1Bg) s1Bg.style.display = 'block';
            if(s1Text) { 
                s1Text.style.display = 'block'; 
                s1Text.innerText = Math.ceil(p.cd / 60); 
            }
        } else {
            if(s1Bg) s1Bg.style.display = 'none';
            if(s1Text) s1Text.style.display = 'none';
        }

        let s2Bg = document.getElementById('talento-cd-bg');
        let s2Text = document.getElementById('talento-cd-text');
        if (p.skill2Cd > 0) {
            if(s2Bg) s2Bg.style.display = 'block';
            if(s2Text) { 
                s2Text.style.display = 'block'; 
                s2Text.innerText = Math.ceil(p.skill2Cd / 60); 
            }
        } else {
            if(s2Bg) s2Bg.style.display = 'none';
            if(s2Text) s2Text.style.display = 'none';
        }
    },

    tick: function() {
        if (STATE.screen === 'playing') {
            if (STATE.hitStopTimer > 0) { 
                STATE.hitStopTimer--; 
                if(typeof Motor3D !== 'undefined') Motor3D.update(STATE); 
            } else { 
                this.updateLogic(); 
                if(typeof Motor3D !== 'undefined') Motor3D.update(STATE); 
            }
            if(typeof UI !== 'undefined') UI.updateHUD(STATE); 
            this.updateCooldownsUI(); 
        } else if (STATE.screen === 'simulation') {
            for (let i = 0; i < 5; i++) { 
                if (STATE.screen !== 'simulation') break; 
                this.updateLogic(); 
            }
            let consoleEl = document.getElementById('sim-console');
            if (STATE.matchFrames % 60 === 0 && consoleEl) { 
                consoleEl.innerHTML += `<div>[${new Date().toLocaleTimeString()}] NEXO AZUL ${Math.floor(Math.max(0, STATE.nexusBlue))} | NEXO ROJO ${Math.floor(Math.max(0, STATE.nexusRed))}</div>`; 
                consoleEl.scrollTop = consoleEl.scrollHeight; 
            }
            if(typeof UI !== 'undefined') UI.drawMinimap(STATE);
        }
        STATE.animationFrameId = requestAnimationFrame(() => this.tick());
    }
};

window.onload = () => Game.init();
