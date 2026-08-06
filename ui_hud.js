// ==================================================
// ui_hud.js - INTERFAZ EN PARTIDA, MINIMAPA Y RADIO
// ==================================================

window.UI = window.UI || {};

// Variables de estado del HUD
UI.mmCtx = null;
UI.damagePool = [];
UI.minimapBgCache = null; 
UI.radioInterval = null;

UI.showRadio = function(text) {
    const radio = document.getElementById('tutorial-radio');
    const radioText = document.getElementById('radio-text');
    if(!radio || !radioText) return;
    radio.style.display = 'flex';
    radio.style.opacity = '0';
    setTimeout(() => radio.style.opacity = '1', 50);

    radioText.innerHTML = '';
    let i = 0;
    if(this.radioInterval) clearInterval(this.radioInterval);
    this.radioInterval = setInterval(() => {
        radioText.innerHTML += text.charAt(i);
        i++;
        if(i >= text.length) clearInterval(this.radioInterval);
    }, 30);
};

UI.hideRadio = function() {
    const radio = document.getElementById('tutorial-radio');
    if(!radio) return;
    radio.style.opacity = '0';
    setTimeout(() => radio.style.display = 'none', 300);
};

UI.initDamagePool = function() {
    this.damagePool = [];
    for(let i = 0; i < 30; i++) {
        let el = document.createElement('div');
        el.className = 'floating-dmg';
        document.body.appendChild(el);
        this.damagePool.push({ el: el, active: false, timeout: null });
    }
};

UI.showDamage = function(x, z, amount, color) {
    if (typeof THREE === 'undefined' || !Motor3D || !Motor3D.camera) return;
    if (this.damagePool.length === 0) this.initDamagePool();
    
    let poolObj = this.damagePool.find(p => !p.active);
    if (!poolObj) return; 
    
    let pos = new THREE.Vector3(x, 25, z);
    pos.project(Motor3D.camera);
    let screenX = (pos.x * 0.5 + 0.5) * window.innerWidth;
    let screenY = (pos.y * -0.5 + 0.5) * window.innerHeight;
    
    let el = poolObj.el;
    el.style.left = screenX + 'px'; 
    el.style.top = screenY + 'px'; 
    el.style.color = color; 
    el.innerText = amount;
    
    poolObj.active = true; 
    el.classList.remove('animating');
    
    requestAnimationFrame(() => {
        el.classList.add('animating');
    });
    
    if (poolObj.timeout) clearTimeout(poolObj.timeout);
    poolObj.timeout = setTimeout(() => { 
        poolObj.active = false; 
        el.classList.remove('animating'); 
    }, 800);
};

UI.updateHUD = function(estadoGlobal) {
    if (!estadoGlobal || estadoGlobal.screen !== 'playing') return;
    
    if (estadoGlobal.matchFrames % 60 === 0) {
        let nB = document.getElementById('blue-nexus-hud');
        let nR = document.getElementById('red-nexus-hud');
        let mT = document.getElementById('match-timer');
        if(nB) nB.innerText = `NEXO: ${Math.floor(estadoGlobal.nexusBlue)}`;
        if(nR) nR.innerText = `NEXO: ${Math.floor(estadoGlobal.nexusRed)}`;
        
        let m = Math.floor(Math.max(0, estadoGlobal.matchFrames) / 3600);
        let s = Math.floor((Math.max(0, estadoGlobal.matchFrames) / 60) % 60);
        if(mT) mT.innerText = `${m<10?'0':''}${m}:${s<10?'0':''}${s}`;
    }
    
    const skK = document.getElementById('skill-knob');
    if (skK && estadoGlobal.player) {
        let colorSkill = (estadoGlobal.player.cd > 0 || estadoGlobal.player.mp < estadoGlobal.player.skillCost) ? 'gray' : 'rgba(100, 180, 255, 0.8)';
        if (skK.dataset.color !== colorSkill) { 
            skK.style.background = colorSkill; 
            skK.dataset.color = colorSkill; 
        }
    }

    const skK2 = document.getElementById('skill-knob-2');
    if (skK2 && estadoGlobal.player) {
        let colorSkill2 = (estadoGlobal.player.skill2Cd > 0) ? 'gray' : 'rgba(250, 204, 21, 0.8)';
        if (skK2.dataset.color !== colorSkill2) { 
            skK2.style.background = colorSkill2; 
            skK2.dataset.color = colorSkill2; 
        }
    }
    
    this.drawMinimap(estadoGlobal);
};

