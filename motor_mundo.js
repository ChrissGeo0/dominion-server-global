// ==================================================
// motor_mundo.js - CONSTRUCCIÓN DE ARENA Y ENTIDADES
// ==================================================

const MotorMundo = {
    scene: null,
    entidadesVisuales: null,
    trapIdCounter: 0, 
    
    construir: function(sceneRef, entidadesRef) {
        this.scene = sceneRef;
        this.entidadesVisuales = entidadesRef;
        
        const geometriaSuelo = new THREE.PlaneGeometry(3650, 3650);
        const texturaSuelo = new THREE.TextureLoader().load('Arena.png');
        const materialSuelo = new THREE.MeshLambertMaterial({ map: texturaSuelo, color: 0xffffff }); 
        const suelo = new THREE.Mesh(geometriaSuelo, materialSuelo);
        suelo.rotation.x = -Math.PI / 2; 
        suelo.position.set(3650 / 2, 0, 3650 / 2); 
        this.scene.add(suelo);
        
        this.crearMuros(); 
        this.crearTorretas(); 
        this.crearPickups();
        this.crearArboles(); 
        
        this.baseVisGroup = new THREE.Group();
        const baseConoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
        const baseBordeMat = new THREE.MeshBasicMaterial({ color: 0x33ccff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, depthTest: false });

        const baseConoGeo = new THREE.RingGeometry(0.01, 1.0, 64);
        const baseCono = new THREE.Mesh(baseConoGeo, baseConoMat);
        baseCono.rotation.x = -Math.PI / 2; baseCono.position.y = 1.0; baseCono.renderOrder = 994;

        const baseBordeGeo = new THREE.RingGeometry(0.98, 1.0, 64);
        const baseBorde = new THREE.Mesh(baseBordeGeo, baseBordeMat);
        baseBorde.rotation.x = -Math.PI / 2; baseBorde.position.y = 1.1; baseBorde.renderOrder = 995;

        this.baseVisGroup.add(baseCono, baseBorde);
        this.baseVisGroup.scale.set(450, 1, 450); 
        this.scene.add(this.baseVisGroup);
    },
    
    limpiarMemoria3D: function(objeto) {
        if (!objeto) return;
        objeto.traverse((hijo) => {
            if (hijo.isMesh) {
                if (hijo.geometry) hijo.geometry.dispose();
                if (hijo.material) {
                    if (Array.isArray(hijo.material)) {
                        hijo.material.forEach(m => m.dispose());
                    } else {
                        hijo.material.dispose();
                    }
                }
            }
        });
        this.scene.remove(objeto);
    },

    crearMuros: function() {
        const materialMuro = new THREE.MeshBasicMaterial({ color: 0x1c2533 }); 
        const materialBorde = new THREE.LineBasicMaterial({ color: 0x33ccff, transparent: true, opacity: 0.15 });
        
        if(WORLD.walls) WORLD.walls.forEach(w => {
            if (!w.hidden) {
                const geo = new THREE.BoxGeometry(w.w, 150, w.h); 
                const muro = new THREE.Mesh(geo, materialMuro);
                const edges = new THREE.EdgesGeometry(geo);
                const line = new THREE.LineSegments(edges, materialBorde);
                
                muro.add(line); 
                muro.position.set(w.x + (w.w / 2), 75, w.y + (w.h / 2)); 
                this.scene.add(muro);
            }
        });
    },
    
    crearArboles: function() {
        if(!WORLD.trees) return;
        
        this.troncoMat = new THREE.MeshStandardMaterial({ color: 0x6b6054, roughness: 1.0 }); 
        this.hojasMat = new THREE.MeshStandardMaterial({ color: 0x22aa44, roughness: 0.9 });          
        this.troncoFantasmaMat = new THREE.MeshStandardMaterial({ color: 0x6b6054, roughness: 1.0, transparent: true, opacity: 0.15 });
        this.hojasFantasmaMat = new THREE.MeshStandardMaterial({ color: 0x22aa44, roughness: 0.9, transparent: true, opacity: 0.1 });
        
        const troncoGeo = new THREE.CylinderGeometry(8, 20, 75, 7);
        const hojasGeo = new THREE.DodecahedronGeometry(45, 0);
        
        WORLD.trees.forEach((t, index) => {
            const grupoArbol = new THREE.Group();
            const tronco = new THREE.Mesh(troncoGeo, this.troncoMat);
            tronco.position.y = 37.5;              
            const hojas = new THREE.Mesh(hojasGeo, this.hojasMat);
            hojas.position.y = 80; 
            hojas.scale.set(1.6, 0.7, 1.6);              
            hojas.rotation.y = Math.random() * Math.PI;
            
            grupoArbol.rotation.y = Math.random() * Math.PI;
            grupoArbol.add(tronco);
            grupoArbol.add(hojas);
            grupoArbol.position.set(t.x, 0, t.y);
            grupoArbol.userData = { tronco: tronco, hojas: hojas };
            
            this.scene.add(grupoArbol);
            this.entidadesVisuales['tree_' + index] = grupoArbol;
        });
    },
    
    crearTorretas: function() {
        if(WORLD.turrets) WORLD.turrets.forEach((t, index) => {
            const torreGroup = new THREE.Group();
            
            const geoTorre = new THREE.RingGeometry(t.range - 15, t.range, 64); 
            const matTorre = new THREE.MeshBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
            const torreMesh = new THREE.Mesh(geoTorre, matTorre);
            torreMesh.rotation.x = -Math.PI / 2; 
            torreMesh.position.y = 2; 
            torreMesh.renderOrder = 1;
            
            const visGroup = new THREE.Group();
            const tConoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
            const tBordeMat = new THREE.MeshBasicMaterial({ color: 0x33ccff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, depthTest: false });

            const tConoGeo = new THREE.RingGeometry(0.01, 1.0, 64);
            const tCono = new THREE.Mesh(tConoGeo, tConoMat);
            tCono.rotation.x = -Math.PI / 2; tCono.position.y = 1.0; tCono.renderOrder = 994;

            const tBordeGeo = new THREE.RingGeometry(0.98, 1.0, 64);
            const tBorde = new THREE.Mesh(tBordeGeo, tBordeMat);
            tBorde.rotation.x = -Math.PI / 2; tBorde.position.y = 1.1; tBorde.renderOrder = 995;

            visGroup.add(tCono, tBorde);
            
            let visionExtra = t.range * 2.25;
            visGroup.scale.set(visionExtra, 1, visionExtra);
            visGroup.visible = false; 
            
            torreGroup.add(torreMesh, visGroup);
            torreGroup.position.set(t.x, 0, t.y);
            torreGroup.userData = { mesh: torreMesh, visGroup: visGroup, matBorde: tBordeMat };
            
            this.scene.add(torreGroup);
            this.entidadesVisuales['torre_' + index] = torreGroup;
        });
    },
    
    crearPickups: function() {
        if(!WORLD.pickups) return;
        WORLD.pickups.forEach((p, index) => {
            const pickupGroup = new THREE.Group();

            const geo = new THREE.OctahedronGeometry(15, 0);
            const isHp = p.type === 'hp';
            const colorHex = isHp ? 0xffea00 : 0x7b68ee; 
            const emissiveHex = isHp ? 0xaa9900 : 0x4a30aa;
            const mat = new THREE.MeshStandardMaterial({ color: colorHex, emissive: emissiveHex, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.8 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 25; 
            
            const visGroup = new THREE.Group();
            const pConoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
            const pBordeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false, depthTest: false });

            const pConoGeo = new THREE.RingGeometry(0.01, 1.0, 32);
            const pCono = new THREE.Mesh(pConoGeo, pConoMat);
            pCono.rotation.x = -Math.PI / 2; pCono.position.y = 1.0; pCono.renderOrder = 994;

            const pBordeGeo = new THREE.RingGeometry(0.95, 1.0, 32);
            const pBorde = new THREE.Mesh(pBordeGeo, pBordeMat);
            pBorde.rotation.x = -Math.PI / 2; pBorde.position.y = 1.1; pBorde.renderOrder = 995;

            visGroup.add(pCono, pBorde);
            visGroup.scale.set(120, 1, 120); 

            pickupGroup.add(mesh, visGroup);
            pickupGroup.position.set(p.x, 0, p.y);
            pickupGroup.userData = { mesh: mesh, visGroup: visGroup };

            this.scene.add(pickupGroup);
            this.entidadesVisuales['pickup_' + index] = pickupGroup;
            
            p.active = true; p.respawnTimer = 0;
        });
    },
    
    crearMeshPersonaje: function(entidad, id) {
        const group = new THREE.Group();
        group.position.y = 0; 
        this.scene.add(group); 
        this.entidadesVisuales[id] = group;
        
        if (typeof Skins !== 'undefined') { 
            Skins.cargar(entidad, group); 
        } else {
            const color = entidad.team === 1 ? 0x00aaff : 0xff2222;
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 50, 16), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.6 }));
            mesh.position.y = 25; 
            group.add(mesh);
        }
        return group;
    },
    
    crearBarra3D: function(entidad, id) {
        const barGroup = new THREE.Group();
        
        const bgGeo = new THREE.PlaneGeometry(110, 25);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x000000, depthTest: false, transparent: true, opacity: 0.8 });
        const bg = new THREE.Mesh(bgGeo, bgMat); 
        bg.renderOrder = 999; barGroup.add(bg);
        
        const hpGeo = new THREE.PlaneGeometry(106, 14); hpGeo.translate(53, 0, 0); 
        const hpColor = entidad.team === 1 ? 0xffea00 : 0xff3333; 
        const hpMat = new THREE.MeshBasicMaterial({ color: hpColor, depthTest: false });
        const hp = new THREE.Mesh(hpGeo, hpMat); 
        hp.position.set(-53, 3.5, 0.1); hp.renderOrder = 1000; barGroup.add(hp);
        
        const mpGeo = new THREE.PlaneGeometry(106, 6); mpGeo.translate(53, 0, 0);
        const mpMat = new THREE.MeshBasicMaterial({ color: 0x7b68ee, depthTest: false }); 
        const mp = new THREE.Mesh(mpGeo, mpMat); 
        mp.position.set(-53, -7.5, 0.1); mp.renderOrder = 1000; barGroup.add(mp);
        
        barGroup.userData = { hpBar: hp, mpBar: mp };
        this.scene.add(barGroup); 
        this.entidadesVisuales['bar_' + id] = barGroup;
        return barGroup;
    },
    
    actualizar: function(estadoGlobal, motorRef) {
        if (estadoGlobal.player && estadoGlobal.player.hp > 0) {
            let playerMesh = this.entidadesVisuales['player'];
            if (!playerMesh) playerMesh = this.crearMeshPersonaje(estadoGlobal.player, 'player');
            
            playerMesh.position.x = estadoGlobal.player.x; 
            playerMesh.position.z = estadoGlobal.player.y; 
            playerMesh.rotation.y = -estadoGlobal.player.lastAngle;
            
            let barPlayer = this.entidadesVisuales['bar_player'];
            if (!barPlayer) barPlayer = this.crearBarra3D(estadoGlobal.player, 'player');
            
            barPlayer.position.set(estadoGlobal.player.x, 140, estadoGlobal.player.y); 
            barPlayer.quaternion.copy(motorRef.camera.quaternion); 
            barPlayer.userData.hpBar.scale.x = Math.max(0.001, estadoGlobal.player.hp / estadoGlobal.player.maxHp);
            barPlayer.userData.mpBar.scale.x = Math.max(0.001, Math.min(1, estadoGlobal.player.mp / estadoGlobal.player.maxMp));
            
            barPlayer.userData.hpBar.material.color.setHex(estadoGlobal.player.poisonTimer > 0 ? 0x8b5cf6 : (estadoGlobal.player.team === 1 ? 0xffea00 : 0xff3333));
            
            barPlayer.visible = true;
            
            let targetZoom = (UI.settings.zoom || 1.0) * 800;
            if (estadoGlobal.player.aimingAtk) targetZoom += CONFIG.UX.smartZoom;
            motorRef.currentZoom = motorRef.currentZoom ? motorRef.lerp(motorRef.currentZoom, targetZoom, 0.05) : targetZoom;
            
            let targetCamX = playerMesh.position.x; 
            let targetCamZ = playerMesh.position.z;
            
            motorRef.camX = motorRef.camX ? motorRef.lerp(motorRef.camX, targetCamX, CONFIG.UX.camLerp) : targetCamX;
            motorRef.camZ = motorRef.camZ ? motorRef.lerp(motorRef.camZ, targetCamZ, CONFIG.UX.camLerp) : targetCamZ;
            
            let shakeX = 0, shakeZ = 0;
            if (STATE.cameraShake > 0) {
                let mult = CONFIG.UX.shakeMult;
                shakeX = (Math.random() - 0.5) * STATE.cameraShake * mult; 
                shakeZ = (Math.random() - 0.5) * STATE.cameraShake * mult;
                STATE.cameraShake *= 0.8; 
                if (STATE.cameraShake < 0.5) STATE.cameraShake = 0;
            }
            motorRef.camera.position.set(motorRef.camX + shakeX, motorRef.currentZoom, motorRef.camZ + shakeZ);
            motorRef.camera.lookAt(motorRef.camX + shakeX, 0, motorRef.camZ + shakeZ);
            
            let camUpZ = estadoGlobal.player.team === 1 ? 1 : -1;
            motorRef.camera.up.set(0, 0, camUpZ);
            
            if (estadoGlobal.player.fov >= Math.PI - 0.1) {
                motorRef.luzJugador.distance = estadoGlobal.player.range;
                motorRef.linterna.intensity = 0;
            } else {
                motorRef.luzJugador.distance = estadoGlobal.player.range * 0.4;
                motorRef.linterna.intensity = 3.0;
                motorRef.linterna.angle = estadoGlobal.player.fov; 
                motorRef.linterna.distance = estadoGlobal.player.range;
            }
            motorRef.luzJugador.position.set(playerMesh.position.x, 50, playerMesh.position.z);
            motorRef.linterna.position.set(playerMesh.position.x, 50, playerMesh.position.z);
            
            let anguloLinterna = estadoGlobal.player.lastAngle;
            let objX = playerMesh.position.x + Math.cos(anguloLinterna) * 500; 
            let objZ = playerMesh.position.z + Math.sin(anguloLinterna) * 500;
            motorRef.linternaTarget.position.set(objX, 0, objZ);
            
            let baseAtkRange = estadoGlobal.player.atkRange;
            let atkRingId = 'atk_ring'; let atkRing = this.entidadesVisuales[atkRingId];
            if (!atkRing) {
                let ringGeo = new THREE.RingGeometry(0.97, 1.0, 64); 
                let ringMat = new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                atkRing = new THREE.Mesh(ringGeo, ringMat); atkRing.rotation.x = -Math.PI / 2; atkRing.position.y = 1.5; atkRing.renderOrder = 998;
                this.scene.add(atkRing); this.entidadesVisuales[atkRingId] = atkRing;
            }
            atkRing.scale.set(baseAtkRange, 1, baseAtkRange);
            atkRing.position.x = estadoGlobal.player.x; atkRing.position.z = estadoGlobal.player.y; atkRing.visible = estadoGlobal.player.hp > 0;
            
            let visRange = estadoGlobal.player.range;
            let visFov = estadoGlobal.player.fov;
            let visorVisId = 'visor_vision'; let visorVisGroup = this.entidadesVisuales[visorVisId];
            
            if (!visorVisGroup) {
                visorVisGroup = new THREE.Group(); 
                let conoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                let bordeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                visorVisGroup.userData = { matCono: conoMat, matBorde: bordeMat, spread: -1 };
                this.scene.add(visorVisGroup); this.entidadesVisuales[visorVisId] = visorVisGroup;
            }
            if (Math.abs(visorVisGroup.userData.spread - visFov) > 0.01) {
                visorVisGroup.children.forEach(c => c.geometry.dispose()); visorVisGroup.clear();
                let anguloApertura = visFov * 2;
                
                let conoGeo = new THREE.RingGeometry(0.05, 1.0, 64, 1, -visFov, anguloApertura);
                let cono = new THREE.Mesh(conoGeo, visorVisGroup.userData.matCono);
                cono.rotation.x = -Math.PI / 2; cono.position.y = 1.2; cono.renderOrder = 996;
                
                let bordeGeo = new THREE.RingGeometry(0.97, 1.0, 64, 1, -visFov, anguloApertura);
                let borde = new THREE.Mesh(bordeGeo, visorVisGroup.userData.matBorde); 
                borde.rotation.x = -Math.PI / 2; borde.position.y = 1.3; borde.renderOrder = 997;
                
                visorVisGroup.add(cono, borde);
                visorVisGroup.userData.spread = visFov;
            }
            visorVisGroup.scale.set(visRange, 1, visRange);
            visorVisGroup.position.x = estadoGlobal.player.x; visorVisGroup.position.z = estadoGlobal.player.y; 
            visorVisGroup.rotation.y = -estadoGlobal.player.lastAngle; visorVisGroup.visible = estadoGlobal.player.hp > 0;
            
            let radarId = 'radar_player'; let radarGroup = this.entidadesVisuales[radarId];
            if (!radarGroup) {
                radarGroup = new THREE.Group();
                let waveGeo = new THREE.RingGeometry(0.95, 1.0, 64);
                let waveMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
                let waveMesh = new THREE.Mesh(waveGeo, waveMat); waveMesh.rotation.x = -Math.PI / 2; waveMesh.name = "onda";
                let areaGeo = new THREE.CircleGeometry(0.95, 64);
                let areaMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
                let areaMesh = new THREE.Mesh(areaGeo, areaMat); areaMesh.rotation.x = -Math.PI / 2; areaMesh.name = "area";
                radarGroup.add(waveMesh); radarGroup.add(areaMesh); radarGroup.position.y = 5.0; 
                waveMesh.renderOrder = 9999; areaMesh.renderOrder = 9998;
                this.scene.add(radarGroup); this.entidadesVisuales[radarId] = radarGroup;
            }
            if (estadoGlobal.player.class === 'ASH-GUARD' && estadoGlobal.player.radarTimer > 0) {
                let progress = 1 - (estadoGlobal.player.radarTimer / 42); 
                let r = 700 * progress; if (r < 0.1) r = 0.1; 
                radarGroup.scale.set(r, 1, r); radarGroup.position.x = estadoGlobal.player.x; radarGroup.position.z = estadoGlobal.player.y;
                let opacityFactor = (1 - progress);
                radarGroup.children.find(c => c.name === "onda").material.opacity = opacityFactor * 0.9;
                radarGroup.children.find(c => c.name === "area").material.opacity = opacityFactor * 0.35;
                radarGroup.visible = true;
            } else { radarGroup.visible = false; }
            
            let isMoving = (Math.abs(estadoGlobal.player.vx) > 0.1 || Math.abs(estadoGlobal.player.vy) > 0.1);
            let dStats = IA.obtenerStatsDinamicas(estadoGlobal.player, isMoving);
            let activeRange = Colisiones.distanciaAlMuro(estadoGlobal.player.x, estadoGlobal.player.y, estadoGlobal.player.lastAngle, dStats.range);
            
            let visorId = 'visor_rojo'; let visorGroup = this.entidadesVisuales[visorId];
            if (!visorGroup) {
                visorGroup = new THREE.Group(); 
                let conoMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                let bordeMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                visorGroup.userData = { mat1: conoMat, mat2: bordeMat, spread: -1 };
                this.scene.add(visorGroup); this.entidadesVisuales[visorId] = visorGroup;
            }
            
            let spreadQuieto = estadoGlobal.player.atkSpread;
            let spreadMoviendo = estadoGlobal.player.atkSpread * 2.0;
            
            if (visorGroup.userData.spread !== spreadQuieto) {
                visorGroup.children.forEach(c => c.geometry.dispose()); visorGroup.clear();
                
                let ang1 = spreadQuieto * 2;
                let c1 = new THREE.Mesh(new THREE.RingGeometry(0.05, 1.0, 32, 1, -spreadQuieto, ang1), visorGroup.userData.mat1);
                c1.rotation.x = -Math.PI / 2; c1.position.y = 2; c1.renderOrder = 998; c1.name = "c1";
                let b1 = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.0, 32, 1, -spreadQuieto, ang1), visorGroup.userData.mat2);
                b1.rotation.x = -Math.PI / 2; b1.position.y = 2.5; b1.renderOrder = 998; b1.name = "b1";
                
                let ang2 = spreadMoviendo * 2;
                let c2 = new THREE.Mesh(new THREE.RingGeometry(0.05, 1.0, 32, 1, -spreadMoviendo, ang2), visorGroup.userData.mat1);
                c2.rotation.x = -Math.PI / 2; c2.position.y = 2; c2.renderOrder = 998; c2.name = "c2";
                let b2 = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.0, 32, 1, -spreadMoviendo, ang2), visorGroup.userData.mat2);
                b2.rotation.x = -Math.PI / 2; b2.position.y = 2.5; b2.renderOrder = 998; b2.name = "b2";
                
                visorGroup.add(c1, b1, c2, b2);
                visorGroup.userData.spread = spreadQuieto;
            }
            
            visorGroup.children.find(c => c.name === "c1").visible = !isMoving;
            visorGroup.children.find(c => c.name === "b1").visible = !isMoving;
            visorGroup.children.find(c => c.name === "c2").visible = isMoving;
            visorGroup.children.find(c => c.name === "b2").visible = isMoving;
            
            visorGroup.scale.set(activeRange, 1, activeRange); 
            visorGroup.position.x = estadoGlobal.player.x; 
            visorGroup.position.z = estadoGlobal.player.y; 
            visorGroup.rotation.y = -estadoGlobal.player.lastAngle;
            
            let targetOpacity = estadoGlobal.player.hasTarget ? 0.4 : 0.15;
            visorGroup.children.find(c => c.name === "c1").material.opacity = targetOpacity;
            visorGroup.children.find(c => c.name === "c2").material.opacity = targetOpacity;
            
            visorGroup.visible = estadoGlobal.player.aimingAtk;

            // === VISOR DE TALENTOS ===
            let visorTalentoId = 'visor_talento'; let visorTalentoGroup = this.entidadesVisuales[visorTalentoId];
            if (!visorTalentoGroup) {
                visorTalentoGroup = new THREE.Group(); 
                
                let tLineGeo = new THREE.PlaneGeometry(1, 4); 
                tLineGeo.rotateX(-Math.PI / 2);
                tLineGeo.translate(0.5, 0, 0); 
                let tLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                let tLine = new THREE.Mesh(tLineGeo, tLineMat);
                tLine.position.y = 2.1;
                tLine.renderOrder = 998;
                tLine.name = "tline";
                
                let tImpactMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                let tImpact = new THREE.Mesh(new THREE.RingGeometry(175, 180, 32), tImpactMat);
                tImpact.rotation.x = -Math.PI / 2; tImpact.position.y = 2.6; tImpact.renderOrder = 999; tImpact.name = "timpact";
                
                visorTalentoGroup.add(tLine, tImpact);
                this.scene.add(visorTalentoGroup); this.entidadesVisuales[visorTalentoId] = visorTalentoGroup;
            }

            if (estadoGlobal.player.aimingSkill2) {
                let talentoColor = 0x888888; 
                let rangoTalento = 300; 
                let radioImpacto = 0;
                
                if(estadoGlobal.player.skill2Type === 'gancho') { talentoColor = 0xfacc15; rangoTalento = 700; }
                if(estadoGlobal.player.skill2Type === 'stun') { talentoColor = 0xffaa00; rangoTalento = 600; }
                if(estadoGlobal.player.skill2Type === 'hielo') { talentoColor = 0x00ffff; rangoTalento = 700; radioImpacto = 180; }
                if(estadoGlobal.player.skill2Type === 'purificar') { talentoColor = 0xffffff; rangoTalento = 50; } 
                // === FIX VISUAL TELEPORT: RANGO REAL Y SIMULACIÓN DE MUROS ===
                if(estadoGlobal.player.skill2Type === 'teleport') { talentoColor = 0xd946ef; rangoTalento = 1000; radioImpacto = estadoGlobal.player.radius + 5; } 
                
                let imp = visorTalentoGroup.children.find(c => c.name === "timpact");
                imp.material.color.setHex(talentoColor);
                
                let paddingVis = estadoGlobal.player.skill2Type === 'teleport' ? (estadoGlobal.player.radius + 5) : 0;
                let activeTalentoRange = rangoTalento;
                
                if (estadoGlobal.player.skill2Type === 'teleport') {
                    let targetX = estadoGlobal.player.x + Math.cos(estadoGlobal.player.lastAngle) * rangoTalento;
                    let targetY = estadoGlobal.player.y + Math.sin(estadoGlobal.player.lastAngle) * rangoTalento;
                    let murosDestino = Colisiones.getMurosCercanos(targetX, targetY, paddingVis);
                    let destinoOcupado = false;
                    
                    for (let j = 0; j < murosDestino.length; j++) {
                        let w = murosDestino[j];
                        if (targetX > w.x - paddingVis && targetX < w.x + w.w + paddingVis &&
                            targetY > w.y - paddingVis && targetY < w.y + w.h + paddingVis) {
                            destinoOcupado = true;
                            break;
                        }
                    }
                    
                    if (destinoOcupado) {
                        activeTalentoRange = Colisiones.distanciaAlMuro(estadoGlobal.player.x, estadoGlobal.player.y, estadoGlobal.player.lastAngle, rangoTalento, paddingVis);
                    }
                } else {
                    activeTalentoRange = Colisiones.distanciaAlMuro(estadoGlobal.player.x, estadoGlobal.player.y, estadoGlobal.player.lastAngle, rangoTalento, paddingVis);
                }
                
                visorTalentoGroup.children.find(c => c.name === "tline").scale.set(activeTalentoRange, 1, 1);
                
                if (radioImpacto > 0) {
                    imp.visible = true;
                    imp.position.set(activeTalentoRange, 2.6, 0); 
                    let s = radioImpacto / 180;
                    imp.scale.set(s, s, 1);
                } else {
                    imp.visible = false;
                }
                
                visorTalentoGroup.position.x = estadoGlobal.player.x; 
                visorTalentoGroup.position.z = estadoGlobal.player.y; 
                visorTalentoGroup.rotation.y = -estadoGlobal.player.lastAngle;
                
                visorTalentoGroup.visible = true;
            } else {
                visorTalentoGroup.visible = false;
            }

            let visorHabId = 'visor_hab_mago'; let visorHabGroup = this.entidadesVisuales[visorHabId];
            if (!visorHabGroup) {
                visorHabGroup = new THREE.Group();
                
                let hLineGeo = new THREE.PlaneGeometry(1, 4);
                hLineGeo.rotateX(-Math.PI / 2);
                hLineGeo.translate(0.5, 0, 0);
                let hLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                let hLine = new THREE.Mesh(hLineGeo, hLineMat);
                hLine.position.y = 2.1;
                hLine.renderOrder = 998;
                hLine.name = "hline";

                let impMat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                let imp = new THREE.Mesh(new THREE.RingGeometry(175, 180, 32), impMat);
                imp.rotation.x = -Math.PI / 2; imp.position.y = 2.6; imp.renderOrder = 999; imp.name = "imp";

                visorHabGroup.add(hLine, imp);
                this.scene.add(visorHabGroup); this.entidadesVisuales[visorHabId] = visorHabGroup;
            }

            if (estadoGlobal.player.aimingSkill && estadoGlobal.player.class === 'FLAME-MAGE') {
                let range = 700; 
                let activeRange = Colisiones.distanciaAlMuro(estadoGlobal.player.x, estadoGlobal.player.y, estadoGlobal.player.lastAngle, range);
                
                visorHabGroup.children.find(c => c.name === "hline").scale.set(activeRange, 1, 1);
                visorHabGroup.children.find(c => c.name === "imp").position.set(activeRange, 2.6, 0);
                
                visorHabGroup.position.x = estadoGlobal.player.x; 
                visorHabGroup.position.z = estadoGlobal.player.y; 
                visorHabGroup.rotation.y = -estadoGlobal.player.lastAngle;
                
                visorHabGroup.visible = true;
            } else {
                if (visorHabGroup) visorHabGroup.visible = false;
            }

            if (this.baseVisGroup) {
                let myBase = estadoGlobal.player.team === 1 ? {x: 1825, y: 300} : {x: 1825, y: 3350};
                this.baseVisGroup.position.x = myBase.x;
                this.baseVisGroup.position.z = myBase.y;
                this.baseVisGroup.visible = true;
            }

        } else {
            let barPlayer = this.entidadesVisuales['bar_player']; if (barPlayer) barPlayer.visible = false;
            let visorTalentoGroup = this.entidadesVisuales['visor_talento']; if (visorTalentoGroup) visorTalentoGroup.visible = false;
            let visorHabGroup = this.entidadesVisuales['visor_hab_mago']; if (visorHabGroup) visorHabGroup.visible = false;
            if (this.baseVisGroup) this.baseVisGroup.visible = false;
        }
        
        estadoGlobal.bots.forEach((bot, index) => {
            let botMesh = this.entidadesVisuales['bot_' + index]; let botBar = this.entidadesVisuales['bar_bot_' + index];
            if (bot.hp > 0) {
                if (!botMesh) botMesh = this.crearMeshPersonaje(bot, 'bot_' + index);
                if (!botBar) botBar = this.crearBarra3D(bot, 'bot_' + index);
                
                botMesh.position.x = bot.x; botMesh.position.z = bot.y; botMesh.rotation.y = -bot.lastAngle;
                
                let isVis = bot.visible || estadoGlobal.player.hp <= 0; 
                botMesh.visible = isVis; 
                
                botBar.position.set(bot.x, 140, bot.y); 
                botBar.quaternion.copy(motorRef.camera.quaternion);
                botBar.userData.hpBar.scale.x = Math.max(0.001, bot.hp / bot.maxHp); 
                botBar.userData.mpBar.scale.x = Math.max(0.001, Math.min(1, bot.mp / bot.maxMp));
                botBar.userData.hpBar.material.color.setHex(bot.poisonTimer > 0 ? 0x8b5cf6 : (bot.team === 1 ? 0xffea00 : 0xff3333));
                
                botBar.visible = isVis; 
            } else {
                if (botMesh) botMesh.visible = false; 
                if (botBar) botBar.visible = false;
            }

            let visorVisBotId = 'visor_vision_bot_' + index; 
            let visorVisBotGroup = this.entidadesVisuales[visorVisBotId];
            
            if (bot.team === estadoGlobal.player.team && bot.hp > 0) {
                if (!visorVisBotGroup) {
                    visorVisBotGroup = new THREE.Group(); 
                    let conoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, depthTest: false }); 
                    let bordeMat = new THREE.MeshBasicMaterial({ color: 0x33ccff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, depthTest: false }); 
                    visorVisBotGroup.userData = { matCono: conoMat, matBorde: bordeMat, spread: -1 };
                    this.scene.add(visorVisBotGroup); 
                    this.entidadesVisuales[visorVisBotId] = visorVisBotGroup;
                }
                
                let visFovBot = bot.fov;
                let visRangeBot = bot.range;
                
                if (Math.abs(visorVisBotGroup.userData.spread - visFovBot) > 0.01) {
                    visorVisBotGroup.children.forEach(c => c.geometry.dispose()); visorVisBotGroup.clear();
                    let anguloApertura = visFovBot * 2;
                    
                    let conoGeo = new THREE.RingGeometry(0.05, 1.0, 32, 1, -visFovBot, anguloApertura);
                    let cono = new THREE.Mesh(conoGeo, visorVisBotGroup.userData.matCono);
                    cono.rotation.x = -Math.PI / 2; cono.position.y = 1.1; cono.renderOrder = 994;
                    
                    let bordeGeo = new THREE.RingGeometry(0.97, 1.0, 32, 1, -visFovBot, anguloApertura);
                    let borde = new THREE.Mesh(bordeGeo, visorVisBotGroup.userData.matBorde); 
                    borde.rotation.x = -Math.PI / 2; borde.position.y = 1.2; borde.renderOrder = 995;
                    
                    visorVisBotGroup.add(cono, borde);
                    visorVisBotGroup.userData.spread = visFovBot;
                }
                visorVisBotGroup.scale.set(visRangeBot, 1, visRangeBot);
                visorVisBotGroup.position.x = bot.x; 
                visorVisBotGroup.position.z = bot.y; 
                visorVisBotGroup.rotation.y = -bot.lastAngle; 
                visorVisBotGroup.visible = true;
            } else {
                if (visorVisBotGroup) visorVisBotGroup.visible = false;
            }
        });
        
        if (!estadoGlobal.ballestas) estadoGlobal.ballestas = [];
        estadoGlobal.ballestas.forEach(b => {
            if (!b.vId) b.vId = 'ballesta_vis_' + b.id;
            let balMesh = this.entidadesVisuales[b.vId];
            
            if (!balMesh) {
                let bGroup = new THREE.Group();
                let isMyTeam = (estadoGlobal.player && estadoGlobal.player.team === b.team);
                
                let baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
                let base = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), baseMat);
                base.position.y = 15;
                
                let gunMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
                let gun = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 30, 8), gunMat);
                gun.rotation.x = Math.PI / 2;
                gun.position.set(0, 35, 10);
                gun.name = "canon";

                let hpGroup = new THREE.Group();
                let bgGeo = new THREE.PlaneGeometry(40, 6);
                let bgMat = new THREE.MeshBasicMaterial({ color: 0x000000, depthTest: false, transparent: true, opacity: 0.8 });
                let bg = new THREE.Mesh(bgGeo, bgMat);
                bg.renderOrder = 999;
                
                let hpColor = b.team === 1 ? 0x33ccff : 0xff3333;
                let hpGeo = new THREE.PlaneGeometry(38, 4); hpGeo.translate(19, 0, 0);
                let hpMat = new THREE.MeshBasicMaterial({ color: hpColor, depthTest: false });
                let hpBar = new THREE.Mesh(hpGeo, hpMat);
                hpBar.position.set(-19, 0, 0.1);
                hpBar.renderOrder = 1000;
                hpBar.name = "hpBar";
                
                hpGroup.add(bg, hpBar);
                hpGroup.position.y = 55; 
                hpGroup.name = "hpGroup";

                bGroup.add(base, gun, hpGroup);
                this.scene.add(bGroup);
                this.entidadesVisuales[b.vId] = bGroup;
                balMesh = bGroup;
            }
            
            balMesh.position.set(b.x, 0, b.y);
            
            let canon = balMesh.children.find(c => c.name === "canon");
            if (canon) {
                canon.rotation.y = -b.lastAngle; 
            }
            
            let hpG = balMesh.children.find(c => c.name === "hpGroup");
            if (hpG) {
                hpG.quaternion.copy(motorRef.camera.quaternion); 
                let hpB = hpG.children.find(c => c.name === "hpBar");
                if (hpB) hpB.scale.x = Math.max(0.001, b.hp / b.maxHp);
            }
        });

        if (!estadoGlobal.trampas) estadoGlobal.trampas = [];
        estadoGlobal.trampas.forEach(t => {
            if (!t.vId) t.vId = 'trampa_' + (++this.trapIdCounter);
            
            let trapMesh = this.entidadesVisuales[t.vId];
            if (!trapMesh) {
                let tGroup = new THREE.Group();
                let isMyTeam = (estadoGlobal.player && estadoGlobal.player.team === t.team);
                
                let ringMat = new THREE.MeshBasicMaterial({ 
                    color: 0x8b5cf6, 
                    transparent: true, 
                    opacity: isMyTeam ? 0.35 : 0.05, 
                    side: THREE.DoubleSide, depthWrite: false, depthTest: false 
                });
                let ringGeo = new THREE.RingGeometry(t.radius - 2, t.radius, 32);
                let ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = -Math.PI / 2;
                ring.position.y = 0.5;
                
                let innerMat = new THREE.MeshBasicMaterial({ 
                    color: 0x8b5cf6, 
                    transparent: true, 
                    opacity: isMyTeam ? 0.5 : 0.0, 
                    side: THREE.DoubleSide, depthWrite: false, depthTest: false 
                });
                let innerGeo = new THREE.CircleGeometry(10, 16);
                let inner = new THREE.Mesh(innerGeo, innerMat);
                inner.rotation.x = -Math.PI / 2;
                inner.position.y = 0.6;
                
                tGroup.add(ring, inner);
                tGroup.position.set(t.x, 0, t.y);
                
                this.scene.add(tGroup);
                this.entidadesVisuales[t.vId] = tGroup;
                trapMesh = tGroup;
            }
            
            if (trapMesh) {
                let scale = 1 + Math.sin(estadoGlobal.matchFrames * 0.1) * 0.05;
                trapMesh.scale.set(scale, 1, scale);
            }
        });

        estadoGlobal.bullets.forEach((b) => {
            let bulletId = 'bullet_' + b.id; let bulletMesh = this.entidadesVisuales[bulletId];
            if (!bulletMesh) {
                let tS = b.size * CONFIG.UX.trailSize; 
                let trailGeo = new THREE.CylinderGeometry(tS, tS, b.speed * 2, 8); 
                trailGeo.translate(0, (b.speed * 2)/2, 0); 
                
                let matColor = b.team === 1 ? 0x00ffff : 0xff3333;
                if (b.color) matColor = b.color; 
                
                let mat = new THREE.MeshBasicMaterial({ color: matColor, transparent: true, opacity: 0.8 });
                bulletMesh = new THREE.Mesh(trailGeo, mat); 
                bulletMesh.rotation.order = 'YXZ'; bulletMesh.rotation.x = Math.PI / 2; bulletMesh.position.y = 35;
                
                this.scene.add(bulletMesh); this.entidadesVisuales[bulletId] = bulletMesh;
            }
            bulletMesh.position.x = b.x; bulletMesh.position.z = b.y; 
            bulletMesh.rotation.y = -b.angle; bulletMesh.visible = true; 
        });
        
        if (estadoGlobal.effects) {
            estadoGlobal.effects.forEach((eff) => {
                let effId = 'eff_' + eff.id; let mesh = this.entidadesVisuales[effId];
                if (!mesh) {
                    if (eff.type === 'hielo_aoe') {
                        let mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                        mesh = new THREE.Mesh(new THREE.RingGeometry(0.1, 180, 32), mat);
                        mesh.rotation.x = -Math.PI / 2; mesh.position.y = 5;
                    } else if (eff.type === 'fuego_aoe') {
                        let mat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                        mesh = new THREE.Mesh(new THREE.RingGeometry(0.1, 180, 32), mat);
                        mesh.rotation.x = -Math.PI / 2; mesh.position.y = 5;
                    } else if (eff.type === 'purify') {
                        let mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                        mesh = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 100, 16), mat);
                        mesh.position.y = 50;
                    } else if (eff.type === 'druid_buff') {
                        let mat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                        mesh = new THREE.Mesh(new THREE.RingGeometry(0.1, 400, 32), mat);
                        mesh.rotation.x = -Math.PI / 2; mesh.position.y = 8;
                    } else if (eff.type === 'fury_buff') {
                        let mat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
                        mesh = new THREE.Mesh(new THREE.RingGeometry(0.1, 100, 32), mat);
                        mesh.rotation.x = -Math.PI / 2; mesh.position.y = 8;
                    } else {
                        let mat = eff.team === 1 ? SharedMaterials.effBlue : SharedMaterials.effRed;
                        mesh = new THREE.Mesh(SharedMaterials.effGeo, mat);
                    }
                    this.scene.add(mesh); this.entidadesVisuales[effId] = mesh;
                }
                mesh.visible = true;

                if (eff.type === 'hielo_aoe' || eff.type === 'fuego_aoe' || eff.type === 'druid_buff' || eff.type === 'fury_buff') {
                    mesh.position.x = eff.x; mesh.position.z = eff.y;
                    mesh.material.opacity = (eff.life / eff.maxLife) * 0.4;
                    let scale = 1 + ((eff.maxLife - eff.life) * 0.05);
                    mesh.scale.set(scale, 1, scale);
                } else if (eff.type === 'purify') {
                    mesh.position.x = eff.x; mesh.position.z = eff.y;
                    let scale = 1 + ((eff.maxLife - eff.life) * 0.05);
                    mesh.scale.set(scale, 1, scale);
                    mesh.material.opacity = (eff.life / eff.maxLife) * 0.6;
                } else {
                    mesh.position.set(eff.x + Math.cos(eff.angle)*60, 35, eff.y + Math.sin(eff.angle)*60);
                    mesh.rotation.y = -eff.angle;
                    mesh.material.opacity = eff.life / eff.maxLife;
                }
            });
        }
        
        if(WORLD.pickups) {
            WORLD.pickups.forEach((p, index) => {
                let pGroup = this.entidadesVisuales['pickup_' + index];
                if(pGroup) {
                    if(p.active) { 
                        pGroup.visible = true; 
                        pGroup.userData.mesh.rotation.y += 0.05; 
                        pGroup.userData.mesh.position.y = 25 + Math.sin(estadoGlobal.matchFrames * 0.05) * 5; 
                        pGroup.userData.visGroup.visible = true;
                    } else { 
                        pGroup.visible = false; 
                    }
                }
            });
        }
        
        if(WORLD.trees) {
            WORLD.trees.forEach((t, index) => {
                let treeGroup = this.entidadesVisuales['tree_' + index];
                if(treeGroup && treeGroup.userData.tronco) {
                    if(!t.active) {
                        treeGroup.userData.tronco.material = this.troncoFantasmaMat;
                        treeGroup.userData.hojas.material = this.hojasFantasmaMat;
                    } else {
                        treeGroup.userData.tronco.material = this.troncoMat;
                        treeGroup.userData.hojas.material = this.hojasMat;
                    }
                }
            });
        }

        for (let key in this.entidadesVisuales) {
            if (key.startsWith('bot_')) {
                let idx = parseInt(key.replace('bot_', ''));
                if (!estadoGlobal.bots[idx]) {
                    this.limpiarMemoria3D(this.entidadesVisuales[key]);
                    delete this.entidadesVisuales[key];
                }
            }
            if (key.startsWith('bar_bot_')) {
                let idx = parseInt(key.replace('bar_bot_', ''));
                if (!estadoGlobal.bots[idx]) {
                    this.limpiarMemoria3D(this.entidadesVisuales[key]);
                    delete this.entidadesVisuales[key];
                }
            }
            if (key.startsWith('visor_vision_bot_')) {
                let idx = parseInt(key.replace('visor_vision_bot_', ''));
                if (!estadoGlobal.bots[idx]) {
                    this.limpiarMemoria3D(this.entidadesVisuales[key]);
                    delete this.entidadesVisuales[key];
                }
            }
            if (key.startsWith('ballesta_vis_')) {
                if (!estadoGlobal.ballestas.some(b => b.vId === key)) {
                    this.limpiarMemoria3D(this.entidadesVisuales[key]);
                    delete this.entidadesVisuales[key];
                }
            }
            if (key.startsWith('trampa_')) {
                if (!estadoGlobal.trampas.some(t => t.vId === key)) {
                    this.limpiarMemoria3D(this.entidadesVisuales[key]);
                    delete this.entidadesVisuales[key];
                }
            }
            if (key.startsWith('bullet_')) {
                if (!estadoGlobal.bullets.some(b => 'bullet_' + b.id === key)) {
                    this.limpiarMemoria3D(this.entidadesVisuales[key]);
                    delete this.entidadesVisuales[key];
                }
            }
            if (key.startsWith('eff_')) {
                if (!estadoGlobal.effects || !estadoGlobal.effects.some(e => 'eff_' + e.id === key)) {
                    this.limpiarMemoria3D(this.entidadesVisuales[key]);
                    delete this.entidadesVisuales[key];
                }
            }
        }
        
        if(WORLD.turrets) WORLD.turrets.forEach((t, index) => {
            let torreGroup = this.entidadesVisuales['torre_' + index];
            if (torreGroup) {
                let torreMesh = torreGroup.userData.mesh;
                let visGroup = torreGroup.userData.visGroup;
                let matBorde = torreGroup.userData.matBorde;
                
                let color = 0x445566; 
                let pTeam = estadoGlobal.player ? estadoGlobal.player.team : 1;
                
                if (t.team === 1) color = 0x00aaff;
                if (t.team === 2) color = 0xff2222;
                
                let progressOpacity = 0.5 + (Math.abs(t.progress) / 360) * 0.5;
                torreMesh.material.color.setHex(color); 
                torreMesh.material.opacity = progressOpacity;
                torreMesh.rotation.z += 0.01; 
                
                if (t.team === pTeam) {
                    visGroup.visible = true; 
                    matBorde.color.setHex(0x33ccff); 
                } else if (t.team !== 0 && t.team !== pTeam) {
                    visGroup.visible = false; 
                } else {
                    visGroup.visible = false; 
                }
            }
        });
    }
};
