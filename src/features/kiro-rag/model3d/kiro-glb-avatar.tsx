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
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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

function disposeModel(root: Group) {
  root.traverse((object) => {
    const candidate = object as unknown as {
      geometry?: { dispose: () => void };
      material?: { dispose?: () => void; map?: { dispose?: () => void } } | Array<{ dispose?: () => void; map?: { dispose?: () => void } }>;
    };
    candidate.geometry?.dispose();
    const materials = Array.isArray(candidate.material) ? candidate.material : candidate.material ? [candidate.material] : [];
    materials.forEach((material) => {
      material.map?.dispose?.();
      material.dispose?.();
    });
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
  const distance = Math.max(distanceForHeight, distanceForWidth) * 1.18;

  camera.position.set(0, Math.max(0, size.y * 0.04), distance);
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
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const modelContainerRef = useRef<Group | null>(null);
  const stateRef = useRef(state);
  const talkingRef = useRef(talking);
  const onCapabilitiesRef = useRef(onCapabilities);
  const [loadState, setLoadState] = useState<KiroLoadState>('loading');
  const [message, setMessage] = useState('Loading Kiro GLB…');

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
    let resizeObserver: ResizeObserver | undefined;
    const scene = new Scene();
    scene.background = null;

    const camera = new PerspectiveCamera(32, 1, 0.01, 1000);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;
    host.appendChild(renderer.domElement);

    const hemi = new HemisphereLight(new Color('#f7f5ef'), new Color('#243447'), 2.1);
    scene.add(hemi);
    const key = new DirectionalLight(new Color('#fff2d7'), 3.4);
    key.position.set(3.5, 5, 6);
    scene.add(key);
    const fill = new DirectionalLight(new Color('#b7ddff'), 1.8);
    fill.position.set(-4, 2, 4);
    scene.add(fill);

    const modelContainer = new Group();
    scene.add(modelContainer);
    modelContainerRef.current = modelContainer;

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

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        modelContainer.add(model);
        frameModel(camera, model, camera.aspect);

        const controller = new KiroAnimationController({
          modelUrl,
          root: model,
          modelContainer,
          clips: gltf.animations,
          reducedMotion: reducedMotionQuery.matches,
        });
        controllerRef.current = controller;
        controller.setState(stateRef.current, true);
        controller.setTalking(talkingRef.current);
        onCapabilitiesRef.current?.(controller.capabilities);
        setLoadState('ready');
        setMessage('Kiro GLB loaded');
      },
      undefined,
      (error) => {
        if (disposed) return;
        const status = (error as { target?: { status?: number } })?.target?.status;
        if (status === 404 || String(error).includes('404')) {
          setLoadState('missing');
          setMessage('Place kiro.glb in public/models/kiro/');
        } else {
          setLoadState('error');
          setMessage('The Kiro GLB could not be loaded. Check the browser console and model export.');
        }
      },
    );

    const onReducedMotion = (event: MediaQueryListEvent) => controllerRef.current?.setReducedMotion(event.matches);
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
      resizeObserver?.disconnect();
      controllerRef.current?.dispose();
      controllerRef.current = null;
      const loaded = modelContainer.children[0] as Group | undefined;
      if (loaded) disposeModel(loaded);
      renderer.dispose();
      renderer.domElement.remove();
      rendererRef.current = null;
      modelContainerRef.current = null;
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
      aria-label="Interactive Kiro 3D model"
    >
      {loadState !== 'ready' && (
        <div className="kiro-glb-avatar__status" role="status">
          <strong>{loadState === 'missing' ? 'GLB slot ready' : loadState === 'error' ? 'Model load failed' : 'Loading model'}</strong>
          <span>{message}</span>
          {loadState === 'missing' && <code>public/models/kiro/kiro.glb</code>}
        </div>
      )}
    </div>
  );
}
