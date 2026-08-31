import { EUROPEAN_WHEEL_ORDER, getRouletteColor, getWheelIndex } from '@bcf/shared-types';
import { useEffect, type RefObject } from 'react';
import * as THREE from 'three';
import { useRouletteStore } from '@/stores/rouletteStore';

/**
 * Cała warstwa three.js. Animacja jest funkcją czasu SERWERA
 * (`round.startedAt` + offset zegara), więc każdy widz — również ten, który
 * dołączył w połowie spinu — widzi kulkę w tym samym miejscu.
 */

const TAU = Math.PI * 2;
const POCKET_COUNT = EUROPEAN_WHEEL_ORDER.length;
const POCKET_ANGLE = TAU / POCKET_COUNT;

const WHEEL_RADIUS = 3;
const HUB_RADIUS = 1.78;
const LABEL_RADIUS = 2.45;
const BALL_TRACK_RADIUS = 3.44;
const BALL_REST_RADIUS = 2.62;
const BALL_Y_TRACK = 0.46;
const BALL_Y_REST = 0.28;

/** Obrót jałowy koła — powolny, żeby scena nie była martwa między rundami. */
const IDLE_SPEED = 0.12;
const WHEEL_TURNS = 7;
const BALL_TURNS = 16;

const POCKET_COLORS: Record<'green' | 'red' | 'black', number> = {
  green: 0x1fa463,
  red: 0xd4342c,
  black: 0x15171c,
};

/** Środek kieszeni o danym indeksie na kole (kąt lokalny grupy koła). */
function pocketTheta(index: number): number {
  return (index + 0.5) * POCKET_ANGLE;
}