UI.drawMinimap = function(estadoGlobal) {
    let canvas = estadoGlobal.screen === 'simulation' ? document.getElementById('simMinimapCanvas') : document.getElementById('minimapCanvas');
    if (!canvas) return;
    this.mmCtx = canvas.getContext('2d');
    
    const sc = (estadoGlobal.screen === 'simulation' ? 200 : 100) / 3650; 
    
    if (!this.minimapBgCache) {
        let bgCanvas = document.createElement('canvas');
        bgCanvas.width = canvas.width;
        bgCanvas.height = canvas.height;
        let bgCtx = bgCanvas.getContext('2d');
        bgCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        if(typeof WORLD !== 'undefined' && WORLD.walls) {
            WORLD.walls.forEach(w => { 
                if (!w.hidden) bgCtx.fillRect(w.x * sc, w.y * sc, Math.max(1, w.w * sc), Math.max(1, w.h * sc)); 
            });
        }
        this.minimapBgCache = bgCanvas;
    }
    
    this.mmCtx.clearRect(0, 0, canvas.width, canvas.height);
    this.mmCtx.drawImage(this.minimapBgCache, 0, 0); 
    
    if(typeof WORLD !== 'undefined' && WORLD.turrets) WORLD.turrets.forEach(t => {
        this.mmCtx.fillStyle = t.team === 1 ? '#33ccff' : (t.team === 2 ? '#ff3333' : 'rgba(255,255,255,0.4)');
        this.mmCtx.beginPath(); 
        this.mmCtx.arc(t.x * sc, t.y * sc, 3, 0, Math.PI * 2); 
        this.mmCtx.fill();
    });
    
    if(typeof WORLD !== 'undefined' && WORLD.pickups) WORLD.pickups.forEach(p => {
        if(p.active) {
            this.mmCtx.fillStyle = p.type === 'hp' ? '#ffea00' : '#7b68ee';
            this.mmCtx.beginPath(); 
            this.mmCtx.arc(p.x * sc, p.y * sc, 2.5, 0, Math.PI * 2); 
            this.mmCtx.fill();
        }
    });
    
    if (estadoGlobal.player || (estadoGlobal.bots && estadoGlobal.bots.length > 0)) {
        let ents = [];
        if(estadoGlobal.player) ents.push(estadoGlobal.player);
        if(estadoGlobal.bots) ents.push(...estadoGlobal.bots);
        
        ents.forEach(ent => {
            if(ent.hp > 0 && (ent.isPlayer || ent.visible || ent.revealTimer > 0)) {
                this.mmCtx.fillStyle = ent.team === 1 ? '#00ffff' : '#ff0033';
                this.mmCtx.beginPath(); 
                this.mmCtx.arc(ent.x * sc, ent.y * sc, ent.isPlayer ? 3.5 : 2.5, 0, Math.PI * 2); 
                this.mmCtx.fill();
            }
        });
    }
};

