// ==================================================
// personajes.js - CONFIGURACIÓN Y ESTADO GLOBAL
// ==================================================

const CONFIG = {
    MAP_SIZE: 3650, 
    MATCH_FRAMES: 8 * 60 * 60, // 8 minutos a 60 FPS
    MANA_REGEN: 0.018,
    UX: { 
        camLerp: 0.1, 
        smartZoom: 300, 
        joyCurve: 1.5, 
        shakeMult: 1.0, 
        friction: 0.2, 
        hitStop: 3, 
        lightIntensity: 1.5, 
        trailSize: 0.25 
    },
    ROLES: {
        'SOUL-SNIPER': { speed: 3.5, radius: 18, atkRange: 700, normalDamage: 100, atkSpread: 0.05, fov: 0.33, range: 338, maxHp: 200, maxMp: 140, skillCost: 35, maxCd: 300, atkSpeed: 1300, hyperRange: 840, hyperSpread: 0.01, hyperVis: 840 },
        'SHADOWBLADE': { speed: 3.9, radius: 12, atkRange: 300, normalDamage: 100, atkSpread: 0.25, fov: 2.7925, range: 350, maxHp: 220, maxMp: 140, skillCost: 35, maxCd: 300, atkSpeed: 900, hyperRange: 350, hyperSpread: 0.15, hyperVis: 280 },
        'ASH-GUARD':   { speed: 3.5, radius: 30, atkRange: 290, normalDamage: 50,  atkSpread: 0.4, fov: Math.PI, range: 400, maxHp: 460, maxMp: 140, skillCost: 35, maxCd: 300, atkSpeed: 1700, hyperRange: 330, hyperSpread: 0.25, hyperVis: 450 },
        'NATURE-DRUID':{ speed: 3.8, radius: 18, atkRange: 550, normalDamage: 70,  atkSpread: 0.15, fov: 0.50, range: 350, maxHp: 250, maxMp: 140, skillCost: 35, maxCd: 480, atkSpeed: 900,  hyperRange: 550, hyperSpread: 0.1,  hyperVis: 600 },
        'ABYSSAL-PIRATE':{ speed: 3.8, radius: 13, atkRange: 300, normalDamage: 80, atkSpread: 0.25, fov: 2.50, range: 380, maxHp: 250, maxMp: 105, skillCost: 35, maxCd: 540, atkSpeed: 1000, hyperRange: 350, hyperSpread: 0.15, hyperVis: 400 },
        'STEEL-MERCENARY':{ speed: 3.8, radius: 13, atkRange: 300, normalDamage: 80, atkSpread: 0.25, fov: 2.50, range: 380, maxHp: 250, maxMp: 105, skillCost: 35, maxCd: 780, atkSpeed: 1000, hyperRange: 350, hyperSpread: 0.15, hyperVis: 400 },
        'RAGE-BRAWLER':{ speed: 3.8, radius: 13, atkRange: 300, normalDamage: 90, atkSpread: 0.25, fov: 2.50, range: 380, maxHp: 300, maxMp: 140, skillCost: 35, maxCd: 450, atkSpeed: 1000, hyperRange: 350, hyperSpread: 0.15, hyperVis: 400 },
        'FLAME-MAGE':{ speed: 3.5, radius: 18, atkRange: 700, normalDamage: 150, atkSpread: 0.05, fov: 0.33, range: 338, maxHp: 200, maxMp: 140, skillCost: 35, maxCd: 300, atkSpeed: 1300, hyperRange: 840, hyperSpread: 0.01, hyperVis: 840 }
    }
};

const STATE = {
    screen: 'lobby', mode: '', matchFrames: 0, nexusBlue: 500, nexusRed: 500, cameraShake: 0, hitStopTimer: 0,
    bulletIdCounter: 0, effectIdCounter: 0,
    player: { 
        id: 'player', isPlayer: true, team: 1, x: 1825, y: 300, hp: 100, maxHp: 100, mp: 140, maxMp: 140, class: '', speed: 0, baseSpeed: 0, cd: 0, maxCd: 300, skillCost: 35, atkSpeed: 500,
        vx: 0, vy: 0, inputX: 0, inputY: 0, lastAngle: 0, fov: 0.5, range: 350, atkRange: 100, atkSpread: 0, hyperRange: 0, hyperSpread: 0, hyperVis: 0, normalDamage: 50, radius: 18, aimingAtk: false, cancelAtk: false, isAimingRight: false, manualAimAngle: 0, chargeTimer: 0, isHyperReady: false, active: false, activeTimer: 0, showAtk: 0, radarTimer: 0, aimingSkill: false, deadTimer: 0, recalling: false, recallTimer: 0, lastHp: 100, kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0, turretsCaptured: 0, inTree: false, currentTree: null, revealTimer: 0, pingTimer: 0, hitFlash: 0, lastAtk: 0, skillOverrideTimer: 0, hasTarget: false,
        nexusDmgKills: 0, nexusLossDeaths: 0, controlFrames: 0, nexusDmgControl: 0,
        
        skill2Type: 'gancho', 
        skill2Cd: 0, 
        skill2MaxCd: 780,
        aimingSkill2: false, 
        inputSkill2X: 0, 
        inputSkill2Y: 0, 
        skill2Angle: 0, 
        isHooked: false, 
        hookAttacker: null, 
        stoneTimer: 0,
        stunTimer: 0,
        slowTimer: 0,
        purifyTimer: 0,
        
        shield: 0,
        speedBuffTimer: 0,
        poisonTimer: 0,
        poisonAttacker: null,
        furyTimer: 0,
        mageBuffTimer: 0,
        
        // === NUEVO: DATOS DEL TELEPORT ===
        teleportTimer: 0,
        teleportTargetX: 0,
        teleportTargetY: 0
    },
    bullets: [], bots: [], effects: [], trampas: [], ballestas: [], animationFrameId: null,
    stats: { blue: { turretFrames: 0, pointsLostToTurrets: 0, pointsLostToDeaths: 0 }, red: { turretFrames: 0, pointsLostToTurrets: 0, pointsLostToDeaths: 0 } }
};
