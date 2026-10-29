// Exact Cover (Algorithm X) Solver for Kanoodle 2D & 3D

class KanoodleSolver {
  constructor() {
    this.width = 11;
    this.height = 5;
    this.totalCells = this.width * this.height; // 55
    this.pieces = Object.keys(window.PIECE_DEFINITIONS || {});
    this.precomputeRows();
  }

  precomputeRows() {
    // Generate all legal placements on the 11x5 board
    // Columns: 12 pieces + 55 cells (indexed 0..66)
    this.cols = [...this.pieces];
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        this.cols.push(`c_${r}_${c}`);
      }
    }

    this.colIndex = new Map();
    this.cols.forEach((col, idx) => this.colIndex.set(col, idx));

    this.allPlacements = []; // { piece, coords, row, col, colsCovered: [] }

    this.pieces.forEach(p => {
      const def = window.PIECE_DEFINITIONS[p];
      if (!def) return;
      def.orientations.forEach(shape => {
        const maxX = Math.max(...shape.map(([x]) => x));
        const maxY = Math.max(...shape.map(([, y]) => y));

        for (let r = 0; r <= this.height - 1 - maxY; r++) {
          for (let c = 0; c <= this.width - 1 - maxX; c++) {
            const coveredCols = [this.colIndex.get(p)];
            shape.forEach(([dx, dy]) => {
              coveredCols.push(this.colIndex.get(`c_${r + dy}_${c + dx}`));
            });

            this.allPlacements.push({
              piece: p,
              coords: shape,
              row: r,
              col: c,
              coveredCols: coveredCols
            });
          }
        }
      });
    });
  }

  // Exact cover recursion
  solveExactCover(X, Y, solution = [], maxCount = 1) {
    const results = [];

    const search = () => {
      if (X.size === 0) {
        results.push([...solution]);
        return results.length >= maxCount;
      }

      // Choose column with minimum options (heuristic)
      let minCol = null;
      let minSize = Infinity;
      for (const [col, rowSet] of X.entries()) {
        if (rowSet.size < minSize) {
          minSize = rowSet.size;
          minCol = col;
          if (minSize === 0) break; // Dead end branch
        }
      }

      if (minSize === 0 || minCol === null) return false;

      const candidateRows = Array.from(X.get(minCol));
      for (const r of candidateRows) {
        solution.push(r);
        const removedCols = [];

        // Cover columns satisfied by row r
        for (const j of Y[r]) {
          const rowsInCol = X.get(j);
          if (!rowsInCol) continue;
          for (const i of rowsInCol) {
            for (const k of Y[i]) {
              if (k !== j && X.has(k)) {
                X.get(k).delete(i);
              }
            }
          }
          removedCols.push({ col: j, set: rowsInCol });
          X.delete(j);
        }

        const done = search();
        solution.pop();

        // Backtrack: uncover columns in reverse order
        for (let idx = removedCols.length - 1; idx >= 0; idx--) {
          const { col: j, set: rowsInCol } = removedCols[idx];
          X.set(j, rowsInCol);
          for (const i of rowsInCol) {
            for (const k of Y[i]) {
              if (k !== j && X.has(k)) {
                X.get(k).add(i);
              }
            }
          }
        }

        if (done) return true;
      }
      return false;
    };

    search();
    return results;
  }

  // Solves the remaining board given placed pieces
  solve(placedPieces = [], maxSolutions = 1) {
    if (!this.allPlacements || this.allPlacements.length === 0) {
      this.precomputeRows();
    }

    const occupiedCells = new Set();
    const usedPieces = new Set();

    // Verify given pieces don't clash internally
    for (const p of placedPieces) {
      if (usedPieces.has(p.piece)) return null;
      usedPieces.add(p.piece);
      for (const [dx, dy] of p.coords) {
        const nr = p.row + dy;
        const nc = p.col + dx;
        const key = `c_${nr}_${nc}`;
        if (nr < 0 || nr >= this.height || nc < 0 || nc >= this.width) return null;
        if (occupiedCells.has(key)) return null;
        occupiedCells.add(key);
      }
    }

    // Build submatrix excluding already satisfied piece columns and cell columns
    const initialCoveredCols = new Set();
    usedPieces.forEach(p => initialCoveredCols.add(this.colIndex.get(p)));
    occupiedCells.forEach(cellKey => initialCoveredCols.add(this.colIndex.get(cellKey)));

    // Filter available rows: row must not use used piece or occupied cell
    const validRowIndices = [];
    this.allPlacements.forEach((placement, rIdx) => {
      if (usedPieces.has(placement.piece)) return;
      let conflicts = false;
      for (const colIdx of placement.coveredCols) {
        if (initialCoveredCols.has(colIdx)) {
          conflicts = true;
          break;
        }
      }
      if (!conflicts) {
        validRowIndices.push(rIdx);
      }
    });

    // Build X map: remaining columns -> Set of valid rows covering it
    const X = new Map();
    for (let c = 0; c < this.cols.length; c++) {
      if (!initialCoveredCols.has(c)) {
        X.set(c, new Set());
      }
    }

    const Y = {};
    validRowIndices.forEach(rIdx => {
      const placement = this.allPlacements[rIdx];
      const remainingCovered = placement.coveredCols.filter(c => !initialCoveredCols.has(c));
      Y[rIdx] = remainingCovered;
      remainingCovered.forEach(c => {
        if (X.has(c)) {
          X.get(c).add(rIdx);
        }
      });
    });

    const rawSolutions = this.solveExactCover(X, Y, [], maxSolutions);
    if (rawSolutions.length === 0) return null;

    // Convert raw row indices back to piece placements
    const solutions = rawSolutions.map(solRows => {
      const fullSolution = [...placedPieces];
      solRows.forEach(rIdx => {
        const p = this.allPlacements[rIdx];
        fullSolution.push({
          piece: p.piece,
          coords: p.coords,
          row: p.row,
          col: p.col
        });
      });
      return fullSolution;
    });

    return maxSolutions === 1 ? solutions[0] : solutions;
  }

  // Get a single hint piece to place
  getHint(placedPieces = []) {
    const full = this.solve(placedPieces, 1);
    if (!full) return null;

    const placedLetters = new Set(placedPieces.map(p => p.piece));
    const nextPiece = full.find(p => !placedLetters.has(p.piece));
    return nextPiece || null;
  }

  // Check if current board is solvable
  isValid(placedPieces = []) {
    const sol = this.solve(placedPieces, 1);
    return sol !== null;
  }

  // Solves arbitrary custom board with custom holes and custom piece inventories (including duplicate pieces!)
  solveCustom({ width, height, activeHoles, inventory, placed = [] }, maxSolutions = 1) {
    const activeSet = new Set();
    if (activeHoles) {
      activeHoles.forEach(h => {
        if (Array.isArray(h)) {
          activeSet.add(`${h[0]},${h[1]}`);
        } else if (typeof h === 'string') {
          activeSet.add(h);
        }
      });
    }

    const occupied = new Set();
    const placedInstances = new Set();

    // Check placed pieces
    for (const p of placed) {
      if (placedInstances.has(p.instanceId)) return null;
      placedInstances.add(p.instanceId);
      for (const [dx, dy] of p.coords) {
        const nr = p.row + dy;
        const nc = p.col + dx;
        const key = `${nr},${nc}`;
        if (!activeSet.has(key)) return null;
        if (occupied.has(key)) return null;
        occupied.add(key);
      }
    }

    // Remaining empty active holes
    const remainingHoles = [];
    activeSet.forEach(key => {
      if (!occupied.has(key)) {
        remainingHoles.push(key);
      }
    });

    // Normalize inventory into array of instances
    let instanceList = [];
    if (Array.isArray(inventory)) {
      instanceList = inventory;
    } else if (typeof inventory === 'object' && inventory !== null) {
      Object.entries(inventory).forEach(([letter, count]) => {
        for (let i = 0; i < count; i++) {
          instanceList.push({
            instanceId: `${letter}_${i}`,
            letter: letter,
            index: i
          });
        }
      });
    }

    // Unplaced inventory instances
    const unplacedInstances = instanceList.filter(inst => !placedInstances.has(inst.instanceId));

    // Fast check: sum of spheres must match remaining holes
    let totalUnplacedSpheres = 0;
    unplacedInstances.forEach(inst => {
      const def = window.getPieceDef ? window.getPieceDef(inst.letter) : window.PIECE_DEFINITIONS[inst.letter];
      if (def) totalUnplacedSpheres += def.spheres;
    });

    if (totalUnplacedSpheres !== remainingHoles.length) {
      return null;
    }

    if (unplacedInstances.length === 0) {
      return [...placed];
    }

    // Columns: instance IDs + remaining holes
    const cols = [...unplacedInstances.map(inst => `inst_${inst.instanceId}`), ...remainingHoles.map(k => `h_${k}`)];
    const colIndex = new Map();
    cols.forEach((col, idx) => colIndex.set(col, idx));

    const X = new Map();
    cols.forEach((col, idx) => X.set(idx, new Set()));

    const Y = [];
    const rowMeta = [];

    unplacedInstances.forEach(inst => {
      const def = window.getPieceDef ? window.getPieceDef(inst.letter) : window.PIECE_DEFINITIONS[inst.letter];
      if (!def) return;
      const instCol = colIndex.get(`inst_${inst.instanceId}`);

      def.orientations.forEach(shape => {
        const maxX = Math.max(...shape.map(([x]) => x));
        const maxY = Math.max(...shape.map(([, y]) => y));

        for (let r = 0; r <= height - 1 - maxY; r++) {
          for (let c = 0; c <= width - 1 - maxX; c++) {
            let fits = true;
            const coveredCols = [instCol];
            for (const [dx, dy] of shape) {
              const key = `${r + dy},${c + dx}`;
              if (!activeSet.has(key) || occupied.has(key)) {
                fits = false;
                break;
              }
              const hCol = colIndex.get(`h_${key}`);
              if (hCol === undefined) {
                fits = false;
                break;
              }
              coveredCols.push(hCol);
            }

            if (fits) {
              const rIdx = Y.length;
              Y.push(coveredCols);
              rowMeta.push({
                instanceId: inst.instanceId,
                piece: inst.letter,
                coords: shape,
                row: r,
                col: c
              });
              coveredCols.forEach(j => {
                if (X.has(j)) X.get(j).add(rIdx);
              });
            }
          }
        }
      });
    });

    const rawSolutions = this.solveExactCover(X, Y, [], maxSolutions);
    if (!rawSolutions || rawSolutions.length === 0) return null;

    const solutions = rawSolutions.map(solRows => {
      const full = [...placed];
      solRows.forEach(rIdx => {
        full.push(rowMeta[rIdx]);
      });
      return full;
    });

    return maxSolutions === 1 ? solutions[0] : solutions;
  }

  getCustomHint(customContext) {
    const full = this.solveCustom(customContext, 1);
    if (!full) return null;
    const placedIds = new Set((customContext.placed || []).map(p => p.instanceId));
    return full.find(p => !placedIds.has(p.instanceId)) || null;
  }

  isCustomSolvable(customContext) {
    return this.solveCustom(customContext, 1) !== null;
  }
}

window.KanoodleSolver = KanoodleSolver;
window.kanoodleSolver = new KanoodleSolver();
