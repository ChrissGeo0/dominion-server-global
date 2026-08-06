// ==================================================
// motor_core.js - NÚCLEO, CÁMARA Y RENDERIZADO
// ==================================================

const SharedMaterials = {
    bulletBlue: null, bulletRed: null, effBlue: null, effRed: null, effGeo: null,
    
    init: function() {
        this.bulletBlue = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
        this.bulletRed = new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.8 });
        this.effBlue = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true });
        this.effRed = new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true });
        this.effGeo = new THREE.BoxGeometry(100, 5, 20);
    }
};

const Motor3D = {
    scene: null, camera: null, renderer: null, entidadesVisuales: {}, luzJugador: null, camX: 0, camZ: 0, currentZoom: 0,
    clock: new THREE.Clock(), 
    
    lerp: function(start, end, amt) { return (1 - amt) * start + amt * end; },
    
    init: function(canvasElement) {
        if (typeof THREE === 'undefined') throw new Error("Three.js no está cargado");
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a10); 
        this.scene.fog = null;                  
        
        SharedMaterials.init(); 
        
        const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.15); 
        this.scene.add(luzAmbiente);
        
        this.luzJugador = new THREE.PointLight(0xffccaa, 1.0, 200); 
        this.scene.add(this.luzJugador);
        
        // Aumentado el brillo de la linterna 3D
        this.linterna = new THREE.SpotLight(0xffffff, 8.0);
        this.linterna.angle = Math.PI / 5; 
        this.linterna.penumbra = 0.5; 
        this.linterna.distance = 700;       
        
        this.linternaTarget = new THREE.Object3D();
        this.scene.add(this.linternaTarget); 
        this.linterna.target = this.linternaTarget; 
        this.scene.add(this.linterna);
        
        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 5000);
        
        this.renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: false, powerPreference: "high-performance" });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        if (typeof Skins !== 'undefined') Skins.init();
        
        // Llamada al nuevo módulo para construir la arena
        if (typeof MotorMundo !== 'undefined') {
            MotorMundo.construir(this.scene, this.entidadesVisuales);
        }
        
        window.addEventListener('resize', () => this.resize());
    },
    
    resize: function() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    
    update: function(estadoGlobal) {
        if (!this.scene) return;
        const delta = this.clock.getDelta();
        if (typeof Skins !== 'undefined') Skins.actualizar(delta, estadoGlobal, this.entidadesVisuales);
        
        // Delegamos toda la lógica visual de los personajes y el mapa al nuevo módulo
        if (typeof MotorMundo !== 'undefined') {
            MotorMundo.actualizar(estadoGlobal, this);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
};
