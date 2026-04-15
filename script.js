// ==========================================
// BACKGROUND SYNTHWAVE + STARFIELD VERTICAL
// ==========================================
const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();

// Adicione a cor de fundo sólida AQUI para limpar rastros do filtro VHS
scene.background = new THREE.Color(0x050014); 
scene.fog = new THREE.Fog(0x050014, 30, 120);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 10); 

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ==========================================
// LÓGICA DA TELA DE "PRESS START"
// ==========================================
let started = false;
let txt, hero, main;

const start = () => {
    if (started) return;
    started = true;
    txt.textContent = "> LOADING...";
    txt.classList.remove('blink-text');
    
    // Prepara as seções para a animação em cascata
    const sections = document.querySelectorAll('#main-content > section');
    sections.forEach(sec => {
        sec.style.opacity = '0';
        sec.style.transform = 'translateY(40px)';
        sec.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    });

    setTimeout(() => {
        hero.classList.add('hero-transition');
        main.classList.remove('hidden-content');
        main.classList.add('reveal-content');
        
        // Dispara a animação de cada seção com um atraso gradual (efeito cascata)
        sections.forEach((sec, index) => {
            setTimeout(() => {
                sec.style.opacity = '1';
                sec.style.transform = 'translateY(0)';
            }, 1000 + (index * 200)); // 1000ms após o hero sumir + 200ms por seção
        });

        setTimeout(() => hero.style.display = 'none', 1200);
    }, 800);
};

document.addEventListener('DOMContentLoaded', () => {
    txt = document.getElementById('press-start-text');
    hero = document.getElementById('sobre');
    main = document.getElementById('main-content');

    // Ouvintes de Eventos
    window.addEventListener('keydown', start);
    window.addEventListener('click', start);
    window.addEventListener('wheel', start, {once: true});
    window.addEventListener('touchstart', start, {once: true});
});

// ------------------------------------------
// 1. CÉU ESTRELADO (Partículas com Movimento Vertical)
// ------------------------------------------
function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        fog: false // ADICIONE ESTA LINHA: Impede que o nevoeiro apague as estrelas
    });

    const starVertices = [];
    
    // Aumentamos a quantidade para 10.000 estrelas
    for (let i = 0; i < 10000; i++) {
        // Espalhamento maior para garantir que cubra toda a área de visão
        const x = (Math.random() - 0.5) * 600;
        const y = (Math.random() - 0.5) * 600; 
        const z = -Math.random() * 300;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    return stars;
}
const starField = createStars();

// ------------------------------------------
// 2. A GRID INFINITA (Alta Resolução + Glow)
// ------------------------------------------
const gridGeometry = new THREE.PlaneGeometry(400, 400); // Grid um pouco maior para cobrir as laterais
const gridMaterial = new THREE.ShaderMaterial({
    extensions: { derivatives: true },
    uniforms: { time: { value: 0 } },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv * vec2(100.0, 100.0);
            uv.y -= time * 3.0;
            vec2 grid = abs(fract(uv - 0.5) - 0.5);
            vec2 fw = fwidth(uv);
            float coreX = smoothstep(fw.x * 1.5, 0.0, grid.x);
            float coreY = smoothstep(fw.y * 1.5, 0.0, grid.y);
            float core = max(coreX, coreY);
            float glowX = smoothstep(0.25, 0.0, grid.x);
            float glowY = smoothstep(0.25, 0.0, grid.y);
            float glow = max(glowX, glowY);
            
            vec3 coreColor = vec3(0.0, 1.0, 1.0); 
            vec3 glowColor = vec3(0.8, 0.0, 1.0); 
            vec3 finalColor = mix(glowColor * glow, coreColor, core);
            
            float fade = 0.8 - smoothstep(0.1, 0.6, distance(vUv, vec2(0.5)));
            float alpha = max(core, glow * 0.6) * fade;
            gl_FragColor = vec4(finalColor, alpha);
        }
    `,
    transparent: true,
    depthWrite: false
});

const grid = new THREE.Mesh(gridGeometry, gridMaterial);
grid.rotation.x = -Math.PI / 2; 
grid.position.set(0, -2, -60);
scene.add(grid);

// ------------------------------------------
// 3. O SOL RETROWAVE
// ------------------------------------------
const sunGeometry = new THREE.PlaneGeometry(120, 120);
const sunMaterial = new THREE.ShaderMaterial({
    extensions: { derivatives: true },
    uniforms: { time: { value: 0 } },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
            float dist = distance(vUv, vec2(0.5));
            float radius = 0.25;
            float circle = smoothstep(radius + fwidth(dist), radius, dist);
            vec3 colorTop = vec3(1.0, 0.9, 0.0);
            vec3 colorBottom = vec3(1.0, 0.0, 0.5);
            vec3 sunColor = mix(colorBottom, colorTop, vUv.y + 0.1); 
            if (vUv.y < 0.5 && circle > 0.0) {
                float lineY = fract(vUv.y * 20.0 - time * 1.5);
                float thickness = smoothstep(0.0, 0.5, vUv.y); 
                if (lineY > thickness) circle = 0.0;
            }
            float glow = exp(-(dist - radius) * 12.0) * 0.9;
            glow = clamp(glow, 0.0, 1.0);
            vec3 glowColor = vec3(1.0, 0.0, 0.8);
            vec3 finalColor = mix(glowColor * glow, sunColor, circle);
            float finalAlpha = max(circle, glow);
            gl_FragColor = vec4(finalColor, finalAlpha);
        }
    `,
    transparent: true,
    depthWrite: false
});

