// Kanoodle 3D — Custom Board & Piece Studio

class CustomStudio {
  constructor() {
    this.width = 8;
    this.height = 6;
    // 2D matrix of active holes: true = drilled socket, false = solid plastic (obstacle/island)
    this.grid = this.createEmptyGrid(this.width, this.height, true);

    // Piece inventory: { letter: count }
    this.pieceCounts = {};
    // Default initial piece counts matching 8x6 = 48 or standard
    this.initDefaultInventory();

    // Custom Piece Creator 5x5 grid state
    this.creatorGrid = Array(5).fill(null).map(() => Array(5).fill(false));
    this.creatorColor = '#38bdf8';
    this.creatorColorHex = 0x38bdf8;
    this.creatorName = 'Custom Shape 1';

    // Built-in Presets
    this.presets = this.getBuiltInPresets();

    // Challenge Mode: Fixed starter clue pieces on board
    this.fixedPieces = []; // Array of { piece, instanceId, coords, row, col, locked: true }
    this.lockCount = 0; // 0 = free play, 1 = 1 piece locked, 2 = 2 pieces locked
    this.fullSolution = null; // Full solution from which clues are locked
    this.isFixPieceMode = false; // Mode toggle: false = regular click (fill/place hole), true = fix pieces position
    this.selectedFixPiece = 'A'; // Currently selected piece to fix on board
    this.selectedFixCoords = null; // Current rotated/flipped coordinates of piece to fix
    this.manualHoles = []; // Temporary hole-by-hole clicked coordinates

    // Saved boards from localStorage
    this.savedBoards = this.loadSavedBoardsFromStorage();

    this.isDrawing = false;
    this.drawMode = true; // true = draw hole, false = erase hole

    this.initDOM();
  }

  createEmptyGrid(w, h, fillVal = true) {
    return Array(h).fill(null).map(() => Array(w).fill(fillVal));
  }

  initDefaultInventory() {
    // Start with 1 of each classic piece
    this.pieceCounts = {
      A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1, H: 1, I: 1, J: 1
    };
  }

