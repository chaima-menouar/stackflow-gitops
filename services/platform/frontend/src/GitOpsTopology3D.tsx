import React, {Suspense, useEffect, useMemo, useRef, useState} from "react";
import {Canvas, useFrame} from "@react-three/fiber";
import {Html} from "@react-three/drei";
import * as THREE from "three";
import "./gitops-topology.css";

/**
 * Conceptual delivery topology. This is deliberately an architecture illustration,
 * not a live cluster or CI status visualization.
 *
 * GitHub -> CI/CD -> Registry -> Argo CD -> Kubernetes -> Monitoring.
 */
type StageId = "github" | "ci" | "registry" | "argocd" | "kubernetes" | "monitoring";
type Point = [number, number, number];
type Stage = {id: StageId; title: string; short: string; description: string; color: string; position: Point};

const STAGES: Stage[] = [
  {id: "github", title: "GitHub", short: "GIT", description: "Source control · reviewed commits trigger the workflow.", color: "#aa8cff", position: [-2.24, 1.18, -0.15]},
  {id: "ci", title: "CI / CD", short: "CI", description: "GitHub Actions · automated tests and security checks.", color: "#8b95ff", position: [-0.46, 2.17, -0.52]},
  {id: "registry", title: "Registry", short: "IMG", description: "GHCR · immutable container images identified by digest.", color: "#e47aff", position: [2.03, 1.29, -0.20]},
  {id: "argocd", title: "Argo CD", short: "ARGO", description: "GitOps reconciliation · reviewed manifests define desired state.", color: "#ff73c9", position: [2.19, -1.22, 0.18]},
  {id: "kubernetes", title: "Kubernetes", short: "K8S", description: "Cluster control plane · runs the approved desired state after synchronization.", color: "#c48eff", position: [0, 0, 0.35]},
  {id: "monitoring", title: "Monitoring", short: "OBS", description: "Prometheus & Grafana · observe health and performance separately.", color: "#b98bfa", position: [-2.10, -1.43, 0.14]}
];

const STAGE_MAP = Object.fromEntries(STAGES.map(stage => [stage.id, stage])) as Record<StageId, Stage>;
const FLOW: [StageId, StageId][] = [
  ["github", "ci"],
  ["ci", "registry"],
  ["registry", "argocd"],
  ["argocd", "kubernetes"],
  ["kubernetes", "monitoring"]
];

function GlowPath({from, to, index, reducedMotion}: {
  from: Stage; to: Stage; index: number; reducedMotion: boolean;
}) {
  const bead = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from.position);
    const end = new THREE.Vector3(...to.position);
    const mid = start.clone().lerp(end, 0.5);
    // Routing cables forward of the core makes the data-flow legible in perspective.
    mid.z += from.id === "argocd" || from.id === "kubernetes" ? 0.74 : 0.34;
    mid.y += 0.11;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to]);
  const softTube = useMemo(() => new THREE.TubeGeometry(curve, 34, 0.035, 6, false), [curve]);
  const innerTube = useMemo(() => new THREE.TubeGeometry(curve, 34, 0.009, 5, false), [curve]);

  useEffect(() => () => {softTube.dispose(); innerTube.dispose();}, [softTube, innerTube]);
  useFrame(({clock}) => {
    if (!bead.current || reducedMotion) return;
    const t = ((clock.elapsedTime * 0.105 + index * 0.17) % 1 + 1) % 1;
    bead.current.position.copy(curve.getPointAt(t));
    const scale = 0.8 + 0.17 * Math.sin(clock.elapsedTime * 3 + index);
    bead.current.scale.setScalar(scale);
  });

  return <group>
    <mesh geometry={softTube}><meshBasicMaterial color={from.color} transparent opacity={0.14} depthWrite={false}/></mesh>
    <mesh geometry={innerTube}><meshBasicMaterial color={from.color} transparent opacity={0.84} depthWrite={false}/></mesh>
    <mesh ref={bead} position={curve.getPointAt(index * 0.17)}>
      <sphereGeometry args={[0.055, 10, 10]}/>
      <meshBasicMaterial color="#fff2ff" toneMapped={false}/>
    </mesh>
  </group>;
}

