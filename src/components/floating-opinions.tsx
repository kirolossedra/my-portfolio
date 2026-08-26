import { useEffect, useRef, type CSSProperties } from 'react';
import type { PublicOpinion } from '../../shared/opinion.ts';

interface FloatingOpinionsProps {
  opinions: PublicOpinion[];
}

type MotionState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
};

function seededValue(seed: number, salt: number): number {
  const value = Math.sin(seed * 17.731 + salt * 91.117) * 43758.5453;
  return value - Math.floor(value);
}

function initialMotion(id: number, width: number, height: number): MotionState {
  const speed = 12 + seededValue(id, 1) * 13;
  const angle = seededValue(id, 2) * Math.PI * 2;
  return {
    x: seededValue(id, 3) * Math.max(0, width - 240),
    y: seededValue(id, 4) * Math.max(0, height - 150),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    width: 0,
    height: 0,
  };
}

export default function FloatingOpinions({ opinions }: FloatingOpinionsProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef(new Map<number, HTMLElement>());
  const motionRef = useRef(new Map<number, MotionState>());

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !opinions.length) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let previousTime = performance.now();

    const measure = () => {
      const bounds = stage.getBoundingClientRect();
      for (const opinion of opinions) {
        const element = bubbleRefs.current.get(opinion.id);
        if (!element) continue;
        const box = element.getBoundingClientRect();
        let motion = motionRef.current.get(opinion.id);
        if (!motion) {
          motion = initialMotion(opinion.id, bounds.width, bounds.height);
          motionRef.current.set(opinion.id, motion);
        }
        motion.width = box.width;
        motion.height = box.height;
        motion.x = Math.min(Math.max(0, motion.x), Math.max(0, bounds.width - box.width));
        motion.y = Math.min(Math.max(0, motion.y), Math.max(0, bounds.height - box.height));
        element.style.transform = `translate3d(${motion.x}px, ${motion.y}px, 0)`;
      }
    };

    const animate = (time: number) => {
      const dt = Math.min(0.04, Math.max(0, (time - previousTime) / 1000));
      previousTime = time;
      const bounds = stage.getBoundingClientRect();

      for (const opinion of opinions) {
        const element = bubbleRefs.current.get(opinion.id);
        const motion = motionRef.current.get(opinion.id);
        if (!element || !motion) continue;

        motion.x += motion.vx * dt;
        motion.y += motion.vy * dt;

        const maxX = Math.max(0, bounds.width - motion.width);
        const maxY = Math.max(0, bounds.height - motion.height);

        if (motion.x <= 0) {
          motion.x = 0;
          motion.vx = Math.abs(motion.vx);
        } else if (motion.x >= maxX) {
          motion.x = maxX;
          motion.vx = -Math.abs(motion.vx);
        }

        if (motion.y <= 0) {
          motion.y = 0;
          motion.vy = Math.abs(motion.vy);
        } else if (motion.y >= maxY) {
          motion.y = maxY;
          motion.vy = -Math.abs(motion.vy);
        }

        element.style.transform = `translate3d(${motion.x}px, ${motion.y}px, 0)`;
      }

      frame = window.requestAnimationFrame(animate);
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(stage);
    opinions.forEach((opinion) => {
      const element = bubbleRefs.current.get(opinion.id);
      if (element) resizeObserver.observe(element);
    });

    if (!reducedMotion) frame = window.requestAnimationFrame(animate);

    return () => {
      resizeObserver.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [opinions]);

  if (!opinions.length) {
    return (
      <div className="opinion-stage opinion-stage--empty">
        <p>No approved opinions yet. The first one can start here.</p>
      </div>
    );
  }

  return (
    <div className="opinion-stage" ref={stageRef} aria-label="Published opinions">
      {opinions.map((opinion) => (
        <blockquote
          className="opinion-bubble"
          key={opinion.id}
          ref={(element) => {
            if (element) bubbleRefs.current.set(opinion.id, element);
            else bubbleRefs.current.delete(opinion.id);
          }}
          style={{ '--bubble-seed': opinion.id } as CSSProperties}
        >
          <p>“{opinion.opinion}”</p>
          <footer>
            <strong>{opinion.displayName}</strong>
            {opinion.relationship && <span>{opinion.relationship}</span>}
          </footer>
        </blockquote>
      ))}
    </div>
  );
}
