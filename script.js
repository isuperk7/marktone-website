import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.167.1/build/three.module.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.matchMedia('(max-width: 900px)').matches;

const canvas = document.querySelector('#webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(mobile ? 38 : 32, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.6, mobile ? 12.2 : 11.6);

const root = new THREE.Group();
scene.add(root);

const cyan = new THREE.Color('#03c8e8');
const gold = new THREE.Color('#f1b43c');

scene.add(new THREE.HemisphereLight(0x9edfff, 0x020812, 0.62));
const key = new THREE.DirectionalLight(0xffd071, 4.2);
key.position.set(4, 7, 6);
scene.add(key);
const rim = new THREE.DirectionalLight(0x00d8ff, 3.6);
rim.position.set(-5, 2, 6);
scene.add(rim);

const platform = new THREE.Group();
root.add(platform);

const baseMat = new THREE.MeshPhysicalMaterial({ color: 0x071827, metalness: 0.88, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.14 });
const edgeMat = new THREE.MeshStandardMaterial({ color: 0x0b2637, metalness: 0.8, roughness: 0.22, emissive: 0x007a9e, emissiveIntensity: 0.25 });
const goldMat = new THREE.MeshStandardMaterial({ color: 0xdca434, metalness: 0.85, roughness: 0.22, emissive: 0x5b3400, emissiveIntensity: 0.42 });

const disc1 = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.45, 0.34, 96), baseMat);
disc1.position.y = -1.72;
platform.add(disc1);
const disc2 = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.88, 0.22, 96), edgeMat);
disc2.position.y = -1.48;
platform.add(disc2);
const disc3 = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.15, 0.16, 96), baseMat.clone());
disc3.position.y = -1.3;
platform.add(disc3);

