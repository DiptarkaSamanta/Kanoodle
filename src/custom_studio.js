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

    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const cell = document.createElement('div');
        cell.className = `painter-cell ${this.grid[r][c] ? 'active-hole' : 'solid-block'}`;
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.title = `(${r}, ${c}): ${this.grid[r][c] ? 'Hole (Socket)' : 'Solid Plastic Obstacle'}`;

        cell.addEventListener('mousedown', (e) => {
          this.isDrawing = true;
          this.drawMode = !this.grid[r][c]; // Toggle mode based on initial cell
          this.toggleCell(r, c, this.drawMode);
        });

        cell.addEventListener('mouseenter', () => {
          if (this.isDrawing) {
            this.toggleCell(r, c, this.drawMode);
          }
        });

        container.appendChild(cell);
      }
    }

    window.addEventListener('mouseup', () => {
      this.isDrawing = false;
    });
  }

  toggleCell(r, c, val) {
    if (r < 0 || r >= this.height || c < 0 || c >= this.width) return;
    this.grid[r][c] = val !== undefined ? val : !this.grid[r][c];

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
    const container = document.getElementById('custom-inventory-list');
    if (!container) return;
    container.innerHTML = '';

    // Standard + Extended + Custom pieces
    const allDefs = [];
    Object.values(window.PIECE_DEFINITIONS || {}).forEach(d => allDefs.push(d));
    Object.values(window.EXTENDED_PIECE_DEFINITIONS || {}).forEach(d => allDefs.push(d));
    Object.values(window.CUSTOM_PIECES || {}).forEach(d => allDefs.push(d));

    allDefs.forEach(def => {
      const count = this.pieceCounts[def.letter] || 0;
      const row = document.createElement('div');
      row.className = `inventory-piece-row ${count > 0 ? 'selected-piece' : ''}`;

      const thumb = window.generatePieceSVG ? window.generatePieceSVG(def.letter, def.coords, 38) : '';

      row.innerHTML = `
        <div class="inv-thumb">${thumb}</div>
        <div class="inv-meta">
          <span class="inv-name" style="color:${def.color}">Piece ${def.letter} (${def.name || ''})</span>
          <span class="inv-spheres">${def.spheres} beads</span>
        </div>
        <div class="inv-stepper">
          <button class="step-btn minus" data-letter="${def.letter}">−</button>
          <span class="step-val" id="step-count-${def.letter}">${count}</span>
          <button class="step-btn plus" data-letter="${def.letter}">+</button>
        </div>
      `;

      row.querySelector('.minus').addEventListener('click', () => {
        this.pieceCounts[def.letter] = Math.max(0, (this.pieceCounts[def.letter] || 0) - 1);
        if (this.pieceCounts[def.letter] === 0) delete this.pieceCounts[def.letter];
        this.renderInventoryPickers();
        this.updateStatsCounters();
      });

      row.querySelector('.plus').addEventListener('click', () => {
        this.pieceCounts[def.letter] = Math.min(10, (this.pieceCounts[def.letter] || 0) + 1);
        this.renderInventoryPickers();
        this.updateStatsCounters();
      });

      container.appendChild(row);
    });
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

    // Reset grid
    this.creatorGrid = Array(5).fill(null).map(() => Array(5).fill(false));
    this.renderCreatorGrid();
    this.renderInventoryPickers();
    this.updateStatsCounters();

    if (window.game) window.game.showToast(`Saved custom piece: "${shapeName}"! ✨`);
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
      beadsCount: this.getTotalBeadsCount(),
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
    const beads = this.getTotalBeadsCount();

    const holesEl = document.getElementById('custom-holes-count');
    if (holesEl) holesEl.textContent = `${holes} Sockets`;

    const beadsEl = document.getElementById('custom-beads-count');
    if (beadsEl) beadsEl.textContent = `${beads} Beads`;

    const balanceEl = document.getElementById('custom-balance-status');
    if (balanceEl) {
      if (holes === beads && holes > 0) {
        balanceEl.className = 'balance-badge perfect';
        balanceEl.textContent = '✓ Perfect Fit (Holes == Beads)';
      } else if (beads < holes) {
        balanceEl.className = 'balance-badge under';
        balanceEl.textContent = `Need ${holes - beads} more beads`;
      } else {
        balanceEl.className = 'balance-badge over';
        balanceEl.textContent = `${beads - holes} extra beads`;
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
      title: 'Custom Player Board',
      width: this.width,
      height: this.height,
      grid: this.grid,
      activeHoles: activeHoles,
      inventory: inventory,
      rawInventory: { ...this.pieceCounts },
      totalHoles: activeHoles.size,
      totalBeads: this.getTotalBeadsCount()
    };
  }

  open() {
    const modal = document.getElementById('custom-studio-modal');
    if (modal) {
      modal.classList.add('show');
      this.renderPainterGrid();
      this.renderInventoryPickers();
      this.renderSavedBoardsList();
      this.updateStatsCounters();
    }
  }

  close() {
    const modal = document.getElementById('custom-studio-modal');
    if (modal) modal.classList.remove('show');
  }

  launchGameWithCurrentBoard() {
    const config = this.getBoardConfig();
    if (config.totalHoles === 0) {
      if (window.game) window.game.showToast("Cannot launch: Board has no drilled holes! Draw some holes first.");
      return;
    }

    this.close();

    if (window.game) {
      window.game.loadCustomBoard(config);
    }
  }

  bindEvents() {
    // Dimension sliders / inputs
    const wInput = document.getElementById('custom-width-input');
    const hInput = document.getElementById('custom-height-input');
    if (wInput) {
      wInput.addEventListener('input', (e) => this.resizeGrid(parseInt(e.target.value), this.height));
    }
    if (hInput) {
      hInput.addEventListener('input', (e) => this.resizeGrid(this.width, parseInt(e.target.value)));
    }

    // Quick Painter Buttons
    document.getElementById('btn-fill-all-holes')?.addEventListener('click', () => {
      this.grid = this.createEmptyGrid(this.width, this.height, true);
      this.renderPainterGrid();
      this.updateStatsCounters();
    });

    document.getElementById('btn-clear-all-holes')?.addEventListener('click', () => {
      this.grid = this.createEmptyGrid(this.width, this.height, false);
      this.renderPainterGrid();
      this.updateStatsCounters();
    });

    document.getElementById('btn-invert-holes')?.addEventListener('click', () => {
      for (let r = 0; r < this.height; r++) {
        for (let c = 0; c < this.width; c++) {
          this.grid[r][c] = !this.grid[r][c];
        }
      }
      this.renderPainterGrid();
      this.updateStatsCounters();
    });

    document.getElementById('btn-auto-match-pieces')?.addEventListener('click', () => {
      this.autoMatchPieces();
    });

    // Custom shape creator color swatches
    const colorPickers = document.querySelectorAll('.creator-color-swatch');
    colorPickers.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorPickers.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        this.creatorColor = swatch.dataset.color;
        this.creatorColorHex = parseInt(this.creatorColor.replace('#', '0x'), 16);
        this.renderCreatorGrid();
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
      document.getElementById('custom-studio-modal')?.classList.add('show');
    });
    document.getElementById('studio-close-btn')?.addEventListener('click', () => {
      document.getElementById('custom-studio-modal')?.classList.remove('show');
    });
  }
}

window.CustomStudio = CustomStudio;
