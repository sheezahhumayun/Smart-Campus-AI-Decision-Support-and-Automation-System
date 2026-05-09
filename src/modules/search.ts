import { CAMPUS_NODES, CAMPUS_EDGES } from '../constants';
import { SearchOutput } from '../types';

/**
 * Calculates straight-line distance between two nodes for A* heuristic
 */
function getHeuristic(currentId: string, targetId: string): number {
  const current = CAMPUS_NODES[currentId];
  const target = CAMPUS_NODES[targetId];
  if (!current || !target) return 0;
  
  const [x1, y1] = current.coords;
  const [x2, y2] = target.coords;
  
  // Apply a scaling factor to guarantee admissibility (never overestimating actual edge costs)
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) * 0.4;
}

/**
 * Breadth-First Search for unweighted graphs
 */
export function bfs(start: string, goal: string): SearchOutput {
  const startTime = performance.now();
  const queue: [string, string[]][] = [[start, [start]]];
  const visited = new Set<string>();
  let nodesExpanded = 0;

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    nodesExpanded++;
    
    if (current === goal) {
      return {
        algorithm_used: 'BFS',
        path,
        cost: path.length - 1,
        steps: path.length - 1,
        nodes_expanded: nodesExpanded,
        execution_time: `${(performance.now() - startTime).toFixed(3)}ms`
      };
    }

    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = CAMPUS_EDGES.filter(e => e.from === current).map(e => e.to);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }
  }

  throw new Error(`No route found from ${start} to ${goal} using BFS`);
}

/**
 * Depth-First Search (Academic Comparison Algorithm)
 */
export function dfs(start: string, goal: string, limit: number = 100): SearchOutput {
  const startTime = performance.now();
  const stack: [string, string[]][] = [[start, [start]]];
  const visited = new Set<string>();
  let nodesExpanded = 0;

  while (stack.length > 0) {
    const [current, path] = stack.pop()!;
    nodesExpanded++;

    if (current === goal) {
      return {
        algorithm_used: 'DFS',
        path,
        cost: path.length - 1, // Inaccurate for weighted, but standard for DFS hops
        steps: path.length - 1,
        nodes_expanded: nodesExpanded,
        execution_time: `${(performance.now() - startTime).toFixed(3)}ms`
      };
    }

    if (!visited.has(current) && path.length <= limit) {
      visited.add(current);
      const neighbors = CAMPUS_EDGES.filter(e => e.from === current).map(e => e.to);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push([neighbor, [...path, neighbor]]);
        }
      }
    }
  }
  throw new Error(`DFS failed to find route`);
}

/**
 * Depth-Limited Search (Academic Comparison Algorithm)
 */
export function dls(start: string, goal: string, limit: number): SearchOutput {
  const startTime = performance.now();
  let nodesExpanded = 0;

  function recursiveDLS(current: string, path: string[], depth: number): string[] | null {
    nodesExpanded++;
    if (current === goal) return path;
    if (depth >= limit) return null;

    const neighbors = CAMPUS_EDGES.filter(e => e.from === current).map(e => e.to);
    for (const neighbor of neighbors) {
      if (!path.includes(neighbor)) {
        const result = recursiveDLS(neighbor, [...path, neighbor], depth + 1);
        if (result) return result;
      }
    }
    return null;
  }

  const resultPath = recursiveDLS(start, [start], 0);
  if (resultPath) {
    return {
      algorithm_used: 'DLS',
      path: resultPath,
      cost: resultPath.length - 1,
      steps: resultPath.length - 1,
      nodes_expanded: nodesExpanded,
      execution_time: `${(performance.now() - startTime).toFixed(3)}ms`
    };
  }
  throw new Error(`DLS failed at depth ${limit}`);
}

/**
 * Iterative Deepening Search (Academic Comparison Algorithm)
 */
export function ids(start: string, goal: string, maxDepth: number = 10): SearchOutput {
  const startTime = performance.now();
  let totalNodesExpanded = 0;

  for (let depth = 0; depth <= maxDepth; depth++) {
    try {
      const result = dls(start, goal, depth);
      totalNodesExpanded += result.nodes_expanded || 0;
      return {
        ...result,
        algorithm_used: 'IDS',
        nodes_expanded: totalNodesExpanded,
        execution_time: `${(performance.now() - startTime).toFixed(3)}ms`
      };
    } catch {
      // Continue to next depth
    }
  }
  throw new Error(`IDS failed within depth ${maxDepth}`);
}

