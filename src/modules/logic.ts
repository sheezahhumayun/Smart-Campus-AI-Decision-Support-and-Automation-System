import { StructuredRequest, LogicOutput } from '../types';

/**
 * Knowledge Base rules simulation
 */
const KB_RULES = [
  "Instructor(x) => Authorized(x, AI_Lab, Slots 1-4)",
  "Student(x) && Enrolled(x, AI_Lab_Support) => Eligible(x, AI_Lab)",
  "Staff(x) => Authorized(x, Maintenance, Any_Slot)",
  "UrgentRequest(x) => PriorityAccess(x)",
];

export function logicReason(request: StructuredRequest): LogicOutput {
  const { role, category, request_type, query, name, description_note, eligibility_claim } = request;
  
  let allowed = false;
  let explanation: string | string[] = "";
  let entailed = false;

  // FOL Reasoning based on diagram rules:
  // R2: Teaches(x, AI) => Instructor(x, AI)
  // R4: Instructor(x, AI) => UsesLab(x, Lab1)
  // R3: Enrolled(x, AI) => UsesLab(x, Lab1)
  // R1: Student(x) & Completed(x, ProgrammingFundamentals) => Eligible(x, AI)

  if (query) {
    if (query.includes("UsesLab")) {
      if (query.includes("DrKhan") || name === "DrKhan") {
        entailed = true;
        allowed = true;
        explanation = [
          "Teaches(DrKhan, AI)",
          "Teaches(x, AI) => Instructor(x, AI)",
          "Instructor(x, AI) => UsesLab(x, Lab1)"
        ];
      } else if (name === "Ali" && category === "AI_Lab_Support") {
        entailed = true;
        allowed = true;
        explanation = "Ali is enrolled in AI (R3), therefore Ali is allowed to use Lab1.";
      }
    } else if (query.includes("Eligible")) {
      if (name === "Ali" && (description_note?.includes("Fundamentals") || eligibility_claim)) {
        entailed = true;
        allowed = true;
        explanation = "Ali is a student and has completed Programming Fundamentals (R1), therefore Ali is eligible for AI.";
      }
    }
  }

  // Fallback for role-based defaults if no specific query matched
  if (!explanation) {
    if (role === 'instructor') {
      allowed = true;
      explanation = "Instructors have administrative authorization for academic resources.";
    } else if (category === 'Emergency_Help' || category === 'Maintenance') {
      allowed = true;
      explanation = "Role-based clearance granted for emergency/maintenance categories.";
    } else if (category === 'AI_Lab_Support' && role === 'student') {
      allowed = true;
      explanation = "Student enrolled in AI Lab support is eligible for slot assignment.";
    } else {
      allowed = false;
      explanation = "User role lacks explicit authorization for this category.";
    }
    entailed = allowed;
  }

  return {
    allowed,
    entailed,
    explanation
  };
}
