// ==================================================
// perfil.js - GESTOR DE ESTADÍSTICAS Y GUARDADO LOCAL
// ==================================================

const Perfil = {
    data: {
        bajas: 0, muertes: 0, torretas: 0, mvp: 0, partidasJugadas: 0, victorias: 0,
        invHades: 0, defResistencia: 0,
        danoCausado: 0, danoRecibido: 0,
        picksSniper: 0, picksShadow: 0, picksGuard: 0, picksDruida: 0, picksPirata: 0, picksMercenario: 0, picksBrawler: 0, picksMago: 0,
        historial: [], 
        heroes: {
            'SOUL-SNIPER': { bajas: 0, muertes: 0, mvp: 0, victorias: 0, partidas: 0, danoCausado: 0, danoRecibido: 0 },
            'SHADOWBLADE': { bajas: 0, muertes: 0, mvp: 0, victorias: 0, partidas: 0, danoCausado: 0, danoRecibido: 0 },
            'ASH-GUARD':   { bajas: 0, muertes: 0, mvp: 0, victorias: 0, partidas: 0, danoCausado: 0, danoRecibido: 0 },
            'NATURE-DRUID':{ bajas: 0, muertes: 0, mvp: 0, victorias: 0, partidas: 0, danoCausado: 0, danoRecibido: 0 },
            'ABYSSAL-PIRATE':{ bajas: 0, muertes: 0, mvp: 0, victorias: 0, partidas: 0, danoCausado: 0, danoRecibido: 0 },
            'STEEL-MERCENARY':{ bajas: 0, muertes: 0, mvp: 0, victorias: 0, partidas: 0, danoCausado: 0, danoRecibido: 0 },
            'RAGE-BRAWLER':{ bajas: 0, muertes: 0, mvp: 0, victorias: 0, partidas: 0, danoCausado: 0, danoRecibido: 0 },
            'FLAME-MAGE':{ bajas: 0, muertes: 0, mvp: 0, victorias: 0, partidas: 0, danoCausado: 0, danoRecibido: 0 }
        }
    },

    init: function() {
        this.cargar();
        this.actualizarUI();
    },

    cargar: function() {
        try {
            let guardado = localStorage.getItem('dominion_stats_v3'); 
            
            if (!guardado) {
                guardado = localStorage.getItem('dominion_stats_v2') || localStorage.getItem('dominion_stats');
            }

            if (guardado) {
                let parsed = JSON.parse(guardado);
                
                Object.keys(parsed).forEach(k => {
                    if (k !== 'heroes' && k !== 'historial' && this.data[k] !== undefined) {
                        this.data[k] = parsed[k];
                    }
                });

                if (parsed.invHades === undefined) this.data.invHades = 0;
                if (parsed.defResistencia === undefined) this.data.defResistencia = 0;

                if (parsed.heroes) {
                    Object.keys(parsed.heroes).forEach(h => {
                        if (this.data.heroes[h]) {
                            this.data.heroes[h] = { ...this.data.heroes[h], ...parsed.heroes[h] };
                        }
                    });
                }
                
                if (parsed.historial) {
                    this.data.historial = parsed.historial;
                }
                
                this.guardar();
            }
        } catch(e) {
            console.warn("No se pudo cargar el perfil local.");
        }
    },

    guardar: function() {
        try {
            localStorage.setItem('dominion_stats_v3', JSON.stringify(this.data));
            this.actualizarUI();
        } catch(e) {}
    },

    actualizarUI: function() {
        let elBajas = document.getElementById('perfil-bajas');
        let elMuertes = document.getElementById('perfil-muertes');
        let elTorretas = document.getElementById('perfil-torretas');
        let elMVP = document.getElementById('perfil-mvp');
        
        let elJugadas = document.getElementById('perfil-jugadas');
        let elVictorias = document.getElementById('perfil-victorias');
        let elWinRate = document.getElementById('perfil-winrate');
        
        let elDmgCausado = document.getElementById('perfil-dmg-causado');
        let elDmgRecibido = document.getElementById('perfil-dmg-recibido');

        if (elBajas) elBajas.innerText = this.data.bajas;
        if (elMuertes) elMuertes.innerText = this.data.muertes;
        if (elTorretas) elTorretas.innerText = this.data.torretas;
        if (elMVP) elMVP.innerText = this.data.mvp;
        
        // === INYECCIÓN LORE: HADES VS RESISTENCIA ===
        if (elJugadas) {
            elJugadas.innerText = this.data.invHades || 0;
            elJugadas.style.color = "#ff3333";
            elJugadas.style.textShadow = "0 0 10px #ff3333";
        }
        
        if (elVictorias) {
            elVictorias.innerText = this.data.defResistencia || 0;
            elVictorias.style.color = "#33ccff";
            elVictorias.style.textShadow = "0 0 10px #33ccff";
        }

        if (elWinRate) elWinRate.innerText = ''; // Dejamos el porcentaje en blanco

        // RASTREADOR DOM: ELIMINA EL WIN RATE Y CAMBIA TEXTOS
        document.querySelectorAll('*').forEach(el => {
            if (el.childNodes.length === 1 && el.nodeType === 1) {
                let texto = el.innerText.trim();
                if (texto === 'JUGADAS') {
                    el.innerText = 'INV. HADES';
                    el.style.color = '#ff3333';
                    el.style.textShadow = '0 0 8px #ff3333';
                }
                if (texto === 'VICTORIAS') {
                    el.innerText = 'DEFENSAS';
                    el.style.color = '#33ccff';
                    el.style.textShadow = '0 0 8px #33ccff';
                }
                if (texto === 'WIN RATE') {
                    el.innerText = ''; // Desaparece la etiqueta de Win Rate
                }
            }
        });
        // ============================================

        const formatDmg = (d) => d > 999 ? (d/1000).toFixed(1) + 'k' : Math.floor(d);
        
        if (elDmgCausado) elDmgCausado.innerText = formatDmg(this.data.danoCausado);
        if (elDmgRecibido) elDmgRecibido.innerText = formatDmg(this.data.danoRecibido);

        this.renderTopHeroes();
    },

    renderTopHeroes: function() {
        let heroList = [
            { id: 'SOUL-SNIPER', name: '🏹 SNIPER', color: '#ffaa00', stats: this.data.heroes['SOUL-SNIPER'] },
            { id: 'SHADOWBLADE', name: '🗡️ SHADOW', color: '#cc33ff', stats: this.data.heroes['SHADOWBLADE'] },
            { id: 'ASH-GUARD', name: '🛡️ GUARD', color: '#33ccff', stats: this.data.heroes['ASH-GUARD'] },
            { id: 'NATURE-DRUID', name: '🌿 DRUIDA', color: '#4ade80', stats: this.data.heroes['NATURE-DRUID'] },
            { id: 'ABYSSAL-PIRATE', name: '☠️ PIRATA', color: '#8b5cf6', stats: this.data.heroes['ABYSSAL-PIRATE'] },
            { id: 'STEEL-MERCENARY', name: '⚙️ MERCENARIO', color: '#a1a1aa', stats: this.data.heroes['STEEL-MERCENARY'] },
            { id: 'RAGE-BRAWLER', name: '🥊 COMBATIENTE', color: '#ef4444', stats: this.data.heroes['RAGE-BRAWLER'] },
            { id: 'FLAME-MAGE', name: '🔥 MAGO', color: '#ff4500', stats: this.data.heroes['FLAME-MAGE'] }
        ];

        heroList.sort((a, b) => b.stats.partidas - a.stats.partidas);

        for (let i = 0; i < 3; i++) {
            let btn = document.getElementById('btn-top-' + (i+1));
            let valSpan = document.getElementById('perfil-top-' + (i+1) + '-val');
            let nameSpan = document.getElementById('perfil-top-' + (i+1) + '-name');
            
            if (btn && valSpan && nameSpan) {
                valSpan.innerText = heroList[i].stats.partidas;
                valSpan.style.color = heroList[i].color;
                valSpan.style.textShadow = `0 0 5px ${heroList[i].color}, 0 2px 5px #000`;
                nameSpan.innerText = heroList[i].name.split(' ')[1]; 

                btn.onclick = () => Perfil.abrirModalStats(heroList[i].id);
            }
        }
    },

    registrarPartida: function(stats) {
        this.data.bajas += (stats.kills || 0);
        this.data.muertes += (stats.deaths || 0);
        this.data.torretas += (stats.torretas || 0);
        this.data.danoCausado += (stats.dañoCausado || 0);
        this.data.danoRecibido += (stats.dañoRecibido || 0);
        this.data.partidasJugadas += 1;
        
        if (stats.victoria) {
            this.data.victorias += 1;
            if (stats.equipo === 2) {
                this.data.invHades = (this.data.invHades || 0) + 1;
            } else {
                this.data.defResistencia = (this.data.defResistencia || 0) + 1;
            }
        }
        
        if (stats.mvp) this.data.mvp += 1;
        
        if (stats.clase === 'SOUL-SNIPER') this.data.picksSniper += 1;
        if (stats.clase === 'SHADOWBLADE') this.data.picksShadow += 1;
        if (stats.clase === 'ASH-GUARD') this.data.picksGuard += 1;
        if (stats.clase === 'NATURE-DRUID') this.data.picksDruida += 1;
        if (stats.clase === 'ABYSSAL-PIRATE') this.data.picksPirata += 1;
        if (stats.clase === 'STEEL-MERCENARY') this.data.picksMercenario += 1;
        if (stats.clase === 'RAGE-BRAWLER') this.data.picksBrawler += 1;
        if (stats.clase === 'FLAME-MAGE') this.data.picksMago += 1;

        if (this.data.heroes[stats.clase]) {
            let h = this.data.heroes[stats.clase];
            h.bajas += (stats.kills || 0);
            h.muertes += (stats.deaths || 0);
            h.danoCausado += (stats.dañoCausado || 0);
            h.danoRecibido += (stats.dañoRecibido || 0);
            h.partidas += 1;
            if (stats.victoria) h.victorias += 1;
            if (stats.mvp) h.mvp += 1;
        }

        let fechaActual = new Date();
        let record = {
            clase: stats.clase,
            victoria: stats.victoria,
            equipo: stats.equipo,
            mvp: stats.mvp,
            kills: stats.kills || 0,
            deaths: stats.deaths || 0,
            torretas: stats.torretas || 0,
            fecha: fechaActual.toLocaleDateString() + ' ' + fechaActual.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        this.data.historial.unshift(record); 
        if (this.data.historial.length > 8) {
            this.data.historial.pop(); 
        }
        
        this.guardar();
    },

    abrirModalStats: function(claseInicial = 'SOUL-SNIPER') {
        document.getElementById('modal-stats-todos').style.display = 'flex';
        this.seleccionarHeroeStats(claseInicial);
    },

    seleccionarHeroeStats: function(clase) {
        let h = this.data.heroes[clase];
        if (!h) return;

        let nombres = {
            'SOUL-SNIPER': '🏹 SNIPER', 'SHADOWBLADE': '🗡️ SHADOW',
            'ASH-GUARD': '🛡️ GUARD', 'NATURE-DRUID': '🌿 DRUIDA',
            'ABYSSAL-PIRATE': '☠️ PIRATA', 'STEEL-MERCENARY': '⚙️ MERCENARIO',
            'RAGE-BRAWLER': '🥊 COMBATIENTE', 'FLAME-MAGE': '🔥 MAGO'
        };

        // El Win Rate individual del héroe sí lo dejamos (para que sepa cuál domina mejor)
        let wr = h.partidas > 0 ? ((h.victorias / h.partidas) * 100).toFixed(1) : 0;
        let avgDmgCausado = h.partidas > 0 ? Math.floor(h.danoCausado / h.partidas) : 0;
        let avgDmgRecibido = h.partidas > 0 ? Math.floor(h.danoRecibido / h.partidas) : 0;

        document.getElementById('modal-heroe-title-stats').innerText = nombres[clase];
        document.getElementById('modal-heroe-bajas-stats').innerText = h.bajas;
        document.getElementById('modal-heroe-muertes-stats').innerText = h.muertes;
        document.getElementById('modal-heroe-mvp-stats').innerText = h.mvp;
        document.getElementById('modal-heroe-victorias-stats').innerText = h.victorias;
        document.getElementById('modal-heroe-partidas-stats').innerText = h.partidas;
        document.getElementById('modal-heroe-wr-stats').innerText = wr + '%';
        
        document.getElementById('modal-heroe-dmg-total').innerText = Math.floor(h.danoCausado).toLocaleString();
        document.getElementById('modal-heroe-dmg-avg').innerText = avgDmgCausado.toLocaleString() + ' / p';
        document.getElementById('modal-heroe-rec-total').innerText = Math.floor(h.danoRecibido).toLocaleString();
        document.getElementById('modal-heroe-rec-avg').innerText = avgDmgRecibido.toLocaleString() + ' / p';

        document.querySelectorAll('.hero-roster-scroll button').forEach(btn => btn.classList.remove('active-roster-btn'));
        let activeBtn = document.getElementById('roster-btn-' + clase);
        if (activeBtn) activeBtn.classList.add('active-roster-btn');
    },
    
    cerrarModalStats: function() {
        document.getElementById('modal-stats-todos').style.display = 'none';
    },

    abrirHistorial: function() {
        let lista = document.getElementById('historial-lista');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (!this.data.historial || this.data.historial.length === 0) {
            lista.innerHTML = '<p style="text-align:center; color:#888; margin-top:20px; font-weight:bold;">Aún no hay registros de combate.</p>';
        } else {
            let heroNames = {
                'SOUL-SNIPER': '🏹 SNIPER', 'SHADOWBLADE': '🗡️ SHADOW',
                'ASH-GUARD': '🛡️ GUARD', 'NATURE-DRUID': '🌿 DRUIDA',
                'ABYSSAL-PIRATE': '☠️ PIRATA', 'STEEL-MERCENARY': '⚙️ MERCENARIO',
                'RAGE-BRAWLER': '🥊 COMBATIENTE', 'FLAME-MAGE': '🔥 MAGO'
            };

            this.data.historial.forEach(p => {
                let esHades = p.equipo === 2;
                let colorBorde = p.victoria ? (esHades ? '#ff3333' : '#33ccff') : '#555';
                let colorTexto = p.victoria ? (esHades ? '#ff3333' : '#33ccff') : '#888';
                let textoRes = p.victoria ? (esHades ? 'INVASIÓN ÉXITO' : 'DEFENSA ÉXITO') : 'MISIÓN FALLIDA';
                
                let mvpBadge = p.mvp ? '<span style="background:#facc15; color:#000; padding:2px 5px; border-radius:4px; font-size:9px; font-weight:900; margin-left:8px; box-shadow: 0 0 5px #facc15;">MVP</span>' : '';
                
                let row = document.createElement('div');
                row.style.cssText = `background: linear-gradient(90deg, rgba(20,20,30,0.9) 0%, rgba(10,10,15,0.95) 100%); border: 1px solid #222; border-left: 5px solid ${colorBorde}; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.5);`;
                
                row.innerHTML = `
                    <div style="display: flex; flex-direction: column; width: 45%;">
                        <div style="display: flex; align-items: center;">
                            <span style="color: ${colorTexto}; font-weight: 900; font-size: 13px; text-shadow: 0 0 8px ${colorTexto};">${textoRes}</span>
                            ${mvpBadge}
                        </div>
                        <span style="color: #888; font-size: 10px; margin-top: 5px; font-weight: bold;">${p.fecha}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; width: 55%; text-align: right;">
                        <span style="color: #fff; font-weight: bold; font-size: 13px;">${heroNames[p.clase] || p.clase}</span>
                        <span style="color: #ccc; font-size: 11px; margin-top: 5px; font-weight: bold;">K:<span style="color:#00ffaa">${p.kills}</span> | D:<span style="color:#ff3333">${p.deaths}</span> | T:<span style="color:#33ccff">${p.torretas}</span></span>
                    </div>
                `;
                lista.appendChild(row);
            });
        }
        document.getElementById('modal-historial').style.display = 'flex';
    },

    cerrarHistorial: function() {
        document.getElementById('modal-historial').style.display = 'none';
    }
};

window.addEventListener('load', () => {
    Perfil.init();
});
