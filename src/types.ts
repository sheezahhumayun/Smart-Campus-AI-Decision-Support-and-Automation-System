export type Role = 'student' | 'instructor' | 'staff';

export type RequestType = 
  | 'Navigation_Only'
  | 'Eligibility_Check'
  | 'Booking_or_Scheduling'
  | 'Urgent_Service_Request'
  | 'Full_Service_Request';

export type Category = 'AI_Lab_Support' | 'Viva_Scheduling' | 'Access_Request' | 'Maintenance' | 'Emergency_Help';

export interface CampusNode {
  id: string;
  coords: [number, number]; // [x, y]
}

export interface Edge {
  from: string;
  to: string;
  weight: number;
}

export interface StructuredRequest {
  request_id: string;
  name: string;
  role: Role;
  request_type: RequestType;
  category?: Category;
  current_location?: string;
  destination?: string;
  preferred_slot?: number; // 1-4
  severity?: number; // 1-10
  time_sensitivity?: number; // 1-10
  crowd_level?: number; // 1-10
  distance?: number;
  graph_type?: 'weighted' | 'unweighted';
  group_id?: string;
  query?: string;
  description_note?: string;
  eligibility_claim?: boolean;
  needs_ann?: boolean;
  needs_logic?: boolean;
  needs_csp?: boolean;
  needs_search?: boolean;
}

export interface SearchOutput {
  algorithm_used: string;
  path: string[];
  cost: number;
  steps: number;
  nodes_expanded?: number;
  execution_time?: string;
}

export interface ANNOutput {
  binary_priority: 'not_urgent' | 'urgent';
  final_priority: 'low' | 'normal' | 'high' | 'urgent';
  confidence: number;
}

export interface LogicOutput {
  allowed: boolean;
  entailed: boolean;
  explanation: string | string[];
}

export interface CSPOutput {
  decision: 'accepted' | 'rejected' | 'pending';
  assigned_room?: string;
  assigned_slot?: number;
  destination?: string;
  notes?: string;
}

export interface FinalResponse {
  request_id: string;
  decision: string;
  priority?: ANNOutput;
  eligibility?: LogicOutput;
  assignment?: CSPOutput;
  route?: SearchOutput;
  comparison_results?: SearchOutput[];
  router_control?: RouterOutput;
  message: string;
}

export interface RouterOutput {
  request_id: string;
  selected_pipeline: string[];
  needs_ann: boolean;
  needs_logic: boolean;
  needs_csp: boolean;
  needs_search: boolean;
}