UI.renderStats = function(estadoGlobal) {
    try {
        let gameOverScreen = document.getElementById('game-over-screen');
        if(gameOverScreen) {
            gameOverScreen.style.backgroundColor = "rgba(5, 5, 10, 0.95)";
        }

        let framesTotales = 28800;
        if (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.MATCH_FRAMES) {
            framesTotales = window.CONFIG.MATCH_FRAMES;
        } else if (typeof CONFIG !== 'undefined' && CONFIG.MATCH_FRAMES) {
            framesTotales = CONFIG.MATCH_FRAMES;
        }

        let currentFrames = estadoGlobal.matchFrames || 0;
        let elapsedFrames = framesTotales - currentFrames;
        let totalSeconds = Math.floor(elapsedFrames / 60);
        let m = Math.floor(totalSeconds / 60); 
        let s = totalSeconds % 60;
        let matchTimeStr = `${m<10?'0':''}${m}:${s<10?'0':''}${s}`;
        
        let titleEl = document.getElementById('stats-title');
        if (titleEl) {
            if ((estadoGlobal.nexusBlue || 0) > (estadoGlobal.nexusRed || 0)) {
                titleEl.innerText = 'VICTORIA AZUL'; 
                titleEl.className = 'victory-title blue-text';
            } else if ((estadoGlobal.nexusRed || 0) > (estadoGlobal.nexusBlue || 0)) {
                titleEl.innerText = 'VICTORIA ROJA'; 
                titleEl.className = 'victory-title red-text';
            } else {
                titleEl.innerText = 'EMPATE TÁCTICO'; 
                titleEl.className = 'victory-title';
            }
        }
        
        let res1 = document.getElementById('res-1'); if(res1) res1.innerText = Math.floor(estadoGlobal.nexusBlue || 0);
        let res2 = document.getElementById('res-2'); if(res2) res2.innerText = Math.floor(estadoGlobal.nexusRed || 0);
        let res3 = document.getElementById('res-3'); if(res3) res3.innerText = matchTimeStr;
        
        let allEnts = [];
        if(estadoGlobal.player) allEnts.push(estadoGlobal.player);
        if(estadoGlobal.bots) allEnts.push(...estadoGlobal.bots);

        const getScore = (e) => (e.kills * 15) + ((e.turretsCaptured||0) * 25) + ((e.damageDealt||0) * 0.05) - (e.deaths * 10);
        
        let blueTeam = allEnts.filter(e => e.team === 1).sort((a,b) => getScore(b) - getScore(a));
        let redTeam = allEnts.filter(e => e.team === 2).sort((a,b) => getScore(b) - getScore(a));
        let overallMVP = allEnts.length > 0 ? allEnts.reduce((prev, curr) => getScore(curr) > getScore(prev) ? curr : prev, allEnts[0]) : null;
        
        const fillRowTemplate = (entidad, isMVP, baseIndex) => {
            if(!entidad) {
                for(let i=0; i<6; i++) {
                    let el = document.getElementById(`res-${baseIndex + i}`);
                    if(el) el.innerText = '';
                }
                return;
            }
            let icon = isMVP ? '👑' : (entidad.isPlayer ? '👤' : '🤖');
            
            let elIcon = document.getElementById(`res-${baseIndex}`);     if(elIcon) elIcon.innerText = icon;
            let elKills = document.getElementById(`res-${baseIndex + 1}`);   if(elKills) elKills.innerText = entidad.kills || 0;
            let elDeaths = document.getElementById(`res-${baseIndex + 2}`);  if(elDeaths) elDeaths.innerText = entidad.deaths || 0;
            let elDmg = document.getElementById(`res-${baseIndex + 3}`);     if(elDmg) elDmg.innerText = Math.floor(entidad.damageDealt||0);
            let elAbs = document.getElementById(`res-${baseIndex + 4}`);     if(elAbs) elAbs.innerText = Math.floor(entidad.damageTaken||0);
            let elCap = document.getElementById(`res-${baseIndex + 5}`);     if(elCap) elCap.innerText = entidad.turretsCaptured||0;
        };

        fillRowTemplate(blueTeam[0], overallMVP && blueTeam[0] && blueTeam[0].id === overallMVP.id, 4);
        fillRowTemplate(blueTeam[1], overallMVP && blueTeam[1] && blueTeam[1].id === overallMVP.id, 10);
        fillRowTemplate(blueTeam[2], overallMVP && blueTeam[2] && blueTeam[2].id === overallMVP.id, 16);

        fillRowTemplate(redTeam[0], overallMVP && redTeam[0] && redTeam[0].id === overallMVP.id, 22);
        fillRowTemplate(redTeam[1], overallMVP && redTeam[1] && redTeam[1].id === overallMVP.id, 28);
        fillRowTemplate(redTeam[2], overallMVP && redTeam[2] && redTeam[2].id === overallMVP.id, 34);

        fillRowTemplate(overallMVP, true, 40);
        
        const getTotals = (teamArr) => {
            return teamArr.reduce((acc, e) => {
                acc.k += e.kills || 0; acc.d += e.deaths || 0; acc.dd += (e.damageDealt||0); acc.dt += (e.damageTaken||0); acc.c += (e.turretsCaptured||0); return acc;
            }, {k:0, d:0, dd:0, dt:0, c:0});
        };
        
        let bTot = getTotals(blueTeam); let rTot = getTotals(redTeam);
        const buildTotalRow = (t) => `
            <span>SUMA</span>
            <span>${t.k}</span>
            <span>${t.d}</span>
            <span class="dmg-dealt">${Math.floor(t.dd)}</span>
            <span class="dmg-taken">${Math.floor(t.dt)}</span>
            <span class="captures">${t.c}</span>
        `;
        
        let btr = document.getElementById('blue-totals-row');
        let rtr = document.getElementById('red-totals-row');
        if(btr) btr.innerHTML = buildTotalRow(bTot);
        if(rtr) rtr.innerHTML = buildTotalRow(rTot);
        
        const formatTime = (frames) => { let sec = Math.floor((frames || 0)/60); let mm = Math.floor(sec/60); let ss = sec%60; return `${mm<10?'0':''}${mm}:${ss<10?'0':''}${ss}`; };
        
        let bStats = (estadoGlobal.stats && estadoGlobal.stats.blue) ? estadoGlobal.stats.blue : { turretFrames: 0, pointsLostToTurrets: 0, pointsLostToDeaths: 0 };
        let rStats = (estadoGlobal.stats && estadoGlobal.stats.red) ? estadoGlobal.stats.red : { turretFrames: 0, pointsLostToTurrets: 0, pointsLostToDeaths: 0 };

        let el_btc = document.getElementById('blue-time-control'); if(el_btc) el_btc.innerText = formatTime(bStats.turretFrames);
        let el_bdc = document.getElementById('blue-dmg-control'); if(el_bdc) el_bdc.innerText = Math.floor(rStats.pointsLostToTurrets) + ' pts';
        let el_bld = document.getElementById('blue-loss-deaths'); if(el_bld) el_bld.innerText = bStats.pointsLostToDeaths + ' pts';
        
        let el_rtc = document.getElementById('red-time-control'); if(el_rtc) el_rtc.innerText = formatTime(rStats.turretFrames);
        let el_rdc = document.getElementById('red-dmg-control'); if(el_rdc) el_rdc.innerText = Math.floor(bStats.pointsLostToTurrets) + ' pts';
        let el_rld = document.getElementById('red-loss-deaths'); if(el_rld) el_rld.innerText = rStats.pointsLostToDeaths + ' pts';
        
        if(overallMVP) {
            let mvpEnemyTeamStats = overallMVP.team === 1 ? rStats : bStats;
            let teamCaptures = overallMVP.team === 1 ? bTot.c : rTot.c;
            let mvpControlRatio = teamCaptures > 0 ? (overallMVP.turretsCaptured||0) / teamCaptures : 0;
            let totalTeamFrames = overallMVP.team === 1 ? bStats.turretFrames : rStats.turretFrames;
            let mvpControlFrames = totalTeamFrames * mvpControlRatio;
            let mvpDmgControl = mvpEnemyTeamStats.pointsLostToTurrets * mvpControlRatio;
            
            let el_mtc = document.getElementById('mvp-time-control'); if(el_mtc) el_mtc.innerText = formatTime(mvpControlFrames);
            let el_mdk = document.getElementById('mvp-dmg-kills'); 
            if(el_mdk) {
                el_mdk.innerText = (overallMVP.nexusDmgKills||0) + ' pts';
                el_mdk.className = overallMVP.team===1 ? 'blue-text' : 'red-text';
            }
            let el_mdc = document.getElementById('mvp-dmg-control'); if(el_mdc) el_mdc.innerText = Math.floor(mvpDmgControl) + ' pts';
            let el_mld = document.getElementById('mvp-loss-deaths'); if(el_mld) el_mld.innerText = (overallMVP.nexusLossDeaths||0) + ' pts';
        }
    } catch (error) {
        console.error("Error táctico al cargar resultados. Forzando despliegue seguro...", error);
    }
};

UI.toggleStatsView = function(viewId) {
    let totalsModal = document.getElementById('stats-totals-modal');
    if (!totalsModal) return;
    
    if (viewId === 'totals') {
        totalsModal.style.display = 'flex';
    } else {
        totalsModal.style.display = 'none';
    }
};