/**
 * Uniform Cost Search (fallback for weighted graphs)
 */
export function ucs(start: string, goal: string): SearchOutput {
  const startTime = performance.now();
  const priorityQueue: { node: string; path: string[]; cost: number }[] = [
    { node: start, path: [start], cost: 0 }
  ];
  const visited = new Map<string, number>();
  let nodesExpanded = 0;

  while (priorityQueue.length > 0) {
    priorityQueue.sort((a, b) => a.cost - b.cost);
    const { node, path, cost } = priorityQueue.shift()!;
    nodesExpanded++;

    if (node === goal) {
      return {
        algorithm_used: 'UCS',
        path,
        cost,
        steps: path.length - 1,
        nodes_expanded: nodesExpanded,
        execution_time: `${(performance.now() - startTime).toFixed(3)}ms`
      };
    }

    if (!visited.has(node) || visited.get(node)! > cost) {
      visited.set(node, cost);
      const outgoingEdges = CAMPUS_EDGES.filter(e => e.from === node);
      for (const edge of outgoingEdges) {
        priorityQueue.push({
          node: edge.to,
          path: [...path, edge.to],
          cost: cost + edge.weight
        });
      }
    }
  }

  throw new Error(`No route found from ${start} to ${goal} using UCS`);
}

/**
 * Greedy Best-First Search (Academic Comparison Algorithm)
 */
export function greedyBestFirst(start: string, goal: string): SearchOutput {
  const startTime = performance.now();
  const priorityQueue: { node: string; path: string[]; h: number }[] = [
    { node: start, path: [start], h: getHeuristic(start, goal) }
  ];
  const visited = new Set<string>();
  let nodesExpanded = 0;

  while (priorityQueue.length > 0) {
    priorityQueue.sort((a, b) => a.h - b.h);
    const { node, path } = priorityQueue.shift()!;
    nodesExpanded++;

    if (node === goal) {
      return {
        algorithm_used: 'Greedy-BFS',
        path,
        cost: 0, // Not optimized for cost
        steps: path.length - 1,
        nodes_expanded: nodesExpanded,
        execution_time: `${(performance.now() - startTime).toFixed(3)}ms`
      };
    }

    if (!visited.has(node)) {
      visited.add(node);
      const neighbors = CAMPUS_EDGES.filter(e => e.from === node);
      for (const edge of neighbors) {
        priorityQueue.push({
          node: edge.to,
          path: [...path, edge.to],
          h: getHeuristic(edge.to, goal)
        });
      }
    }
  }
  throw new Error(`Greedy BFS failed`);
}

/**
 * A* Search for weighted graphs with heuristics
 */
export function aStar(start: string, goal: string): SearchOutput {
  const startTime = performance.now();
  const priorityQueue: { node: string; path: string[]; g: number; f: number }[] = [
    { node: start, path: [start], g: 0, f: getHeuristic(start, goal) }
  ];
  const visited = new Map<string, number>();
  let nodesExpanded = 0;

  while (priorityQueue.length > 0) {
    priorityQueue.sort((a, b) => a.f - b.f);
    const { node, path, g } = priorityQueue.shift()!;
    nodesExpanded++;

    if (node === goal) {
      return {
        algorithm_used: 'A*',
        path,
        cost: g,
        steps: path.length - 1,
        nodes_expanded: nodesExpanded,
        execution_time: `${(performance.now() - startTime).toFixed(3)}ms`
      };
    }

    if (!visited.has(node) || visited.get(node)! > g) {
      visited.set(node, g);
      const outgoingEdges = CAMPUS_EDGES.filter(e => e.from === node);
      for (const edge of outgoingEdges) {
        const nextG = g + edge.weight;
        const nextF = nextG + getHeuristic(edge.to, goal);
        priorityQueue.push({
          node: edge.to,
          path: [...path, edge.to],
          g: nextG,
          f: nextF
        });
      }
    }
  }

  throw new Error(`No route found from ${start} to ${goal} using A*`);
}

export function computeRoute(start: string, goal: string, graphType: 'weighted' | 'unweighted' = 'weighted'): SearchOutput {
  // Section 7.2 Strategy
  if (graphType === 'unweighted') {
    return bfs(start, goal);
  } else {
    // Weighted graph
    const h = getHeuristic(start, goal);
    if (h > 0) {
      return aStar(start, goal);
    } else {
      return ucs(start, goal);
    }
  }
}
