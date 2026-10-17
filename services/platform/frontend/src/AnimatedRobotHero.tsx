import React, {useEffect, useRef, useState} from "react";
import {FEATURES, RobotRenderer, type FeatureId} from "./RobotWebGL";
import "./animated-robot.css";

export default function AnimatedRobotHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RobotRenderer | null>(null);
  const [stage, setStage] = useState<FeatureId>("ci");
  const [paused, setPaused] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const selected = FEATURES.find(f => f.id === stage) ?? FEATURES[0];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (fallback || !canvasRef.current) return;
    let renderer: RobotRenderer | undefined;
    try {
      renderer = new RobotRenderer(canvasRef.current, setStage, () => setFallback(true));
      rendererRef.current = renderer;
    } catch (error) {
      console.warn("StackFlow: WebGL robot unavailable; using the static mascot.", error);
      setFallback(true);
    }
    return () => {
      rendererRef.current = null;
      renderer?.dispose();
    };
  }, [fallback]);

  useEffect(() => {
    rendererRef.current?.select(stage);
  }, [stage]);
  useEffect(() => {
    rendererRef.current?.pause(paused);
  }, [paused]);
  useEffect(() => {
    rendererRef.current?.motionReduced(reducedMotion);
  }, [reducedMotion]);

  function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    rendererRef.current?.pointer((x / rect.width - .5) * 2, (y / rect.height - .5) * 2);
    event.currentTarget.style.cursor = rendererRef.current?.hover(x, y) ? "pointer" : "default";
  }
  function pointerLeave() {
    rendererRef.current?.pointer(0, 0);
  }
  function clickCanvas(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    rendererRef.current?.tap(event.clientX - rect.left, event.clientY - rect.top);
  }

  return <div className="webgl-hero">
    <div className="webgl-hero-aura" aria-hidden="true"/>
    <div className="webgl-hero-caption"><span className="webgl-hero-caption-dot"/> STACKFLOW DEPLOYMENT ROBOT <span className="webgl-hero-caption-line"/> 3D WEBGL</div>
    {fallback ?
      <img className="webgl-robot-fallback" src="/stackflow-deployment-robot.webp"
        alt="StackFlow deployment assistant robot with holographic pipeline interfaces" width="820" height="820"/>
      :
      <canvas ref={canvasRef} className="webgl-robot-canvas"
        aria-label="3D animated StackFlow robot controlling orbiting deployment workflow cards. Select an activity below to view its explanation."
        onPointerMove={pointerMove} onPointerLeave={pointerLeave} onClick={clickCanvas}/>
    }
    <div className="webgl-hero-bottom">
      <div className="webgl-feature-info" aria-live="polite">
        <span className="webgl-feature-dot" style={{background: selected.color, boxShadow: "0 0 12px "+selected.color}}/>
        <div><strong>{selected.name}</strong><small>{selected.detail}</small></div>
        {!fallback && <button type="button" className="webgl-motion-toggle" aria-label={paused ? "Resume 3D animation" : "Pause 3D animation"}
          aria-pressed={paused} onClick={() => setPaused(v => !v)}>{paused ? "Play" : "Pause"}</button>}
      </div>
      <div className="webgl-feature-choices" aria-label="Deployment workflow stages">
        {FEATURES.map(feature => <button type="button" key={feature.id}
          className={"webgl-feature-button" + (feature.id === stage ? " is-selected" : "")}
          aria-pressed={feature.id === stage} onClick={() => setStage(feature.id)}
          title={feature.detail}>{feature.name}</button>)}
      </div>
      <div className="webgl-hero-qualifier">Conceptual architecture · not live deployment telemetry</div>
    </div>
  </div>;
}
