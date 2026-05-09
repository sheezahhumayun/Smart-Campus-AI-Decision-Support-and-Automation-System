import { StructuredRequest, RequestType, Category, Role } from '../types';
import { CAMPUS_NODES, ROLE_ENCODING, REQUEST_TYPE_ENCODING } from '../constants';

/**
 * Normalizes input strings to match standard project naming
 * Example: "ai lab" -> "AI_Lab"
 */
export function normalize(val: string | undefined): string {
  if (!val) return "";
  const trimmed = val.trim();
  
  // Hardcoded normalization mappings from PDF Section 4.3
  if (trimmed.toLowerCase() === "ai lab") return "AI_Lab";
  if (trimmed.toLowerCase() === "hostel") return "Hostel";
  if (trimmed.toLowerCase() === "urgent_service_request") return "Urgent_Service_Request";
  if (trimmed.toLowerCase() === "student") return "student";
  
  const normalized = trimmed.replace(/\s+/g, '_');
  
  // Case sensitive matching for known nodes
  const nodeKey = Object.keys(CAMPUS_NODES).find(
    k => k.toLowerCase() === normalized.toLowerCase()
  );
  if (nodeKey) return nodeKey;

  // Manual mappings for categories or roles if needed
  if (normalized.toLowerCase() === 'student') return 'student';
  if (normalized.toLowerCase() === 'instructor') return 'instructor';
  if (normalized.toLowerCase() === 'staff') return 'staff';

  return normalized;
}

/**
 * Validates the structured request fields
 */
export function validateRequest(request: Partial<StructuredRequest>): string | null {
  if (!request.name) return "Name is required.";
  if (!request.role) return "Role is required.";
  if (!request.request_type) return "Request type is required.";

  if (request.preferred_slot && (request.preferred_slot < 1 || request.preferred_slot > 4)) {
    return "Preferred slot must be between 1 and 4.";
  }

  if (request.severity && (request.severity < 1 || request.severity > 10)) {
    return "Severity must be between 1 and 10.";
  }

  if (request.current_location && !CAMPUS_NODES[request.current_location]) {
    return `Invalid current location: ${request.current_location}`;
  }

  if (request.destination && !CAMPUS_NODES[request.destination]) {
    return `Invalid destination: ${request.destination}`;
  }

  return null;
}

/**
 * Preprocessing Module: Standardizes and prepares the request object
 */
export function preprocessRequest(raw: Partial<StructuredRequest>): StructuredRequest {
  const error = validateRequest(raw);
  if (error) throw new Error(`Preprocessing Validation Failed: ${error}`);

  const processed: StructuredRequest = {
    request_id: raw.request_id || `REQ-${Date.now()}`,
    name: raw.name!,
    role: raw.role as Role,
    request_type: raw.request_type as RequestType,
    category: raw.category as Category,
    current_location: normalize(raw.current_location),
    destination: normalize(raw.destination),
    preferred_slot: raw.preferred_slot,
    severity: raw.severity,
    time_sensitivity: raw.time_sensitivity,
    crowd_level: raw.crowd_level,
    group_id: raw.group_id,
    query: raw.query,
    description_note: raw.description_note,
    eligibility_claim: raw.eligibility_claim,
    needs_ann: ['Urgent_Service_Request', 'Full_Service_Request'].includes(raw.request_type!),
    needs_logic: ['Eligibility_Check', 'Booking_or_Scheduling', 'Urgent_Service_Request', 'Full_Service_Request'].includes(raw.request_type!),
    needs_csp: ['Booking_or_Scheduling', 'Urgent_Service_Request', 'Full_Service_Request'].includes(raw.request_type!),
    needs_search: ['Navigation_Only', 'Full_Service_Request'].includes(raw.request_type!) || (['Booking_or_Scheduling', 'Urgent_Service_Request'].includes(raw.request_type!) && !!raw.current_location),
    distance: (raw.current_location && raw.destination) ? 
      Math.abs(CAMPUS_NODES[raw.current_location].coords[0] - CAMPUS_NODES[raw.destination].coords[0]) +
      Math.abs(CAMPUS_NODES[raw.current_location].coords[1] - CAMPUS_NODES[raw.destination].coords[1]) 
      : 5 // Default middle distance if one is missing
  };

  return processed;
}
