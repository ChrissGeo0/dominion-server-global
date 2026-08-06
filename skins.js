// ==================================================
// skins.js - GENERACIÓN PROCEDIMENTAL Y ANIMACIONES
// ==================================================

const Skins = {
    init: function() {
        console.log("Skins Procedimentales Inicializadas 🛡️");
    },

    cargar: function(entidad, group) {
        let colorPiel = 0xfcd34d; 
        let colorArmadura = entidad.team === 1 ? 0x1e3a8a : 0x7f1d1d; 
        let colorPantalon = 0x111111;
        let colorMagia = entidad.team === 1 ? 0x00ffff : 0xff3333; 

        if (entidad.class === 'SHADOWBLADE') colorPiel = 0xef4444; 
        if (entidad.class === 'ASH-GUARD') colorPiel = 0x4ade80;   
        if (entidad.class === 'NATURE-DRUID') {
            colorPiel = 0xfef08a; 
            colorArmadura = 0x166534; 
            colorPantalon = 0x78350f; 
            colorMagia = 0x4ade80; 
        }
        if (entidad.class === 'ABYSSAL-PIRATE') {
            colorPiel = 0x9ca3af; 
            colorArmadura = 0x1e293b; 
            colorPantalon = 0x0f172a; 
            colorMagia = 0x8b5cf6; 
        }
        if (entidad.class === 'STEEL-MERCENARY') {
            colorPiel = 0x475569; 
            colorArmadura = 0x334155; 
            colorPantalon = 0x1e293b; 
            colorMagia = 0xf97316; 
        }
        if (entidad.class === 'RAGE-BRAWLER') {
            colorPiel = 0xd97706; 
            colorArmadura = 0x450a0a; 
            colorPantalon = 0x1c1917; 
            colorMagia = 0xff0000; 
        }
        // === NUEVO: COLORES DEL MAGO DE FUEGO ===
        if (entidad.class === 'FLAME-MAGE') {
            colorPiel = 0xffe4c4; // Piel clara
            colorArmadura = 0x991111; // Túnica roja oscura/carmesí
            colorPantalon = 0x550000; // Pantalones más oscuros
            colorMagia = 0xff4500; // Fuego naranja/rojo
        }

        const matPiel = new THREE.MeshStandardMaterial({ color: colorPiel, roughness: 0.8 });
        const matTraje = new THREE.MeshStandardMaterial({ color: colorArmadura, roughness: 0.9 });
        const matPantalon = new THREE.MeshStandardMaterial({ color: colorPantalon, roughness: 0.9 });

        const heroeGroup = new THREE.Group();
        
        const cabezaGroup = new THREE.Group(); 
        cabezaGroup.position.y = 3.1; 
        
        if (entidad.class === 'SOUL-SNIPER' || entidad.class === 'NATURE-DRUID' || entidad.class === 'ABYSSAL-PIRATE' || entidad.class === 'RAGE-BRAWLER' || entidad.class === 'FLAME-MAGE') { 
            let m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), matPiel); 
            cabezaGroup.add(m);
            if (entidad.class === 'ABYSSAL-PIRATE') {
                let matParche = new THREE.MeshStandardMaterial({color: 0x000000});
                let parche = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.2), matParche);
                parche.position.set(0.2, 0.1, 0.55);
                let cinta = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 1.2), matParche);
                cabezaGroup.add(parche, cinta);
            }
            // === SOMBRERO DE MAGO ===
            if (entidad.class === 'FLAME-MAGE') {
                let hatMat = new THREE.MeshStandardMaterial({ color: 0x220505 });
                let hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16), hatMat);
                hatBase.position.y = 0.4;
                let hatTop = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.5, 16), hatMat);
                hatTop.position.y = 1.1;
                cabezaGroup.add(hatBase, hatTop);
            }
        } else if (entidad.class === 'SHADOWBLADE') { 
            let m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), matPiel); cabezaGroup.add(m);
            let hg = new THREE.ConeGeometry(0.15, 0.5, 8); let hm = new THREE.MeshStandardMaterial({color: 0x111111});
            let hl = new THREE.Mesh(hg, hm); hl.position.set(-0.35, 0.7, 0); hl.rotation.z = Math.PI/8;
            let hr = new THREE.Mesh(hg, hm); hr.position.set(0.35, 0.7, 0); hr.rotation.z = -Math.PI/8;
            cabezaGroup.add(hl, hr);
        } else if (entidad.class === 'ASH-GUARD') { 
            let m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1.1), matPiel); cabezaGroup.add(m);
            let eg = new THREE.BoxGeometry(0.5, 0.2, 0.3);
            let el = new THREE.Mesh(eg, matPiel); el.position.set(-0.8, 0, 0);
            let er = new THREE.Mesh(eg, matPiel); er.position.set(0.8, 0, 0);
            cabezaGroup.add(el, er);
        } else if (entidad.class === 'STEEL-MERCENARY') {
            let m = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), matTraje); 
            let matVisor = new THREE.MeshBasicMaterial({color: colorMagia});
            let visor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.1), matVisor); 
            visor.position.set(0, 0.15, 0.55);
            cabezaGroup.add(m, visor);
        }

        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 0.8), matTraje); 
        torso.position.y = 1.8;
        
        const geoBrazo = new THREE.BoxGeometry(0.5, 1.4, 0.5); geoBrazo.translate(0, -0.5, 0);
        const geoPierna = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), matPantalon); geoPierna.position.set(0, -0.6, 0);
        
        const brazoIzq = new THREE.Mesh(geoBrazo, matTraje); brazoIzq.position.set(-0.9, 2.3, 0);
        const brazoDer = new THREE.Mesh(geoBrazo, matTraje); brazoDer.position.set(0.9, 2.3, 0);
        
        const piernaIzq = new THREE.Group(); piernaIzq.position.set(-0.4, 1.7, 0); piernaIzq.add(geoPierna.clone());
        const piernaDer = new THREE.Group(); piernaDer.position.set(0.4, 1.7, 0);
        
        if (entidad.class === 'ABYSSAL-PIRATE') {
            let pataPalo = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0x4a3018 }));
            pataPalo.position.set(0, -0.6, 0);
            piernaDer.add(pataPalo);
        } else {
            piernaDer.add(geoPierna.clone());
        }

        heroeGroup.add(cabezaGroup, torso, brazoIzq, brazoDer, piernaIzq, piernaDer);

        // 4. Armería Procedimental
        if (entidad.class === 'SOUL-SNIPER') {
            let bowMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 }); 
            let stringMat = new THREE.MeshBasicMaterial({ color: 0xcccccc }); 
            
            let arcoCompleto = new THREE.Group();
            let centroArco = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), bowMat);
            let puntaArriba = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), bowMat);
            puntaArriba.position.set(0, 0.6, 0.1); puntaArriba.rotation.x = -0.2;
            let puntaAbajo = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), bowMat);
            puntaAbajo.position.set(0, -0.6, 0.1); puntaAbajo.rotation.x = 0.2;
            let cuerda = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8), stringMat);
            cuerda.position.set(0, 0, 0.25);

            arcoCompleto.add(centroArco, puntaArriba, puntaAbajo, cuerda);
            arcoCompleto.position.set(0, -1.0, 0.3); 
            brazoIzq.add(arcoCompleto);

            let flecha = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.6), new THREE.MeshBasicMaterial({ color: colorMagia }));
            flecha.position.set(0, -1.0, 0); 
            brazoDer.add(flecha);
        } 
        else if (entidad.class === 'SHADOWBLADE') {
            let hiltMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            let bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 1.0, roughness: 0.1 });
            let guardMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 }); 
            
            let espada = new THREE.Group();
            let empunadura = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), hiltMat);
            let guardia = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.2), guardMat);
            guardia.position.y = 0.2;
            let hoja = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.0, 0.15), bladeMat);
            hoja.position.y = 1.25; hoja.geometry.translate(0, 0, -0.02);

            espada.add(empunadura, guardia, hoja);
            espada.position.set(0, -1.0, 0.2);
            espada.rotation.x = Math.PI / 2; 
            brazoDer.add(espada);
        } 
        else if (entidad.class === 'ASH-GUARD') {
            let shieldMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
            let shieldBorderMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9 }); 
            let handleMat = new THREE.MeshStandardMaterial({ color: 0x4a3018 });
            let axeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });
            
            let escudoGroup = new THREE.Group();
            let escudoBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 24), shieldMat);
            escudoBase.rotation.x = Math.PI / 2; 
            let escudoBorde = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 16, 24), shieldBorderMat);
            escudoGroup.add(escudoBase, escudoBorde);
            escudoGroup.position.set(0, -0.5, 0.4); 
            brazoIzq.add(escudoGroup);
            
            let hacha = new THREE.Group();
            let mango = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8), handleMat);
            let hojaHacha = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.15), axeMat);
            hojaHacha.position.set(0.4, 1.0, 0); 
            hacha.add(mango, hojaHacha);
            hacha.position.set(0, -1.0, 0.2);
            hacha.rotation.x = Math.PI / 2;
            brazoDer.add(hacha);
        }
        else if (entidad.class === 'NATURE-DRUID' || entidad.class === 'FLAME-MAGE') {
            let isDruid = entidad.class === 'NATURE-DRUID';
            let staffMat = new THREE.MeshStandardMaterial({ color: isDruid ? 0x4a3018 : 0x111111, roughness: 1.0 }); 
            let gemMat = new THREE.MeshBasicMaterial({ color: colorMagia }); 
            
            let baculo = new THREE.Group();
            let palo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 2.5), staffMat);
            let gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), gemMat);
            gema.position.y = 1.35;
            
            baculo.add(palo, gema);
            baculo.position.set(0, -0.5, 0.4);
            baculo.rotation.x = Math.PI / 2;
            brazoDer.add(baculo);
        }
        else if (entidad.class === 'ABYSSAL-PIRATE') {
            let handleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            let bladeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
            let guardMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8 }); 
            
            let sable = new THREE.Group();
            let empunadura = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), handleMat);
            let campana = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8, 0, Math.PI), guardMat);
            campana.position.y = 0.2; campana.rotation.x = -Math.PI / 2;
            
            let curveShape = new THREE.Shape();
            curveShape.moveTo(0, 0);
            curveShape.quadraticCurveTo(0.2, 0.6, 0.3, 1.2);
            curveShape.quadraticCurveTo(0.1, 1.5, 0, 1.8);
            curveShape.lineTo(-0.1, 1.5);
            curveShape.lineTo(-0.1, 0);
            
            let extrudeSettings = { depth: 0.05, bevelEnabled: false };
            let hojaCurva = new THREE.Mesh(new THREE.ExtrudeGeometry(curveShape, extrudeSettings), bladeMat);
            hojaCurva.position.set(0, 0.2, -0.025);
            
            sable.add(empunadura, campana, hojaCurva);
            sable.position.set(0, -1.0, 0.2);
            sable.rotation.x = Math.PI / 2;
            sable.rotation.z = -Math.PI / 4; 
            brazoDer.add(sable);
        }
        else if (entidad.class === 'STEEL-MERCENARY') {
            let handleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            let bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.3 });
            
            let maza = new THREE.Group();
            let mango = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.0), handleMat);
            let cabezaMaza = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.6), bladeMat);
            cabezaMaza.position.y = 1.0;
            
            maza.add(mango, cabezaMaza);
            maza.position.set(0, -0.5, 0.2);
            maza.rotation.x = Math.PI / 2;
            brazoDer.add(maza);
        }
        else if (entidad.class === 'RAGE-BRAWLER') {
            let gloveMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9, metalness: 0.2 });
            let spikeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 }); 
            
            let guanteIzq = new THREE.Group();
            let gI = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.8), gloveMat);
            let sI = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 4), spikeMat); sI.position.y = 0.45;
            guanteIzq.add(gI, sI);
            guanteIzq.position.set(0, -0.6, 0.1);
            brazoIzq.add(guanteIzq);

            let guanteDer = new THREE.Group();
            let gD = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.8), gloveMat);
            let sD = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 4), spikeMat); sD.position.y = 0.45;
            guanteDer.add(gD, sD);
            guanteDer.position.set(0, -0.6, 0.1);
            brazoDer.add(guanteDer);
        }

        // 5. Ajustar Escala Global al tamaño del mapa
        let escala = 13;
        if (entidad.class === 'SOUL-SNIPER') escala = 58;
        else if (entidad.class === 'SHADOWBLADE') escala = 52;
        else if (entidad.class === 'ASH-GUARD') escala = 65;
        else if (entidad.class === 'NATURE-DRUID') escala = 55; 
        else if (entidad.class === 'ABYSSAL-PIRATE') escala = 54; 
        else if (entidad.class === 'STEEL-MERCENARY') escala = 56; 
        else if (entidad.class === 'RAGE-BRAWLER') escala = 60; 
        else if (entidad.class === 'FLAME-MAGE') escala = 56; 
        
        heroeGroup.scale.set(escala, escala, escala);
        group.add(heroeGroup);

        group.userData = {
            heroeGroup: heroeGroup,
            torso: torso,
            brazoIzq: brazoIzq,
            brazoDer: brazoDer,
            piernaIzq: piernaIzq,
            piernaDer: piernaDer,
            frameAnimacion: Math.random() * 10, 
            matPiel: matPiel,
            matTraje: matTraje,
            matPantalon: matPantalon
        };
    },

    actualizar: function(delta, estadoGlobal, entidadesVisuales) {
        if (estadoGlobal.player && entidadesVisuales['player']) {
            this.transicionar(estadoGlobal.player, entidadesVisuales['player']);
        }
        estadoGlobal.bots.forEach((bot, index) => {
            if (entidadesVisuales['bot_' + index]) {
                this.transicionar(bot, entidadesVisuales['bot_' + index]);
            }
        });
    },

    transicionar: function(entidad, group) {
        if (!group.userData || !group.userData.brazoIzq) return;
        
        let u = group.userData;
        let isMoving = (Math.abs(entidad.vx) > 0.1 || Math.abs(entidad.vy) > 0.1);
        let isAiming = entidad.aimingAtk;
        let frameGolpe = entidad.showAtk || 0; 
        let isDead = entidad.hp <= 0;

        if (isDead) {
            u.heroeGroup.rotation.x = -Math.PI / 2;
            u.heroeGroup.position.y = -5; 
            return;
        } else {
            u.heroeGroup.rotation.x = 0;
            u.heroeGroup.position.y = 0;
        }

        if (entidad.active && entidad.class === 'SHADOWBLADE') {
            u.matPiel.opacity = 0.2; u.matTraje.opacity = 0.2; u.matPantalon.opacity = 0.2;
        } else {
            u.matPiel.opacity = 1; u.matTraje.opacity = 1; u.matPantalon.opacity = 1;
        }

        if (entidad.furyTimer && entidad.furyTimer > 0) {
            u.frameAnimacion += isMoving ? 0.4 : 0.15;
        } else if (entidad.mageBuffTimer && entidad.mageBuffTimer > 0) {
            u.frameAnimacion += isMoving ? 0.35 : 0.1;
        } else {
            u.frameAnimacion += isMoving ? 0.25 : 0.05; 
        }

        let oscilacion = Math.sin(u.frameAnimacion) * 0.8;
        
        u.piernaIzq.rotation.x = isMoving ? oscilacion : 0;
        u.piernaDer.rotation.x = isMoving ? -oscilacion : 0;
        
        if (entidad.class === 'ABYSSAL-PIRATE' && isMoving) {
            u.heroeGroup.position.y = Math.sin(u.frameAnimacion * 2) * 2;
        } else {
            u.torso.scale.y = isMoving ? 1 : 1 + Math.sin(u.frameAnimacion) * 0.03;
        }

        // Posturas de los brazos
        if (frameGolpe > 0) {
            if (entidad.class === 'SOUL-SNIPER') {
                u.brazoIzq.rotation.x = -Math.PI/2 - 0.2; 
                u.brazoDer.rotation.x = 0; 
            } else if (entidad.class === 'SHADOWBLADE' || entidad.class === 'ABYSSAL-PIRATE') {
                u.brazoDer.rotation.x = Math.PI/6; 
                u.brazoDer.rotation.z = Math.PI/8;
            } else if (entidad.class === 'ASH-GUARD' || entidad.class === 'STEEL-MERCENARY') {
                u.brazoDer.rotation.x = Math.PI/4; 
                u.brazoIzq.rotation.x = -0.2; 
                u.brazoIzq.rotation.z = -0.3;
            } else if (entidad.class === 'NATURE-DRUID' || entidad.class === 'FLAME-MAGE') {
                u.brazoDer.rotation.x = Math.PI/4; 
                u.brazoIzq.rotation.x = -0.3;
            } else if (entidad.class === 'RAGE-BRAWLER') {
                u.brazoDer.rotation.x = Math.PI/2 - 0.2; 
                u.brazoIzq.rotation.x = Math.PI/2 - 0.5;
            }
        } else if (isAiming) {
            if (entidad.class === 'SOUL-SNIPER') {
                u.brazoIzq.rotation.x = -Math.PI/2; 
                u.brazoDer.rotation.x = -Math.PI/2 + 0.4; 
                u.brazoIzq.rotation.z = 0; u.brazoDer.rotation.z = 0;
            } else if (entidad.class === 'SHADOWBLADE' || entidad.class === 'ABYSSAL-PIRATE') {
                u.brazoDer.rotation.x = -Math.PI/2 + 0.2; 
                u.brazoIzq.rotation.x = 0;
                u.brazoDer.rotation.z = 0;
            } else if (entidad.class === 'ASH-GUARD' || entidad.class === 'STEEL-MERCENARY') {
                u.brazoIzq.rotation.x = -0.2; 
                u.brazoIzq.rotation.z = -0.3; 
                u.brazoDer.rotation.x = -Math.PI/2 + 0.6; 
                u.brazoDer.rotation.z = 0;
            } else if (entidad.class === 'NATURE-DRUID' || entidad.class === 'FLAME-MAGE') {
                u.brazoDer.rotation.x = -Math.PI/2 + 0.3; 
                u.brazoIzq.rotation.x = 0;
                u.brazoDer.rotation.z = 0;
            } else if (entidad.class === 'RAGE-BRAWLER') {
                u.brazoIzq.rotation.x = -0.3; 
                u.brazoIzq.rotation.z = -0.1; 
                u.brazoDer.rotation.x = -Math.PI/2 + 0.4; 
                u.brazoDer.rotation.z = 0;
            }
        } else {
            u.brazoIzq.rotation.x = isMoving ? -oscilacion : 0;
            u.brazoDer.rotation.x = isMoving ? oscilacion : 0;
            u.brazoIzq.rotation.z = 0; u.brazoDer.rotation.z = 0;
            
            if ((entidad.class === 'ASH-GUARD' || entidad.class === 'STEEL-MERCENARY') && !isAiming) {
                u.brazoIzq.rotation.x = isMoving ? (-oscilacion * 0.5) - 0.1 : -0.1; 
                u.brazoIzq.rotation.z = -0.1;
            }
            if (entidad.class === 'RAGE-BRAWLER' && !isAiming) {
                u.brazoIzq.rotation.x = isMoving ? -oscilacion : -0.2; 
                u.brazoDer.rotation.x = isMoving ? oscilacion : -0.2; 
            }
        }
    }
};
