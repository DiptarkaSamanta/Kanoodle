// Kanoodle 12 Official Canonical Pieces & 3D Mesh Factory

const PIECE_DEFINITIONS = {
  A: {
    letter: 'A',
    name: 'Lime L-4',
    colorName: 'Lime',
    color: '#4ade80',
    colorHex: 0x22c55e,
    accent: '#86efac',
    spheres: 4,
    coords: [[0, 1], [0, 0], [1, 0], [2, 0]]
  },
  B: {
    letter: 'B',
    name: 'Cherry P-5',
    colorName: 'Cherry',
    color: '#ff1744',
    colorHex: 0xff1744,
    accent: '#ff616f',
    spheres: 5,
    coords: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1]]
  },
  C: {
    letter: 'C',
    name: 'Indigo Long-L',
    colorName: 'Indigo',
    color: '#2563eb',
    colorHex: 0x1d4ed8,
    accent: '#60a5fa',
    spheres: 5,
    coords: [[1, 0], [1, 1], [1, 2], [0, 3], [1, 3]]
  },
  D: {
    letter: 'D',
    name: 'Pink Branch-5',
    colorName: 'Pink',
    color: '#ff2d87',
    colorHex: 0xf43f5e,
    accent: '#fda4af',
    spheres: 5,
    coords: [[0, 0], [1, 0], [2, 0], [3, 0], [2, 1]]
  },
  E: {
    letter: 'E',
    name: 'Orange Z-5',
    colorName: 'Orange',
    color: '#ff6b00',
    colorHex: 0xf97316,
    accent: '#fed7aa',
    spheres: 5,
    coords: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1]]
  },
  F: {
    letter: 'F',
    name: 'Cyan Corner-3',
    colorName: 'Cyan',
    color: '#00d4ff',
    colorHex: 0x06b6d4,
    accent: '#a5f3fc',
    spheres: 3,
    coords: [[0, 0], [0, 1], [1, 1]]
  },
  G: {
    letter: 'G',
    name: 'Peach V-5',
    colorName: 'Peach',
    color: '#ff5722',
    colorHex: 0xf43f5e,
    accent: '#ff8a65',
    spheres: 5,
    coords: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]
  },
  H: {
    letter: 'H',
    name: 'Violet Stair-5',
    colorName: 'Violet',
    color: '#a855f7',
    colorHex: 0x9333ea,
    accent: '#e9d5ff',
    spheres: 5,
    coords: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]]
  },
  I: {
    letter: 'I',
    name: 'Sunny U-5',
    colorName: 'Sunny',
    color: '#fbbf24',
    colorHex: 0xf59e0b,
    accent: '#fef08a',
    spheres: 5,
    coords: [[0, 0], [1, 0], [1, 1], [0, 2], [1, 2]]
  },
  J: {
    letter: 'J',
    name: 'Magenta Line-4',
    colorName: 'Magenta',
    color: '#db2777',
    colorHex: 0xbe185d,
    accent: '#fbcfe8',
    spheres: 4,
    coords: [[0, 0], [1, 0], [2, 0], [3, 0]]
  },
  K: {
    letter: 'K',
    name: 'Emerald Square-4',
    colorName: 'Emerald',
    color: '#10b981',
    colorHex: 0x059669,
    accent: '#a7f3d0',
    spheres: 4,
    coords: [[0, 0], [1, 0], [0, 1], [1, 1]]
  },
  L: {
    letter: 'L',
    name: 'Amber Cross-5',
    colorName: 'Amber',
    color: '#ea580c',
    colorHex: 0xd97706,
    accent: '#fed7aa',
    spheres: 5,
    coords: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]
  }
};

