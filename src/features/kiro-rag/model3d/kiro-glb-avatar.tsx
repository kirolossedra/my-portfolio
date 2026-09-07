import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  ACESFilmicToneMapping,
  Box3,
  Clock,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { KiroAnimationController } from './kiro-animation-controller.ts';
import { KIRO_MODEL_URL } from './kiro-model-contract.ts';
import type {
  KiroAvatarState,
  KiroLoadState,
  KiroModelCapabilities,
} from './kiro-model.types.ts';

interface KiroGlbAvatarProps {
  state?: KiroAvatarState;
  modelUrl?: string;
  talking?: boolean;
  interactiveGaze?: boolean;
  className?: string;
  onCapabilities?: (capabilities: KiroModelCapabilities) => void;
}

type DisposableMaterial = {
  dispose?: () => void;
  map?: { dispose?: () => void; colorSpace?: string };
  normalMap?: { dispose?: () => void };
  roughnessMap?: { dispose?: () => void };
  metalnessMap?: { dispose?: () => void };
};

function materialsFor(object: Mesh): DisposableMaterial[] {
  const material = object.material as unknown as DisposableMaterial | DisposableMaterial[] | undefined;
  if (!material) return [];
  return Array.isArray(material) ? material : [material];
}

function prepareModel(root: Group) {
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.material) return;
    for (const material of materialsFor(mesh)) {
      if (material.map) material.map.colorSpace = SRGBColorSpace;
    }
  });
}

function disposeModel(root: Group) {
  root.traverse((object) => {
    const mesh = object as Mesh;
    mesh.geometry?.dispose();
    for (const material of materialsFor(mesh)) {
      material.map?.dispose?.();
      material.normalMap?.dispose?.();
      material.roughnessMap?.dispose?.();
      material.metalnessMap?.dispose?.();
      material.dispose?.();
    }
  });
}

function frameModel(camera: PerspectiveCamera, model: Group, viewportAspect: number) {
  const box = new Box3().setFromObject(model);
  if (box.isEmpty()) return;

  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  model.position.sub(center);

  const height = Math.max(size.y, 0.1);
  const width = Math.max(size.x, 0.1);
  const verticalFov = MathUtils.degToRad(camera.fov);
  const distanceForHeight = height / (2 * Math.tan(verticalFov / 2));
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * viewportAspect);
  const distanceForWidth = width / (2 * Math.tan(horizontalFov / 2));
  const distance = Math.max(distanceForHeight, distanceForWidth) * 1.14;

  camera.position.set(0, Math.max(0, size.y * 0.035), distance);
  camera.near = Math.max(0.01, distance / 100);
  camera.far = Math.max(100, distance * 12);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

export default function KiroGlbAvatar({
  state = 'idle',
  modelUrl = KIRO_MODEL_URL,
  talking = state === 'answering',
  interactiveGaze = true,
  className = '',
  onCapabilities,
}: KiroGlbAvatarProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<KiroAnimationController | null>(null);
  const stateRef = useRef(state);
  const talkingRef = useRef(talking);
  const onCapabilitiesRef = useRef(onCapabilities);
  const [loadState, setLoadState] = useState<KiroLoadState>('loading');
  const [message, setMessage] = useState('Loading Mixamo-rigged Kiro…');

  useEffect(() => {
    stateRef.current = state;
    controllerRef.current?.setState(state);
  }, [state]);

  useEffect(() => {
    talkingRef.current = talking;
    controllerRef.current?.setTalking(talking);
  }, [talking]);

  useEffect(() => {
    onCapabilitiesRef.current = onCapabilities;
  }, [onCapabilities]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let animationFrame = 0;

    const scene = new Scene();
    scene.background = null;

    const camera = new PerspectiveCamera(32, 1, 0.01, 1000);
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.03;
    host.appendChild(renderer.domElement);

    const hemi = new HemisphereLight(new Color('#f7f5ef'), new Color('#243447'), 2.15);
    scene.add(hemi);

    const key = new DirectionalLight(new Color('#fff2d7'), 3.35);
    key.position.set(3.5, 5, 6);
    scene.add(key);

    const fill = new DirectionalLight(new Color('#b7ddff'), 1.7);
    fill.position.set(-4, 2, 4);
    scene.add(fill);

    const modelContainer = new Group();
    scene.add(modelContainer);

    const clock = new Clock();
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      const loadedModel = modelContainer.children[0] as Group | undefined;
      if (loadedModel) frameModel(camera, loadedModel, camera.aspect);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const loader = new FBXLoader();
    loader.load(
      modelUrl,
      (model) => {
        if (disposed) return;

        prepareModel(model);
        modelContainer.add(model);
        frameModel(camera, model, camera.aspect);

        const controller = new KiroAnimationController({
          modelUrl,
          root: model,
          modelContainer,
          clips: model.animations,
          reducedMotion: reducedMotionQuery.matches,
        });

        controllerRef.current = controller;
        controller.setState(stateRef.current, true);
        controller.setTalking(talkingRef.current);
        onCapabilitiesRef.current?.(controller.capabilities);

        setLoadState('ready');
        setMessage('Mixamo rig loaded');
      },
      undefined,
      (error) => {
        if (disposed) return;
        const status = (error as { target?: { status?: number } })?.target?.status;

        if (status === 404 || String(error).includes('404')) {
          setLoadState('missing');
          setMessage('Place the Mixamo FBX at public/models/kiro/kiro.fbx');
        } else {
          setLoadState('error');
          setMessage('The Mixamo FBX could not be loaded. Check the browser console and exported rig.');
        }
      },
    );

    const onReducedMotion = (event: MediaQueryListEvent) => {
      controllerRef.current?.setReducedMotion(event.matches);
    };
    reducedMotionQuery.addEventListener('change', onReducedMotion);

    const render = () => {
      if (disposed) return;
      animationFrame = window.requestAnimationFrame(render);

      const delta = clock.getDelta();
      const elapsed = clock.elapsedTime;
      if (document.visibilityState !== 'hidden') {
        controllerRef.current?.update(delta, elapsed);
        renderer.render(scene, camera);
      }
    };
    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      reducedMotionQuery.removeEventListener('change', onReducedMotion);
      resizeObserver.disconnect();
      controllerRef.current?.dispose();
      controllerRef.current = null;

      const loaded = modelContainer.children[0] as Group | undefined;
      if (loaded) disposeModel(loaded);

      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [modelUrl]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!interactiveGaze || !hostRef.current) return;

    const rect = hostRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    const y = -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
    controllerRef.current?.setLook(x, y);
  };

  const onPointerLeave = () => controllerRef.current?.setLook(0, 0);

  return (
    <div
      ref={hostRef}
      className={`kiro-glb-avatar is-${loadState} ${className}`.trim()}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-label="Interactive Mixamo-rigged Kiro 3D model"
      data-model-format="fbx"
    >
      {loadState !== 'ready' && (
        <div className="kiro-glb-avatar__status" role="status">
          <strong>
            {loadState === 'missing'
              ? 'Mixamo model slot ready'
              : loadState === 'error'
                ? 'Model load failed'
                : 'Loading model'}
          </strong>
          <span>{message}</span>
          {loadState === 'missing' && <code>public/models/kiro/kiro.fbx</code>}
        </div>
      )}
    </div>
  );
}
