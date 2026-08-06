// ==================================================
// controles.js - GESTIÓN DE JOYSTICKS Y BOTONES TÁCTILES
// ==================================================

const Controles = {
    init: function() {
        this.setupJoystick('move-stick', 'move-knob', 'move');
        this.setupJoystick('atk-stick', 'atk-knob', 'atk');
        this.setupJoystick('skill-stick', 'skill-knob', 'skill');
        this.setupJoystick('skill-stick-2', 'skill-knob-2', 'skill2');
        
        const recallBtn = document.getElementById('recall-btn');
        if (recallBtn) {
            recallBtn.addEventListener('pointerdown', () => {
                if (STATE && STATE.player && STATE.player.hp > 0 && (!STATE.player.stoneTimer || STATE.player.stoneTimer <= 0) && (!STATE.player.stunTimer || STATE.player.stunTimer <= 0)) {
                    STATE.player.recalling = true;
                    STATE.player.recallTimer = 180; 
                }
            });
        }
    },
    
    setupJoystick: function(stickId, knobId, tipo) {
        const stick = document.getElementById(stickId);
        const knob = document.getElementById(knobId);
        const cancelZone = document.getElementById('cancel-zone');
        if (!stick || !knob) return;
        
        let activePointerId = null;
        let centerX, centerY;
        let maxDist = 60; 
        
        stick.addEventListener('pointerdown', (e) => {
            if (STATE.player.hp <= 0 || (STATE.player.stoneTimer && STATE.player.stoneTimer > 0) || (STATE.player.stunTimer && STATE.player.stunTimer > 0)) return;
            
            if (activePointerId !== null) return;
            activePointerId = e.pointerId;
            stick.setPointerCapture(activePointerId);
            
            let rect = stick.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
            maxDist = rect.width / 2;
            
            this.handleMove(e, centerX, centerY, maxDist, knob, tipo, cancelZone);
        });
        
        stick.addEventListener('pointermove', (e) => {
            if (activePointerId === e.pointerId && (!STATE.player.stoneTimer || STATE.player.stoneTimer <= 0) && (!STATE.player.stunTimer || STATE.player.stunTimer <= 0)) {
                this.handleMove(e, centerX, centerY, maxDist, knob, tipo, cancelZone);
            }
        });
        
        const handleUp = (e) => {
            if (activePointerId === e.pointerId) {
                activePointerId = null;
                stick.releasePointerCapture(e.pointerId);
                knob.style.transform = `translate(-50%, -50%)`;
                
                let isCancel = false;
                if (tipo !== 'move' && cancelZone && cancelZone.style.display === 'flex') {
                    let cx = e.clientX, cy = e.clientY;
                    let czRect = cancelZone.getBoundingClientRect();
                    if (cx > czRect.left && cx < czRect.right && cy > czRect.top && cy < czRect.bottom) {
                        isCancel = true;
                    }
                    cancelZone.style.display = 'none';
                    cancelZone.classList.remove('active');
                }
                
                if (STATE && STATE.player) {
                    if (tipo === 'move') {
                        STATE.player.inputX = 0;
                        STATE.player.inputY = 0;
                    }
                    
                    if (STATE.player.stoneTimer > 0 || STATE.player.stunTimer > 0) return;

                    if (tipo === 'atk') {
                        STATE.player.aimingAtk = false;
                        STATE.player.isAimingRight = false;
                        STATE.player.cancelAtk = false;
                    } else if (tipo === 'skill') {
                        STATE.player.aimingSkill = false;
                        STATE.player.cancelAtk = false;
                        
                        if (!isCancel && STATE.player.hp > 0 && STATE.player.cd <= 0 && STATE.player.mp >= STATE.player.skillCost) {
                            Habilidades.executeSkill(STATE.player, STATE);
                            STATE.player.skillOverrideTimer = 15; 
                        }
                    } else if (tipo === 'skill2') {
                        STATE.player.aimingSkill2 = false;
                        
                        // Si la habilidad no se disparó automáticamente por el auto-aim, la disparamos al soltar el botón (Para Piedra, Purificar o tiros a ciegas)
                        if (!isCancel && STATE.player.hp > 0 && STATE.player.skill2Cd <= 0) {
                            STATE.player.skill2Angle = STATE.player.lastAngle;
                            STATE.player.skill2Cd = STATE.player.skill2MaxCd;
                            if (typeof Habilidades !== 'undefined' && Habilidades.executeSkill2) {
                                Habilidades.executeSkill2(STATE.player, STATE);
                                STATE.player.skillOverrideTimer = 15; 
                            }
                        }
                    }
                }
            }
        };
        
        stick.addEventListener('pointerup', handleUp);
        stick.addEventListener('pointercancel', handleUp);
    },
    
    handleMove: function(e, centerX, centerY, maxDist, knob, tipo, cancelZone) {
        let dx = e.clientX - centerX;
        let dy = e.clientY - centerY;
        let dist = Math.sqrt(dx*dx + dy*dy);
        let angle = Math.atan2(dy, dx);
        let isCancel = false;
        
        if (tipo !== 'move' && cancelZone) {
            cancelZone.style.display = 'flex';
            let cx = e.clientX, cy = e.clientY;
            let czRect = cancelZone.getBoundingClientRect();
            if (cx > czRect.left && cx < czRect.right && cy > czRect.top && cy < czRect.bottom) {
                isCancel = true;
                cancelZone.classList.add('active');
            } else {
                cancelZone.classList.remove('active');
            }
        }
        
        if (dist > maxDist) {
            dx = Math.cos(angle) * maxDist;
            dy = Math.sin(angle) * maxDist;
        }
        
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        if (STATE && STATE.player && STATE.player.hp > 0) {
            if (tipo === 'move') {
                STATE.player.inputX = dx / maxDist;
                STATE.player.inputY = dy / maxDist;
            } else if (tipo === 'atk') {
                STATE.player.aimingAtk = true;
                STATE.player.isAimingRight = true;
                STATE.player.manualAimAngle = angle;
                STATE.player.cancelAtk = isCancel;
                STATE.player.aimingSkill = false;
                STATE.player.aimingSkill2 = false;
            } else if (tipo === 'skill') {
                STATE.player.aimingSkill = true;
                STATE.player.manualAimAngle = angle;
                STATE.player.cancelAtk = isCancel;
                STATE.player.aimingSkill2 = false;
            } else if (tipo === 'skill2') {
                STATE.player.aimingSkill2 = true;
                STATE.player.autoAimingSkill2 = (dist < 15); // Si casi no se movió, es un toque automático
                STATE.player.manualAimAngle = angle; 
                STATE.player.cancelAtk = isCancel;
                STATE.player.aimingAtk = false;
                STATE.player.aimingSkill = false;
            }
        }
    }
};
