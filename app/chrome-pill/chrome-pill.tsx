"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  ToneMapping,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { build_pill_halves, PILL_LENGTH } from "./pill-geometry";

export type ChromePillProps = {
  /** Multiplicateur de taille (1 = la gélule occupe ~60 % de la largeur du canvas). */
  size?: number;
  /** Roulis continu + flottement en idle. */
  autoRotate?: boolean;
  /** Rotation et ouverture des deux moitiés pilotées par le scroll de la section parente. */
  scrollDriven?: boolean;
  /** Inclinaison vers le curseur (désactivée sur écrans tactiles). */
  interactive?: boolean;
  /** Séquence d'ouverture : les deux moitiés s'écartent pour révéler le contenu. */
  reveal?: boolean;
  /** Déclenchement : "auto" (après revealDelay) ou "hover" (au survol / au toucher). */
  openOn?: "auto" | "hover";
  /** Instant (s) où les moitiés commencent à s'écarter (mode auto). */
  revealDelay?: number;
  /** Mode hover : ouverture automatique de secours si personne n'interagit (s). */
  autoOpenAfter?: number;
  /** Appelé au moment où la gélule s'ouvre (pour révéler le contenu de la page). */
  onReveal?: () => void;
  className?: string;
};

type PillProps = Required<Omit<ChromePillProps, "className" | "onReveal">> & {
  shared_ref: React.RefObject<SharedState>;
  reveal_cb: React.RefObject<(() => void) | undefined>;
};

const DEG = Math.PI / 180;
const INTRO_DURATION = 1.6;
const ENV_INTENSITY = 1.4;
const OPEN_GAP = 1.15; // écart final de chaque moitié (unités gélule) : encadre le titre
// Téléphone (portrait) : gélule un peu plus petite qui s'écarte davantage, le texte reste au centre entre les moitiés
const PORTRAIT_ASPECT = 0.85;
const PORTRAIT_FIT = 0.7; // gélule fermée = 70 % de la largeur : ouverte, moitiés entières à l'écran et plus hautes que le bouton
const OPEN_GAP_PORTRAIT = 0.92;

// Ressort de l'ouverture (masse 1) : raideur et amortissement → ζ ≈ 0,72, léger dépassement naturel
const SPRING_K = 26;
const SPRING_C = 7.4;

/** Easing expo.out. */
const expo_out = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
/** Lissage indépendant du framerate : facteur donné pour 60 i/s. */
const damp = (factor: number, dt: number) => 1 - Math.pow(1 - factor, dt * 60);
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type SharedState = {
  reduced_motion: boolean;
  touch: boolean;
  scroll: { target: number };
  want_open: boolean; // survol, toucher ou clic : demande d'ouverture
};

/**
 * Environnement lumineux de la gélule.
 * Seulement visible dans les reflets : le fond reste noir pur.
 */
function StudioEnvironment({ resolution = 1024 }: { resolution?: number }) {
  // Photo de studio en pleine définition (même éclairage que la référence « The Pill Thingy ») : chrome miroir net
  return <Environment preset="studio" resolution={resolution} background={false} />;
}

/**
 * La gélule : deux moitiés groupées + toute l'animation (intro, idle, pointeur, scroll).
 */