function idleAngle(timeMs: number): number {
  return (timeMs / 1000) * IDLE_SPEED;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function createLabelTexture(value: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 96;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f4f2ee';
    ctx.font = 'bold 62px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function useRouletteScene(containerRef: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 6.4, 5.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(4, 9, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x1fa463, 22, 24);
    rimLight.position.set(-4, 4, -4);
    scene.add(rimLight);

    const wheel = new THREE.Group();
    scene.add(wheel);

    // Zewnętrzny pierścień (tor kulki) + korpus koła.
    const rim = new THREE.Mesh(
      track(new THREE.TorusGeometry(BALL_TRACK_RADIUS + 0.16, 0.3, 20, 120)),
      track(new THREE.MeshStandardMaterial({ color: 0x3a3026, metalness: 0.85, roughness: 0.32 })),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.24;
    wheel.add(rim);

    const bowl = new THREE.Mesh(
      track(new THREE.CylinderGeometry(BALL_TRACK_RADIUS + 0.16, BALL_TRACK_RADIUS - 0.1, 0.5, 120)),
      track(new THREE.MeshStandardMaterial({ color: 0x22262d, metalness: 0.4, roughness: 0.6 })),
    );
    bowl.position.y = -0.02;
    wheel.add(bowl);

    // 37 kieszeni jako wycinki walca — kąt liczony dokładnie, bez UV-owych sztuczek.
    const pocketMaterials: THREE.MeshStandardMaterial[] = [];

    EUROPEAN_WHEEL_ORDER.forEach((value, index) => {
      const material = track(
        new THREE.MeshStandardMaterial({
          color: POCKET_COLORS[getRouletteColor(value)],
          metalness: 0.25,
          roughness: 0.55,
          emissive: new THREE.Color(POCKET_COLORS[getRouletteColor(value)]),
          emissiveIntensity: 0,
        }),
      );
      pocketMaterials.push(material);

      const pocket = new THREE.Mesh(
        track(
          new THREE.CylinderGeometry(
            WHEEL_RADIUS,
            WHEEL_RADIUS,
            0.22,
            10,
            1,
            false,
            index * POCKET_ANGLE,
            POCKET_ANGLE,
          ),
        ),
        material,
      );
      pocket.position.y = 0.24;
      wheel.add(pocket);

      // Przegroda między kieszeniami.
      const fret = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.035, 0.16, WHEEL_RADIUS - HUB_RADIUS)),
        track(new THREE.MeshStandardMaterial({ color: 0xb9a37a, metalness: 0.9, roughness: 0.3 })),
      );
      const fretAngle = index * POCKET_ANGLE;
      const fretRadius = (WHEEL_RADIUS + HUB_RADIUS) / 2;
      fret.position.set(fretRadius * Math.sin(fretAngle), 0.4, fretRadius * Math.cos(fretAngle));
      fret.rotation.y = fretAngle;
      wheel.add(fret);

      // Numer leży płasko, „górą" do środka koła — tak jak na prawdziwym kole.
      const labelGroup = new THREE.Group();
      labelGroup.rotation.y = pocketTheta(index);

      const labelTexture = track(createLabelTexture(value));
      const label = new THREE.Mesh(
        track(new THREE.PlaneGeometry(0.42, 0.32)),
        track(new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true })),
      );
      label.rotation.x = -Math.PI / 2;
      label.position.set(0, 0.36, LABEL_RADIUS);
      labelGroup.add(label);
      wheel.add(labelGroup);
    });

    const hub = new THREE.Mesh(
      track(new THREE.CylinderGeometry(HUB_RADIUS, HUB_RADIUS - 0.25, 0.42, 72)),
      track(new THREE.MeshStandardMaterial({ color: 0x2a2f37, metalness: 0.7, roughness: 0.35 })),
    );
    hub.position.y = 0.42;
    wheel.add(hub);

    const turret = new THREE.Mesh(
      track(new THREE.ConeGeometry(0.38, 0.9, 36)),
      track(new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.95, roughness: 0.22 })),
    );
    turret.position.y = 0.95;
    wheel.add(turret);

    // Kulka celowo poza grupą koła — jej kąt liczymy w przestrzeni świata.
    const ball = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.135, 28, 20)),
      track(new THREE.MeshStandardMaterial({ color: 0xf6f4ef, metalness: 0.15, roughness: 0.18 })),
    );
    scene.add(ball);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let lastRound = useRouletteStore.getState().round;
    let highlighted = -1;
    let frameId = 0;

    const setHighlight = (index: number, intensity: number) => {
      if (highlighted !== index && highlighted >= 0) {
        const previous = pocketMaterials[highlighted];
        if (previous) previous.emissiveIntensity = 0;
      }
      highlighted = index;
      const material = pocketMaterials[index];
      if (material) material.emissiveIntensity = intensity;
    };

    const render = () => {
      frameId = requestAnimationFrame(render);

      const state = useRouletteStore.getState();
      if (state.round) lastRound = state.round;

      const serverNow = Date.now() + state.clockOffset;
      const active = state.round ?? lastRound;

      let wheelAngle: number;
      let ballAngle: number;
      let ballRadius = BALL_REST_RADIUS;
      let ballY = BALL_Y_REST;

      if (!active) {
        wheelAngle = idleAngle(serverNow);
        ballAngle = wheelAngle + pocketTheta(0);
        setHighlight(-1, 0);
      } else {
        const index = getWheelIndex(active.number);
        const wheelStart = idleAngle(active.startedAt);
        const wheelEnd = wheelStart + WHEEL_TURNS * TAU;
        const ballEnd = wheelEnd + pocketTheta(index);
        const ballStart = ballEnd + BALL_TURNS * TAU;
        const progress = clamp((serverNow - active.startedAt) / active.durationMs, 0, 1);

        if (progress >= 1) {
          const settledFor = (serverNow - (active.startedAt + active.durationMs)) / 1000;
          wheelAngle = wheelEnd + settledFor * IDLE_SPEED;
          ballAngle = wheelAngle + pocketTheta(index);
          setHighlight(index, 0.35 + Math.sin(settledFor * 3.4) * 0.2);
        } else {
          const eased = easeOutQuart(progress);
          wheelAngle = wheelStart + eased * (wheelEnd - wheelStart);
          ballAngle = ballStart + eased * (ballEnd - ballStart);

          const drop = smoothstep(0.58, 0.97, progress);
          ballRadius = BALL_TRACK_RADIUS + (BALL_REST_RADIUS - BALL_TRACK_RADIUS) * drop;
          ballY =
            BALL_Y_TRACK +
            (BALL_Y_REST - BALL_Y_TRACK) * drop +
            Math.abs(Math.sin(progress * 24)) * 0.07 * (1 - drop);
          setHighlight(-1, 0);
        }
      }

      wheel.rotation.y = wheelAngle;
      ball.position.set(
        ballRadius * Math.sin(ballAngle),
        ballY,
        ballRadius * Math.cos(ballAngle),
      );

      renderer.render(scene, camera);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      for (const item of disposables) item.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [containerRef]);
}