// Extended shapes for Custom Mode (Monosperes, Dominios, Trominoes, Alternative Pentas, Hexaspheres)
const EXTENDED_PIECE_DEFINITIONS = {
  M: {
    letter: 'M',
    name: 'Dot-1',
    colorName: 'Ruby',
    color: '#f43f5e',
    colorHex: 0xf43f5e,
    accent: '#fda4af',
    spheres: 1,
    coords: [[0, 0]]
  },
  N: {
    letter: 'N',
    name: 'Domino-2',
    colorName: 'Sky',
    color: '#0ea5e9',
    colorHex: 0x0ea5e9,
    accent: '#7dd3fc',
    spheres: 2,
    coords: [[0, 0], [1, 0]]
  },
  O: {
    letter: 'O',
    name: 'Tromino-3',
    colorName: 'Tangerine',
    color: '#f97316',
    colorHex: 0xf97316,
    accent: '#fdba74',
    spheres: 3,
    coords: [[0, 0], [1, 0], [2, 0]]
  },
  P: {
    letter: 'P',
    name: 'T-Tetra-4',
    colorName: 'Purple',
    color: '#a855f7',
    colorHex: 0xa855f7,
    accent: '#d8b4fe',
    spheres: 4,
    coords: [[0, 0], [1, 0], [2, 0], [1, 1]]
  },
  Q: {
    letter: 'Q',
    name: 'Z-Tetra-4',
    colorName: 'Fuchsia',
    color: '#ec4899',
    colorHex: 0xec4899,
    accent: '#f472b6',
    spheres: 4,
    coords: [[0, 0], [1, 0], [1, 1], [2, 1]]
  },
  R: {
    letter: 'R',
    name: 'Line-5',
    colorName: 'Teal',
    color: '#14b8a6',
    colorHex: 0x14b8a6,
    accent: '#5eead4',
    spheres: 5,
    coords: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]
  },
  S: {
    letter: 'S',
    name: 'F-Penta-5',
    colorName: 'Rose',
    color: '#e11d48',
    colorHex: 0xe11d48,
    accent: '#fb7185',
    spheres: 5,
    coords: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]]
  },
  T: {
    letter: 'T',
    name: 'Big-T-5',
    colorName: 'Lavender',
    color: '#6366f1',
    colorHex: 0x6366f1,
    accent: '#a5b4fc',
    spheres: 5,
    coords: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]]
  },
  U: {
    letter: 'U',
    name: 'Crown-6',
    colorName: 'Chartreuse',
    color: '#84cc16',
    colorHex: 0x84cc16,
    accent: '#bef264',
    spheres: 6,
    coords: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]]
  },
  V: {
    letter: 'V',
    name: 'Big-V-6',
    colorName: 'Gold',
    color: '#eab308',
    colorHex: 0xeab308,
    accent: '#fef08a',
    spheres: 6,
    coords: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2]]
  },
  W: {
    letter: 'W',
    name: 'Block-6',
    colorName: 'Grape',
    color: '#7e22ce',
    colorHex: 0x7e22ce,
    accent: '#c084fc',
    spheres: 6,
    coords: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]]
  },
  X: {
    letter: 'X',
    name: 'Stair-6',
    colorName: 'Bronze',
    color: '#d97706',
    colorHex: 0xd97706,
    accent: '#fcd34d',
    spheres: 6,
    coords: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]]
  },
  Y: {
    letter: 'Y',
    name: 'Turquoise Cross-6',
    colorName: 'Turquoise',
    color: '#06b6d4',
    colorHex: 0x06b6d4,
    accent: '#67e8f9',
    spheres: 6,
    coords: [[1, 0], [1, 1], [0, 2], [1, 2], [2, 2], [1, 3]]
  },
  Z: {
    letter: 'Z',
    name: 'Coral Lightning-6',
    colorName: 'Coral',
    color: '#f43f5e',
    colorHex: 0xf43f5e,
    accent: '#fda4af',
    spheres: 6,
    coords: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2], [2, 3]]
  }
};

// Global unified piece registry
const CUSTOM_PIECES = {};

// Coordinate helpers
function normalizeCoords(coords) {
  const minX = Math.min(...coords.map(([x]) => x));
  const minY = Math.min(...coords.map(([, y]) => y));
  const normalized = coords.map(([x, y]) => [x - minX, y - minY]);
  normalized.sort((a, b) => a[1] !== b[1] ? a[1] - b[1] : a[0] - b[0]);
  return normalized;
}

function rotateCoords(coords) {
  // 90 deg clockwise: (x, y) -> (-y, x)
  const rotated = coords.map(([x, y]) => [-y, x]);
  return normalizeCoords(rotated);
}

function flipCoords(coords) {
  // Horizontal flip: (x, y) -> (-x, y)
  const flipped = coords.map(([x, y]) => [-x, y]);
  return normalizeCoords(flipped);
}

function areCoordsEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  }
  return true;
}

function getAllOrientations(baseCoords) {
  const orientations = [];
  let current = normalizeCoords(baseCoords);

  for (let flip = 0; flip < 2; flip++) {
    for (let r = 0; r < 4; r++) {
      const exists = orientations.some(orient => areCoordsEqual(orient, current));
      if (!exists) {
        orientations.push(current);
      }
      current = rotateCoords(current);
    }
    current = flipCoords(current);
  }
  return orientations;
}

// Pre-calculate orientations
Object.values(PIECE_DEFINITIONS).forEach(piece => {
  piece.orientations = getAllOrientations(piece.coords);
});
Object.values(EXTENDED_PIECE_DEFINITIONS).forEach(piece => {
  piece.orientations = getAllOrientations(piece.coords);
});

// Dynamic piece helper
function getPieceDef(letter) {
  return PIECE_DEFINITIONS[letter] || EXTENDED_PIECE_DEFINITIONS[letter] || CUSTOM_PIECES[letter] || null;
}

function registerCustomPiece(pieceDef) {
  const norm = normalizeCoords(pieceDef.coords);
  const color = pieceDef.color || '#38bdf8';
  const colorHex = typeof pieceDef.colorHex === 'number' ? pieceDef.colorHex : parseInt(color.replace('#', '0x'), 16);
  const letter = pieceDef.letter || `C_${Date.now()}`;
  
  const def = {
    letter: letter,
    name: pieceDef.name || 'Custom Shape',
    color: color,
    colorHex: colorHex,
    accent: pieceDef.accent || '#93c5fd',
    spheres: norm.length,
    coords: norm,
    orientations: getAllOrientations(norm),
    isCustom: true
  };
  CUSTOM_PIECES[letter] = def;
  return def;
}

// Three.js 3D Mesh Generation
const SPHERE_RADIUS = 0.96;
const CONNECTOR_RADIUS = 0.58;
const SPHERE_SPACING = 2.0;

function createPieceMesh(letter, coords, options = {}) {
  const def = getPieceDef(letter);
  if (!def) return null;

  const isGhost = !!options.isGhost;
  const ghostValid = options.ghostValid !== false;
  const group = new THREE.Group();
  group.name = `piece_${letter}`;

  let material;
  if (isGhost) {
    material = new THREE.MeshStandardMaterial({
      color: ghostValid ? 0x22c55e : 0xef4444,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
      metalness: 0.1,
      emissive: ghostValid ? 0x15803d : 0xb91c1c,
      emissiveIntensity: 0.5
    });
  } else if (options.isGolden) {
    // Rich gleaming golden metallic material for locked custom starter clues
    material = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.18,
      metalness: 0.82,
      emissive: 0xd97706,
      emissiveIntensity: 0.4
    });
  } else {
    // Highly vibrant glossy candy marble material (mobile-safe)
    material = new THREE.MeshStandardMaterial({
      color: def.colorHex,
      roughness: 0.25,
      metalness: 0.05,
      emissive: def.colorHex,
      emissiveIntensity: 0.12
    });
  }

  const sphereGeo = new THREE.SphereGeometry(SPHERE_RADIUS, 28, 20);

  // Add individual spheres
  coords.forEach(([gx, gy]) => {
    const sphere = new THREE.Mesh(sphereGeo, material);
    sphere.position.set(gx * SPHERE_SPACING, 0, gy * SPHERE_SPACING);
    sphere.castShadow = !isGhost;
    sphere.receiveShadow = !isGhost;
    sphere.userData = { pieceLetter: letter, gridX: gx, gridY: gy };
    group.add(sphere);
  });

  // Add smooth bridge connectors between adjacent spheres
  const coordSet = new Set(coords.map(([x, y]) => `${x},${y}`));
  const addedBridges = new Set();

  coords.forEach(([x, y]) => {
    // Check right neighbor
    if (coordSet.has(`${x + 1},${y}`) && !addedBridges.has(`${x},${y}-${x + 1},${y}`)) {
      addedBridges.add(`${x},${y}-${x + 1},${y}`);
      const bridgeGeo = new THREE.CylinderGeometry(CONNECTOR_RADIUS, CONNECTOR_RADIUS, SPHERE_SPACING, 16);
      const bridge = new THREE.Mesh(bridgeGeo, material);
      bridge.rotation.z = Math.PI / 2;
      bridge.position.set((x + 0.5) * SPHERE_SPACING, 0, y * SPHERE_SPACING);
      bridge.castShadow = !isGhost;
      bridge.receiveShadow = !isGhost;
      group.add(bridge);
    }
    // Check bottom neighbor
    if (coordSet.has(`${x},${y + 1}`) && !addedBridges.has(`${x},${y}-${x},${y + 1}`)) {
      addedBridges.add(`${x},${y}-${x},${y + 1}`);
      const bridgeGeo = new THREE.CylinderGeometry(CONNECTOR_RADIUS, CONNECTOR_RADIUS, SPHERE_SPACING, 16);
      const bridge = new THREE.Mesh(bridgeGeo, material);
      bridge.rotation.x = Math.PI / 2;
      bridge.position.set(x * SPHERE_SPACING, 0, (y + 0.5) * SPHERE_SPACING);
      bridge.castShadow = !isGhost;
      bridge.receiveShadow = !isGhost;
      group.add(bridge);
    }
  });

  group.userData = {
    pieceLetter: letter,
    coords: coords,
    color: def.color
  };

  return group;
}

