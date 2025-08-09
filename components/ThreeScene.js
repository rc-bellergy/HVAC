import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export default function ThreeScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      init();
    }

    // Cleanup function
    return () => {
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, []);

  function init() {
    // ---------- Scene setup ----------
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08101e);
    scene.fog = new THREE.FogExp2(0x0a1326, 0.025);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 2000);
    camera.position.set(42, 28, 44);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.classList.add('webgl');
    container.appendChild(renderer.domElement);

    // CSS2D overlay for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.inset = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 2.5, 0);
    controls.minDistance = 10;
    controls.maxDistance = 160;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;

    // Lights
    const hemi = new THREE.HemisphereLight(0x9fdfff, 0x0a1730, 1.2);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xaed4ff, 1.2);
    dir.position.set(40, 60, 20);
    scene.add(dir);

    // ---------- Postprocessing (bloom) ----------
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.2, 0.9, 0.15);
    bloomPass.threshold = 0.18;
    bloomPass.strength = 1.6;      // overall glow
    bloomPass.radius = 0.9;
    composer.addPass(bloomPass);

    // ---------- Helpers / materials ----------
    function makeGridTexture(size=1024, majorEvery=8) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      g.fillStyle = '#061226';
      g.fillRect(0,0,size,size);
      g.strokeStyle = '#2b6db8';
      g.globalAlpha = .14;
      g.lineWidth = 1;
      for(let i=0;i<size;i+=size/64){
        g.beginPath(); g.moveTo(i,0); g.lineTo(i,size); g.stroke();
        g.beginPath(); g.moveTo(0,i); g.lineTo(size,i); g.stroke();
      }
      g.strokeStyle = '#4cc3ff';
      g.globalAlpha = .25; g.lineWidth = 1.2;
      for(let i=0;i<=size;i+=size/majorEvery){
        g.beginPath(); g.moveTo(i,0); g.lineTo(i,size); g.stroke();
        g.beginPath(); g.moveTo(0,i); g.lineTo(size,i); g.stroke();
      }
      return new THREE.CanvasTexture(c);
    }

    const gridTex = makeGridTexture();
    gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
    gridTex.repeat.set(12,12);

    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x0b1a32),
      map: gridTex,
      metalness: 0.0,
      roughness: 1.0,
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 56), floorMat);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0.01;
    scene.add(floor);
    const gridHelper = new THREE.GridHelper(90, 45, 0x4cc3ff, 0x2b6db8);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Utility: asset labeling
    function addLabel(obj, text) {
      const el = document.createElement('div');
      el.className = 'label';
      el.textContent = text;
      const label = new CSS2DObject(el);
      label.position.set(0, 1.8, 0);
      obj.add(label);
      return el;
    }

    // Utility: pipe labeling
    function addPipeLabel(pipeGroup, text) {
      const el = document.createElement('div');
      el.className = 'label pipe-label';
      el.textContent = text;
      const label = new CSS2DObject(el);
      // Position the label at the center of the pipe
      label.position.set(0, 0.5, 0);
      pipeGroup.add(label);
      return el;
    }

    // ---------- Pipe shader (animated dashes) ----------
    const pipeUniforms = {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(0x47e1ff) },
      uColorB: { value: new THREE.Color(0x00ffa9) },
      uGlow:  { value: 1.0 },
      uSpeed: { value: 0.5 },
      uStripe: { value: 26.0 },
      uMix: { value: 0.5 }
    };

    const pipeMat = new THREE.ShaderMaterial({
      uniforms: pipeUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        varying float vCurve;
        void main(){
          vUv = uv;
          vec3 transformed = position.xyz;
          vCurve = length(normal.xy);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed,1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vCurve;
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform float uGlow;
        uniform float uSpeed;
        uniform float uStripe;
        uniform float uMix;
        float pulse(float x){ return 0.5 + 0.5 * sin(x); }
        void main(){
          float t = fract(vUv.x * uStripe - uTime * (0.6 + 1.2*uSpeed));
          float dash = smoothstep(0.1, 0.0, abs(t-0.5));
          float core = smoothstep(0.04, 0.0, abs(t-0.5));
          vec3 col = mix(uColorA, uColorB, uMix);
          float edge = smoothstep(1.2, 0.2, vCurve);
          float sparkle = 0.4 * pulse(uTime*2.0 + vUv.x*10.0);
          float alpha = clamp(dash*1.6 + edge*0.35 + sparkle*0.15, 0.0, 1.0);
          gl_FragColor = vec4(col * (1.0 + 2.0*core + 0.6*edge), alpha*uGlow);
        }
      `
    });

    // Helper: create tube along points
    function makePipe(points, radius=0.12) {
      const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2);
      const geom = new THREE.TubeGeometry(curve, Math.max(80, points.length*20), radius, 16, false);
      const mesh = new THREE.Mesh(geom, pipeMat);
      const shell = new THREE.Mesh(
        new THREE.TubeGeometry(curve, Math.max(80, points.length*20), radius*1.35, 16, false),
        new THREE.MeshStandardMaterial({ color:0x0b2b49, metalness:0.2, roughness:0.5, transparent:true, opacity:0.08 })
      );
      const group = new THREE.Group();
      group.add(mesh, shell);
      return { group, curve };
    }

    // ---------- Assets (tanks, reactors, machines) ----------
    const PICK = [];

    function makeTank(id, pos){
      const g = new THREE.Group(); g.position.copy(pos);
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 5.2, 24),
        new THREE.MeshStandardMaterial({ color:0x2a70b7, roughness:0.2, metalness:0.1, emissive:0x0c5ca3, emissiveIntensity:0.6 })
      );
      g.add(cyl);
      g.userData = { id, name:`Tank ${id}`, type:'tank', temp: 21+Math.random()*4, load: 0.5, state: 'ok' };
      addLabel(g, `Tank ${id}`);
      PICK.push(cyl);
      cyl.userData.ref = g;
      scene.add(g);
      return g;
    }

    function makeChiller(id, pos){
      const g = new THREE.Group(); g.position.copy(pos);
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3, 3),
        new THREE.MeshStandardMaterial({ color:0x0d8a37, roughness:0.4, metalness:0.2, emissive:0x39ff78, emissiveIntensity:0.7, transparent:true, opacity:0.92 })
      );
      box.position.y = 1.5;
      const frame = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(6,3,3)),
        new THREE.LineBasicMaterial({ color:0x9affc9, transparent:true, opacity:0.8 })
      );
      frame.position.copy(box.position);
      g.add(box, frame);
      g.userData = { id, name:`Chiller ${id}`, type:'chiller', temp: 35+Math.random()*5, load: 0.5, state:'ok' };
      addLabel(g, `Chiller ${id}`);
      PICK.push(box);
      box.userData.ref = g;
      scene.add(g);
      return g;
    }

    function makeCompressor(id, pos){
      const g = new THREE.Group(); g.position.copy(pos);
      const base = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 4), new THREE.MeshStandardMaterial({
        color: 0x1a1a1a, roughness: .9, metalness: .05, emissive: 0x151515
      }));
      base.position.y = 0.3;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 4.2, 24), new THREE.MeshStandardMaterial({
        color: 0x5a1a08, roughness: 0.6, metalness: 0.2, emissive: 0xff6a2a, emissiveIntensity: 0.9, transparent:true, opacity:0.85
      }));
      body.position.y = 2.5;
      g.add(base, body);
      g.userData = { id, name:`Compressor ${id}`, type:'compressor', temp: 60+Math.random()*10, load: 0.7, state:'ok' };
      addLabel(g, `Compressor ${id}`);
      PICK.push(body);
      body.userData.ref = g;
      scene.add(g);
      return g;
    }

    // ---------- Layout (from 03.html) ----------
    const tanks = [];
    const chillers = [];
    const compressors = [];

    const tankPositions = [ [-34, -10], [-34, -2], [-34, 6], [-34, 14] ];
    tankPositions.forEach(([x,z], i) => {
      tanks.push(makeTank(i+1, new THREE.Vector3(x, 2.6, z)));
    });

    const chillerPositions = [ -20, -10, 0, 10, 20 ];
    chillerPositions.forEach((x, i) => {
      chillers.push(makeChiller(i+1, new THREE.Vector3(x, 0, -6)));
    });

    const compressorPositions = [ -15, -5, 5, 15 ];
    compressorPositions.forEach((x, i) => {
      compressors.push(makeCompressor(i+1, new THREE.Vector3(x, 0, 6)));
    });

    // ---------- Pipe network ----------
    const pipes = [];
    let pipeId = 1;
    // Connect tanks to a main line
    const tankMainPts = [new THREE.Vector3(-40, 1.8, -12), new THREE.Vector3(-30, 1.8, 16)];
    const tankMainPipe = makePipe(tankMainPts, 0.18);
    tankMainPipe.group.userData = { id: pipeId++, type: 'pipe', name: `Pipe ${pipeId-1}` };
    addPipeLabel(tankMainPipe.group, `P${pipeId-1}`);
    pipes.push(tankMainPipe);
    tanks.forEach((t, i) => {
      const p = t.position.clone();
      const tankPipe = makePipe([new THREE.Vector3(p.x+1.8, 1.8, p.z), new THREE.Vector3(-30, 1.8, p.z)], 0.12);
      tankPipe.group.userData = { id: pipeId++, type: 'pipe', name: `Pipe ${pipeId-1}` };
      addPipeLabel(tankPipe.group, `P${pipeId-1}`);
      pipes.push(tankPipe);
    });

    // Connect chillers to a main line
    const chillerMainPts = [new THREE.Vector3(-24, 1.2, -3), new THREE.Vector3(24, 1.2, -3)];
    const chillerMainPipe = makePipe(chillerMainPts, 0.16);
    chillerMainPipe.group.userData = { id: pipeId++, type: 'pipe', name: `Pipe ${pipeId-1}` };
    addPipeLabel(chillerMainPipe.group, `P${pipeId-1}`);
    pipes.push(chillerMainPipe);
    chillers.forEach((c, i) => {
      const p = c.position.clone();
      const chillerPipe = makePipe([new THREE.Vector3(p.x, 1.2, p.z+1.5), new THREE.Vector3(p.x, 1.2, -3)], 0.12);
      chillerPipe.group.userData = { id: pipeId++, type: 'pipe', name: `Pipe ${pipeId-1}` };
      addPipeLabel(chillerPipe.group, `P${pipeId-1}`);
      pipes.push(chillerPipe);
    });

    // Connect compressors to a main line
    const compressorMainPts = [new THREE.Vector3(-20, 1.2, 3), new THREE.Vector3(20, 1.2, 3)];
    const compressorMainPipe = makePipe(compressorMainPts, 0.16);
    compressorMainPipe.group.userData = { id: pipeId++, type: 'pipe', name: `Pipe ${pipeId-1}` };
    addPipeLabel(compressorMainPipe.group, `P${pipeId-1}`);
    pipes.push(compressorMainPipe);
    compressors.forEach((c, i) => {
      const p = c.position.clone();
      const compressorPipe = makePipe([new THREE.Vector3(p.x, 1.2, p.z-2), new THREE.Vector3(p.x, 1.2, 3)], 0.12);
      compressorPipe.group.userData = { id: pipeId++, type: 'pipe', name: `Pipe ${pipeId-1}` };
      addPipeLabel(compressorPipe.group, `P${pipeId-1}`);
      pipes.push(compressorPipe);
    });

    // Cross-connect the main lines
    const crossPipe1 = makePipe([new THREE.Vector3(-28, 1.5, -8), new THREE.Vector3(-28, 1.5, 8)], 0.14);
    crossPipe1.group.userData = { id: pipeId++, type: 'pipe', name: `Pipe ${pipeId-1}` };
    addPipeLabel(crossPipe1.group, `P${pipeId-1}`);
    pipes.push(crossPipe1);
    const crossPipe2 = makePipe([new THREE.Vector3(22, 1.5, 0), new THREE.Vector3(22, 1.5, 8)], 0.14);
    crossPipe2.group.userData = { id: pipeId++, type: 'pipe', name: `Pipe ${pipeId-1}` };
    addPipeLabel(crossPipe2.group, `P${pipeId-1}`);
    pipes.push(crossPipe2);

    pipes.forEach(p => scene.add(p.group));

    // ---------- Flow particles ----------
    function movingDot(color=0x8cf0ff){
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.9 }));
      return m;
    }
    const flowDots = [];
    pipes.slice(0,3).forEach(p => { // add dots to first 3 pipes
      for(let i=0; i<6; i++){
        const d = movingDot(i%2?0x8cf0ff:0x00ffa9);
        scene.add(d);
        flowDots.push({ mesh:d, curve: p.curve, t: Math.random(), speed: 0.04 + Math.random()*0.06 });
      }
    });

    // ---------- Interactivity ----------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selected = null;

    function setSelection(mesh){
      selected = mesh?.userData?.ref || null;
      updateSide(selected);
    }

    function onPointer(e){
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ( (e.clientX - rect.left) / rect.width ) * 2 - 1;
      const y = -( (e.clientY - rect.top) / rect.height ) * 2 + 1;
      mouse.set(x,y);
      raycaster.setFromCamera(mouse, camera);
      const list = raycaster.intersectObjects(PICK, false);
      if(list.length>0) setSelection(list[0].object);
      else setSelection(null);
    }
    renderer.domElement.addEventListener('pointerdown', onPointer);

    // ---------- Telemetry simulation ----------
    const allAssets = [...tanks, ...chillers, ...compressors];
    function tickTelemetry(){
      let throughput = 0;
      // Generate more random throughput value
      throughput = 0.5 + Math.random() * 3.0; // Random value between 0.5 and 3.5
      
      // Update assets with more random values
      allAssets.forEach(g=>{
        const u = g.userData;
        // More random load values
        u.load = Math.random();
        u.temp = 20 + Math.random() * 60; // Temperature between 20 and 80
        let state='ok';
        if(u.load>0.95 || u.temp>70) state='warn';
        if(u.load>1.05 || u.temp>80) state='alert';
        u.state = state;
        const k = (g.children.find(c=>c.isMesh)||g);
        const emissiveBoost = state==='ok'? 0.8 : state==='warn'? 1.3 : 1.7;
        if(k.material && 'emissiveIntensity' in k.material){
          k.material.emissiveIntensity = emissiveBoost;
          if(u.type==='chiller'){
            k.material.color.set(state==='alert'?0x40141f: state==='warn'?0x2b4a0f: 0x0d8a37);
            k.material.emissive.set(state==='alert'?0xff355d: state==='warn'?0xff8a3a: 0x39ff78);
          }
          if(u.type==='compressor'){
            k.material.emissive.set(state==='alert'?0xff355d: state==='warn'?0xff8a3a: 0xff6a2a);
          }
        }
        const lbl = g.children.find(ch=>ch.isCSS2DObject)?.element;
        if(lbl){
          lbl.classList.toggle('warn', state==='warn');
          lbl.classList.toggle('alert', state==='alert');
          lbl.innerHTML = `${u.name}<br><span class="value">${u.load.toFixed(2)} load</span>`;
        }
      });
      document.getElementById('throughput').textContent = (throughput).toFixed(2);
      sparkPush(throughput);
      if(selected) updateSide(selected);
    }
    setInterval(tickTelemetry, 10000);

    // ---------- Side panel updates ----------
    function updateSide(g){
      if(!g){
        document.getElementById('selId').textContent = '–';
        document.getElementById('selName').textContent = 'Tap an object';
        document.getElementById('selStatus').textContent = '–';
        document.getElementById('selTemp').textContent = '–';
        document.getElementById('selLoad').textContent = '–';
        return;
      }
      const u=g.userData;
      document.getElementById('selId').textContent = u.id;
      document.getElementById('selName').textContent = `${u.name} (${u.type})`;
      document.getElementById('selStatus').textContent = u.state.toUpperCase();
      document.getElementById('selTemp').textContent = `${u.temp.toFixed(1)} °C`;
      document.getElementById('selLoad').textContent = `${(u.load*100).toFixed(0)} %`;
    }

    // ---------- Sparkline ----------
    const spark = document.getElementById('spark');
    const sg = spark.getContext('2d');
    let sparkData = [];
    function sparkDraw(){
      const w = spark.width = spark.clientWidth*2;
      const h = spark.height = spark.clientHeight*2;
      sg.clearRect(0,0,w,h);
      sg.fillStyle = '#07142a';
      sg.fillRect(0,0,w,h);
      sg.strokeStyle = '#13325a'; sg.globalAlpha = .6; sg.lineWidth = 1;
      for(let x=0; x<w; x+=w/10){ sg.beginPath(); sg.moveTo(x,0); sg.lineTo(x,h); sg.stroke(); }
      if(sparkData.length<2) return;
      const max = Math.max(1, ...sparkData);
      const min = 0;
      sg.globalAlpha = 1.0;
      const grad = sg.createLinearGradient(0,0,0,h);
      grad.addColorStop(0, '#2dfcff44');
      grad.addColorStop(1, '#00ffa922');
      sg.fillStyle = grad;
      sg.beginPath();
      sparkData.forEach((v,i)=>{
        const x = i/(sparkData.length-1) * (w-4) + 2;
        const y = h - (v-min)/(max-min) * (h-6) - 3;
        if(i===0) sg.moveTo(x,y); else sg.lineTo(x,y);
      });
      sg.lineTo(w-2, h-2); sg.lineTo(2, h-2); sg.closePath(); sg.fill();
      sg.strokeStyle = '#68fff4'; sg.lineWidth = 2.5; sg.globalAlpha = 0.9;
      sg.beginPath();
      sparkData.forEach((v,i)=>{
        const x = i/(sparkData.length-1) * (w-4) + 2;
        const y = h - (v-min)/(max-min) * (h-6) - 3;
        if(i===0) sg.moveTo(x,y); else sg.lineTo(x,y);
      });
      sg.stroke();
    }
    function sparkPush(v){
      sparkData.push(v);
      if(sparkData.length>80) sparkData.shift();
      sparkDraw();
    }
    window.addEventListener('resize', sparkDraw);

    // ---------- UI controls ----------
    const flowRadios = [...document.querySelectorAll('input[name=flow]')];
    flowRadios.forEach(r => r.addEventListener('change', ()=>{
      const mode = Number(document.querySelector('input[name=flow]:checked').value);
      pipeUniforms.uSpeed.value = mode===0? 0.0 : mode===1? 0.55 : 1.4;
    }));
    document.getElementById('btnReset').addEventListener('click', ()=>{
      camera.position.set(42, 28, 44);
      controls.target.set(0, 2.5, 0);
      controls.update();
    });
    let dark = true;
    document.getElementById('btnTheme').addEventListener('click', ()=>{
      dark = !dark;
      scene.background = new THREE.Color(dark?0x08101e:0x0e1c28);
      renderer.toneMappingExposure = dark?1.2:1.0;
    });
    document.getElementById('btnStart').addEventListener('click', ()=> pipeUniforms.uSpeed.value = 0.8);
    document.getElementById('btnStop').addEventListener('click', ()=> pipeUniforms.uSpeed.value = 0.0);
    document.getElementById('btnPulse').addEventListener('click', ()=>{
      const g = allAssets[Math.floor(Math.random()*allAssets.length)];
      g.userData.temp = 85 + Math.random()*10;
      g.userData.load = 1.1;
      tickTelemetry();
    });
    
    // Auto Rotate toggle
    const btnAutoRotate = document.getElementById('btnAutoRotate');
    btnAutoRotate.addEventListener('click', ()=>{
      controls.autoRotate = !controls.autoRotate;
      btnAutoRotate.textContent = controls.autoRotate ? 'Auto Rotate: ON' : 'Auto Rotate: OFF';
    });

    // ---------- Animation loop ----------
    let clock = new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      const dt = clock.getDelta();
      pipeUniforms.uTime.value += dt;

      flowDots.forEach(d=>{
        d.t = (d.t + d.speed * (0.3 + pipeUniforms.uSpeed.value)) % 1;
        const pos = d.curve.getPointAt(d.t);
        d.mesh.position.copy(pos);
      });

      controls.update();
      composer.render();
      labelRenderer.render(scene, camera);
    }
    animate();

    // ---------- Resize ----------
    function onResize(){
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w,h);
      composer.setSize(w,h);
      labelRenderer.setSize(w,h);
    }
    window.addEventListener('resize', onResize);

    // Initial telemetry seed - more random data
    for(let i=0;i<24;i++) sparkPush(0.5 + Math.random() * 3.0);
    tickTelemetry();

    // Subtle camera intro from 03.html
    (function introCam(){
      const start = performance.now(), dur = 1600;
      const sPos = camera.position.clone();
      const ePos = new THREE.Vector3(34, 22, 38);
      function step(){
        const t = Math.min(1, (performance.now()-start)/dur);
        const k = 1 - Math.pow(1-t, 3);
        camera.position.lerpVectors(sPos, ePos, k);
        controls.update();
        if (t<1) requestAnimationFrame(step);
      }
      step();
    })();
  }

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}