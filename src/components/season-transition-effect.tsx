import { useEffect, type CSSProperties } from 'react';
import type { Season } from '../lib/season-utils.ts';

type ParticleStyle = CSSProperties & {
  '--particle-x': string;
  '--particle-delay': string;
  '--particle-duration': string;
  '--particle-drift': string;
  '--particle-size': string;
  '--particle-rotation': string;
  '--particle-rain-drift': string;
};

interface SeasonTransitionEffectProps {
  season: Season;
  effectKey: number;
  onComplete: () => void;
}

function seededValue(index: number, salt: number): number {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function particleStyle(index: number, salt: number): ParticleStyle {
  const x = seededValue(index, salt) * 100;
  const delay = seededValue(index, salt + 1) * 1.1;
  const duration = 2.2 + seededValue(index, salt + 2) * 1.8;
  const drift = -90 + seededValue(index, salt + 3) * 180;
  const size = 5 + seededValue(index, salt + 4) * 9;
  const rotation = -120 + seededValue(index, salt + 5) * 240;

  return {
    '--particle-x': `${x}%`,
    '--particle-delay': `${delay}s`,
    '--particle-duration': `${duration}s`,
    '--particle-drift': `${drift}px`,
    '--particle-size': `${size}px`,
    '--particle-rotation': `${rotation}deg`,
    '--particle-rain-drift': `${drift * 0.24}px`,
  };
}

export default function SeasonTransitionEffect({
  season,
  effectKey,
  onComplete,
}: SeasonTransitionEffectProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onComplete, season === 'summer' ? 3900 : 3400);
    return () => window.clearTimeout(timeout);
  }, [effectKey, onComplete, season]);

  const count = season === 'winter' ? 30 : season === 'summer' ? 22 : 20;

  return (
    <div className={`season-transition season-transition--${season}`} aria-hidden="true">
      {season === 'summer' && <span className="season-sun-glow" />}
      <div className="season-particle-field">
        {Array.from({ length: count }, (_, index) => (
          <span
            className="season-particle"
            key={`${season}-${effectKey}-${index}`}
            style={particleStyle(index, effectKey + season.length)}
          />
        ))}
      </div>
    </div>
  );
}