// Generate SVG thumbnail for UI tray buttons
function generatePieceSVG(letter, coords, size = 64) {
  const def = getPieceDef(letter);
  if (!def) return '';

  const maxX = Math.max(...coords.map(([x]) => x));
  const maxY = Math.max(...coords.map(([, y]) => y));
  const spanX = maxX + 1;
  const spanY = maxY + 1;
  const cell = 14;
  const pad = 10;
  const svgW = spanX * cell + pad * 2;
  const svgH = spanY * cell + pad * 2;
  const r = 5.2;

  let circles = '';
  coords.forEach(([x, y]) => {
    const cx = pad + x * cell + cell / 2;
    const cy = pad + y * cell + cell / 2;
    circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${def.color}" stroke="${def.accent}" stroke-width="1.2" />`;
    circles += `<circle cx="${cx - 1.5}" cy="${cy - 1.5}" r="${r * 0.35}" fill="white" opacity="0.65" />`;
  });

  // Connecting lines between neighbors
  const coordSet = new Set(coords.map(([x, y]) => `${x},${y}`));
  let lines = '';
  coords.forEach(([x, y]) => {
    if (coordSet.has(`${x + 1},${y}`)) {
      const x1 = pad + x * cell + cell / 2;
      const y1 = pad + y * cell + cell / 2;
      const x2 = pad + (x + 1) * cell + cell / 2;
      lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y1}" stroke="${def.color}" stroke-width="${r * 1.5}" stroke-linecap="round"/>`;
    }
    if (coordSet.has(`${x},${y + 1}`)) {
      const x1 = pad + x * cell + cell / 2;
      const y1 = pad + y * cell + cell / 2;
      const y2 = pad + (y + 1) * cell + cell / 2;
      lines += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y2}" stroke="${def.color}" stroke-width="${r * 1.5}" stroke-linecap="round"/>`;
    }
  });

  return `<svg viewBox="0 0 ${svgW} ${svgH}" class="piece-thumbnail-svg" style="max-width: 100%; max-height: 100%;">
    ${lines}
    ${circles}
  </svg>`;
}

window.PIECE_DEFINITIONS = PIECE_DEFINITIONS;
window.EXTENDED_PIECE_DEFINITIONS = EXTENDED_PIECE_DEFINITIONS;
window.CUSTOM_PIECES = CUSTOM_PIECES;
window.getPieceDef = getPieceDef;
window.registerCustomPiece = registerCustomPiece;
window.createPieceMesh = createPieceMesh;
window.generatePieceSVG = generatePieceSVG;
window.normalizeCoords = normalizeCoords;
window.rotateCoords = rotateCoords;
window.flipCoords = flipCoords;
window.areCoordsEqual = areCoordsEqual;
window.getAllOrientations = getAllOrientations;
window.SPHERE_RADIUS = SPHERE_RADIUS;
window.SPHERE_SPACING = SPHERE_SPACING;
