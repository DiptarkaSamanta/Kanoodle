// Kanoodle 12 Official Canonical Pieces & 3D Mesh Factory

const PIECE_DEFINITIONS = {
  A: {
    letter: 'A',
    name: 'Lime L-4',
    color: '#4ade80',
    colorHex: 0x22c55e,
    accent: '#86efac',
    spheres: 4,
    coords: [[0, 1], [0, 0], [1, 0], [2, 0]]
  },
  B: {
    letter: 'B',
    name: 'Cherry P-5',
    color: '#ff1744',
    colorHex: 0xff1744,
    accent: '#ff616f',
    spheres: 5,
    coords: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1]]
  },
  C: {
    letter: 'C',
    name: 'Indigo Long-L',
    color: '#2563eb',
    colorHex: 0x1d4ed8,
    accent: '#60a5fa',
    spheres: 5,
    coords: [[1, 0], [1, 1], [1, 2], [0, 3], [1, 3]]
  },
  D: {
    letter: 'D',
    name: 'Pink Branch-5',
    color: '#ff2d87',
    colorHex: 0xf43f5e,
    accent: '#fda4af',
    spheres: 5,
    coords: [[0, 0], [1, 0], [2, 0], [3, 0], [2, 1]]
  },
  E: {
    letter: 'E',
    name: 'Orange Z-5',
    color: '#ff6b00',
    colorHex: 0xf97316,
    accent: '#fed7aa',
    spheres: 5,
    coords: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1]]
  },
  F: {
    letter: 'F',
    name: 'Cyan Corner-3',
    color: '#00d4ff',
    colorHex: 0x06b6d4,
    accent: '#a5f3fc',
    spheres: 3,
    coords: [[0, 0], [0, 1], [1, 1]]
  },
  G: {
    letter: 'G',
    name: 'Peach V-5',
    color: '#ff5722',
    colorHex: 0xf43f5e,
    accent: '#ff8a65',
    spheres: 5,
    coords: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]
  },
  H: {
    letter: 'H',
    name: 'Violet Stair-5',
    color: '#a855f7',
    colorHex: 0x9333ea,
    accent: '#e9d5ff',
    spheres: 5,
    coords: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]]
  },
  I: {
    letter: 'I',
    name: 'Sunny U-5',
    color: '#fbbf24',
    colorHex: 0xf59e0b,
    accent: '#fef08a',
    spheres: 5,
    coords: [[0, 0], [1, 0], [1, 1], [0, 2], [1, 2]]
  },
  J: {
    letter: 'J',
    name: 'Magenta Line-4',
    color: '#db2777',
    colorHex: 0xbe185d,
    accent: '#fbcfe8',
    spheres: 4,
    coords: [[0, 0], [1, 0], [2, 0], [3, 0]]
  },
  K: {
    letter: 'K',
    name: 'Emerald Square-4',
    color: '#10b981',
    colorHex: 0x059669,
    accent: '#a7f3d0',
    spheres: 4,
    coords: [[0, 0], [1, 0], [0, 1], [1, 1]]
  },
  L: {
    letter: 'L',
    name: 'Amber Cross-5',
    color: '#ea580c',
    colorHex: 0xd97706,
    accent: '#fed7aa',
    spheres: 5,
    coords: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]
  }
};

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

// Pre-calculate all unique orientations
Object.values(PIECE_DEFINITIONS).forEach(piece => {
  piece.orientations = getAllOrientations(piece.coords);
});

// Three.js 3D Mesh Generation
const SPHERE_RADIUS = 0.96;
const CONNECTOR_RADIUS = 0.58;
const SPHERE_SPACING = 2.0;

function createPieceMesh(letter, coords, options = {}) {
  const def = PIECE_DEFINITIONS[letter];
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
  const def = PIECE_DEFINITIONS[letter];
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
window.createPieceMesh = createPieceMesh;
window.generatePieceSVG = generatePieceSVG;
window.normalizeCoords = normalizeCoords;
window.rotateCoords = rotateCoords;
window.flipCoords = flipCoords;
window.areCoordsEqual = areCoordsEqual;
window.SPHERE_RADIUS = SPHERE_RADIUS;
window.SPHERE_SPACING = SPHERE_SPACING;