for (let i = 0; i < 4; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.72 + i * 0.38, 0.012 + i * 0.003, 8, 180),
    i % 2 ? goldMat : new THREE.MeshStandardMaterial({ color: 0x00b9dc, emissive: 0x007c95, emissiveIntensity: 1.25, metalness: 0.7, roughness: 0.25 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.65 - i * 0.025;
  ring.material.transparent = true;
  ring.material.opacity = 0.45 - i * 0.06;
  platform.add(ring);
}

const wavePoints = [
  [-3.28,-0.32,0],[-3.0,-0.18,0],[-2.72,-1.05,0],[-2.18,0.9,0],[-1.58,-0.65,0],[-0.82,2.55,0],[-0.02,-1.1,0],[0.76,1.08,0],[1.5,-0.22,0],[2.22,-0.72,0],[3.25,0.14,0]
].map(([x,y,z]) => new THREE.Vector3(x,y,z));
const curve = new THREE.CatmullRomCurve3(wavePoints, false, 'catmullrom', 0.46);
const tube = new THREE.TubeGeometry(curve, 260, mobile ? 0.145 : 0.17, 20, false);
const waveMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uCyan: { value: cyan }, uGold: { value: gold } },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormalW;
    varying vec3 vWorld;
    void main(){
      vUv = uv;
      vec4 world = modelMatrix * vec4(position,1.0);
      vWorld = world.xyz;
      vNormalW = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uCyan;
    uniform vec3 uGold;
    varying vec2 vUv;
    varying vec3 vNormalW;
    varying vec3 vWorld;
    void main(){
      float split = smoothstep(.43,.70,vUv.x);
      vec3 base = mix(uCyan,uGold,split);
      vec3 N = normalize(vNormalW);
      vec3 V = normalize(cameraPosition - vWorld);
      vec3 L = normalize(vec3(-.35,.82,.58));
      float diff = max(dot(N,L),0.0);
      float fres = pow(1.0 - max(dot(N,V),0.0), 2.6);
      float pulse = .5 + .5*sin((vUv.x*12.0) - uTime*1.45);
      vec3 color = base*(.24 + diff*.92) + fres*base*.88 + pulse*.055;
      color += vec3(1.0,.86,.58)*pow(max(dot(reflect(-L,N),V),0.0),24.0)*.72;
      gl_FragColor = vec4(color,1.0);
    }
  `
});
const wave = new THREE.Mesh(tube, waveMat);
wave.position.y = -0.1;
wave.rotation.x = -0.02;
root.add(wave);

const connectorGroup = new THREE.Group();
root.add(connectorGroup);
const nodePositions = [
  [-4.25,-1.45,0.2],[-2.35,-2.18,0.2],[0,-2.48,0.2],[2.45,-2.14,0.2],[4.18,-1.38,0.2]
];
const nodeColors = [gold, cyan, gold, cyan, gold];
const nodeLights = [];
nodePositions.forEach((p, i) => {
  const node = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,.16,40), baseMat.clone());
  pad.position.y = -.08;
  node.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.33,.018,8,64), new THREE.MeshStandardMaterial({ color: nodeColors[i], emissive: nodeColors[i], emissiveIntensity: 1.15, metalness:.7, roughness:.25 }));
  ring.rotation.x = Math.PI/2;
  node.add(ring);
  const orbMat = new THREE.MeshStandardMaterial({ color: nodeColors[i], emissive: nodeColors[i], emissiveIntensity: 1.7, metalness:.25, roughness:.25 });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(.07,20,20), orbMat);
  orb.position.y = .22;
  node.add(orb);
  node.position.set(...p);
  connectorGroup.add(node);
  nodeLights.push({ node, orbMat, offset:i*.75, baseY:p[1] });

  const start = new THREE.Vector3(p[0]*.72,-1.42,p[2]);
  const end = new THREE.Vector3(...p);
  const mid = start.clone().lerp(end,.5); mid.y += .15 + (i%2)*.08;
  const lineCurve = new THREE.QuadraticBezierCurve3(start,mid,end);
  const line = new THREE.Mesh(new THREE.TubeGeometry(lineCurve,32,.015,6,false), new THREE.MeshBasicMaterial({ color:nodeColors[i], transparent:true, opacity:.48 }));
  connectorGroup.add(line);
});

const particles = new THREE.BufferGeometry();
const count = mobile ? 70 : 150;
const arr = new Float32Array(count*3);
for(let i=0;i<count;i++){
  arr[i*3]=(Math.random()-.5)*18;
  arr[i*3+1]=(Math.random()-.5)*10;
  arr[i*3+2]=-4-Math.random()*8;
}
particles.setAttribute('position',new THREE.BufferAttribute(arr,3));
const pts = new THREE.Points(particles,new THREE.PointsMaterial({ color:0x4aa8c7,size:.025,transparent:true,opacity:.45,depthWrite:false }));
scene.add(pts);

const targetStatesDesktop = [
  {x:-2.6,y:.55,z:0,s:1.08,rx:-.04,ry:-.24,rz:0},
  {x:3.4,y:.25,z:-.8,s:.86,rx:-.14,ry:.46,rz:-.04},
  {x:-3.15,y:.0,z:-1.2,s:.80,rx:.06,ry:-.62,rz:.03},
  {x:2.65,y:.18,z:-1.0,s:.77,rx:-.08,ry:.72,rz:-.02},
  {x:-2.85,y:-.15,z:-1.35,s:.82,rx:.08,ry:-.48,rz:.03},
  {x:0,y:.0,z:-2.0,s:.66,rx:-.14,ry:.02,rz:0},
  {x:2.5,y:.05,z:-.65,s:.92,rx:-.05,ry:.5,rz:0}
];
const targetStatesMobile = [
  {x:0,y:-2.35,z:-1.1,s:.68,rx:-.04,ry:-.12,rz:0},
  {x:0,y:-2.9,z:-2.2,s:.50,rx:-.08,ry:.35,rz:0},
  {x:0,y:-3.05,z:-2.4,s:.46,rx:.03,ry:-.45,rz:0},
  {x:0,y:-2.8,z:-2.1,s:.48,rx:-.06,ry:.55,rz:0},
  {x:0,y:-2.9,z:-2.3,s:.48,rx:.03,ry:-.38,rz:0},
  {x:0,y:-3.2,z:-3.1,s:.40,rx:-.10,ry:.0,rz:0},
  {x:0,y:-2.2,z:-1.6,s:.60,rx:-.04,ry:.36,rz:0}
];
const states = mobile ? targetStatesMobile : targetStatesDesktop;
let scrollProgress = 0;
let pointerX = 0, pointerY = 0;

function lerpState(a,b,t){
  return {
    x:THREE.MathUtils.lerp(a.x,b.x,t), y:THREE.MathUtils.lerp(a.y,b.y,t), z:THREE.MathUtils.lerp(a.z,b.z,t),
    s:THREE.MathUtils.lerp(a.s,b.s,t), rx:THREE.MathUtils.lerp(a.rx,b.rx,t), ry:THREE.MathUtils.lerp(a.ry,b.ry,t), rz:THREE.MathUtils.lerp(a.rz,b.rz,t)
  };
}
function currentState(){
  const maxIndex=states.length-1;
  const scaled=scrollProgress*maxIndex;
  const i=Math.min(maxIndex-1,Math.floor(scaled));
  return lerpState(states[i],states[i+1],scaled-i);
}
function updateScroll(){
  const h=document.documentElement.scrollHeight-window.innerHeight;
  scrollProgress=h>0?Math.min(1,Math.max(0,window.scrollY/h)):0;
  document.querySelector('[data-header]')?.classList.toggle('scrolled',window.scrollY>24);
}
window.addEventListener('scroll',updateScroll,{passive:true});
window.addEventListener('pointermove',(e)=>{
  pointerX=(e.clientX/window.innerWidth-.5);
  pointerY=(e.clientY/window.innerHeight-.5);
},{passive:true});
updateScroll();

const clock = new THREE.Clock();
function render(){
  const t=clock.getElapsedTime();
  waveMat.uniforms.uTime.value=t;
  const s=currentState();
  const ease=.055;
  root.position.x=THREE.MathUtils.lerp(root.position.x,s.x,ease);
  root.position.y=THREE.MathUtils.lerp(root.position.y,s.y,ease);
  root.position.z=THREE.MathUtils.lerp(root.position.z,s.z,ease);
  root.scale.setScalar(THREE.MathUtils.lerp(root.scale.x,s.s,ease));
  root.rotation.x=THREE.MathUtils.lerp(root.rotation.x,s.rx,ease);
  root.rotation.y=THREE.MathUtils.lerp(root.rotation.y,s.ry + (reduceMotion?0:Math.sin(t*.28)*.035),ease);
  root.rotation.z=THREE.MathUtils.lerp(root.rotation.z,s.rz,ease);
  if(!reduceMotion){
    platform.rotation.y=t*.035;
    connectorGroup.rotation.y=-t*.018;
    pts.rotation.y=t*.008;
    nodeLights.forEach(({node,orbMat,offset,baseY})=>{
      node.position.y=baseY;
      const pulse=.62+.38*Math.sin(t*1.55+offset);
      orbMat.emissiveIntensity=1.2+pulse*1.4;
      node.scale.setScalar(.98+pulse*.035);
    });
    camera.position.x=THREE.MathUtils.lerp(camera.position.x,pointerX*.18,.035);
    camera.position.y=THREE.MathUtils.lerp(camera.position.y,.6-pointerY*.12,.035);
  }
  camera.lookAt(0,-.15,0);
  renderer.render(scene,camera);
  requestAnimationFrame(render);
}
render();

function onResize(){
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,window.innerWidth<900?1.25:1.7));
  renderer.setSize(window.innerWidth,window.innerHeight);
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.fov=window.innerWidth<900?38:32;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize',onResize,{passive:true});

const revealObserver=new IntersectionObserver((entries)=>{
  entries.forEach((entry)=>{
    if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target);}
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

const menuButton=document.querySelector('.menu-toggle');
const mobileNav=document.querySelector('.mobile-nav');
menuButton?.addEventListener('click',()=>{
  const open=!mobileNav.classList.contains('open');
  mobileNav.classList.toggle('open',open);
  menuButton.setAttribute('aria-expanded',String(open));
  mobileNav.setAttribute('aria-hidden',String(!open));
});
mobileNav?.querySelectorAll('a,button').forEach(item=>item.addEventListener('click',()=>{
  mobileNav.classList.remove('open');
  menuButton.setAttribute('aria-expanded','false');
  mobileNav.setAttribute('aria-hidden','true');
}));

const sections=[...document.querySelectorAll('main section[id]')];
const navLinks=[...document.querySelectorAll('.desktop-nav a')];
const navObserver=new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${entry.target.id}`));
    }
  });
},{rootMargin:'-40% 0px -48% 0px'});
sections.forEach(section=>navObserver.observe(section));

const dialog=document.querySelector('.contact-dialog');
document.querySelectorAll('[data-open-form]').forEach(btn=>btn.addEventListener('click',()=>{if(dialog&&!dialog.open)dialog.showModal();}));
dialog?.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',(event)=>{if(event.target===dialog)dialog.close();});

const form=document.querySelector('#contact-form');
const status=document.querySelector('.form-status');
form?.addEventListener('submit',(event)=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form).entries());
  const subject=`طلب جلسة تشخيص — ${data.organization}`;
  const body=`الاسم: ${data.name}\nاسم الجهة: ${data.organization}\nرقم الجوال: ${data.phone}\n\nأكبر تحدٍ حالي:\n${data.challenge}`;
  const href=`mailto:info@marktone.sa?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  status.className='form-status success';
  status.textContent='تم تجهيز الرسالة. سيفتح تطبيق البريد لإرسالها إلى فريق ماركتون.';
  window.location.href=href;
});
