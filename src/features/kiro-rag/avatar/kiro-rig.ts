/**
 * Compatibility surface for the earlier cutout rig module.
 *
 * The production avatar now uses the continuous deformation model in
 * `kiro-model.ts`. Keep this module small so older imports fail gracefully
 * during the migration instead of reintroducing DOM joint transforms.
 */
export {
  KIRO_NEUTRAL_PARAMETERS,
  KIRO_PARAMETER_KEYS,
  KIRO_STATE_LABELS,
  clampKiroParameters,
  resolveKiroModel,
} from './kiro-model.ts';