function HologramCore({active, onSelect, reducedMotion}: {
  active: boolean; onSelect: (stage: StageId) => void; reducedMotion: boolean;
}) {
  const rotor = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  useFrame(({clock}, delta) => {
    if (reducedMotion) return;
    if (rotor.current) rotor.current.rotation.y += Math.min(delta, 0.05) * 0.24;
    if (rings.current) rings.current.rotation.z = clock.elapsedTime * 0.085;
  });
  return <group position={STAGE_MAP.kubernetes.position}>
    <pointLight color="#a45aff" intensity={3.2} distance={3.8}/>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.98, 0.012, 7, 96]}/>
      <meshBasicMaterial color="#bc63ff" transparent opacity={0.37}/>
    </mesh>
    <mesh rotation={[Math.PI / 2.8, 0.15, 0]}>
      <torusGeometry args={[1.17, 0.008, 6, 96]}/>
      <meshBasicMaterial color="#e75aff" transparent opacity={0.23}/>
    </mesh>
    <group ref={rings}>
      {Array.from({length: 6}, (_, i) =>
        <mesh key={i} position={[Math.cos(i * Math.PI / 3) * 0.91, Math.sin(i * Math.PI / 3) * 0.91, 0]}>
          <sphereGeometry args={[0.026, 8, 8]}/>
          <meshBasicMaterial color={i % 2 ? "#ec69e7" : "#caa0ff"}/>
        </mesh>
      )}
    </group>
    <group ref={rotor} rotation={[0, -0.32, -0.13]}>
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.67, 0.74, 0.17, 6]}/>
        <meshStandardMaterial color="#30174e" emissive="#7427b6" emissiveIntensity={0.38} metalness={0.75} roughness={0.24}/>
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.59, 0.64, 0.28, 6]}/>
        <meshStandardMaterial color="#382264" emissive="#6a31c3" emissiveIntensity={0.34} metalness={0.65} roughness={0.24}/>
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.54, 0.58, 0.12, 6]}/>
        <meshStandardMaterial color="#6d39ad" emissive="#b04aef" emissiveIntensity={0.50} metalness={0.7} roughness={0.22}/>
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.40, 0.47, 0.12, 6]}/>
        <meshStandardMaterial color="#a366e7" emissive="#b85ef4" emissiveIntensity={0.46} metalness={0.6} roughness={0.25}/>
      </mesh>
      {[-0.07, 0.15, 0.32].map((height, i) =>
        <mesh key={i} position={[0, height, 0]} rotation={[Math.PI / 2, 0, Math.PI / 6]}>
          <torusGeometry args={[0.77 - i * 0.11, 0.013, 6, 6]}/>
          <meshBasicMaterial color={i === 2 ? "#fa85e5" : "#ad77ff"} transparent opacity={0.92}/>
        </mesh>
      )}
      <mesh position={[0, 0.51, 0]}>
        <octahedronGeometry args={[0.19, 0]}/>
        <meshStandardMaterial color="#efd5ff" emissive="#df75ff" emissiveIntensity={1.15} roughness={0.22} metalness={0.25}/>
      </mesh>
    </group>
    <Html position={[0, -0.89, 0.50]} center distanceFactor={7.7} zIndexRange={[15, 0]}>
      <button type="button" className={"topology-node-label core-label" + (active ? " is-active" : "")}
        aria-pressed={active} aria-label="Show Kubernetes architecture stage"
        onClick={() => onSelect("kubernetes")}>
        <span className="topology-label-dot" /> KUBERNETES <small>CLUSTER CORE</small>
      </button>
    </Html>
  </group>;
}

function Satellite({stage, selected, onSelect, reducedMotion, index}: {
  stage: Stage; selected: boolean; onSelect: (stage: StageId) => void; reducedMotion: boolean; index: number;
}) {
  const structure = useRef<THREE.Group>(null);
  useFrame(({clock}) => {
    if (!structure.current || reducedMotion) return;
    structure.current.rotation.y = clock.elapsedTime * (0.19 + index * 0.025);
    structure.current.position.y = Math.sin(clock.elapsedTime * 1.05 + index * 1.7) * 0.055;
  });
  return <group position={stage.position}>
    <pointLight color={stage.color} intensity={0.95} distance={1.45}/>
    <mesh rotation={[Math.PI / 2.6, 0.0, 0.1]}>
      <torusGeometry args={[0.42, 0.009, 5, 56]}/>
      <meshBasicMaterial color={stage.color} transparent opacity={selected ? 0.77 : 0.43}/>
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.39, 0.51, 48]}/>
      <meshBasicMaterial color={stage.color} transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false}/>
    </mesh>
    <group ref={structure}>
      <mesh>
        <icosahedronGeometry args={[selected ? 0.28 : 0.24, 0]}/>
        <meshStandardMaterial color={stage.color} emissive={stage.color} emissiveIntensity={selected ? 0.75 : 0.34} metalness={0.57} roughness={0.27}/>
      </mesh>
      <mesh rotation={[0.4, 0.3, 0.8]}>
        <icosahedronGeometry args={[selected ? 0.38 : 0.33, 0]}/>
        <meshBasicMaterial color={stage.color} wireframe transparent opacity={0.68}/>
      </mesh>
    </group>
    <Html position={[0, -0.66, 0.38]} center distanceFactor={7.7} zIndexRange={[15, 0]}>
      <button type="button" className={"topology-node-label" + (selected ? " is-active" : "")}
        aria-pressed={selected} aria-label={"Show " + stage.title + " architecture stage"}
        onClick={() => onSelect(stage.id)}>
        <span className="topology-label-dot" style={{background: stage.color}}/>{stage.title}
      </button>
    </Html>
  </group>;
}

