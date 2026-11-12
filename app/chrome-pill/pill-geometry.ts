import * as THREE from "three";

// Dimensions de la gélule (unités monde) — forme validée par Mehdi (longue et fine)
export const PILL_LENGTH = 2.65;
export const PILL_RADIUS = 0.5;
const CYL_HALF = PILL_LENGTH / 2 - PILL_RADIUS; // demi-longueur du corps cylindrique : 0.825

// Jointure centrale
const SEAM_HALF_WIDTH = 0.018 / 2; // 0.009 de chaque côté du centre
const SEAM_DEPTH = 0.01;
const BEVEL = 0.004;

const RADIAL_SEGMENTS = 256;
const CAP_POINTS = 72; // ≥ 64 points sur le profil de la calotte
const BODY_POINTS = 24;
const BEVEL_POINTS = 10;

/**
 * Profil (rayon, y) d'une demi-gélule, du pôle (y négatif) jusqu'au plan de jointure (y = 0).
 * Calotte hémisphérique parfaite → corps → biseau arrondi de 0.004 → paroi et fond de la rainure.
 */
function half_profile(): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];

  // Calotte hémisphérique : du pôle à l'équateur
  for (let i = 0; i <= CAP_POINTS; i++) {
    const a = -Math.PI / 2 + (i / CAP_POINTS) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(Math.cos(a) * PILL_RADIUS, 1e-5), -CYL_HALF + Math.sin(a) * PILL_RADIUS));
  }

  // Corps cylindrique jusqu'au début du biseau
  const body_end = -(SEAM_HALF_WIDTH + BEVEL);
  for (let i = 1; i <= BODY_POINTS; i++) {
    pts.push(new THREE.Vector2(PILL_RADIUS, -CYL_HALF + (i / BODY_POINTS) * (body_end + CYL_HALF)));
  }

  // Biseau arrondi (quart de cercle de rayon 0.004) : la lèvre attrape une fine ligne de lumière
  const cx = PILL_RADIUS - BEVEL;
  const cy = body_end;
  for (let i = 1; i <= BEVEL_POINTS; i++) {
    const a = (i / BEVEL_POINTS) * (Math.PI / 2);
    pts.push(new THREE.Vector2(cx + Math.cos(a) * BEVEL, cy + Math.sin(a) * BEVEL));
  }

  // Paroi de la rainure puis fond de la rainure jusqu'au centre
  const floor_r = PILL_RADIUS - SEAM_DEPTH;
  pts.push(new THREE.Vector2(floor_r, -SEAM_HALF_WIDTH));
  pts.push(new THREE.Vector2(floor_r, 0));

  // Pas de face de fermeture : chaque moitié est une coque creuse, comme une vraie gélule
  return pts;
}

/**
 * Construit les deux moitiés de la gélule, axe long sur X, jointure au centre (x = 0).
 * Gauche : x ∈ [-1.325, 0], droite : x ∈ [0, 1.325].
 */
export function build_pill_halves() {
  const left = new THREE.LatheGeometry(half_profile(), RADIAL_SEGMENTS);
  // Rotation de 180° autour de Z : miroir sans inverser l'ordre des triangles
  const right = left.clone().rotateZ(Math.PI);
  // Axe long Y → X : le pôle gauche (y négatif) passe en x négatif
  left.rotateZ(-Math.PI / 2);
  right.rotateZ(-Math.PI / 2);
  return { left, right };
}
