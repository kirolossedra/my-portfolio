export type KiroAvatarState =
  | 'idle'
  | 'thinking'
  | 'retrieving'
  | 'answering'
  | 'success'
  | 'error';

interface KiroAvatarProps {
  state?: KiroAvatarState;
  className?: string;
}

/**
 * Stage-one Kiro avatar.
 *
 * The canonical artwork is deliberately rendered as one stable 2D visual first.
 * Future rigging can replace the internals with independently controlled layers
 * without changing page-level callers or KiroRag state semantics.
 */
export default function KiroAvatar({ state = 'idle', className = '' }: KiroAvatarProps) {
  return (
    <figure className={`kiro-avatar ${className}`.trim()} data-kiro-state={state}>
      <div className="kiro-avatar-frame">
        <img
          src="/media/kiro-rag/kiro-canonical.png"
          alt="Kiro Rag avatar standing on a dual-thruster hoverboard"
          width="1254"
          height="1254"
          draggable="false"
        />
      </div>
      <figcaption>Canonical Kiro visual · 2D source of truth</figcaption>
    </figure>
  );
}
