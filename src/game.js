// Kanoodle 3D - Main Game Engine & Controller

class KanoodleGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.mode = '2d'; // '2d' or '3d'
    this.currentLevelIndex = 0;
    this.levels = window.KANOODLE_LEVELS || [];
    this.currentLevel = null;

    // Board state
    this.gridW = 11;
    this.gridH = 5;
    this.boardState = []; // 5x11 array of null or pieceLetter
    this.placedPieces = []; // [{ piece, coords, row, col, locked, mesh }]

    // 3D Pyramid state (5 layers)
    this.pyramidActiveLayer = 0; // 0 (base 5x5) to 4 (apex 1x1), or -1 (all)
    this.pyramidPlaced = []; // [{ piece, layer, row, col, coords, mesh }]

    // Interaction state
    this.selectedPiece = null; // { letter, coords, orientationIdx, isLocked }
    this.ghostMesh = null;
    this.hoverPos = null; // { row, col, valid }
    this.isSolving = false;
    this.isViewingSolution = false;

    // Stats
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.movesCount = 0;
    this.hintsCount = 0;

    // Three.js instances
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.boardGroup = new THREE.Group();
    this.piecesGroup = new THREE.Group();

    // Sockets cache for raycasting
    this.socketMeshes = [];

    this.initThree();
    this.initBoard();
    this.initUI();
    this.bindEvents();
    this.loadLevel(0);
    this.startTimer();
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e17);
    // Note: No fog, to prevent washing out colors into a milky haze on mobile GPUs!

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Vibrant true sRGB rendering
    if (THREE.sRGBEncoding) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.container.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 70;
    this.controls.target.set(0, 0, 0);

    // Initial camera positioning optimized for screen ratio
    this.updateCameraForDevice();

    // Studio Lighting - bright, neutral, punchy
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(15, 30, 20);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 5;
    keyLight.shadow.camera.far = 70;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
    fillLight.position.set(-15, 20, -15);
    this.scene.add(fillLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.65, 45);
    pointLight.position.set(0, 16, 2);
    this.scene.add(pointLight);

    // Soft floor shadow receiver
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.scene.add(this.boardGroup);
    this.scene.add(this.piecesGroup);
  }

  updateCameraForDevice() {
    const isMobilePortrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
    if (isMobilePortrait) {
      // In portrait mobile, elevate camera and adjust FOV so 11x5 board fits with side padding
      this.camera.fov = 54;
      this.camera.position.set(0, 36, 24);
      if (this.controls) this.controls.target.set(0, 0, -0.5);
    } else {
      this.camera.fov = 45;
      this.camera.position.set(0, 22, 22);
      if (this.controls) this.controls.target.set(0, 0, 0);
    }
    this.camera.updateProjectionMatrix();
    if (this.controls) this.controls.update();
  }

  setCameraPreset(preset) {
    const isMobile = window.innerWidth < 768;
    if (preset === 'top') {
      this.camera.position.set(0, isMobile ? 38 : 32, 0.1);
      if (this.controls) this.controls.target.set(0, 0, 0);
    } else if (preset === 'front') {
      this.camera.position.set(0, isMobile ? 20 : 16, isMobile ? 32 : 26);
      if (this.controls) this.controls.target.set(0, 0, 0);
    } else {
      // Isometric default
      this.updateCameraForDevice();
    }
    if (this.controls) this.controls.update();
  }

  initBoard() {
    // Clear previous board meshes
    while (this.boardGroup.children.length > 0) {
      this.boardGroup.remove(this.boardGroup.children[0]);
    }
    this.socketMeshes = [];

    if (this.mode === '2d') {
      this.init2DBoard();
    } else if (this.mode === '3d') {
      this.init3DPyramidBoard();
    } else if (this.mode === 'custom' && this.customConfig) {
      this.initCustomBoard(this.customConfig);
    }
  }

  initCustomBoard(config) {
    this.gridW = config.width;
    this.gridH = config.height;
    this.customActiveHoles = new Set(config.activeHoles);
    this.boardState = Array(this.gridH).fill(null).map(() => Array(this.gridW).fill(null));

    // Mark non-drilled positions as solid plastic obstacles (islands, gaps, borders)
    for (let r = 0; r < this.gridH; r++) {
      for (let c = 0; c < this.gridW; c++) {
        if (!this.customActiveHoles.has(`${r},${c}`)) {
          this.boardState[r][c] = 'SOLID';
        }
      }
    }

    const spacing = window.SPHERE_SPACING || 2.0;
    const trayWidth = (this.gridW - 1) * spacing + 3.8;
    const trayHeight = (this.gridH - 1) * spacing + 3.8;
    const trayDepth = 1.4;

    // Outer Tray Case
    const caseGeo = new THREE.BoxGeometry(trayWidth, trayDepth, trayHeight);
    const caseMat = new THREE.MeshPhysicalMaterial({
      color: 0x111827,
      roughness: 0.35,
      metalness: 0.15,
      clearcoat: 0.3
    });
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.position.set(0, -trayDepth / 2, 0);
    caseMesh.receiveShadow = true;
    caseMesh.castShadow = true;
    this.boardGroup.add(caseMesh);

    // Cyan metallic border trim
    const trimGeo = new THREE.BoxGeometry(trayWidth + 0.3, 0.2, trayHeight + 0.3);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.8
    });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.set(0, -trayDepth + 0.1, 0);
    this.boardGroup.add(trimMesh);

    // Create sockets ONLY for active drilled holes
    const socketGeo = new THREE.CylinderGeometry(0.85, 0.72, 0.5, 24);
    const socketMat = new THREE.MeshStandardMaterial({
      color: 0x030712,
      roughness: 0.8,
      metalness: 0.2
    });

    const rimGeo = new THREE.RingGeometry(0.78, 0.92, 24);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
      side: THREE.DoubleSide
    });

    const offsetX = -((this.gridW - 1) * spacing) / 2;
    const offsetZ = -((this.gridH - 1) * spacing) / 2;

    for (let r = 0; r < this.gridH; r++) {
      for (let c = 0; c < this.gridW; c++) {
        if (!this.customActiveHoles.has(`${r},${c}`)) continue;

        const x = offsetX + c * spacing;
        const z = offsetZ + r * spacing;

        const socket = new THREE.Mesh(socketGeo, socketMat);
        socket.position.set(x, -0.22, z);
        socket.receiveShadow = true;
        socket.userData = { isSocket: true, row: r, col: c };
        this.boardGroup.add(socket);
        this.socketMeshes.push(socket);

        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(x, 0.01, z);
        this.boardGroup.add(rim);
      }
    }
  }

  loadCustomBoard(config) {
    this.mode = 'custom';
    this.customConfig = config;

    const btn2D = document.getElementById('mode-2d');
    const btn3D = document.getElementById('mode-3d');
    const btnCustom = document.getElementById('mode-custom');
    if (btn2D) btn2D.classList.remove('active');
    if (btn3D) btn3D.classList.remove('active');
    if (btnCustom) btnCustom.classList.add('active');

    const diffBadge = document.getElementById('difficulty-badge');
    if (diffBadge) {
      diffBadge.className = 'difficulty-badge free';
      diffBadge.textContent = 'Custom';
      diffBadge.style.display = 'inline-block';
    }

    this.clearBoard(false);
    this.deselectPiece();
    this.initBoard();

    // Place any locked challenge starter pieces
    if (config.fixedPieces && config.fixedPieces.length > 0) {
      config.fixedPieces.forEach((p, idx) => {
        this.placePiece(p.piece, p.coords, p.row, p.col, true, p.instanceId || `${p.piece}_fixed_${idx}`);
      });
    }

    // Rebuild dock for custom inventory
    this.renderCustomDockUI();

    this.movesCount = 0;
    this.hintsCount = 0;
    this.timerSeconds = 0;
    this.updateStats();

    this.showToast(`Custom Board: "${config.title || 'Player Board'}" (${config.totalHoles} Sockets) Loaded! 🎨`);
  }

  renderCustomDockUI() {
    const rack = document.getElementById('pieces-rack');
    if (!rack || !this.customConfig) return;
    rack.innerHTML = '';

    const inv = this.customConfig.inventory || [];
    inv.forEach(inst => {
      const def = window.getPieceDef ? window.getPieceDef(inst.letter) : window.PIECE_DEFINITIONS[inst.letter];
      if (!def) return;

      const card = document.createElement('div');
      card.className = 'piece-card';
      card.id = `piece-card-${inst.instanceId}`;
      card.setAttribute('data-instance', inst.instanceId);
      card.setAttribute('data-letter', inst.letter);

      const top = document.createElement('div');
      top.className = 'card-top';

      const letterBadge = document.createElement('div');
      letterBadge.className = 'card-letter';
      letterBadge.style.backgroundColor = def.color;
      letterBadge.textContent = inst.letter.startsWith('U_') ? '★' : inst.letter;

      const status = document.createElement('div');
      status.className = 'card-status';
      status.textContent = `#${inst.index + 1} (${def.spheres}b)`;

      top.appendChild(letterBadge);
      top.appendChild(status);

      const thumb = document.createElement('div');
      thumb.className = 'card-thumb';
      thumb.innerHTML = window.generatePieceSVG(def.letter, def.coords);

      card.appendChild(top);
      card.appendChild(thumb);

      card.addEventListener('click', () => {
        this.selectPiece(inst.instanceId, inst.letter);
      });

      rack.appendChild(card);
    });
  }

  init2DBoard() {
    this.gridW = 11;
    this.gridH = 5;
    this.boardState = Array(5).fill(null).map(() => Array(11).fill(null));

    const spacing = window.SPHERE_SPACING || 2.0;
    const trayWidth = (this.gridW - 1) * spacing + 3.8;
    const trayHeight = (this.gridH - 1) * spacing + 3.8;
    const trayDepth = 1.4;

    // Outer Tray Case (Dark slate plastic with rounded bevel)
    const caseGeo = new THREE.BoxGeometry(trayWidth, trayDepth, trayHeight);
    const caseMat = new THREE.MeshPhysicalMaterial({
      color: 0x171e2e,
      roughness: 0.35,
      metalness: 0.15,
      clearcoat: 0.3
    });
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.position.set(0, -trayDepth / 2, 0);
    caseMesh.receiveShadow = true;
    caseMesh.castShadow = true;
    this.boardGroup.add(caseMesh);

    // Outer metallic border trim
    const trimGeo = new THREE.BoxGeometry(trayWidth + 0.3, 0.2, trayHeight + 0.3);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.2,
      metalness: 0.8
    });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.set(0, -trayDepth + 0.1, 0);
    this.boardGroup.add(trimMesh);

    // Create 55 socket holes (11 columns x 5 rows)
    const socketGeo = new THREE.CylinderGeometry(0.85, 0.72, 0.5, 24);
    const socketMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f19,
      roughness: 0.8,
      metalness: 0.2
    });

    const rimGeo = new THREE.RingGeometry(0.78, 0.92, 24);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide
    });

    const offsetX = -((this.gridW - 1) * spacing) / 2;
    const offsetZ = -((this.gridH - 1) * spacing) / 2;

    for (let r = 0; r < this.gridH; r++) {
      for (let c = 0; c < this.gridW; c++) {
        const x = offsetX + c * spacing;
        const z = offsetZ + r * spacing;

        const socket = new THREE.Mesh(socketGeo, socketMat);
        socket.position.set(x, -0.22, z);
        socket.receiveShadow = true;
        socket.userData = { isSocket: true, row: r, col: c };
        this.boardGroup.add(socket);
        this.socketMeshes.push(socket);

        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(x, 0.01, z);
        this.boardGroup.add(rim);
      }
    }
  }

  init3DPyramidBoard() {
    // 5-Tier Pyramid Base (5x5 = 25 holes)
    const spacing = window.SPHERE_SPACING || 2.0;
    const baseW = 4 * spacing + 4.2;
    const caseGeo = new THREE.BoxGeometry(baseW, 1.4, baseW);
    const caseMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e1b4b,
      roughness: 0.3,
      metalness: 0.2,
      clearcoat: 0.4
    });
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.position.set(0, -0.7, 0);
    caseMesh.receiveShadow = true;
    caseMesh.castShadow = true;
    this.boardGroup.add(caseMesh);

    // Pyramid tiers guide rings
    const socketGeo = new THREE.CylinderGeometry(0.85, 0.72, 0.5, 24);
    const socketMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.8,
      metalness: 0.2
    });

    const layerOffsetZ = (5 - 1) * spacing * 0.5;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const x = (c - 2) * spacing;
        const z = (r - 2) * spacing;

        const socket = new THREE.Mesh(socketGeo, socketMat);
        socket.position.set(x, -0.22, z);
        socket.userData = { isSocket: true, layer: 0, row: r, col: c };
        this.boardGroup.add(socket);
        this.socketMeshes.push(socket);

        // Rim
        const rimGeo = new THREE.RingGeometry(0.78, 0.92, 24);
        const rimMat = new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0x7e22ce,
          emissiveIntensity: 0.2,
          side: THREE.DoubleSide
        });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(x, 0.01, z);
        this.boardGroup.add(rim);
      }
    }
  }

  // Clear all pieces from board
  clearBoard(keepLocked = false) {
    const toRemove = keepLocked 
      ? this.placedPieces.filter(p => !p.locked)
      : [...this.placedPieces];

    toRemove.forEach(p => {
      this.piecesGroup.remove(p.mesh);
      for (const [dx, dy] of p.coords) {
        if (this.boardState[p.row + dy]) {
          this.boardState[p.row + dy][p.col + dx] = null;
        }
      }
    });

    this.placedPieces = keepLocked 
      ? this.placedPieces.filter(p => p.locked)
      : [];

    this.updateDockUI();
    this.updateStats();
  }

  // Load a curated level
  loadLevel(index) {
    if (index < 0 || index >= this.levels.length) index = 0;
    this.currentLevelIndex = index;
    this.currentLevel = this.levels[index];
    this.isViewingSolution = false;

    if (this.mode !== '2d') {
      this.mode = '2d';
      const btn2D = document.getElementById('mode-2d');
      const btn3D = document.getElementById('mode-3d');
      const btnCustom = document.getElementById('mode-custom');
      if (btnCustom) btnCustom.classList.remove('active');
      if (btn3D) btn3D.classList.remove('active');
      if (btn2D) btn2D.classList.add('active');
      this.initBoard();
      this.initUI();
    }

    // Reset board
    this.clearBoard(false);
    this.deselectPiece();

    // Place starting challenge pieces (locked)
    if (this.currentLevel && this.currentLevel.placed) {
      this.currentLevel.placed.forEach(p => {
        this.placePiece(p.piece, p.coords, p.row, p.col, true);
      });
    }

    // Reset stats
    this.movesCount = 0;
    this.hintsCount = 0;
    this.timerSeconds = 0;

    // Update UI elements
    const levelSelect = document.getElementById('level-select');
    if (levelSelect) levelSelect.value = index;

    const diffBadge = document.getElementById('difficulty-badge');
    if (diffBadge) {
      const diff = this.currentLevel.difficulty || 'Starter';
      diffBadge.className = `difficulty-badge ${diff.toLowerCase()}`;
      diffBadge.textContent = diff;
    }

    const prevBtn = document.getElementById('btn-prev-level');
    const nextBtn = document.getElementById('btn-next-level');
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === this.levels.length - 1;

    this.updateDockUI();
    this.updateStats();
    this.showToast(`Loaded ${this.currentLevel.title}! 🎯`);
  }

  // Place a piece onto board
  placePiece(letter, coords, row, col, locked = false, instanceId = null, isGolden = false) {
    const def = window.getPieceDef ? window.getPieceDef(letter) : window.PIECE_DEFINITIONS[letter];
    if (!def) return false;

    // Check bounds & occupancy (in custom mode, non-holes are marked 'SOLID' and are not null)
    for (const [dx, dy] of coords) {
      const r = row + dy;
      const c = col + dx;
      if (r < 0 || r >= this.gridH || c < 0 || c >= this.gridW) return false;
      if (this.boardState[r][c] !== null) return false;
    }

    // Determine instance ID
    let instId = instanceId;
    if (!instId) {
      if (this.mode === 'custom' && this.customConfig) {
        const placedIds = new Set(this.placedPieces.map(p => p.instanceId));
        const free = this.customConfig.inventory.find(i => i.letter === letter && !placedIds.has(i.instanceId));
        instId = free ? free.instanceId : `${letter}_${Date.now()}`;
      } else {
        instId = letter;
      }
    }

    // Mark board grid cells
    for (const [dx, dy] of coords) {
      this.boardState[row + dy][col + dx] = letter;
    }

    // Create 3D Mesh (Golden metallic for locked custom starter pieces!)
    const isGold = isGolden || (locked && this.mode === 'custom');
    const mesh = window.createPieceMesh(letter, coords, { isGhost: false, isGolden: isGold });
    const spacing = window.SPHERE_SPACING || 2.0;
    const offsetX = -((this.gridW - 1) * spacing) / 2;
    const offsetZ = -((this.gridH - 1) * spacing) / 2;

    mesh.position.set(offsetX + col * spacing, 0.9, offsetZ + row * spacing);
    this.piecesGroup.add(mesh);

    const pieceRecord = {
      piece: letter,
      instanceId: instId,
      coords: coords,
      row: row,
      col: col,
      locked: locked,
      mesh: mesh
    };

    this.placedPieces.push(pieceRecord);
    this.movesCount++;
    this.updateDockUI();
    this.updateStats();

    // Check win condition
    const totalExpectedHoles = this.mode === 'custom'
      ? (this.customConfig ? this.customConfig.totalHoles : this.socketMeshes.length)
      : 55;
    const filledSpheres = this.placedPieces.reduce((acc, p) => acc + p.coords.length, 0);

    if (filledSpheres === totalExpectedHoles && !this.isViewingSolution) {
      setTimeout(() => {
        if (!this.isViewingSolution) this.celebrateVictory();
      }, 300);
    }

    return true;
  }

  // Remove a placed piece
  removePiece(pieceRecord) {
    if (pieceRecord.locked) {
      this.showToast("This piece is part of the challenge starter! 🔒");
      if (window.soundEngine) window.soundEngine.playError();
      return false;
    }

    this.isViewingSolution = false;

    // Unmark board state
    for (const [dx, dy] of pieceRecord.coords) {
      this.boardState[pieceRecord.row + dy][pieceRecord.col + dx] = null;
    }

    this.piecesGroup.remove(pieceRecord.mesh);
    this.placedPieces = this.placedPieces.filter(p => p !== pieceRecord);

    if (window.soundEngine) window.soundEngine.playPickup();
    this.updateDockUI();
    this.updateStats();
    return true;
  }

  // Select a piece from tray
  selectPiece(instanceIdOrLetter, letter = null) {
    let actualLetter = letter || instanceIdOrLetter;
    let instanceId = instanceIdOrLetter;

    if (this.mode === 'custom') {
      const already = this.placedPieces.find(p => p.instanceId === instanceId);
      if (already) {
        this.removePiece(already);
      }
    } else {
      actualLetter = instanceIdOrLetter;
      instanceId = actualLetter;
      const already = this.placedPieces.find(p => p.piece === actualLetter);
      if (already) {
        if (already.locked) {
          this.showToast("Piece is locked in challenge! 🔒");
          return;
        }
        this.removePiece(already);
      }
    }

    const def = window.getPieceDef ? window.getPieceDef(actualLetter) : window.PIECE_DEFINITIONS[actualLetter];
    if (!def) return;

    this.selectedPiece = {
      letter: actualLetter,
      instanceId: instanceId,
      coords: [...def.coords],
      orientationIdx: 0,
      orientations: def.orientations
    };

    if (window.soundEngine) window.soundEngine.playPickup();
    this.updateGhostMesh();
    this.updateSelectedHUD();
    this.updateDockUI();
    this.container.classList.add('placing-mode');
  }

  deselectPiece() {
    this.selectedPiece = null;
    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh);
      this.ghostMesh = null;
    }
    this.hoverPos = null;
    this.container.classList.remove('placing-mode');
    this.updateSelectedHUD();
    this.updateDockUI();
  }

  // Rotate selected piece
  rotateSelected() {
    if (!this.selectedPiece) return;
    this.selectedPiece.coords = window.rotateCoords(this.selectedPiece.coords);
    if (window.soundEngine) window.soundEngine.playRotate();
    this.updateGhostMesh();
    this.updateSelectedHUD();
  }

  // Flip selected piece
  flipSelected() {
    if (!this.selectedPiece) return;
    this.selectedPiece.coords = window.flipCoords(this.selectedPiece.coords);
    if (window.soundEngine) window.soundEngine.playRotate();
    this.updateGhostMesh();
    this.updateSelectedHUD();
  }

  // Updates ghost mesh following cursor
  updateGhostMesh() {
    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh);
      this.ghostMesh = null;
    }

    if (!this.selectedPiece) return;

    const isValid = this.hoverPos ? this.hoverPos.valid : true;
    this.ghostMesh = window.createPieceMesh(this.selectedPiece.letter, this.selectedPiece.coords, {
      isGhost: true,
      ghostValid: isValid
    });

    this.scene.add(this.ghostMesh);

    if (this.hoverPos) {
      const spacing = window.SPHERE_SPACING || 2.0;
      const offsetX = -((this.gridW - 1) * spacing) / 2;
      const offsetZ = -((this.gridH - 1) * spacing) / 2;
      this.ghostMesh.position.set(
        offsetX + this.hoverPos.col * spacing,
        1.1,
        offsetZ + this.hoverPos.row * spacing
      );
    } else {
      this.ghostMesh.position.set(0, 5, 0);
    }
  }

  // Smart Hint: Solves remaining pieces and places 1 piece correctly
  giveHint() {
    if (this.isSolving) return;
    if (this.placedPieces.length >= 12) {
      this.showToast("All pieces already placed! 🎉");
      return;
    }

    if (this.mode === 'custom') {
      if (!this.customConfig) return;
      const totalPieces = (this.customConfig.inventory || []).length;
      if (this.placedPieces.length >= totalPieces) {
        this.showToast("All pieces already placed! 🎉");
        return;
      }

      const activeHolesArr = Array.from(this.customActiveHoles || []).map(s => s.split(',').map(Number));
      const customContext = {
        width: this.gridW,
        height: this.gridH,
        activeHoles: activeHolesArr,
        inventory: this.customConfig.rawInventory || {},
        placed: this.placedPieces.map(p => ({
          instanceId: p.instanceId || `${p.piece}_0`,
          piece: p.piece,
          coords: p.coords,
          row: p.row,
          col: p.col
        }))
      };

      const nextPiece = window.kanoodleSolver.getCustomHint(customContext);
      if (!nextPiece) {
        this.showToast("No solution possible with current pieces! Try removing one ⚠️");
        if (window.soundEngine) window.soundEngine.playError();
        return;
      }

      this.deselectPiece();
      this.placePiece(nextPiece.piece, nextPiece.coords, nextPiece.row, nextPiece.col, false, nextPiece.instanceId);
      this.hintsCount++;
      this.updateStats();

      if (window.soundEngine) window.soundEngine.playHint();
      this.showToast(`Placed piece ${nextPiece.piece} as hint! 💡`);
      return;
    }

    const currentPlacements = this.placedPieces.map(p => ({
      piece: p.piece,
      coords: p.coords,
      row: p.row,
      col: p.col
    }));

    const nextPiece = window.kanoodleSolver.getHint(currentPlacements);
    if (!nextPiece) {
      this.showToast("No solution possible with current pieces! Try removing one ⚠️");
      if (window.soundEngine) window.soundEngine.playError();
      return;
    }

    this.deselectPiece();
    this.placePiece(nextPiece.piece, nextPiece.coords, nextPiece.row, nextPiece.col, false);
    this.hintsCount++;
    this.updateStats();

    if (window.soundEngine) window.soundEngine.playHint();
    this.showToast(`Placed piece ${nextPiece.piece} as hint! 💡`);
  }

  // Auto-Solve: Watches the solver solve the board step by step
  async autoSolve() {
    if (this.isSolving) return;
    this.isSolving = true;
    this.deselectPiece();

    if (this.mode === 'custom') {
      if (!this.customConfig) {
        this.isSolving = false;
        return;
      }
      const activeHolesArr = Array.from(this.customActiveHoles || []).map(s => s.split(',').map(Number));
      const customContext = {
        width: this.gridW,
        height: this.gridH,
        activeHoles: activeHolesArr,
        inventory: this.customConfig.rawInventory || {},
        placed: this.placedPieces.map(p => ({
          instanceId: p.instanceId || `${p.piece}_0`,
          piece: p.piece,
          coords: p.coords,
          row: p.row,
          col: p.col
        }))
      };

      let fullSolution = window.kanoodleSolver.solveCustom(customContext, 1);
      if (!fullSolution && this.customConfig.solution) {
        // Conflicting pieces placed by player; reset to apply verified solution while preserving locked starter clues!
        const hasLocked = this.placedPieces.some(p => p.locked);
        this.clearBoard(hasLocked);
        fullSolution = this.customConfig.solution;
        this.showToast("Clearing conflicting moves to place guaranteed solution... ⚡");
      }

      if (!fullSolution) {
        this.showToast("Custom board layout is unsolvable! Remove conflicting pieces first.");
        if (window.soundEngine) window.soundEngine.playError();
        this.isSolving = false;
        return;
      }

      this.showToast("Auto-solving custom puzzle... ⚡");

      const placedIds = new Set(this.placedPieces.map(p => p.instanceId));
      const missing = fullSolution.filter(p => !placedIds.has(p.instanceId));

      for (const p of missing) {
        await new Promise(res => setTimeout(res, 220));
        this.placePiece(p.piece, p.coords, p.row, p.col, false, p.instanceId);
        if (window.soundEngine) window.soundEngine.playClack();
      }

      this.isSolving = false;
      return;
    }

    const currentPlacements = this.placedPieces.map(p => ({
      piece: p.piece,
      coords: p.coords,
      row: p.row,
      col: p.col
    }));

    const fullSolution = window.kanoodleSolver.solve(currentPlacements, 1);
    if (!fullSolution) {
      this.showToast("Board layout is unsolvable! Remove conflicting pieces first.");
      if (window.soundEngine) window.soundEngine.playError();
      this.isSolving = false;
      return;
    }

    this.showToast("Auto-solving puzzle... ⚡");

    const placedLetters = new Set(this.placedPieces.map(p => p.piece));
    const missing = fullSolution.filter(p => !placedLetters.has(p.piece));

    for (const p of missing) {
      await new Promise(res => setTimeout(res, 220));
      this.placePiece(p.piece, p.coords, p.row, p.col, false);
      if (window.soundEngine) window.soundEngine.playClack();
    }

    this.isSolving = false;
  }

  // Check if current board is solvable
  validateBoard() {
    if (this.mode === 'custom') {
      if (!this.customConfig) return;
      const activeHolesArr = Array.from(this.customActiveHoles || []).map(s => s.split(',').map(Number));
      const customContext = {
        width: this.gridW,
        height: this.gridH,
        activeHoles: activeHolesArr,
        inventory: this.customConfig.rawInventory || {},
        placed: this.placedPieces.map(p => ({
          instanceId: p.instanceId || `${p.piece}_0`,
          piece: p.piece,
          coords: p.coords,
          row: p.row,
          col: p.col
        }))
      };

      const solvable = window.kanoodleSolver.isCustomSolvable(customContext);
      if (solvable) {
        this.showToast("Custom board is solvable! You are on the right track! 🌟");
        if (window.soundEngine) window.soundEngine.playHint();
      } else {
        this.showToast("Current layout cannot be solved without moving pieces. ⚠️");
        if (window.soundEngine) window.soundEngine.playError();
      }
      return;
    }

    const currentPlacements = this.placedPieces.map(p => ({
      piece: p.piece,
      coords: p.coords,
      row: p.row,
      col: p.col
    }));

    const solvable = window.kanoodleSolver.isValid(currentPlacements);
    if (solvable) {
      this.showToast("Board is solvable! You are on the right track! 🌟");
      if (window.soundEngine) window.soundEngine.playHint();
    } else {
      this.showToast("Current layout cannot be solved without moving pieces. ⚠️");
      if (window.soundEngine) window.soundEngine.playError();
    }
  }

  // Random puzzle challenge
  generateRandomPuzzle() {
    const diff = document.getElementById('difficulty-badge') 
      ? document.getElementById('difficulty-badge').textContent 
      : 'Starter';

    let missing = 3;
    if (diff === 'Junior') missing = 5;
    else if (diff === 'Expert') missing = 7;
    else if (diff === 'Master') missing = 9;
    else if (diff === 'Genius') missing = 10;

    const puzzle = window.kanoodleSolver.generateRandomPuzzle(missing);
    if (!puzzle) {
      this.showToast("Could not generate puzzle, try again!");
      return;
    }

    this.clearBoard(false);
    this.deselectPiece();

    puzzle.placed.forEach(p => {
      this.placePiece(p.piece, p.coords, p.row, p.col, true);
    });

    this.movesCount = 0;
    this.hintsCount = 0;
    this.timerSeconds = 0;
    this.updateDockUI();
    this.updateStats();
    this.showToast(`Generated fresh ${puzzle.title}! 🎲`);
  }

  // Timer
  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.updateStats();
    }, 1000);
  }

  formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  updateStats() {
    const timerEl = document.getElementById('stat-timer');
    if (timerEl) timerEl.textContent = this.formatTime(this.timerSeconds);

    const piecesEl = document.getElementById('stat-pieces');
    if (piecesEl) {
      const totalPieces = this.mode === 'custom' && this.customConfig
        ? (this.customConfig.inventory || []).length
        : 12;
      piecesEl.textContent = `${this.placedPieces.length}/${totalPieces}`;
    }

    const hintsEl = document.getElementById('stat-hints');
    if (hintsEl) hintsEl.textContent = this.hintsCount;
  }

  // UI Dock Rack
  initUI() {
    const rack = document.getElementById('pieces-rack');
    if (!rack) return;
    rack.innerHTML = '';

    Object.values(window.PIECE_DEFINITIONS).forEach(def => {
      const card = document.createElement('div');
      card.className = 'piece-card';
      card.id = `piece-card-${def.letter}`;
      card.setAttribute('data-letter', def.letter);

      const top = document.createElement('div');
      top.className = 'card-top';

      const letterBadge = document.createElement('div');
      letterBadge.className = 'card-letter';
      letterBadge.style.backgroundColor = def.color;
      letterBadge.textContent = def.letter;

      const status = document.createElement('div');
      status.className = 'card-status';
      status.textContent = `${def.spheres} beads`;

      top.appendChild(letterBadge);
      top.appendChild(status);

      const thumb = document.createElement('div');
      thumb.className = 'card-thumb';
      thumb.innerHTML = window.generatePieceSVG(def.letter, def.coords);

      card.appendChild(top);
      card.appendChild(thumb);

      card.addEventListener('click', () => {
        this.selectPiece(def.letter);
      });

      rack.appendChild(card);
    });

    // Populate level select
    const levelSelect = document.getElementById('level-select');
    if (levelSelect) {
      levelSelect.innerHTML = '';
      this.levels.forEach((lvl, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${lvl.title} (${12 - lvl.givenCount} to solve)`;
        levelSelect.appendChild(opt);
      });
      levelSelect.addEventListener('change', (e) => {
        this.loadLevel(parseInt(e.target.value));
      });
    }
  }

  updateDockUI() {
    if (this.mode === 'custom' && this.customConfig) {
      const placedIds = new Set(this.placedPieces.map(p => p.instanceId));
      (this.customConfig.inventory || []).forEach(inst => {
        const card = document.getElementById(`piece-card-${inst.instanceId}`);
        if (!card) return;

        const isPlaced = placedIds.has(inst.instanceId);
        const isSelected = this.selectedPiece && this.selectedPiece.instanceId === inst.instanceId;

        card.classList.toggle('placed', isPlaced);
        card.classList.toggle('selected', isSelected);

        const status = card.querySelector('.card-status');
        if (status) {
          if (isPlaced) {
            const rec = this.placedPieces.find(p => p.instanceId === inst.instanceId);
            status.textContent = rec && rec.locked ? 'Locked 🔒' : 'Placed ✓';
          } else {
            const def = window.getPieceDef ? window.getPieceDef(inst.letter) : window.PIECE_DEFINITIONS[inst.letter];
            status.textContent = `#${inst.index + 1} (${def ? def.spheres : 0}b)`;
          }
        }
      });
      return;
    }

    const placedSet = new Set(this.placedPieces.map(p => p.piece));
    Object.keys(window.PIECE_DEFINITIONS).forEach(letter => {
      const card = document.getElementById(`piece-card-${letter}`);
      if (!card) return;

      const isPlaced = placedSet.has(letter);
      const isSelected = this.selectedPiece && this.selectedPiece.letter === letter;

      card.classList.toggle('placed', isPlaced);
      card.classList.toggle('selected', isSelected);

      const status = card.querySelector('.card-status');
      if (status) {
        if (isPlaced) {
          const rec = this.placedPieces.find(p => p.piece === letter);
          status.textContent = rec && rec.locked ? 'Locked 🔒' : 'Placed ✓';
        } else {
          const def = window.PIECE_DEFINITIONS[letter];
          status.textContent = `${def.spheres} beads`;
        }
      }
    });
  }

  updateSelectedHUD() {
    const hud = document.getElementById('active-piece-hud');
    if (!hud) return;

    if (!this.selectedPiece) {
      hud.classList.add('hidden');
      return;
    }

    hud.classList.remove('hidden');
    const def = window.PIECE_DEFINITIONS[this.selectedPiece.letter];
    const preview = document.getElementById('hud-preview');
    if (preview) {
      preview.innerHTML = window.generatePieceSVG(this.selectedPiece.letter, this.selectedPiece.coords, 48);
    }
    const title = document.getElementById('hud-title');
    if (title) {
      title.innerHTML = `Piece ${this.selectedPiece.letter} <span style="font-size:12px;color:${def.color}">●</span>`;
    }
  }

  celebrateVictory() {
    if (window.soundEngine) window.soundEngine.playVictory();

    // Trigger confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.4 }
        });
      }, 350);
    }

    const modal = document.getElementById('victory-modal');
    if (modal) {
      modal.classList.add('show');
      const timeEl = document.getElementById('modal-time');
      if (timeEl) timeEl.textContent = this.formatTime(this.timerSeconds);

      const movesEl = document.getElementById('modal-moves');
      if (movesEl) movesEl.textContent = this.movesCount;

      const spheresEl = document.getElementById('modal-spheres');
      if (spheresEl) {
        spheresEl.textContent = this.mode === 'custom' && this.customConfig
          ? this.customConfig.totalHoles
          : 55;
      }

      const starsEl = document.getElementById('modal-stars');
      if (starsEl) {
        const starCount = this.hintsCount === 0 ? 3 : this.hintsCount === 1 ? 2 : 1;
        starsEl.innerHTML = '★'.repeat(starCount) + '<span class="star empty">' + '★'.repeat(3 - starCount) + '</span>';
      }

      const nextBtn = document.getElementById('modal-btn-next');
      if (nextBtn) {
        nextBtn.textContent = this.mode === 'custom' ? 'Custom Studio 🎨' : 'Next Level ▶';
      }
    }
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // Smart placement when tapping a hole: tries exact anchor or centered on tapped hole
  tryPlaceAtHole(targetRow, targetCol) {
    if (!this.selectedPiece) return false;

    // 1. Try default anchor (row, col)
    if (this.canFitPiece(this.selectedPiece.coords, targetRow, targetCol)) {
      this.placePiece(this.selectedPiece.letter, this.selectedPiece.coords, targetRow, targetCol, false);
      if (window.soundEngine) window.soundEngine.playClack();
      if (navigator.vibrate) navigator.vibrate(25);
      this.deselectPiece();
      return true;
    }

    // 2. Try aligning each individual sphere of the piece with the clicked hole
    for (const [dx, dy] of this.selectedPiece.coords) {
      const candidateRow = targetRow - dy;
      const candidateCol = targetCol - dx;
      if (this.canFitPiece(this.selectedPiece.coords, candidateRow, candidateCol)) {
        this.placePiece(this.selectedPiece.letter, this.selectedPiece.coords, candidateRow, candidateCol, false);
        if (window.soundEngine) window.soundEngine.playClack();
        if (navigator.vibrate) navigator.vibrate(25);
        this.deselectPiece();
        return true;
      }
    }

    // Failed to fit at or around this hole
    if (window.soundEngine) window.soundEngine.playError();
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    this.showToast("Piece doesn't fit in this hole! Try rotating ↻");
    return false;
  }

  canFitPiece(coords, row, col) {
    for (const [dx, dy] of coords) {
      const r = row + dy;
      const c = col + dx;
      if (r < 0 || r >= this.gridH || c < 0 || c >= this.gridW) return false;
      if (this.boardState[r][c] !== null) return false;
    }
    return true;
  }

  replayCurrentLevel() {
    this.isViewingSolution = false;
    this.deselectPiece();
    const modal = document.getElementById('victory-modal');
    if (modal) modal.classList.remove('show');

    if (this.mode === 'custom' && this.customConfig) {
      this.loadCustomBoard(this.customConfig);
    } else {
      this.loadLevel(this.currentLevelIndex);
    }
  }

  playNextStage() {
    this.isViewingSolution = false;
    this.deselectPiece();
    const modal = document.getElementById('victory-modal');
    if (modal) modal.classList.remove('show');

    if (this.mode === 'custom') {
      this.mode = '2d';
      const btn2D = document.getElementById('mode-2d');
      const btnCustom = document.getElementById('mode-custom');
      if (btnCustom) btnCustom.classList.remove('active');
      if (btn2D) btn2D.classList.add('active');
      this.loadLevel(this.currentLevelIndex + 1);
      this.showToast(`Advancing to Stage ${this.currentLevelIndex + 1}: ${this.levels[this.currentLevelIndex].title}! 🎯`);
    } else {
      const nextIdx = (this.currentLevelIndex + 1) % this.levels.length;
      this.loadLevel(nextIdx);
      this.showToast(`Advancing to Stage ${nextIdx + 1}: ${this.levels[nextIdx].title}! 🎯`);
    }
  }

  applyFullSolution() {
    this.isViewingSolution = true;
    this.deselectPiece();
    const modal = document.getElementById('victory-modal');
    if (modal) modal.classList.remove('show');

    // Pause timer so player has unlimited uninterrupted time to inspect the solution
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.mode === 'custom' && this.customConfig) {
      const sol = this.customConfig.solution;
      if (sol && sol.length > 0) {
        const fixedPieces = this.customConfig.fixedPieces || [];
        this.clearBoard(false);

        // Re-place fixed clues as locked (golden)
        fixedPieces.forEach((p, idx) => {
          this.placePiece(p.piece, p.coords, p.row, p.col, true, p.instanceId || `${p.piece}_fixed_${idx}`);
        });

        // Place all other solution pieces as UNLOCKED so player can pick them up and play again!
        sol.forEach((p, idx) => {
          const isFixed = fixedPieces.some(fp => 
            fp.piece === p.piece && fp.row === p.row && fp.col === p.col
          );
          if (!isFixed) {
            this.placePiece(p.piece, p.coords, p.row, p.col, false, p.instanceId || `${p.piece}_sol_${idx}`);
          }
        });

        this.updateDockUI();
        this.updateStats();
        this.showToast("👁️ Solution displayed! Unlimited time to study. Pick up any piece or click 'Play Next Stage'.");
        if (window.soundEngine) window.soundEngine.playHint();
        return;
      }
    }

    // Standard 2D level
    if (this.currentLevel) {
      const startingClues = (this.currentLevel.placed || []).map(p => ({
        piece: p.piece,
        coords: p.coords,
        row: p.row,
        col: p.col
      }));
      const sol = window.kanoodleSolver ? window.kanoodleSolver.solve(startingClues, 1) : null;
      if (sol && sol.length > 0) {
        this.clearBoard(false);
        if (this.currentLevel.placed) {
          this.currentLevel.placed.forEach(p => {
            this.placePiece(p.piece, p.coords, p.row, p.col, true);
          });
        }
        const placedLetters = new Set(this.placedPieces.map(p => p.piece));
        sol.forEach(p => {
          if (!placedLetters.has(p.piece)) {
            this.placePiece(p.piece, p.coords, p.row, p.col, false);
          }
        });
        this.updateDockUI();
        this.updateStats();
        this.showToast("👁️ Solution displayed! Unlimited time to study. Pick up any piece or click 'Play Next Stage'.");
        if (window.soundEngine) window.soundEngine.playHint();
        return;
      }
    }

    this.showToast("No verified solution found for this board.");
  }

  bindEvents() {
    // Window Resize & Orientation Change
    const handleResize = () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.updateCameraForDevice();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 150));

    // Pointer / Touch state
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouchDragging = false;

    const updateRaycastFromClient = (clientX, clientY) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      if (!this.selectedPiece) return;

      const intersects = this.raycaster.intersectObjects(this.socketMeshes);
      if (intersects.length > 0) {
        const socket = intersects[0].object;
        const row = socket.userData.row;
        const col = socket.userData.col;
        const valid = this.canFitPiece(this.selectedPiece.coords, row, col);
        this.hoverPos = { row, col, valid };
      } else {
        this.hoverPos = null;
      }
      this.updateGhostMesh();
    };

    // Mouse Move (Desktop)
    this.container.addEventListener('mousemove', (e) => {
      updateRaycastFromClient(e.clientX, e.clientY);
    });

    // Touch Start (Mobile Drag / Pick)
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        updateRaycastFromClient(touch.clientX, touch.clientY);

        if (this.selectedPiece) {
          isTouchDragging = true;
          this.controls.enabled = false; // Lock camera orbit while dragging piece
        } else {
          // Check if touching an existing placed piece
          const intersects = this.raycaster.intersectObjects(this.piecesGroup.children, true);
          if (intersects.length > 0) {
            let topGroup = intersects[0].object;
            while (topGroup && topGroup.parent && topGroup.parent !== this.piecesGroup) {
              topGroup = topGroup.parent;
            }
            if (topGroup && topGroup.userData && topGroup.userData.pieceLetter) {
              const letter = topGroup.userData.pieceLetter;
              const rec = this.placedPieces.find(p => p.piece === letter);
              if (rec && !rec.locked) {
                this.removePiece(rec);
                this.selectPiece(letter);
                isTouchDragging = true;
                this.controls.enabled = false;
                if (navigator.vibrate) navigator.vibrate(15);
              }
            }
          }
        }
      } else if (e.touches.length >= 2) {
        // Multi-touch: allow pinch zoom / two-finger rotate
        this.controls.enabled = true;
        isTouchDragging = false;
      }
    }, { passive: false });

    // Touch Move (Drag piece over holes)
    this.container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.selectedPiece) {
        e.preventDefault(); // Prevent page pull-down refresh while dragging
        const touch = e.touches[0];
        updateRaycastFromClient(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    // Touch End (Snap & Drop or Tap Hole)
    this.container.addEventListener('touchend', (e) => {
      this.controls.enabled = true;

      const touch = e.changedTouches[0];
      const dist = Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY);

      if (this.selectedPiece) {
        // If dragged into a valid hole
        if (this.hoverPos && this.hoverPos.valid) {
          const success = this.placePiece(
            this.selectedPiece.letter,
            this.selectedPiece.coords,
            this.hoverPos.row,
            this.hoverPos.col,
            false
          );
          if (success) {
            if (window.soundEngine) window.soundEngine.playClack();
            if (navigator.vibrate) navigator.vibrate(25);
            this.deselectPiece();
          }
        } else if (dist < 15) {
          // Tap on a hole (Click the Hole)
          const intersects = this.raycaster.intersectObjects(this.socketMeshes);
          if (intersects.length > 0) {
            const socket = intersects[0].object;
            this.tryPlaceAtHole(socket.userData.row, socket.userData.col);
          }
        }
      }
      isTouchDragging = false;
    });

    // Click on canvas (Desktop Place or Pick Up)
    this.container.addEventListener('click', (e) => {
      if (this.selectedPiece) {
        if (this.hoverPos && this.hoverPos.valid) {
          const success = this.placePiece(
            this.selectedPiece.letter,
            this.selectedPiece.coords,
            this.hoverPos.row,
            this.hoverPos.col,
            false
          );
          if (success) {
            if (window.soundEngine) window.soundEngine.playClack();
            if (navigator.vibrate) navigator.vibrate(25);
            this.deselectPiece();
          }
        } else {
          // Try smart hole click
          const intersects = this.raycaster.intersectObjects(this.socketMeshes);
          if (intersects.length > 0) {
            this.tryPlaceAtHole(intersects[0].object.userData.row, intersects[0].object.userData.col);
          } else {
            if (window.soundEngine) window.soundEngine.playError();
            this.showToast("Cannot place here: overlapping or out of bounds! ⚠️");
          }
        }
        return;
      }

      // If no piece selected, check if user clicked on an existing placed piece to pick it up
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.piecesGroup.children, true);
      if (intersects.length > 0) {
        let topGroup = intersects[0].object;
        while (topGroup && topGroup.parent && topGroup.parent !== this.piecesGroup) {
          topGroup = topGroup.parent;
        }
        if (topGroup && topGroup.userData && topGroup.userData.pieceLetter) {
          const letter = topGroup.userData.pieceLetter;
          const rec = this.placedPieces.find(p => p.piece === letter);
          if (rec) {
            if (rec.locked) {
              this.showToast("This piece is part of the challenge starter! 🔒");
              if (window.soundEngine) window.soundEngine.playError();
            } else {
              this.removePiece(rec);
              this.selectPiece(letter);
            }
          }
        }
      }
    });

    // Right-click: deselect
    this.container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.selectedPiece) {
        this.deselectPiece();
      }
    });

    // Mouse wheel: rotate selected piece
    this.container.addEventListener('wheel', (e) => {
      if (this.selectedPiece) {
        e.preventDefault();
        this.rotateSelected();
      }
    }, { passive: false });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.rotateSelected();
      } else if (e.key === 'f' || e.key === 'F') {
        this.flipSelected();
      } else if (e.key === 'Escape') {
        this.deselectPiece();
      } else if (e.key === 'h' || e.key === 'H') {
        this.giveHint();
      } else if (e.key === ' ') {
        // Space to toggle top-down or isometric view
        this.setCameraPreset(this.camera.position.y > 28 ? 'isometric' : 'top');
      }
    });

    // Mode Toggle Buttons
    const btn2D = document.getElementById('mode-2d');
    const btn3D = document.getElementById('mode-3d');
    const btnCustom = document.getElementById('mode-custom');

    const setActiveModeBtn = (activeBtn) => {
      [btn2D, btn3D, btnCustom].forEach(b => {
        if (b) b.classList.remove('active');
      });
      if (activeBtn) activeBtn.classList.add('active');
    };

    if (btn2D) {
      btn2D.addEventListener('click', () => {
        if (this.mode === '2d') return;
        this.mode = '2d';
        setActiveModeBtn(btn2D);
        this.initBoard();
        this.loadLevel(this.currentLevelIndex);
        this.initUI();
        this.updateStats();
      });
    }

    if (btn3D) {
      btn3D.addEventListener('click', () => {
        if (this.mode === '3d') return;
        this.mode = '3d';
        setActiveModeBtn(btn3D);
        this.initBoard();
        this.clearBoard(false);
        this.initUI();
        this.updateStats();
        this.showToast("3D Pyramid Mode Active! 📐");
      });
    }

    if (btnCustom) {
      btnCustom.addEventListener('click', () => {
        if (window.customStudio) {
          window.customStudio.open();
        }
      });
    }

    document.getElementById('btn-open-studio')?.addEventListener('click', () => {
      if (window.customStudio) window.customStudio.open();
    });
    document.getElementById('btn-custom-studio')?.addEventListener('click', () => {
      if (window.customStudio) window.customStudio.open();
    });

    // UI Buttons
    document.getElementById('btn-rotate')?.addEventListener('click', () => this.rotateSelected());
    document.getElementById('btn-flip')?.addEventListener('click', () => this.flipSelected());
    document.getElementById('btn-hint')?.addEventListener('click', () => this.giveHint());
    document.getElementById('btn-solve')?.addEventListener('click', () => this.autoSolve());
    document.getElementById('btn-validate')?.addEventListener('click', () => this.validateBoard());
    document.getElementById('btn-next-stage')?.addEventListener('click', () => this.playNextStage());
    document.getElementById('btn-random')?.addEventListener('click', () => this.generateRandomPuzzle());
    document.getElementById('btn-reset')?.addEventListener('click', () => this.replayCurrentLevel());
    document.getElementById('btn-clear')?.addEventListener('click', () => this.clearBoard(true));

    document.getElementById('hud-btn-rotate')?.addEventListener('click', () => this.rotateSelected());
    document.getElementById('hud-btn-flip')?.addEventListener('click', () => this.flipSelected());
    document.getElementById('hud-btn-cancel')?.addEventListener('click', () => this.deselectPiece());

    document.getElementById('btn-prev-level')?.addEventListener('click', () => this.loadLevel(this.currentLevelIndex - 1));
    document.getElementById('btn-next-level')?.addEventListener('click', () => this.loadLevel(this.currentLevelIndex + 1));
    document.getElementById('btn-see-solution-header')?.addEventListener('click', () => this.applyFullSolution());

    // Camera preset buttons
    document.getElementById('cam-iso')?.addEventListener('click', () => this.setCameraPreset('isometric'));
    document.getElementById('cam-top')?.addEventListener('click', () => this.setCameraPreset('top'));
    document.getElementById('cam-front')?.addEventListener('click', () => this.setCameraPreset('front'));

    // Sound toggle
    document.getElementById('btn-sound')?.addEventListener('click', (e) => {
      if (window.soundEngine) {
        const muted = window.soundEngine.toggleMute();
        e.currentTarget.innerHTML = muted 
          ? '<span class="tool-icon">🔇</span><span>Unmute</span>' 
          : '<span class="tool-icon">🔊</span><span>Sound</span>';
      }
    });

    // Victory Modal Buttons
    document.getElementById('modal-btn-next')?.addEventListener('click', () => {
      document.getElementById('victory-modal').classList.remove('show');
      if (this.mode === 'custom') {
        if (window.customStudio) window.customStudio.open();
      } else {
        this.loadLevel(this.currentLevelIndex + 1);
      }
    });
    document.getElementById('modal-btn-replay')?.addEventListener('click', () => {
      document.getElementById('victory-modal').classList.remove('show');
      this.replayCurrentLevel();
    });
    document.getElementById('modal-btn-see-solution')?.addEventListener('click', () => {
      document.getElementById('victory-modal').classList.remove('show');
      this.applyFullSolution();
    });

    // Rules / How to play modal
    document.getElementById('btn-rules')?.addEventListener('click', () => {
      document.getElementById('rules-modal').classList.add('show');
    });
    document.getElementById('rules-close-btn')?.addEventListener('click', () => {
      document.getElementById('rules-modal').classList.remove('show');
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    // Subtle gentle floating breathing for ghost mesh
    if (this.ghostMesh) {
      const t = Date.now() * 0.003;
      this.ghostMesh.position.y = 1.05 + Math.sin(t) * 0.08;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new KanoodleGame();
  if (window.CustomStudio) {
    window.customStudio = new CustomStudio();
  }
});