function BackgroundStars() {
  const geometry = useMemo(() => {
    const coords: number[] = [];
    for (let i = 0; i < 80; i++) {
      const theta = (i * 2.3999632297);
      const radius = 2.1 + (i % 7) * 0.54;
      coords.push(Math.sin(theta) * radius, Math.cos(theta) * radius * 0.68, -1.25 - (i % 4) * 0.22);
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.Float32BufferAttribute(coords, 3));
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <points geometry={geometry}>
    <pointsMaterial color="#b37cef" size={0.023} sizeAttenuation transparent opacity={0.56} depthWrite={false}/>
  </points>;
}

function TopologyScene({selected, onSelect, reducedMotion}: {
  selected: StageId; onSelect: (stage: StageId) => void; reducedMotion: boolean;
}) {
  const rig = useRef<THREE.Group>(null);
  useFrame(({clock, pointer}) => {
    if (!rig.current || reducedMotion) return;
    rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, pointer.x * 0.12 + Math.sin(clock.elapsedTime * 0.12) * 0.075, 0.03);
    rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, -pointer.y * 0.08, 0.03);
  });

  return <>
    <ambientLight intensity={1.32}/>
    <directionalLight color="#b6a5ff" position={[2, 5, 6]} intensity={1.5}/>
    <pointLight color="#e950dc" position={[4, -2, 3]} intensity={10} distance={9}/>
    <BackgroundStars/>
    <group ref={rig}>
      {FLOW.map(([from, to], index) =>
        <GlowPath key={from + to} from={STAGE_MAP[from]} to={STAGE_MAP[to]} index={index} reducedMotion={reducedMotion}/>
      )}
      {STAGES.filter(stage => stage.id !== "kubernetes").map((stage, index) =>
        <Satellite key={stage.id} stage={stage} index={index} selected={selected === stage.id}
          onSelect={onSelect} reducedMotion={reducedMotion}/>
      )}
      <HologramCore active={selected === "kubernetes"} onSelect={onSelect} reducedMotion={reducedMotion}/>
    </group>
  </>;
}

function StaticTopology({selected, onSelect}: {
  selected: StageId; onSelect: (stage: StageId) => void;
}) {
  return <div className="topology-static" aria-label="GitOps architecture stages">
    <div className="topology-static-core"><span>K8S</span><small>CLUSTER</small></div>
    <div className="topology-static-stages">
      {STAGES.filter(stage => stage.id !== "kubernetes").map(stage =>
        <button key={stage.id} type="button" className={selected === stage.id ? "is-active" : ""}
          onClick={() => onSelect(stage.id)}>{stage.title}</button>
      )}
    </div>
  </div>;
}

function canRenderWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (context) {
      context.getExtension("WEBGL_lose_context")?.loseContext();
    }
    return Boolean(context);
  } catch {
    return false;
  }
}

class ThreeSceneBoundary extends React.Component<
  {children: React.ReactNode; fallback: React.ReactNode},
  {failed: boolean}
> {
  state = {failed: false};
  static getDerivedStateFromError() {return {failed: true};}
  render() {return this.state.failed ? this.props.fallback : this.props.children;}
}

export default function GitOpsTopology3D() {
  const [selected, setSelected] = useState<StageId>("kubernetes");
  const [webGLReady, setWebGLReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setWebGLReady(canRenderWebGL());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const stage = STAGE_MAP[selected];
  return <div className="hero-art topology-art">
    <div className="topology-art-grid" aria-hidden="true"/>
    <div className="topology-art-aura" aria-hidden="true"/>
    <div className="topology-suptitle"><span className="topology-live-dot"/> ARCHITECTURE PREVIEW <span className="topology-dash"/> 3D GITOPS</div>
    <div className="topology-canvas" aria-label="Interactive 3D view of the GitOps delivery architecture">
      {webGLReady ?
        <ThreeSceneBoundary fallback={<StaticTopology selected={selected} onSelect={setSelected}/>}>
          <Suspense fallback={<StaticTopology selected={selected} onSelect={setSelected}/>}>
          <Canvas camera={{position: [0, 0, 9.4], fov: 39, near: 0.1, far: 60}}
            dpr={[1, 1.65]} frameloop={reducedMotion ? "demand" : "always"}
            gl={{alpha: true, antialias: true, powerPreference: "high-performance"}}
            onCreated={({gl}) => {gl.setClearColor("#000000", 0);}}
            onPointerMissed={() => setSelected("kubernetes")}>
            <TopologyScene selected={selected} onSelect={setSelected} reducedMotion={reducedMotion}/>
          </Canvas>
          </Suspense>
        </ThreeSceneBoundary>
        : <StaticTopology selected={selected} onSelect={setSelected}/>}
    </div>
    <div className="topology-stage-info" aria-live="polite">
      <span className="topology-stage-mark" style={{background: stage.color, boxShadow: "0 0 12px " + stage.color}}/>
      <div className="topology-stage-copy"><strong>{stage.title}</strong><span>{stage.description}</span></div>
      <span className="topology-stage-index">{String(STAGES.findIndex(item => item.id === selected) + 1).padStart(2, "0")}/06</span>
    </div>
    <p className="topology-disclaimer">Conceptual flow · not live cluster telemetry</p>
  </div>;
}
