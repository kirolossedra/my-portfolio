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
  '--leaf-color': string;
  '--leaf-highlight': string;
  '--leaf-shadow': string;
  '--leaf-opacity': string;
  '--leaf-start-rotation': string;
  '--leaf-spin': string;
  '--leaf-sway-a': string;
  '--leaf-sway-b': string;
  '--leaf-sway-c': string;
  '--leaf-fall-drift': string;
  '--leaf-size': string;
  '--leaf-tumble-duration': string;
  '--leaf-tumble-delay': string;
};

interface SeasonTransitionEffectProps {
  season: Season;
  effectKey: number;
  onComplete: () => void;
}

const FALL_PALETTE = [
  { color: '#a9342a', highlight: '#d75a36', shadow: '#6e271f' },
  { color: '#bf472d', highlight: '#e57438', shadow: '#7f2e20' },
  { color: '#d56a2c', highlight: '#ee9a3d', shadow: '#8d3c20' },
  { color: '#e29a2c', highlight: '#f2c04a', shadow: '#996025' },
  { color: '#d4aa32', highlight: '#f0cf58', shadow: '#8d7227' },
  { color: '#93372a', highlight: '#c95a35', shadow: '#63251f' },
] as const;

function seededValue(index: number, salt: number): number {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function particleStyle(index: number, salt: number): ParticleStyle {
  const x = seededValue(index, salt) * 100;
  const delay = seededValue(index, salt + 1) * 1.15;
  const duration = 2.2 + seededValue(index, salt + 2) * 1.8;
  const drift = -90 + seededValue(index, salt + 3) * 180;
  const size = 5 + seededValue(index, salt + 4) * 9;
  const rotation = -120 + seededValue(index, salt + 5) * 240;
  const palette = FALL_PALETTE[index % FALL_PALETTE.length];
  const leafDirection = seededValue(index, salt + 6) > 0.5 ? 1 : -1;
  const leafScale = 0.82 + seededValue(index, salt + 7) * 0.62;
  const leafSize = (13 + seededValue(index, salt + 8) * 15) * leafScale;
  const leafDrift = (-115 + seededValue(index, salt + 9) * 230) * leafDirection;
  const sway = 20 + seededValue(index, salt + 10) * 52;
  const leafStartRotation = -55 + seededValue(index, salt + 11) * 110;
  const leafSpin = (220 + seededValue(index, salt + 12) * 430) * leafDirection;

  return {
    '--particle-x': `${x}%`,
    '--particle-delay': `${delay}s`,
    '--particle-duration': `${duration}s`,
    '--particle-drift': `${drift}px`,
    '--particle-size': `${size}px`,
    '--particle-rotation': `${rotation}deg`,
    '--particle-rain-drift': `${drift * 0.24}px`,
    '--leaf-color': palette.color,
    '--leaf-highlight': palette.highlight,
    '--leaf-shadow': palette.shadow,
    '--leaf-opacity': `${0.72 + seededValue(index, salt + 13) * 0.24}`,
    '--leaf-start-rotation': `${leafStartRotation}deg`,
    '--leaf-spin': `${leafSpin}deg`,
    '--leaf-sway-a': `${sway * leafDirection}px`,
    '--leaf-sway-b': `${-sway * 0.7 * leafDirection}px`,
    '--leaf-sway-c': `${sway * 0.52 * leafDirection}px`,
    '--leaf-fall-drift': `${leafDrift}px`,
    '--leaf-size': `${leafSize}px`,
    '--leaf-tumble-duration': `${1.35 + seededValue(index, salt + 14) * 1.45}s`,
    '--leaf-tumble-delay': `${-seededValue(index, salt + 15) * 1.8}s`,
  };
}

function fallLeafVariant(index: number): string {
  if (index % 7 === 0 || index % 11 === 0) {
    return 'season-fall-leaf--aspen';
  }

  if (index % 5 === 0) {
    return 'season-fall-leaf--oak';
  }

  return 'season-fall-leaf--maple';
}

export default function SeasonTransitionEffect({
  season,
  effectKey,
  onComplete,
}: SeasonTransitionEffectProps) {
  useEffect(() => {
    const duration = season === 'fall' ? 6500 : season === 'summer' ? 3900 : 3400;
    const timeout = window.setTimeout(onComplete, duration);
    return () => window.clearTimeout(timeout);
  }, [effectKey, onComplete, season]);

  const count =
    season === 'fall' ? 36 : season === 'winter' ? 30 : season === 'summer' ? 22 : 20;

  return (
    <div className={`season-transition season-transition--${season}`} aria-hidden="true">
      {season === 'fall' && <span className="season-fall-warmth" />}
      {season === 'summer' && <span className="season-sun-glow" />}
      <div className="season-particle-field">
        {Array.from({ length: count }, (_, index) => (
          <span
            className="season-particle"
            key={`${season}-${effectKey}-${index}`}
            style={particleStyle(index, effectKey + season.length)}
          >
            {season === 'fall' && (
              <span className={`season-fall-leaf ${fallLeafVariant(index)}`}>
                <span className="season-fall-leaf-body" />
                <span className="season-fall-leaf-stem" />
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
