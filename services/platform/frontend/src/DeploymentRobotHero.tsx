import React, {useRef} from "react";
import "./deployment-robot.css";

/**
 * StackFlow's deployment mascot is a visual identity element, not a live
 * deployment monitor. Its appearance is the user-selected 3D robot artwork.
 * CSS motion is intentionally lightweight and honors reduced-motion settings.
 */
export default function DeploymentRobotHero() {
  const artRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - bounds.left) / bounds.width - 0.5;
    const dy = (event.clientY - bounds.top) / bounds.height - 0.5;
    artRef.current?.style.setProperty("--robot-tilt-x", (-dy * 5).toFixed(2) + "deg");
    artRef.current?.style.setProperty("--robot-tilt-y", (dx * 6).toFixed(2) + "deg");
  }

  function resetPointer() {
    artRef.current?.style.setProperty("--robot-tilt-x", "0deg");
    artRef.current?.style.setProperty("--robot-tilt-y", "0deg");
  }

  return (
    <div className="robot-hero" onPointerMove={handlePointerMove} onPointerLeave={resetPointer}>
      <div className="robot-hero-light" aria-hidden="true"/>
      <div className="robot-hero-ring robot-hero-ring-one" aria-hidden="true"/>
      <div className="robot-hero-ring robot-hero-ring-two" aria-hidden="true"/>
      <div className="robot-hero-artwork" ref={artRef}>
        <img
          className="robot-hero-image"
          src="/stackflow-deployment-robot.webp"
          alt="StackFlow's purple 3D deployment robot guiding CI/CD workflows, container orchestration and observability"
          decoding="async"
          fetchPriority="high"
          width={820}
          height={820}
        />
      </div>
      <div className="robot-hero-caption" aria-hidden="true"><span className="robot-caption-pulse"/> YOUR DEPLOYMENT COMPANION</div>
    </div>
  );
}
