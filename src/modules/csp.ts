import { StructuredRequest, CSPOutput } from '../types';

/**
 * CSP Solver for Group Scheduling (Slots 1-4)
 * Variables: G1, G2, G3, G4, G5, G6
 * Constraints from image:
 * 1. G1 != G2
 * 2. G1 != G4
 * 3. G1 != G3 (Examiner Clash)
 * 4. G2 != G4
 * 5. G2 != G5 (Supervisor Clash)
 * 6. G4 < G3  (Precedence)
 * 7. G3 != G5
 * 8. G3 != G6
 * 9. G5 != G6
 */

type Assignment = { [key: string]: number };

function isConsistent(variable: string, value: number, assignment: Assignment): boolean {
  // G1 Constraints
  if (variable === 'G1') {
    if (assignment['G2'] === value) return false;
    if (assignment['G4'] === value) return false;
    if (assignment['G3'] === value) return false;
  }
  if (variable === 'G2') {
    if (assignment['G1'] === value) return false;
    if (assignment['G4'] === value) return false;
    if (assignment['G5'] === value) return false;
  }
  if (variable === 'G3') {
    if (assignment['G1'] === value) return false;
    if (assignment['G4'] !== undefined && assignment['G4'] >= value) return false; // G4 < G3
    if (assignment['G5'] === value) return false;
    if (assignment['G6'] === value) return false;
  }
  if (variable === 'G4') {
    if (assignment['G1'] === value) return false;
    if (assignment['G2'] === value) return false;
    if (assignment['G3'] !== undefined && value >= assignment['G3']) return false; // G4 < G3
  }
  if (variable === 'G5') {
    if (assignment['G2'] === value) return false;
    if (assignment['G3'] === value) return false;
    if (assignment['G6'] === value) return false;
  }
  if (variable === 'G6') {
    if (assignment['G3'] === value) return false;
    if (assignment['G5'] === value) return false;
  }

  return true;
}

function backtrack(variables: string[], domains: number[], assignment: Assignment): Assignment | null {
  if (Object.keys(assignment).length === variables.length) return assignment;

  const unassigned = variables.find(v => assignment[v] === undefined)!;

  for (const value of domains) {
    if (isConsistent(unassigned, value, assignment)) {
      assignment[unassigned] = value;
      const result = backtrack(variables, domains, assignment);
      if (result) return result;
      delete assignment[unassigned];
    }
  }
  return null;
}

export function cspSchedule(request: StructuredRequest): CSPOutput {
  const { preferred_slot, category, group_id } = request;
  
  const variables = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'];
  const domains = [1, 2, 3, 4]; // 4 slots available
  
  // If user requested a specific group, we can prioritize it
  // But for the project, we find a complete feasible schedule
  const solution = backtrack(variables, domains, {});

  if (!solution) {
    return {
      decision: 'rejected',
      notes: "No feasible schedule exists for the current constraints."
    };
  }

  // Map requested group to its assigned slot, or use G1 as default
  const targetVar = group_id && variables.includes(group_id) ? group_id : 'G1';
  const assignedSlot = solution[targetVar];

  const ROOMS = ["AI_Lab_01", "AI_Lab_02", "Smart_Classroom", "Maintenance_Office"];

  return {
    decision: 'accepted',
    assigned_room: category === 'AI_Lab_Support' ? ROOMS[0] : ROOMS[2],
    assigned_slot: assignedSlot,
    destination: category === 'AI_Lab_Support' ? 'AI_Lab' : 'Student_Services',
    notes: `CSP Constraint Solver assigned ${targetVar} to Slot ${assignedSlot}. Full Schedule: ${JSON.stringify(solution)}`
  };
}