const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 18, -120); // Subi um pouco mais o sol
scene.add(sun);

// ------------------------------------------
// ANIMAÇÃO
// ==========================================
// EFEITO VHS (POST-PROCESSING CUSTOMIZADO)
// ==========================================
// 1. Criamos um "alvo" para renderizar a cena 3D inteira primeiro
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

// 2. Câmera e cena ortográfica (2D plana) apenas para colar o efeito final na tela
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postScene = new THREE.Scene();

// 3. Shader Material aplicando as configurações exatas do seu print
const vhsMaterial = new THREE.ShaderMaterial({
    uniforms: {
        tDiffuse: { value: renderTarget.texture },
        time: { value: 0 },
        noiseIntensity: { value: 0.2 },        // Intensidade do Ruído
        chromaticAberration: { value: 0.001 }, // 0.1 do print (adaptado para escala matemática UV)
        darkOpacity: { value: 0.5 }            // Opacidade Escura
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float noiseIntensity;
        uniform float chromaticAberration;
        uniform float darkOpacity;
        varying vec2 vUv;

        // Função para gerar ruído pseudo-aleatório
        float rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv;

            // Aberração Cromática
            vec2 offset = vec2(chromaticAberration, 0.0);
            float r = texture2D(tDiffuse, uv + offset).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, uv - offset).b;
            vec4 texColor = vec4(r, g, b, 1.0);

            // Scanlines clássicas de CRT
            float scanline = sin(uv.y * 800.0) * 0.04;
            texColor.rgb -= scanline;

            // ==========================================
            // CORREÇÃO DO ACÚMULO DE RUÍDO AQUI
            // ==========================================
            // mod() impede que o tempo cresça infinitamente e quebre a matemática da GPU
            float retroTime = mod(floor(time * 24.0), 100.0); 
            
            // Usamos dois números primos no deslocamento para o chiado ser orgânico
            vec2 noiseOffset = vec2(retroTime * 0.13, retroTime * 0.27);
            float noise = (rand(uv + noiseOffset) - 0.5) * noiseIntensity;
            
            texColor.rgb += noise;

            // Escurecimento Final
            texColor.rgb = mix(texColor.rgb, vec3(0.0), darkOpacity);

            gl_FragColor = texColor;
        }
    `
});

const postPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), vhsMaterial);
postScene.add(postPlane);

// ------------------------------------------
// LÓGICA DE CONTROLE E ANIMAÇÃO
// ------------------------------------------
const clock = new THREE.Clock();
let shaderTime = 0; 
let isPaused = false;

const animToggle = document.getElementById('animToggle');
if (animToggle) {
    animToggle.addEventListener('click', () => {
        isPaused = !isPaused;
        if (isPaused) {
            animToggle.innerHTML = '<i class="bi bi-play-fill"></i> DESPAUSAR ANIMAÇÃO';
        } else {
            animToggle.innerHTML = '<i class="bi bi-pause-fill"></i> PAUSAR ANIMAÇÃO';
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (!isPaused) {
        shaderTime += delta;
    }
    
    // Atualiza Shaders da Cena Original
    gridMaterial.uniforms.time.value = shaderTime;
    sunMaterial.uniforms.time.value = shaderTime;
    starField.rotation.x = shaderTime * 0.015;
    starField.material.opacity = 0.6 + Math.sin(shaderTime * 2.0) * 0.2;
    
    // Atualiza o tempo do filtro VHS
    vhsMaterial.uniforms.time.value = shaderTime;

    // ETAPA 1: Renderiza a cena 3D inteira para a memória da placa de vídeo
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    
    // ETAPA 2: Joga a imagem renderizada na tela com o filtro VHS por cima
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Redimensiona também a textura de pós-processamento para manter a resolução alta
    renderTarget.setSize(window.innerWidth, window.innerHeight);
});