  getBuiltInPresets() {
    return [
      {
        id: 'donut',
        name: '🍩 Donut Island',
        width: 8,
        height: 8,
        desc: 'Holes surrounding a solid 4x4 obstacle island in the center! (48 sockets)',
        generator: (w, h) => {
          const g = this.createEmptyGrid(w, h, true);
          for (let r = 2; r < 6; r++) {
            for (let c = 2; c < 6; c++) {
              g[r][c] = false; // Solid island obstacle
            }
          }
          return g;
        },
        defaultPieces: { B: 2, C: 2, D: 2, E: 2, A: 2 } // 48 beads
      },
      {
        id: 'heart',
        name: '❤️ Heart Pattern',
        width: 9,
        height: 7,
        desc: 'Romantic heart-shaped custom tray with 39 sockets.',
        generator: (w, h) => {
          const g = this.createEmptyGrid(w, h, false);
          // Draw heart holes
          const heartCoords = [
            [1, 1], [1, 2], [1, 3], [1, 5], [1, 6], [1, 7],
            [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8],
            [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8],
            [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7],
            [5, 2], [5, 3], [5, 4], [5, 5], [5, 6],
            [6, 3], [6, 4], [6, 5]
          ];
          heartCoords.forEach(([r, c]) => {
            if (r < h && c < w) g[r][c] = true;
          });
          return g;
        },
        defaultPieces: { B: 2, C: 2, D: 2, E: 1, A: 1 } // 39 beads
      },
      {
        id: 'cross',
        name: '✝️ Swiss Cross',
        width: 7,
        height: 7,
        desc: 'Cross shaped puzzle with solid corner obstacles. (33 sockets)',
        generator: (w, h) => {
          const g = this.createEmptyGrid(w, h, true);
          // Block corners
          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) g[r][c] = false;
            for (let c = 5; c < 7; c++) g[r][c] = false;
          }
          for (let r = 5; r < 7; r++) {
            for (let c = 0; c < 2; c++) g[r][c] = false;
            for (let c = 5; c < 7; c++) g[r][c] = false;
          }
          return g;
        },
        defaultPieces: { B: 2, C: 2, D: 2, F: 1 } // 33 beads
      },
      {
        id: 'gem',
        name: '💎 Royal Gem Octagon',
        width: 6,
        height: 6,
        desc: 'Sleek octagon with cut corner plastic obstacles. (32 sockets)',
        generator: (w, h) => {
          const g = this.createEmptyGrid(w, h, true);
          g[0][0] = false;
          g[0][5] = false;
          g[5][0] = false;
          g[5][5] = false;
          return g;
        },
        defaultPieces: { B: 2, C: 2, A: 3 } // 32 beads
      },
      {
        id: 'mini',
        name: '⚡ Quick Mini 6×4',
        width: 6,
        height: 4,
        desc: 'Fast 24-socket sprint challenge.',
        generator: (w, h) => this.createEmptyGrid(w, h, true),
        defaultPieces: { B: 1, C: 1, D: 1, E: 1, A: 1 } // 24 beads
      },
      {
        id: 'maze',
        name: '🌀 Maze with Gap Obstacles',
        width: 9,
        height: 5,
        desc: 'Checkerboard gaps creating isolated bottleneck passages. (40 sockets)',
        generator: (w, h) => {
          const g = this.createEmptyGrid(w, h, true);
          // Scattered obstacles
          g[1][2] = false;
          g[1][6] = false;
          g[2][4] = false;
          g[3][2] = false;
          g[3][6] = false;
          return g;
        },
        defaultPieces: { B: 2, C: 2, D: 2, G: 1, E: 1 } // 40 beads
      },
      {
        id: 'large',
        name: '🏰 Mega Tray 12×6',
        width: 12,
        height: 6,
        desc: 'Grand 72-socket master board.',
        generator: (w, h) => this.createEmptyGrid(w, h, true),
        defaultPieces: { B: 3, C: 3, D: 3, E: 3, A: 3 } // 72 beads
      }
    ];
  }

  loadSavedBoardsFromStorage() {
    try {
      const raw = localStorage.getItem('kanoodle_custom_boards');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  saveBoardsToStorage() {
    try {
      localStorage.setItem('kanoodle_custom_boards', JSON.stringify(this.savedBoards));
    } catch (e) {}
  }

  // Count active drilled holes
  getActiveHolesCount() {
    let count = 0;
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        if (this.grid[r] && this.grid[r][c]) count++;
      }
    }
    return count;
  }

  // Count selected total beads
  getTotalBeadsCount() {
    let total = 0;
    Object.entries(this.pieceCounts).forEach(([letter, count]) => {
      if (count > 0) {
        const def = window.getPieceDef ? window.getPieceDef(letter) : window.PIECE_DEFINITIONS[letter];
        if (def) total += def.spheres * count;
      }
    });
    return total;
  }

  // Count beads locked on the board as starter clues
  getFixedBeadsCount() {
    let total = 0;
    (this.fixedPieces || []).forEach(p => {
      const def = window.getPieceDef ? window.getPieceDef(p.piece) : window.PIECE_DEFINITIONS[p.piece];
      total += def ? def.spheres : p.coords.length;
    });
    return total;
  }

  // Set grid dimensions
  resizeGrid(newW, newH) {
    const oldGrid = this.grid;
    const oldW = this.width;
    const oldH = this.height;

    this.width = Math.max(3, Math.min(14, newW));
    this.height = Math.max(3, Math.min(10, newH));
    this.grid = this.createEmptyGrid(this.width, this.height, true);

    for (let r = 0; r < Math.min(oldH, this.height); r++) {
      for (let c = 0; c < Math.min(oldW, this.width); c++) {
        this.grid[r][c] = oldGrid[r] ? !!oldGrid[r][c] : true;
      }
    }

    this.fixedPieces = [];
    this.lockCount = 0;
    this.fullSolution = null;
    this.updateLockButtonsUI();
    this.renderPainterGrid();
    this.updateStatsCounters();
  }

  // Apply a preset
  applyPreset(presetId) {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) return;

    this.width = preset.width;
    this.height = preset.height;
    this.grid = preset.generator(this.width, this.height);

    if (preset.defaultPieces) {
      this.pieceCounts = { ...preset.defaultPieces };
    }

    const wInput = document.getElementById('custom-width-input');
    const hInput = document.getElementById('custom-height-input');
    if (wInput) wInput.value = this.width;
    if (hInput) hInput.value = this.height;

    this.renderPainterGrid();
    this.renderInventoryPickers();
    this.updateStatsCounters();
    if (window.game) window.game.showToast(`Applied preset: ${preset.name}! ✨`);
  }

  // Auto-match pieces to hole count
  autoMatchPieces() {
    const targetHoles = this.getActiveHolesCount();
    if (targetHoles <= 0) return;

    const availableLetters = Object.keys(window.PIECE_DEFINITIONS || {});
    const piecesWithSpheres = availableLetters.map(l => {
      const def = window.getPieceDef(l);
      return { letter: l, spheres: def ? def.spheres : 5 };
    }).sort((a, b) => b.spheres - a.spheres);

    const counts = {};
    let currentBeads = 0;

    // Greedy pick
    while (currentBeads < targetHoles) {
      const diff = targetHoles - currentBeads;
      const fit = piecesWithSpheres.find(p => p.spheres <= diff) || piecesWithSpheres[piecesWithSpheres.length - 1];
      counts[fit.letter] = (counts[fit.letter] || 0) + 1;
      currentBeads += fit.spheres;
      if (currentBeads > targetHoles) break;
    }

    this.pieceCounts = counts;
    this.renderInventoryPickers();
    this.updateStatsCounters();
    if (window.game) window.game.showToast(`Auto-matched ${this.getTotalBeadsCount()} beads to ${targetHoles} holes! 🎯`);
  }

  // DOM initialization
  initDOM() {
    this.renderPainterGrid();
    this.renderPresetsList();
    this.renderInventoryPickers();
    this.renderCreatorGrid();
    this.renderSavedBoardsList();
    this.bindEvents();
    this.updateStatsCounters();
  }

  renderPainterGrid() {
    const container = document.getElementById('board-painter-grid');
    if (!container) return;

    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${this.width}, 34px)`;
    container.style.gridTemplateRows = `repeat(${this.height}, 34px)`;

    // 1. Golden locked pieces lookup
    const goldenMap = new Map();
    (this.fixedPieces || []).forEach(p => {
      const def = window.getPieceDef ? window.getPieceDef(p.piece) : window.PIECE_DEFINITIONS[p.piece];
      p.coords.forEach(([dx, dy]) => {
        goldenMap.set(`${p.row + dy},${p.col + dx}`, {
          pieceObj: p,
          letter: p.piece,
          name: def ? def.name : p.piece
        });
      });
    });

    // 2. Solution pieces lookup (non-fixed pieces from verified solution)
    const solutionMap = new Map();
    if (this.verifiedSolution) {
      this.verifiedSolution.forEach(p => {
        if (p.locked) return;
        const def = window.getPieceDef ? window.getPieceDef(p.piece) : window.PIECE_DEFINITIONS[p.piece];
        p.coords.forEach(([dx, dy]) => {
          const key = `${p.row + dy},${p.col + dx}`;
          if (!goldenMap.has(key)) {
            solutionMap.set(key, {
              pieceObj: p,
              letter: p.piece,
              name: def ? def.name : p.piece
            });
          }
        });
      });
    }

    const manualSet = new Set((this.manualHoles || []).map(([r, c]) => `${r},${c}`));

    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const cell = document.createElement('div');
        const posKey = `${r},${c}`;
        const goldenInfo = goldenMap.get(posKey);
        const solutionInfo = solutionMap.get(posKey);
        const isManual = manualSet.has(posKey);

        if (!this.grid[r][c]) {
          cell.className = 'painter-cell solid-block';
          cell.title = `(${r}, ${c}): Solid Plastic Obstacle`;
        } else if (goldenInfo) {
          // Highlighted as GOLDEN STARTER CLUE!
          cell.className = 'painter-cell active-hole locked-clue-golden';
          cell.innerHTML = '<span class="cell-lock-icon">🔒</span>';
          cell.title = `(${r}, ${c}): 🌟 Golden Locked Clue: Piece ${goldenInfo.letter} (${goldenInfo.name}) [Click or Double-Click to Remove]`;
        } else if (solutionInfo) {
          // Highlighted as SUITABLE SOLUTION PIECE in BLUE!
          cell.className = 'painter-cell active-hole solution-piece-blue';
          cell.innerHTML = `<span class="cell-piece-letter">${solutionInfo.letter}</span>`;
          cell.title = `(${r}, ${c}): Piece ${solutionInfo.letter} (${solutionInfo.name}) [Double-click to Lock as Clue 🔒]`;
        } else if (isManual) {
          cell.className = 'painter-cell active-hole manual-selected-hole';
          cell.title = `(${r}, ${c}): Selected hole for Piece ${this.selectedFixPiece}`;
        } else {
          cell.className = 'painter-cell active-hole';
          cell.title = `(${r}, ${c}): Hole (Socket)`;
        }

        cell.dataset.row = r;
        cell.dataset.col = c;

        // Hover effect in Fix Piece Mode
        cell.addEventListener('mouseenter', () => {
          if (this.isFixPieceMode && this.grid[r][c] && !goldenInfo && this.selectedFixCoords) {
            this.updateHoverPreview(r, c);
          } else if (!this.isFixPieceMode && this.isDrawing) {
            this.toggleCell(r, c, this.drawMode);
          }
        });

        cell.addEventListener('mouseleave', () => {
          if (this.isFixPieceMode) {
            this.clearHoverPreview();
          }
        });

        // Double-click: Lock solution piece as Golden clue or unlock Golden clue
        cell.addEventListener('dblclick', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (goldenInfo) {
            this.handlePieceDblClick(r, c);
          } else if (solutionInfo) {
            const p = solutionInfo.pieceObj;
            this.fixedPieces.push({
              piece: p.piece,
              coords: JSON.parse(JSON.stringify(p.coords)),
              row: p.row,
              col: p.col,
              locked: true,
              instanceId: `${p.piece}_fixed_${Date.now()}`
            });
            this.lockCount = this.fixedPieces.length;
            this.updateLockButtonsUI();
            this.renderPainterGrid();
            this.renderInventoryPickers();
            this.updateStatsCounters();
            if (window.soundEngine) window.soundEngine.playClack();
            if (window.game) window.game.showToast(`🌟 Piece ${p.piece} locked as Golden starter clue! 🔒`);
          }
        });

        // Click / MouseDown handling
        cell.addEventListener('mousedown', (e) => {
          if (this.isFixPieceMode) {
            // Fix Piece Mode: Handle placing or removing fixed piece
            this.handleCellFixClick(r, c, goldenInfo);
            return;
          }

          // Regular click mode: one click fills/drills hole, again click toggles it
          this.isDrawing = true;
          this.drawMode = !this.grid[r][c]; // Toggle mode based on initial cell
          this.toggleCell(r, c, this.drawMode);
        });

        container.appendChild(cell);
      }
    }

    window.addEventListener('mouseup', () => {
      this.isDrawing = false;
    });
  }

  updateHoverPreview(originR, originC) {
    this.clearHoverPreview();
    if (!this.selectedFixCoords) return;

    let allHoles = true;
    const cellsToHighlight = [];

    for (const [dx, dy] of this.selectedFixCoords) {
      const targetR = originR + dy;
      const targetC = originC + dx;

      if (
        targetR < 0 || targetR >= this.height ||
        targetC < 0 || targetC >= this.width ||
        !this.grid[targetR] || !this.grid[targetR][targetC]
      ) {
        allHoles = false;
        continue;
      }

      // Check if already occupied by another golden locked piece
      const isOccupied = (this.fixedPieces || []).some(fp =>
        fp.coords.some(([pdx, pdy]) => (fp.row + pdy) === targetR && (fp.col + pdx) === targetC)
      );
      if (isOccupied) {
        allHoles = false;
      }

      const el = document.querySelector(`.painter-cell[data-row="${targetR}"][data-col="${targetC}"]`);
      if (el) cellsToHighlight.push(el);
    }

    // Apply class
    cellsToHighlight.forEach(el => {
      el.classList.add(allHoles ? 'hover-fix-preview' : 'hover-fix-invalid');
    });
  }

  clearHoverPreview() {
    document.querySelectorAll('.painter-cell.hover-fix-preview, .painter-cell.hover-fix-invalid')
      .forEach(el => el.classList.remove('hover-fix-preview', 'hover-fix-invalid'));
  }

  handleCellFixClick(r, c, goldenInfo) {
    this.clearHoverPreview();

    // 1. If clicking on an already golden piece: Remove/unfix it!
    if (goldenInfo) {
      const idx = this.fixedPieces.findIndex(fp => fp === goldenInfo.pieceObj);
      if (idx >= 0) {
        const removed = this.fixedPieces.splice(idx, 1)[0];
        this.lockCount = this.fixedPieces.length;

        // Re-solve remaining sockets
        const res = window.kanoodleSolver.tileCustomBoard({
          width: this.width,
          height: this.height,
          activeHoles: this.getActiveHolesList(),
          fixedPieces: this.fixedPieces
        });
        if (res) {
          this.verifiedSolution = res.solution;
          this.fullSolution = [...res.solution];
          this.pieceCounts = { ...res.pieceCounts };
        }

        if (window.soundEngine) window.soundEngine.playPickup();
        if (window.game) window.game.showToast(`Removed fixed Piece ${removed.piece}. 🔓`);

        this.renderPainterGrid();
        this.renderInventoryPickers();
        this.updateStatsCounters();
        this.updateLockButtonsUI();
      }
      return;
    }

    if (!this.grid[r] || !this.grid[r][c]) {
      if (window.game) window.game.showToast("Cannot place piece on a solid obstacle! Click an active socket.");
      return;
    }

    const def = window.getPieceDef ? window.getPieceDef(this.selectedFixPiece) : window.PIECE_DEFINITIONS[this.selectedFixPiece];
    if (!def) return;

    // 2. Check if selectedFixCoords fits directly at (r, c)
    let canFit = true;
    for (const [dx, dy] of this.selectedFixCoords) {
      const tr = r + dy;
      const tc = c + dx;
      if (
        tr < 0 || tr >= this.height ||
        tc < 0 || tc >= this.width ||
        !this.grid[tr] || !this.grid[tr][tc]
      ) {
        canFit = false;
        break;
      }
      const isOccupied = (this.fixedPieces || []).some(fp =>
        fp.coords.some(([pdx, pdy]) => (fp.row + pdy) === tr && (fp.col + pdx) === tc)
      );
      if (isOccupied) {
        canFit = false;
        break;
      }
    }

    if (canFit) {
      // Direct placement of the selected piece!
      this.lockPieceOnBoard(this.selectedFixPiece, this.selectedFixCoords, r, c);
      return;
    }

    // 3. Manual hole-by-hole clicking
    const existingIdx = (this.manualHoles || []).findIndex(([hr, hc]) => hr === r && hc === c);
    if (existingIdx >= 0) {
      this.manualHoles.splice(existingIdx, 1);
    } else {
      this.manualHoles.push([r, c]);
    }

    if (this.manualHoles.length === def.spheres) {
      // Check if manual holes match any orientation of this piece
      const minR = Math.min(...this.manualHoles.map(([hr]) => hr));
      const minC = Math.min(...this.manualHoles.map(([, hc]) => hc));
      const norm = window.normalizeCoords ? window.normalizeCoords(this.manualHoles) : this.manualHoles;

      const matchingOrient = (def.orientations || [def.coords]).find(o =>
        window.areCoordsEqual ? window.areCoordsEqual(o, norm) : false
      );

      if (matchingOrient) {
        this.manualHoles = [];
        this.lockPieceOnBoard(this.selectedFixPiece, matchingOrient, minR, minC);
        return;
      } else {
        if (window.game) {
          window.game.showToast(`Selected ${def.spheres} sockets don't match Piece ${this.selectedFixPiece}'s shape. Adjust sockets or use R/F to rotate!`);
        }
      }
    } else {
      if (window.game) {
        window.game.showToast(`Selected ${this.manualHoles.length}/${def.spheres} sockets for Piece ${this.selectedFixPiece}.`);
      }
    }

    this.renderPainterGrid();
  }

  lockPieceOnBoard(letter, coords, r, c) {
    const newFixed = [
      ...this.fixedPieces,
      {
        piece: letter,
        coords: JSON.parse(JSON.stringify(coords)),
        row: r,
        col: c,
        locked: true,
        instanceId: `${letter}_fixed_${Date.now()}`
      }
    ];

    // Solver checks remaining sockets to guarantee valid solution
    const res = window.kanoodleSolver.tileCustomBoard({
      width: this.width,
      height: this.height,
      activeHoles: this.getActiveHolesList(),
      fixedPieces: newFixed
    });

    this.fixedPieces = newFixed;
    this.lockCount = this.fixedPieces.length;
    this.manualHoles = [];

    if (res) {
      this.verifiedSolution = res.solution;
      this.fullSolution = [...res.solution];
      this.pieceCounts = { ...res.pieceCounts };
      if (window.soundEngine) window.soundEngine.playClack();
      if (window.game) {
        window.game.showToast(`🌟 Piece ${letter} locked on board! Remaining sockets are 100% solvable 🎯`);
      }
    } else {
      if (window.soundEngine) window.soundEngine.playClack();
      if (window.game) {
        window.game.showToast(`🌟 Piece ${letter} locked on board! (Tip: Current position may restrict remaining pieces)`);
      }
    }

    this.renderPainterGrid();
    this.renderInventoryPickers();
    this.updateStatsCounters();
    this.updateLockButtonsUI();
  }

  toggleCell(r, c, val) {
    if (r < 0 || r >= this.height || c < 0 || c >= this.width) return;
    this.grid[r][c] = val !== undefined ? val : !this.grid[r][c];

    // If a socket was turned into a solid obstacle, only remove fixed pieces that overlap this cell:
    if (!this.grid[r][c] && this.fixedPieces.length > 0) {
      const prevCount = this.fixedPieces.length;
      this.fixedPieces = this.fixedPieces.filter(fp =>
        fp.coords.every(([dx, dy]) => {
          const tr = fp.row + dy;
          const tc = fp.col + dx;
          return this.grid[tr] && this.grid[tr][tc];
        })
      );
      if (this.fixedPieces.length !== prevCount) {
        this.lockCount = this.fixedPieces.length;
        this.renderPainterGrid();
      }
    }

    const cell = document.querySelector(`.painter-cell[data-row="${r}"][data-col="${c}"]`);
    if (cell) {
      cell.className = `painter-cell ${this.grid[r][c] ? 'active-hole' : 'solid-block'}`;
      cell.title = `(${r}, ${c}): ${this.grid[r][c] ? 'Hole (Socket)' : 'Solid Plastic Obstacle'}`;
    }
    this.updateStatsCounters();
  }

  renderPresetsList() {
    const container = document.getElementById('custom-presets-list');
    if (!container) return;
    container.innerHTML = '';

    this.presets.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'preset-card-btn';
      btn.innerHTML = `
        <span class="preset-title">${p.name}</span>
        <span class="preset-meta">${p.width}×${p.height} • ${p.desc}</span>
      `;
      btn.addEventListener('click', () => this.applyPreset(p.id));
      container.appendChild(btn);
    });
  }

  renderInventoryPickers() {
    const stdContainer = document.getElementById('custom-inventory-list');
    const customContainer = document.getElementById('custom-user-pieces-list');
    const customBadge = document.getElementById('custom-user-pieces-badge');
    if (!stdContainer) return;

    stdContainer.innerHTML = '';
    if (customContainer) customContainer.innerHTML = '';

    const fixedLetters = new Set((this.fixedPieces || []).map(fp => fp.piece));
    const solCounts = {};
    if (this.verifiedSolution) {
      this.verifiedSolution.forEach(p => {
        if (!p.locked) {
          solCounts[p.piece] = (solCounts[p.piece] || 0) + 1;
        }
      });
    }

    // 1. Standard (A-L) and Extended (M-Z) pieces list
    const standardDefs = [];
    Object.values(window.PIECE_DEFINITIONS || {}).forEach(d => standardDefs.push(d));
    Object.values(window.EXTENDED_PIECE_DEFINITIONS || {}).forEach(d => standardDefs.push(d));

    standardDefs.forEach(def => {
      const count = this.pieceCounts[def.letter] || 0;
      const isFixed = fixedLetters.has(def.letter);
      const isSolution = (solCounts[def.letter] || 0) > 0;

      let rowHighlightClass = '';
      let badgeHTML = '';
      if (isFixed) {
        rowHighlightClass = 'fixed-locked-piece';
        badgeHTML = `<span class="inv-badge gold">🔒 Locked on Board</span>`;
      } else if (isSolution) {
        rowHighlightClass = 'solution-highlight';
        badgeHTML = `<span class="inv-badge cyan">✓ Solution Piece (${solCounts[def.letter]})</span>`;
      } else if (count > 0) {
        rowHighlightClass = 'selected-piece';
      }

      const row = document.createElement('div');
      row.className = `inventory-piece-row ${rowHighlightClass}`;
      row.title = `Click to select Piece ${def.letter} for board fixing`;

      const thumb = window.generatePieceSVG ? window.generatePieceSVG(def.letter, def.coords, 38) : '';
      const colorName = def.colorName || (def.name ? def.name.split(' ')[0] : 'Color');

      row.innerHTML = `
        <div class="inv-thumb">${thumb}</div>
        <div class="inv-meta">
          <div class="inv-name-row">
            <span class="inv-letter">${def.letter}</span>
            <span class="inv-color" style="color:${def.color}">${colorName}</span>
            <span class="inv-spheres">${def.spheres} beads</span>
          </div>
          ${badgeHTML ? `<div class="inv-status-row">${badgeHTML}</div>` : ''}
        </div>
        <div class="inv-actions-col">
          <button class="btn-inv-fix" data-letter="${def.letter}" title="Fix this piece onto board as starter clue">📌 Fix</button>
          <div class="inv-stepper">
            <button class="step-btn minus" data-letter="${def.letter}">−</button>
            <span class="step-val" id="step-count-${def.letter}">${count}</span>
            <button class="step-btn plus" data-letter="${def.letter}">+</button>
          </div>
        </div>
      `;

      row.querySelector('.btn-inv-fix')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startFixingPiece(def.letter);
      });

      row.querySelector('.minus').addEventListener('click', (e) => {
        e.stopPropagation();
        this.pieceCounts[def.letter] = Math.max(0, (this.pieceCounts[def.letter] || 0) - 1);
        if (this.pieceCounts[def.letter] === 0) delete this.pieceCounts[def.letter];
        this.renderInventoryPickers();
        this.updateStatsCounters();
      });

      row.querySelector('.plus').addEventListener('click', (e) => {
        e.stopPropagation();
        this.pieceCounts[def.letter] = Math.min(10, (this.pieceCounts[def.letter] || 0) + 1);
        this.renderInventoryPickers();
        this.updateStatsCounters();
      });

      // Clicking row selects piece to fix on board
      row.addEventListener('click', (e) => {
        if (!e.target.closest('.inv-stepper') && !e.target.closest('.btn-inv-fix')) {
          this.startFixingPiece(def.letter);
        }
      });

      stdContainer.appendChild(row);
    });

    // 2. Custom User-Made Pieces list (Shown after Z)
    const customDefs = Object.values(window.CUSTOM_PIECES || {});
    if (customBadge) {
      customBadge.textContent = `${customDefs.length} Custom Shape${customDefs.length === 1 ? '' : 's'}`;
    }

    if (customContainer) {
      if (customDefs.length === 0) {
        customContainer.innerHTML = `
          <div class="empty-custom-pieces-card">
            <span>✨</span> No custom user-made pieces created yet. Go to the "✨ Create Shape" tab above to forge your own unique polyspheres!
          </div>
        `;
      } else {
        customDefs.forEach(def => {
          const count = this.pieceCounts[def.letter] || 0;
          const isFixed = fixedLetters.has(def.letter);
          const isSolution = (solCounts[def.letter] || 0) > 0;

          let rowHighlightClass = '';
          let badgeHTML = '';
          if (isFixed) {
            rowHighlightClass = 'fixed-locked-piece';
            badgeHTML = `<span class="inv-badge gold">🔒 Locked on Board</span>`;
          } else if (isSolution) {
            rowHighlightClass = 'solution-highlight';
            badgeHTML = `<span class="inv-badge cyan">✓ Solution Piece (${solCounts[def.letter]})</span>`;
          } else if (count > 0) {
            rowHighlightClass = 'selected-piece';
          }

          const row = document.createElement('div');
          row.className = `inventory-piece-row ${rowHighlightClass}`;
          row.title = `Click to select custom piece "${def.name}" for board fixing`;

          const thumb = window.generatePieceSVG ? window.generatePieceSVG(def.letter, def.coords, 38) : '';

          row.innerHTML = `
            <div class="inv-thumb">${thumb}</div>
            <div class="inv-meta">
              <div class="inv-name-row">
                <span class="inv-letter">✨</span>
                <span class="inv-color" style="color:${def.color}">${def.name}</span>
                <span class="inv-spheres">${def.spheres} beads</span>
              </div>
              ${badgeHTML ? `<div class="inv-status-row">${badgeHTML}</div>` : ''}
            </div>
            <div class="inv-actions-col">
              <button class="btn-inv-fix" data-letter="${def.letter}" title="Fix this custom piece onto board as starter clue">📌 Fix</button>
              <div class="inv-stepper">
                <button class="step-btn minus" data-letter="${def.letter}">−</button>
                <span class="step-val" id="step-count-${def.letter}">${count}</span>
                <button class="step-btn plus" data-letter="${def.letter}">+</button>
              </div>
              <button class="custom-del-btn" data-letter="${def.letter}" title="Delete this custom shape">🗑️</button>
            </div>
          `;

          row.querySelector('.btn-inv-fix')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startFixingPiece(def.letter);
          });

          row.querySelector('.minus').addEventListener('click', (e) => {
            e.stopPropagation();
            this.pieceCounts[def.letter] = Math.max(0, (this.pieceCounts[def.letter] || 0) - 1);
            if (this.pieceCounts[def.letter] === 0) delete this.pieceCounts[def.letter];
            this.renderInventoryPickers();
            this.updateStatsCounters();
          });

          row.querySelector('.plus').addEventListener('click', (e) => {
            e.stopPropagation();
            this.pieceCounts[def.letter] = Math.min(10, (this.pieceCounts[def.letter] || 0) + 1);
            this.renderInventoryPickers();
            this.updateStatsCounters();
          });

          row.querySelector('.custom-del-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            delete window.CUSTOM_PIECES[def.letter];
            delete this.pieceCounts[def.letter];
            this.fixedPieces = (this.fixedPieces || []).filter(fp => fp.piece !== def.letter);
            this.lockCount = this.fixedPieces.length;
            this.renderInventoryPickers();
            this.renderPainterGrid();
            this.updateStatsCounters();
            if (window.game) window.game.showToast(`Deleted custom piece "${def.name}". 🗑️`);
          });

          row.addEventListener('click', (e) => {
            if (!e.target.closest('.inv-stepper') && !e.target.closest('.custom-del-btn') && !e.target.closest('.btn-inv-fix')) {
              this.startFixingPiece(def.letter);
            }
          });

          customContainer.appendChild(row);
        });
      }
    }
  }

  // Starts fixing a piece chosen from Piece Inventory (or dropdown)
  startFixingPiece(letter) {
    this.selectedFixPiece = letter;
    const def = window.getPieceDef ? window.getPieceDef(letter) : window.PIECE_DEFINITIONS[letter];
    if (!def) return;

    this.selectedFixCoords = JSON.parse(JSON.stringify(def.coords));
    this.manualHoles = [];
    this.isFixPieceMode = true;

    // Switch to Board Designer tab
    document.querySelectorAll('.studio-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.studio-tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelector('.studio-tab-btn[data-target="tab-designer"]')?.classList.add('active');
    document.getElementById('tab-designer')?.classList.add('active');

    // Update Fix Piece Mode button & toolbar
    const btn = document.getElementById('btn-custom-lock-mode');
    if (btn) {
      btn.classList.add('active-fix-mode');
      btn.innerHTML = '🌟 Fix Mode: ON (Click Holes to Place)';
    }

    const bar = document.getElementById('fix-piece-bar');
    if (bar) bar.style.display = 'flex';
    this.updateFixPieceToolbar();

    this.renderPainterGrid();
    if (window.soundEngine) window.soundEngine.playPickup();
    if (window.game) {
      const colorName = def.colorName || (def.name ? def.name.split(' ')[0] : '');
      window.game.showToast(`📌 Selected Piece ${def.letter} (${colorName}): Click holes on the board to fix it in place!`);
    }
  }

  updateFixPieceToolbar() {
    const dropdown = document.getElementById('fix-piece-dropdown');
    const metaEl = document.getElementById('fix-piece-current-meta');
    if (!dropdown) return;

    dropdown.innerHTML = '';

    // Group 1: Standard & Extended Pieces (A through Z)
    const stdGroup = document.createElement('optgroup');
    stdGroup.label = 'Standard & Extended Pieces (A–Z)';

    const stdDefs = [];
    Object.values(window.PIECE_DEFINITIONS || {}).forEach(d => stdDefs.push(d));
    Object.values(window.EXTENDED_PIECE_DEFINITIONS || {}).forEach(d => stdDefs.push(d));

    stdDefs.forEach(def => {
      const opt = document.createElement('option');
      opt.value = def.letter;
      const colorName = def.colorName || (def.name ? def.name.split(' ')[0] : '');
      opt.textContent = `${def.letter}  ${colorName}  (${def.spheres} beads)`;
      if (def.letter === this.selectedFixPiece) opt.selected = true;
      stdGroup.appendChild(opt);
    });
    dropdown.appendChild(stdGroup);

    // Group 2: Custom User-Made Pieces (After Z)
    const customDefs = Object.values(window.CUSTOM_PIECES || {});
    if (customDefs.length > 0) {
      const customGroup = document.createElement('optgroup');
      customGroup.label = '✨ Custom User-Made Pieces (After Z)';

      customDefs.forEach(def => {
        const opt = document.createElement('option');
        opt.value = def.letter;
        opt.textContent = `✨ ${def.name}  (${def.spheres} beads)`;
        if (def.letter === this.selectedFixPiece) opt.selected = true;
        customGroup.appendChild(opt);
      });
      dropdown.appendChild(customGroup);
    }

    const currDef = window.getPieceDef ? window.getPieceDef(this.selectedFixPiece) : window.PIECE_DEFINITIONS[this.selectedFixPiece];
    if (metaEl && currDef) {
      metaEl.textContent = `• ${currDef.spheres} beads`;
      metaEl.style.color = currDef.color || '#fbbf24';
    }
  }

  rotateFixCoords() {
    if (!this.selectedFixCoords) return;
    this.selectedFixCoords = window.rotateCoords ? window.rotateCoords(this.selectedFixCoords) : this.selectedFixCoords;
    if (window.soundEngine) window.soundEngine.playRotate();
    if (window.game) window.game.showToast(`↻ Rotated Piece ${this.selectedFixPiece} 90°`);
    this.renderPainterGrid();
  }

  flipFixCoords() {
    if (!this.selectedFixCoords) return;
    this.selectedFixCoords = window.flipCoords ? window.flipCoords(this.selectedFixCoords) : this.selectedFixCoords;
    if (window.soundEngine) window.soundEngine.playRotate();
    if (window.game) window.game.showToast(`⇄ Flipped Piece ${this.selectedFixPiece}`);
    this.renderPainterGrid();
  }

  renderCreatorGrid() {
    const container = document.getElementById('shape-creator-grid');
    if (!container) return;
    container.innerHTML = '';

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cell = document.createElement('div');
        const active = this.creatorGrid[r][c];
        cell.className = `creator-cell ${active ? 'active-bead' : ''}`;
        if (active) cell.style.backgroundColor = this.creatorColor;

        cell.addEventListener('click', () => {
          this.creatorGrid[r][c] = !this.creatorGrid[r][c];
          this.renderCreatorGrid();
        });
        container.appendChild(cell);
      }
    }
  }

  // Helper: Get list of active holes [[r, c], ...]
  getActiveHolesList() {
    const list = [];
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        if (this.grid[r] && this.grid[r][c]) list.push([r, c]);
      }
    }
    return list;
  }

  // Helper: Verify all spheres in custom shape are connected together (orthogonal adjacency)
  isShapeConnected(coords) {
    if (!coords || coords.length <= 1) return true;
    const set = new Set(coords.map(([x, y]) => `${x},${y}`));
    const visited = new Set();
    const queue = [coords[0]];
    visited.add(`${coords[0][0]},${coords[0][1]}`);

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];
      for (const [nx, ny] of neighbors) {
        const key = `${nx},${ny}`;
        if (set.has(key) && !visited.has(key)) {
          visited.add(key);
          queue.push([nx, ny]);
        }
      }
    }
    return visited.size === coords.length;
  }

  // Helper: Verify if custom shape can physically fit anywhere on the current board
  canShapeFitOnBoard(coords) {
    const orientations = window.getAllOrientations ? window.getAllOrientations(coords) : [coords];
    for (const orient of orientations) {
      const maxX = Math.max(...orient.map(([x]) => x));
      const maxY = Math.max(...orient.map(([, y]) => y));

      for (let r = 0; r <= this.height - 1 - maxY; r++) {
        for (let c = 0; c <= this.width - 1 - maxX; c++) {
          let fits = true;
          for (const [dx, dy] of orient) {
            if (!this.grid[r + dy] || !this.grid[r + dy][c + dx]) {
              fits = false;
              break;
            }
          }
          if (fits) return true;
        }
      }
    }
    return false;
  }

  saveCustomCreatedShape() {
    const coords = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (this.creatorGrid[r][c]) coords.push([c, r]);
      }
    }

    if (coords.length === 0) {
      if (window.game) window.game.showToast("Click spheres on the 5x5 grid to draw your shape first!");
      return;
    }

    // Validation 1: All spheres must be connected together (no floating beads)
    if (!this.isShapeConnected(coords)) {
      if (window.soundEngine) window.soundEngine.playError();
      if (window.game) {
        window.game.showToast("⚠️ Disconnected shape! All spheres must be connected into one piece.");
      }
      alert("⚠️ Invalid Kanoodle Piece:\nAll spheres must be orthogonally connected together (no floating or disconnected beads). Please draw connected spheres.");
      return;
    }

    // Validation 2: Piece size cannot exceed total available sockets on the board
    const totalSockets = this.getActiveHolesCount();
    if (coords.length > totalSockets) {
      if (window.soundEngine) window.soundEngine.playError();
      if (window.game) {
        window.game.showToast(`⚠️ Piece has ${coords.length} beads, but board only has ${totalSockets} sockets!`);
      }
      alert(`⚠️ Piece Too Large:\nThis piece has ${coords.length} spheres, but your custom board only has ${totalSockets} active sockets! It cannot fit.`);
      return;
    }

    // Validation 3: Check if piece can physically fit anywhere on the current board layout
    if (!this.canShapeFitOnBoard(coords)) {
      if (window.soundEngine) window.soundEngine.playError();
      if (window.game) {
        window.game.showToast("⚠️ Piece cannot fit anywhere on your current board layout!");
      }
      alert("⚠️ Cannot Fit on Board:\nThis custom shape cannot physically fit into any area of your board layout due to solid obstacles or tray bounds. Please adjust your shape or board sockets.");
      return;
    }

    const nameInput = document.getElementById('custom-shape-name');
    const shapeName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : `Custom ${Date.now().toString().slice(-4)}`;
    const letterKey = `U_${Date.now().toString().slice(-4)}`;

    const newDef = window.registerCustomPiece({
      letter: letterKey,
      name: shapeName,
      color: this.creatorColor,
      coords: coords
    });

    // Add 1 to inventory
    this.pieceCounts[letterKey] = 1;
    this.verifiedSolution = null;

    // Reset grid
    this.creatorGrid = Array(5).fill(null).map(() => Array(5).fill(false));
    this.renderCreatorGrid();
    this.renderInventoryPickers();
    this.updateStatsCounters();

    if (window.soundEngine) window.soundEngine.playClack();
    if (window.game) window.game.showToast(`Saved custom piece: "${shapeName}"! ✨`);
  }

  // Guaranteed Solvable: Finds suitable pieces from inventory to solve custom board
  autoSolveAndBalance() {
    const holes = this.getActiveHolesCount();
    if (holes === 0) {
      if (window.game) window.game.showToast("Please drill some sockets on the board first!");
      return null;
    }

    if (window.game) window.game.showToast("⚡ Checking pieces from inventory to solve custom board...");

    const activeHolesList = this.getActiveHolesList();
    const result = window.kanoodleSolver.tileCustomBoard({
      width: this.width,
      height: this.height,
      activeHoles: activeHolesList,
      inventory: this.pieceCounts,
      fixedPieces: this.fixedPieces
    });

    if (!result) {
      if (window.soundEngine) window.soundEngine.playError();
      this.showUnsolvableWarningModal();
      return null;
    }

    // Update piece counts and store the verified solution (PRESERVING fixedPieces!)
    this.pieceCounts = { ...result.pieceCounts };
    this.verifiedSolution = result.solution;
    this.fullSolution = [...result.solution];
    this.lockCount = this.fixedPieces.length;
    this.updateLockButtonsUI();

    this.renderPainterGrid();
    this.renderInventoryPickers();
    this.updateStatsCounters();

    if (window.soundEngine) window.soundEngine.playHint();
    if (window.game) {
      const fixedMsg = this.fixedPieces.length > 0 ? ` (${this.fixedPieces.length} locked on board 🔒)` : '';
      window.game.showToast(`✨ Solvable pieces found & highlighted in inventory${fixedMsg}! 🎯`);
    }

    return result;
  }

  showUnsolvableWarningModal() {
    const modal = document.getElementById('custom-solvability-modal');
    if (!modal) return;

    const titleEl = modal.querySelector('.modal-title');
    const descEl = document.getElementById('solvability-modal-desc');
    const detailsEl = document.getElementById('solvability-details-box');
    const actionsEl = modal.querySelector('.solvability-actions');

    if (titleEl) titleEl.textContent = "⚠️ Cannot Solve With Current Pieces";
    if (descEl) {
      const fixedCount = (this.fixedPieces || []).length;
      descEl.textContent = fixedCount > 0
        ? `No combination of standard pieces can tile the open sockets around your ${fixedCount} fixed piece(s).`
        : `No combination of available pieces can tile this obstacle shape and socket layout.`;
    }
    if (detailsEl) {
      detailsEl.innerHTML = `
        <div style="font-weight: 700; color: #38bdf8; margin-bottom: 6px;">💡 Forge a Custom Piece to Solve It:</div>
        <div>Standard shapes cannot fill these open gaps. You can draw and forge a custom polysphere in the <strong>Shape Forge</strong> made specifically to fit this board!</div>
      `;
    }

    if (actionsEl) {
      actionsEl.innerHTML = `
        <button id="btn-modal-forge-new" class="modal-btn primary">
          ✨ Go to Forge: Create New Piece
        </button>
        <button id="btn-modal-keep-editing" class="modal-btn secondary">
          ✏️ Keep Editing Board
        </button>
      `;

      document.getElementById('btn-modal-forge-new')?.addEventListener('click', () => {
        this.closeSolvabilityModal();
        this.switchTab('tab-creator');
        if (window.game) window.game.showToast("✨ Click spheres on the 5×5 grid to design a piece that fits your board!");
      });

      document.getElementById('btn-modal-keep-editing')?.addEventListener('click', () => {
        this.closeSolvabilityModal();
      });
    }

    modal.classList.add('show');
  }

  switchTab(tabId) {
    document.querySelectorAll('.studio-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.target === tabId);
    });
    document.querySelectorAll('.studio-tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === tabId);
    });
  }

  // Set Challenge Mode: Lock 1 or 2 pieces from a verified solution as starter clues
  setLockChallenge(count) {
    if (count === 0) {
      this.fixedPieces = [];
      this.lockCount = 0;
      if (this.fullSolution) {
        // Restore all pieces from the full solution back to the inventory tray
        const fullCounts = {};
        this.fullSolution.forEach(p => {
          fullCounts[p.piece] = (fullCounts[p.piece] || 0) + 1;
        });
        this.pieceCounts = fullCounts;
      }
      this.renderPainterGrid();
      this.renderInventoryPickers();
      this.updateStatsCounters();
      this.updateLockButtonsUI();
      if (window.game) window.game.showToast("Challenge Mode disabled: All pieces returned to tray for free play 🔓");
      return;
    }

    const holes = this.getActiveHolesCount();
    if (holes === 0) {
      if (window.game) window.game.showToast("Please drill some sockets on the board first!");
      return;
    }

    // Ensure we have a valid tiling solution
    if (!this.fullSolution || !this.verifiedSolution) {
      const res = this.autoSolveAndBalance();
      if (!res) return;
      this.fullSolution = [...res.solution];
    }

    const sol = this.fullSolution;
    if (!sol || sol.length === 0) {
      if (window.game) window.game.showToast("Could not compute a solution to lock pieces from.");
      return;
    }

    if (sol.length <= count) {
      if (window.game) window.game.showToast(`Board only needs ${sol.length} pieces total; cannot lock ${count} pieces!`);
      return;
    }

    // Pick 1 or 2 pieces from the solution to lock onto the board
    // Randomize order to allow clicking "Lock 1/2" again to cycle different pieces
    const shuffled = [...sol].sort(() => Math.random() - 0.5);

    // Prefer pieces with at least 4 spheres so they make interesting clues
    shuffled.sort((a, b) => {
      const defA = window.getPieceDef ? window.getPieceDef(a.piece) : window.PIECE_DEFINITIONS[a.piece];
      const defB = window.getPieceDef ? window.getPieceDef(b.piece) : window.PIECE_DEFINITIONS[b.piece];
      const sA = defA ? defA.spheres : 5;
      const sB = defB ? defB.spheres : 5;
      return sB - sA;
    });

    const picked = shuffled.slice(0, count);
    this.fixedPieces = picked.map((p, idx) => ({
      piece: p.piece,
      instanceId: `${p.piece}_fixed_${idx}`,
      coords: p.coords,
      row: p.row,
      col: p.col,
      locked: true
    }));

    // Remaining pieces from the full solution that go into the player's tray
    const remainingPieces = sol.filter(p => !picked.some(pk => pk.piece === p.piece && pk.row === p.row && pk.col === p.col));
    const remainingCounts = {};
    remainingPieces.forEach(p => {
      remainingCounts[p.piece] = (remainingCounts[p.piece] || 0) + 1;
    });

    this.pieceCounts = remainingCounts;
    this.lockCount = count;

    this.renderPainterGrid();
    this.renderInventoryPickers();
    this.updateStatsCounters();
    this.updateLockButtonsUI();

    if (window.soundEngine) window.soundEngine.playHint();
    if (window.game) {
      const pieceNames = this.fixedPieces.map(p => {
        const def = window.getPieceDef ? window.getPieceDef(p.piece) : window.PIECE_DEFINITIONS[p.piece];
        return `Piece ${p.piece} (${def ? def.name : ''})`;
      }).join(' and ');
      window.game.showToast(`🔒 Challenge Set: ${count} piece(s) locked on board (${pieceNames})! Remaining pieces in tray are 100% solvable 🎯`);
    }
  }

  // Toggle Fix Piece Mode
  toggleFixPieceMode() {
    this.isFixPieceMode = !this.isFixPieceMode;
    const btn = document.getElementById('btn-custom-lock-mode');
    const bar = document.getElementById('fix-piece-bar');

    if (this.isFixPieceMode) {
      if (!this.selectedFixPiece) {
        const customKeys = Object.keys(window.CUSTOM_PIECES || {});
        this.selectedFixPiece = customKeys.length > 0 ? customKeys[0] : 'B';
      }
      const def = window.getPieceDef ? window.getPieceDef(this.selectedFixPiece) : window.PIECE_DEFINITIONS[this.selectedFixPiece];
      if (def) {
        this.selectedFixCoords = JSON.parse(JSON.stringify(def.coords));
      }
      this.manualHoles = [];

      if (btn) {
        btn.classList.add('active-fix-mode');
        btn.innerHTML = '🌟 Fix Mode: ON (Click Holes to Place)';
      }
      if (bar) bar.style.display = 'flex';
      this.updateFixPieceToolbar();

      if (window.game) {
        window.game.showToast(`📌 Fix Mode ON: Selected Piece ${this.selectedFixPiece}. Click holes to fix it in place!`);
      }
    } else {
      this.manualHoles = [];
      if (btn) {
        btn.classList.remove('active-fix-mode');
        btn.innerHTML = '📌 Fix Piece Mode';
      }
      if (bar) bar.style.display = 'none';
      if (window.game) {
        window.game.showToast("Hole Drill Mode: Single click toggles sockets/obstacles.");
      }
    }

    this.renderPainterGrid();
  }

  // Handle Double-Click on a cell in the board designer: Unlocks golden piece if clicked
  handlePieceDblClick(r, c) {
    if (!this.grid[r] || !this.grid[r][c]) return;

    // Check if (r, c) is already a Golden locked piece -> Unlock it!
    const goldenIdx = this.fixedPieces.findIndex(fp =>
      fp.coords.some(([dx, dy]) => (fp.row + dy) === r && (fp.col + dx) === c)
    );

    if (goldenIdx >= 0) {
      const unlocked = this.fixedPieces.splice(goldenIdx, 1)[0];
      this.lockCount = this.fixedPieces.length;

      // Re-solve remaining board considering any remaining golden pieces
      const res = window.kanoodleSolver.tileCustomBoard({
        width: this.width,
        height: this.height,
        activeHoles: this.getActiveHolesList(),
        fixedPieces: this.fixedPieces
      });

      if (res) {
        this.verifiedSolution = res.solution;
        this.fullSolution = [...res.solution];
        this.pieceCounts = { ...res.pieceCounts };
      }

      this.renderPainterGrid();
      this.renderInventoryPickers();
      this.updateStatsCounters();
      this.updateLockButtonsUI();

      if (window.soundEngine) window.soundEngine.playPickup();
      if (window.game) window.game.showToast(`Unlocked Piece ${unlocked.piece}. 🔓`);
    }
  }

  updateLockButtonsUI() {
    const btn0 = document.getElementById('btn-lock-0');
    const btn1 = document.getElementById('btn-lock-1');
    const btn2 = document.getElementById('btn-lock-2');
    const btnShuffle = document.getElementById('btn-shuffle-locks');

    [btn0, btn1, btn2].forEach(b => b && b.classList.remove('active'));

    if (this.lockCount === 0 && btn0) btn0.classList.add('active');
    else if (this.lockCount === 1 && btn1) btn1.classList.add('active');
    else if (this.lockCount === 2 && btn2) btn2.classList.add('active');

    if (btnShuffle) {
      btnShuffle.style.display = this.lockCount > 0 ? 'inline-flex' : 'none';
    }
  }

  renderSavedBoardsList() {
    const container = document.getElementById('saved-boards-list');
    if (!container) return;
    container.innerHTML = '';

    if (this.savedBoards.length === 0) {
      container.innerHTML = '<div class="empty-boards-msg">No saved custom boards yet. Create and save one!</div>';
      return;
    }

    this.savedBoards.forEach((board, idx) => {
      const card = document.createElement('div');
      card.className = 'saved-board-card';
      card.innerHTML = `
        <div class="saved-meta">
          <div class="saved-name">${board.name}</div>
          <div class="saved-details">${board.width}×${board.height} • ${board.holesCount} sockets • ${board.date}</div>
        </div>
        <div class="saved-actions">
          <button class="action-pill-btn primary" title="Load into game">Play</button>
          <button class="action-pill-btn secondary delete" title="Delete">🗑️</button>
        </div>
      `;

      card.querySelector('.primary').addEventListener('click', () => {
        this.loadBoardData(board);
        this.launchGameWithCurrentBoard();
      });

      card.querySelector('.delete').addEventListener('click', () => {
        this.savedBoards.splice(idx, 1);
        this.saveBoardsToStorage();
        this.renderSavedBoardsList();
      });

      container.appendChild(card);
    });
  }

  saveCurrentBoard() {
    const nameInput = document.getElementById('save-board-name-input');
    const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : `Custom Board ${this.savedBoards.length + 1}`;

    const boardRecord = {
      id: `board_${Date.now()}`,
      name: name,
      width: this.width,
      height: this.height,
      grid: JSON.parse(JSON.stringify(this.grid)),
      pieceCounts: { ...this.pieceCounts },
      holesCount: this.getActiveHolesCount(),
      beadsCount: this.getTotalBeadsCount() + this.getFixedBeadsCount(),
      fixedPieces: JSON.parse(JSON.stringify(this.fixedPieces || [])),
      fullSolution: this.fullSolution ? JSON.parse(JSON.stringify(this.fullSolution)) : null,
      solution: this.verifiedSolution || null,
      date: new Date().toLocaleDateString()
    };

    this.savedBoards.unshift(boardRecord);
    this.saveBoardsToStorage();
    this.renderSavedBoardsList();

    if (window.game) window.game.showToast(`Saved "${name}" successfully! 💾`);
  }

  loadBoardData(boardRecord) {
    this.width = boardRecord.width;
    this.height = boardRecord.height;
    this.grid = JSON.parse(JSON.stringify(boardRecord.grid));
    this.pieceCounts = { ...boardRecord.pieceCounts };
    this.fixedPieces = boardRecord.fixedPieces ? JSON.parse(JSON.stringify(boardRecord.fixedPieces)) : [];
    this.lockCount = this.fixedPieces.length;
    this.fullSolution = boardRecord.fullSolution ? JSON.parse(JSON.stringify(boardRecord.fullSolution)) : null;
    this.verifiedSolution = boardRecord.solution || null;
    this.updateLockButtonsUI();

    const wInput = document.getElementById('custom-width-input');
    const hInput = document.getElementById('custom-height-input');
    if (wInput) wInput.value = this.width;
    if (hInput) hInput.value = this.height;

    this.renderPainterGrid();
    this.renderInventoryPickers();
    this.updateStatsCounters();
  }

  updateStatsCounters() {
    const holes = this.getActiveHolesCount();
    const trayBeads = this.getTotalBeadsCount();
    const fixedBeads = this.getFixedBeadsCount();
    const totalBeads = trayBeads + fixedBeads;

    const holesEl = document.getElementById('custom-holes-count');
    if (holesEl) holesEl.textContent = `${holes} Sockets`;

    const beadsEl = document.getElementById('custom-beads-count');
    if (beadsEl) {
      if (fixedBeads > 0) {
        beadsEl.textContent = `${trayBeads} Tray (+${fixedBeads} 🔒)`;
      } else {
        beadsEl.textContent = `${totalBeads} Beads`;
      }
    }

    const balanceEl = document.getElementById('custom-balance-status');
    const solvabilityBadge = document.getElementById('custom-solvability-badge');
    const footerStatusText = document.getElementById('studio-footer-status-text');

    if (balanceEl) {
      if (holes === totalBeads && holes > 0) {
        balanceEl.className = 'balance-badge perfect';
        if (this.fixedPieces.length > 0) {
          balanceEl.textContent = `✓ Challenge Ready (${this.fixedPieces.length} Locked 🔒)`;
        } else {
          balanceEl.textContent = '✓ Perfect Fit (Holes == Beads)';
        }
      } else if (totalBeads < holes) {
        balanceEl.className = 'balance-badge under';
        balanceEl.textContent = `Need ${holes - totalBeads} more beads`;
      } else {
        balanceEl.className = 'balance-badge over';
        balanceEl.textContent = `${totalBeads - holes} extra beads`;
      }
    }

    if (solvabilityBadge) {
      if (holes === 0) {
        solvabilityBadge.className = 'balance-badge unknown';
        solvabilityBadge.textContent = '0 Sockets';
        if (footerStatusText) footerStatusText.textContent = 'Draw sockets on the grid to create your board.';
      } else if (holes !== totalBeads) {
        solvabilityBadge.className = 'balance-badge unsolvable';
        solvabilityBadge.textContent = '⚠️ Mismatch';
        if (footerStatusText) footerStatusText.textContent = `Bead mismatch (${totalBeads}/${holes} beads). Click Auto-Fix to balance.`;
      } else if (this.verifiedSolution) {
        solvabilityBadge.className = 'balance-badge solvable';
        solvabilityBadge.textContent = this.fixedPieces.length > 0 ? `✓ ${this.fixedPieces.length} Clues Locked` : '✓ 100% Solvable';
        if (footerStatusText) {
          footerStatusText.textContent = this.fixedPieces.length > 0
            ? `✓ Challenge Ready with ${this.fixedPieces.length} locked piece(s). Launch in 3D to play!`
            : '✓ Solvability Verified! Solution is ready to play.';
        }
      } else {
        // Quick solvability test
        const config = this.getBoardConfig();
        const testSol = window.kanoodleSolver ? window.kanoodleSolver.solveCustom(config, 1) : null;
        if (testSol) {
          this.verifiedSolution = testSol;
          this.fullSolution = testSol;
          solvabilityBadge.className = 'balance-badge solvable';
          solvabilityBadge.textContent = '✓ Solvable';
          if (footerStatusText) footerStatusText.textContent = '✓ Solvable layout detected. Ready to launch!';
        } else {
          solvabilityBadge.className = 'balance-badge unsolvable';
          solvabilityBadge.textContent = '⚠️ Unsolvable';
          if (footerStatusText) footerStatusText.textContent = '⚠️ Pieces cannot solve this obstacle layout. Click Auto-Fix.';
        }
      }
    }
  }

  // Exports custom board configuration to Game Engine
  getBoardConfig() {
    const activeHoles = new Set();
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        if (this.grid[r][c]) activeHoles.add(`${r},${c}`);
      }
    }

    // Build inventory instances (handling multiples of same piece!)
    const inventory = [];
    Object.entries(this.pieceCounts).forEach(([letter, count]) => {
      for (let i = 0; i < count; i++) {
        inventory.push({
          instanceId: `${letter}_${i}`,
          letter: letter,
          index: i
        });
      }
    });

    return {
      id: `custom_${Date.now()}`,
      title: this.fixedPieces.length > 0 ? `Custom Challenge (${this.fixedPieces.length} Clues 🔒)` : 'Custom Player Board',
      width: this.width,
      height: this.height,
      grid: this.grid,
      activeHoles: activeHoles,
      fixedPieces: JSON.parse(JSON.stringify(this.fixedPieces || [])),
      inventory: inventory,
      rawInventory: { ...this.pieceCounts },
      totalHoles: activeHoles.size,
      totalBeads: this.getTotalBeadsCount() + this.getFixedBeadsCount(),
      solution: this.fullSolution || this.verifiedSolution || null
    };
  }

  open() {
    const modal = document.getElementById('custom-studio-modal');
    if (modal) {
      modal.classList.add('show');
      const card = modal.querySelector('.studio-card');
      if (card) {
        card.scrollTop = 0;
        card.scrollLeft = 0;
      }
      const presets = document.getElementById('custom-presets-list');
      if (presets) {
        presets.scrollLeft = 0;
      }
      this.renderPainterGrid();
      this.renderInventoryPickers();
      this.renderSavedBoardsList();
      this.updateStatsCounters();
    }
  }

  close() {
    const modal = document.getElementById('custom-studio-modal');
    if (modal) modal.classList.remove('show');
    this.closeSolvabilityModal();
  }

  showSolvabilityModal(config) {
    const modal = document.getElementById('custom-solvability-modal');
    if (!modal) return;

    const descEl = document.getElementById('solvability-modal-desc');
    const detailsEl = document.getElementById('solvability-details-box');

    if (config.totalBeads !== config.totalHoles) {
      if (descEl) descEl.textContent = `Your custom board has ${config.totalHoles} sockets, but your inventory currently has ${config.totalBeads} beads.`;
      if (detailsEl) detailsEl.textContent = `Kanoodle's Exact-Cover algorithm can automatically adjust piece quantities or add matching pieces to make total beads exactly equal ${config.totalHoles} and guarantee a 100% playable game!`;
    } else {
      if (descEl) descEl.textContent = `Total beads (${config.totalBeads}) equal sockets, but these pieces cannot geometrically tile around the obstacles on your board.`;
      if (detailsEl) detailsEl.textContent = `Click below to let Kanoodle automatically swap or adjust pieces to perfectly tile your custom board shape with a verified solution.`;
    }

    modal.classList.add('show');
  }

  closeSolvabilityModal() {
    const modal = document.getElementById('custom-solvability-modal');
    if (modal) modal.classList.remove('show');
  }

  launchGameWithCurrentBoard() {
    const holes = this.getActiveHolesCount();
    if (holes === 0) {
      if (window.game) window.game.showToast("Cannot launch: Board has no drilled sockets! Click to draw sockets first.");
      if (window.soundEngine) window.soundEngine.playError();
      return;
    }

    // Step 1: Check if already verified and matching
    let solution = this.verifiedSolution;
    const config = this.getBoardConfig();
    if (!solution || config.totalBeads !== config.totalHoles) {
      // Auto-prepare solvable pieces preserving fixed pieces!
      const res = this.autoSolveAndBalance();
      if (!res) return;
      solution = res.solution;
    }

    // Direct 3D launch
    const updatedConfig = this.getBoardConfig();
    updatedConfig.solution = solution;
    updatedConfig.isVerifiedSolvable = true;
    this.close();
    if (window.game) {
      window.game.loadCustomBoard(updatedConfig);
      window.game.showToast(this.fixedPieces.length > 0
        ? `🎮 Playing Custom Challenge with ${this.fixedPieces.length} locked clue(s)! Solve the rest!`
        : `🎮 Custom Board Loaded! Place your pieces to solve!`
      );
    }
  }

  bindEvents() {
    // Dimension sliders / inputs
    const wInput = document.getElementById('custom-width-input');
    const hInput = document.getElementById('custom-height-input');
    if (wInput) {
      wInput.addEventListener('input', (e) => {
        this.verifiedSolution = null;
        this.resizeGrid(parseInt(e.target.value), this.height);
      });
    }
    if (hInput) {
      hInput.addEventListener('input', (e) => {
        this.verifiedSolution = null;
        this.resizeGrid(this.width, parseInt(e.target.value));
      });
    }

    // Quick Painter Buttons
    document.getElementById('btn-fill-all-holes')?.addEventListener('click', () => {
      this.grid = this.createEmptyGrid(this.width, this.height, true);
      this.verifiedSolution = null;
      this.renderPainterGrid();
      this.updateStatsCounters();
    });

    document.getElementById('btn-clear-all-holes')?.addEventListener('click', () => {
      this.grid = this.createEmptyGrid(this.width, this.height, false);
      this.verifiedSolution = null;
      this.renderPainterGrid();
      this.updateStatsCounters();
    });

    document.getElementById('btn-invert-holes')?.addEventListener('click', () => {
      for (let r = 0; r < this.height; r++) {
        for (let c = 0; c < this.width; c++) {
          this.grid[r][c] = !this.grid[r][c];
        }
      }
      this.verifiedSolution = null;
      this.renderPainterGrid();
      this.updateStatsCounters();
    });

    document.getElementById('btn-auto-match-pieces')?.addEventListener('click', () => {
      this.autoMatchPieces();
    });

    // Challenge Mode Lock Buttons
    document.getElementById('btn-lock-0')?.addEventListener('click', () => {
      this.setLockChallenge(0);
    });
    document.getElementById('btn-lock-1')?.addEventListener('click', () => {
      this.setLockChallenge(1);
    });
    document.getElementById('btn-lock-2')?.addEventListener('click', () => {
      this.setLockChallenge(2);
    });
    document.getElementById('btn-shuffle-locks')?.addEventListener('click', () => {
      this.setLockChallenge(this.lockCount || 1);
    });

    // Custom Fix Piece Mode Toggle Button
    document.getElementById('btn-custom-lock-mode')?.addEventListener('click', () => {
      this.toggleFixPieceMode();
    });

    // Clear Fixed Clues Button
    document.getElementById('btn-clear-fixed-clues')?.addEventListener('click', () => {
      this.fixedPieces = [];
      this.lockCount = 0;
      this.manualHoles = [];
      this.updateLockButtonsUI();
      this.renderPainterGrid();
      this.renderInventoryPickers();
      this.updateStatsCounters();
      if (window.soundEngine) window.soundEngine.playPickup();
      if (window.game) window.game.showToast("Cleared all fixed golden pieces from board. 🗑️");
    });

    // Fix Piece Toolbar Bindings
    document.getElementById('fix-piece-dropdown')?.addEventListener('change', (e) => {
      this.selectedFixPiece = e.target.value;
      const def = window.getPieceDef ? window.getPieceDef(this.selectedFixPiece) : window.PIECE_DEFINITIONS[this.selectedFixPiece];
      if (def) {
        this.selectedFixCoords = JSON.parse(JSON.stringify(def.coords));
        this.manualHoles = [];
        this.updateFixPieceToolbar();
        this.renderPainterGrid();
      }
    });

    document.getElementById('btn-fix-rotate')?.addEventListener('click', () => {
      this.rotateFixCoords();
    });

    document.getElementById('btn-fix-flip')?.addEventListener('click', () => {
      this.flipFixCoords();
    });

    document.getElementById('btn-fix-clear-all')?.addEventListener('click', () => {
      this.fixedPieces = [];
      this.lockCount = 0;
      this.manualHoles = [];
      this.updateLockButtonsUI();
      this.renderPainterGrid();
      this.renderInventoryPickers();
      this.updateStatsCounters();
      if (window.soundEngine) window.soundEngine.playPickup();
      if (window.game) window.game.showToast("Cleared all fixed pieces from board. 🗑️");
    });

    document.getElementById('btn-fix-done')?.addEventListener('click', () => {
      this.toggleFixPieceMode();
    });

    window.addEventListener('keydown', (e) => {
      if (!this.isFixPieceMode) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.code === 'KeyR') {
        e.preventDefault();
        this.rotateFixCoords();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        this.flipFixCoords();
      }
    });

    // Auto-Solve & Guarantee Solvable Buttons
    document.getElementById('btn-auto-solve-board')?.addEventListener('click', () => {
      this.autoSolveAndBalance();
    });
    document.getElementById('btn-footer-auto-solve')?.addEventListener('click', () => {
      this.autoSolveAndBalance();
    });

    // Solvability Modal Buttons
    document.getElementById('btn-modal-autofix-play')?.addEventListener('click', () => {
      const res = this.autoSolveAndBalance();
      if (res) {
        this.closeSolvabilityModal();
        this.close();
        const config = this.getBoardConfig();
        config.solution = res.solution;
        config.isVerifiedSolvable = true;
        if (window.game) window.game.loadCustomBoard(config);
      }
    });

    document.getElementById('btn-modal-keep-editing')?.addEventListener('click', () => {
      this.closeSolvabilityModal();
    });

    // Custom shape creator color selection (Swatches + Interactive Color Wheel)
    const colorPickers = document.querySelectorAll('.creator-color-swatch');
    const colorWheel = document.getElementById('creator-color-wheel');
    const colorIndicator = document.getElementById('creator-color-indicator');
    const colorHexVal = document.getElementById('creator-color-hex-val');

    const setCreatorColor = (hexStr, fromWheel = false) => {
      this.creatorColor = hexStr;
      this.creatorColorHex = parseInt(hexStr.replace('#', '0x'), 16);
      if (colorIndicator) colorIndicator.style.backgroundColor = hexStr;
      if (colorHexVal) colorHexVal.textContent = hexStr.toUpperCase();
      if (colorWheel && !fromWheel) colorWheel.value = hexStr;
      this.renderCreatorGrid();
    };

    if (colorWheel) {
      const handleWheel = (e) => {
        colorPickers.forEach(s => s.classList.remove('selected'));
        setCreatorColor(e.target.value, true);
      };
      colorWheel.addEventListener('input', handleWheel);
      colorWheel.addEventListener('change', handleWheel);
    }

    colorPickers.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorPickers.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        setCreatorColor(swatch.dataset.color, false);
      });
    });

    document.getElementById('btn-save-custom-shape')?.addEventListener('click', () => {
      this.saveCustomCreatedShape();
    });

    document.getElementById('btn-save-board')?.addEventListener('click', () => {
      this.saveCurrentBoard();
    });

    document.getElementById('btn-play-custom-board')?.addEventListener('click', () => {
      this.launchGameWithCurrentBoard();
    });

    // Tab switching inside Studio Modal
    const tabs = document.querySelectorAll('.studio-tab-btn');
    const tabPanes = document.querySelectorAll('.studio-tab-pane');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const targetId = tab.dataset.target;
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Open Studio Modal Button
    document.getElementById('btn-open-studio')?.addEventListener('click', () => {
      this.open();
    });
    document.getElementById('mode-custom')?.addEventListener('click', () => {
      this.open();
    });
    document.getElementById('studio-close-btn')?.addEventListener('click', () => {
      this.close();
    });
  }
}

window.CustomStudio = CustomStudio;
