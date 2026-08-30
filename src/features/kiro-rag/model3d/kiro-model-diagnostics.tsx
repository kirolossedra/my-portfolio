import type { KiroModelCapabilities } from './kiro-model.types.ts';

interface KiroModelDiagnosticsProps {
  capabilities: KiroModelCapabilities | null;
}

export default function KiroModelDiagnostics({ capabilities }: KiroModelDiagnosticsProps) {
  if (!capabilities) {
    return (
      <section className="kiro-model-diagnostics" aria-labelledby="kiro-model-diagnostics-title">
        <div>
          <p className="eyebrow">GLB contract</p>
          <h2 id="kiro-model-diagnostics-title">Drop the model in one stable location.</h2>
          <p>The runtime is already wired. Add <code>public/models/kiro/kiro.glb</code> and reload this page.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="kiro-model-diagnostics" aria-labelledby="kiro-model-diagnostics-title">
      <div>
        <p className="eyebrow">Runtime inspection</p>
        <h2 id="kiro-model-diagnostics-title">The GLB tells us what Kiro can actually do.</h2>
        <p>The loader discovers bones, facial morph targets and authored animation clips before the controller attempts procedural behavior.</p>
      </div>
      <dl className="kiro-model-diagnostics__stats">
        <div><dt>Bones</dt><dd>{capabilities.boneNames.length}</dd></div>
        <div><dt>Morph targets</dt><dd>{capabilities.morphTargetNames.length}</dd></div>
        <div><dt>Animation clips</dt><dd>{capabilities.animationNames.length}</dd></div>
        <div><dt>Mapped states</dt><dd>{Object.keys(capabilities.stateClips).length}/6</dd></div>
      </dl>
      {(capabilities.animationNames.length > 0 || capabilities.morphTargetNames.length > 0) && (
        <div className="kiro-model-diagnostics__lists">
          {capabilities.animationNames.length > 0 && (
            <div><strong>Clips</strong><span>{capabilities.animationNames.join(' · ')}</span></div>
          )}
          {capabilities.morphTargetNames.length > 0 && (
            <div><strong>Facial controls</strong><span>{capabilities.morphTargetNames.slice(0, 16).join(' · ')}</span></div>
          )}
        </div>
      )}
      {capabilities.warnings.length > 0 && (
        <ul className="kiro-model-diagnostics__warnings">
          {capabilities.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      )}
    </section>
  );
}