function Pill({ size, autoRotate, scrollDriven, interactive, reveal, openOn, revealDelay, autoOpenAfter, shared_ref, reveal_cb }: PillProps) {
  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const roll = useRef<THREE.Group>(null);
  const left_ref = useRef<THREE.Mesh>(null);
  const right_ref = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0, touch: false }); // touch : dernier geste au doigt (amplitude plus forte)
  const clock = useRef({ t: 0, roll: 0, tilt_x: 0, tilt_y: 12 * DEG, scroll: 0, revealed: false, gap: 0, gap_v: 0, cam_z: 7, sway: 0, open_k: 0, open_at: Infinity, armed: false });
  const hovered_open = useRef(false); // survol / toucher sur la gélule elle-même

  const { left, right } = useMemo(() => build_pill_halves(), []);
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        metalness: 1,
        // Miroir très brillant (version validée par Mehdi) ; rugosité à peine augmentée pour adoucir les fins câbles du studio
        roughness: 0.055,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        envMapIntensity: 0,
        side: THREE.DoubleSide, // intérieur des coques visible à l'ouverture
      }),
    []
  );

  // Nettoyage GPU au démontage
  useEffect(
    () => () => {
      left.dispose();
      right.dispose();
      material.dispose();
    },
    [left, right, material]
  );

  // Pointeur : la souris ET le doigt inclinent la gélule ; au lever du doigt, elle revient doucement au repos
  useEffect(() => {
    if (!interactive || shared_ref.current.reduced_motion) return;
    const on_move = (e: PointerEvent) => {
      pointer.current.touch = e.pointerType !== "mouse";
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const on_release = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    window.addEventListener("pointerdown", on_move, { passive: true });
    window.addEventListener("pointermove", on_move, { passive: true });
    window.addEventListener("pointerup", on_release, { passive: true });
    window.addEventListener("pointercancel", on_release, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", on_move);
      window.removeEventListener("pointermove", on_move);
      window.removeEventListener("pointerup", on_release);
      window.removeEventListener("pointercancel", on_release);
    };
  }, [interactive, shared_ref]);

  useFrame((state, delta) => {
    const shared = shared_ref.current;
    const { scene, camera } = state;
    const dt = Math.min(delta, 0.05);
    const c = clock.current;
    c.t += dt;
    if (!root.current || !tilt.current || !roll.current) return;

    // Les reflets glissent en continu : oscillation ±30° sur 40 s (un tour complet
    // ferait passer les lumières chaudes devant la gélule et casserait le rendu de référence)
    scene.environmentRotation.y = Math.sin((c.t / 40) * Math.PI * 2) * 30 * DEG;

    // Taille : la gélule remplit ~60 % de la largeur visible
    // Largeur visible calculée à distance fixe (7) : le travelling caméra reste perceptible
    const cam = camera as THREE.PerspectiveCamera;
    const vw = 2 * 7 * Math.tan((cam.fov * DEG) / 2) * cam.aspect;
    const portrait = cam.aspect < PORTRAIT_ASPECT;
    const fit = ((vw * (portrait ? PORTRAIT_FIT : 0.6)) / PILL_LENGTH) * size;
    const open_gap = portrait ? OPEN_GAP_PORTRAIT : OPEN_GAP;
    // Inclinaison Z : -8° ; sur téléphone, la gélule ouverte se remet presque à plat pour ne pas mordre sur le texte
    const roll_z = -8 * DEG * (1 - (portrait ? 1 : 0) * c.open_k);

    // Intro (1,6 s, expo.out)
    const k = shared.reduced_motion ? 1 : expo_out(Math.min(c.t / INTRO_DURATION, 1));
    // Ouverte : la gélule rétrécit de 18 % pour que les deux moitiés restent entières à l'écran
    root.current.scale.setScalar(fit * (0.85 + 0.15 * k) * (1 - 0.18 * c.open_k));
    const mat = left_ref.current?.material as THREE.MeshPhysicalMaterial | undefined;
    if (mat) mat.envMapIntensity = ENV_INTENSITY * k;

    if (shared.reduced_motion) {
      // Mouvement réduit : seule la rotation de l'environnement reste (gélule déjà ouverte si reveal)
      tilt.current.rotation.set(0, 12 * DEG, -8 * DEG);
      if (reveal) {
        if (left_ref.current) left_ref.current.position.x = -open_gap / size;
        if (right_ref.current) right_ref.current.position.x = open_gap / size;
        if (!c.revealed) {
          c.revealed = true;
          reveal_cb.current?.();
        }
      }
      return;
    }

    // Idle : flottement ±0,06 sur 4 s, roulis d'un tour / 14 s
    root.current.position.y = autoRotate ? Math.sin((c.t / 4) * Math.PI * 2) * 0.06 : 0;
    // Instant d'ouverture : programmé (auto ou secours), avancé par un survol / toucher / clic
    if (!c.armed) {
      c.armed = true;
      c.open_at = openOn === "auto" ? revealDelay : autoOpenAfter;
    }
    if ((shared.want_open || hovered_open.current) && c.open_at > c.t + 0.4) c.open_at = Math.max(c.t + 0.4, INTRO_DURATION * 0.75);
    const open_at = c.open_at;
    // Anticipation : le roulis ralentit et s'arrête juste avant l'ouverture
    const roll_speed = reveal ? 1 - smoothstep(open_at - 0.5, open_at - 0.05, c.t) : 1;
    if (autoRotate) c.roll += (dt / 14) * Math.PI * 2 * roll_speed;
    roll.current.rotation.x = c.roll + (-90 * DEG) * (1 - k);

    // Inclinaison au repos + vers le curseur (±10°), amortie
    const px = interactive ? pointer.current.x : 0;
    const py = interactive ? pointer.current.y : 0;
    const f = damp(0.06, dt);
    // Amplitude : ±10° à la souris, ±18° au doigt (sur petit écran le geste est plus court)
    const amp = (pointer.current.touch ? 18 : 10) * DEG;
    c.tilt_x += (-py * amp - c.tilt_x) * f;
    // Une fois ouverte, l'inclinaison de repos (12°) revient à 0 : les deux moitiés restent symétriques à l'écran
    c.open_k += ((reveal && c.t >= open_at ? 1 : 0) - c.open_k) * (1 - Math.exp(-dt * 1.5));
    c.tilt_y += (12 * DEG * (1 - c.open_k) + px * amp - c.tilt_y) * f;

    // Scroll : rotation Y complète + ouverture des moitiés entre 0,4 et 0,7, refermées à 1
    let spin = 0;
    let gap = 0;
    if (scrollDriven) {
      c.scroll += (shared.scroll.target - c.scroll) * damp(0.1, dt);
      spin = c.scroll * Math.PI * 2;
      gap = smoothstep(0.4, 0.7, c.scroll) * (1 - smoothstep(0.7, 1, c.scroll)) * 0.35;
    }
    // Ouverture physique : un ressort tire les deux moitiés vers leur position finale.
    // Rien n'est scripté : vitesse, dépassement et retour viennent de la simulation.
    let half_yaw = 0;
    if (reveal) {
      const target = c.t >= open_at ? open_gap / size : 0;
      // Sous-pas fixes pour une simulation stable quel que soit le framerate
      const steps = Math.ceil(dt / (1 / 240));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        const acc = SPRING_K * (target - c.gap) - SPRING_C * c.gap_v;
        c.gap_v += acc * h;
        c.gap += c.gap_v * h;
      }
      gap = Math.max(gap, c.gap);
      // Inertie : les moitiés s'inclinent selon leur vitesse puis se redressent d'elles-mêmes
      half_yaw = Math.max(-14, Math.min(14, c.gap_v * 3.2)) * DEG;
      // Caméra : reste à distance fixe (retour amorti si elle a bougé)
      const cam_target = 7; // pas de rapprochement : les moitiés doivent rester entières à l'écran
      c.cam_z += (cam_target - c.cam_z) * (1 - Math.exp(-dt * 1.4));
      camera.position.z = c.cam_z;
      // Balancement d'ensemble très lent, qui n'arrive qu'après 1,8 s de calme (skill : pas de flottement par élément)
      c.sway += ((c.t > open_at + 1.8 ? 1 : 0) - c.sway) * (1 - Math.exp(-dt * 1.2));
      if (!c.revealed && c.t >= open_at + 0.35) {
        c.revealed = true;
        document.body.style.cursor = "";
        reveal_cb.current?.();
      }
    }
    tilt.current.rotation.set(c.tilt_x, c.tilt_y + spin, roll_z);
    // Balancement lent (~11 s) appliqué à l'ensemble, pas à chaque moitié
    const sw = c.t * 0.57;
    // Sur téléphone, balancement réduit : les deux moitiés gardent la même taille à l'écran
    tilt.current.rotation.y += c.sway * (portrait ? 0.025 : 0.06) * Math.sin(sw);
    tilt.current.rotation.x += c.sway * 0.02 * Math.sin(sw * 1.3 + 1);
    if (left_ref.current) {
      left_ref.current.position.set(-gap, 0, 0);
      left_ref.current.rotation.y = half_yaw;
    }
    if (right_ref.current) {
      right_ref.current.position.set(gap, 0, 0);
      right_ref.current.rotation.y = -half_yaw;
    }
  });

  return (
    <group ref={root}>
      <group ref={tilt} rotation={[0, 12 * DEG, -8 * DEG]}>
        <group
          ref={roll}
          onPointerOver={(e) => {
            if (!reveal || openOn !== "hover" || clock.current.revealed) return;
            e.stopPropagation();
            document.body.style.cursor = "pointer";
            if (e.pointerType === "mouse") hovered_open.current = true;
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
          onPointerDown={() => {
            if (reveal) hovered_open.current = true;
          }}
        >
          <mesh ref={left_ref} geometry={left} material={material} />
          <mesh ref={right_ref} geometry={right} material={material} />
        </group>
      </group>
    </group>
  );
}

/**
 * Gélule chrome temps réel, rendu type "offline" (environnement studio procédural + post-process).
 * Autonome : fond noir pur, pause hors écran / onglet caché, repli PNG sans WebGL2.
 */
export default function ChromePill({
  size = 1,
  autoRotate = true,
  scrollDriven = false,
  interactive = true,
  reveal = false,
  openOn = "auto",
  revealDelay = 2.6,
  autoOpenAfter = 7,
  onReveal,
  className,
}: ChromePillProps) {
  const reveal_cb = useRef(onReveal);
  useEffect(() => {
    reveal_cb.current = onReveal;
  }, [onReveal]);
  const container = useRef<HTMLDivElement>(null);
  const [webgl2, set_webgl2] = useState<boolean | null>(null);
  // Téléphone / tablette : rendu allégé pour une ouverture fluide (moins de pixels et d'échantillons)
  const [light, set_light] = useState(false);
  const [visible, set_visible] = useState(true);
  const shared_ref = useRef<SharedState>({ reduced_motion: false, touch: false, scroll: { target: 0 }, want_open: false });
  const on_screen = useRef(true);

  // Détection WebGL2, mouvement réduit, tactile
  useEffect(() => {
    const test = document.createElement("canvas").getContext("webgl2");
    shared_ref.current.reduced_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    shared_ref.current.touch = window.matchMedia("(hover: none)").matches;
    // Détection côté client uniquement (impossible pendant le rendu serveur)
    set_light(shared_ref.current.touch || window.innerWidth < 768);
    set_webgl2(!!test);
  }, []);

  // Pause quand le canvas sort de l'écran ou que l'onglet est caché
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const update = () => set_visible(on_screen.current && document.visibilityState === "visible");
    const io = new IntersectionObserver(([entry]) => {
      on_screen.current = entry.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  // Progression du scroll sur la hauteur de la section parente
  useEffect(() => {
    if (!scrollDriven) return;
    const section = container.current?.closest("section") ?? container.current?.parentElement;
    if (!section) return;
    const on_scroll = () => {
      const rect = section.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      shared_ref.current.scroll.target = Math.min(1, Math.max(0, -rect.top / range));
    };
    on_scroll();
    window.addEventListener("scroll", on_scroll, { passive: true });
    window.addEventListener("resize", on_scroll);
    return () => {
      window.removeEventListener("scroll", on_scroll);
      window.removeEventListener("resize", on_scroll);
    };
  }, [scrollDriven]);

  // Un clic n'importe où déclenche aussi l'ouverture
  useEffect(() => {
    if (!reveal) return;
    const on_down = () => {
      shared_ref.current.want_open = true;
    };
    window.addEventListener("pointerdown", on_down);
    return () => window.removeEventListener("pointerdown", on_down);
  }, [reveal]);


  return (
    <div ref={container} className={className} style={{ width: "100%", height: "100%", background: "#000" }}>
      {webgl2 === false && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/chrome-pill.png" alt="Gélule chromée" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      )}
      {webgl2 && (
        <Canvas
          frameloop={visible ? "always" : "never"}
          dpr={light ? [1, 1.5] : [1, 2]}
          camera={{ fov: 28, position: [0, 0, 7], near: 0.1, far: 50 }}
          gl={{ antialias: !light, alpha: false, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.setClearColor("#000000", 1);
            gl.toneMappingExposure = 1;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          <color attach="background" args={["#000000"]} />
          <StudioEnvironment resolution={light ? 512 : 1024} />
          <Pill size={size} autoRotate={autoRotate} scrollDriven={scrollDriven} interactive={interactive} reveal={reveal} openOn={openOn} revealDelay={revealDelay} autoOpenAfter={autoOpenAfter} shared_ref={shared_ref} reveal_cb={reveal_cb} />
          <EffectComposer multisampling={light ? 2 : 4}>
            {/* Bloom contenu (niveaux réduits) pour garder un noir pur autour de la gélule */}
            <Bloom intensity={0.03} luminanceThreshold={2.2} luminanceSmoothing={0.3} mipmapBlur levels={3} />
            <Noise opacity={0.03} premultiply blendFunction={BlendFunction.SCREEN} />
            <Vignette offset={0.3} darkness={0.6} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        </Canvas>
      )}
    </div>
  );
}
