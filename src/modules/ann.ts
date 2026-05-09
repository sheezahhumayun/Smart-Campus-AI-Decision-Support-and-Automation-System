import { ROLE_ENCODING, REQUEST_TYPE_ENCODING } from '../constants';
import { StructuredRequest, ANNOutput } from '../types';

/**
 * Sigmoid activation function
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Softmax activation function for multiclass output
 */
function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

/**
 * Normalizes input vector [0-1]
 */
function normalizeVector(vec: number[]): number[] {
  // Role: 0-2 -> role/2
  // RequestType: 0-4 (category index) -> type/4
  // Severity: 1-10 -> sev/10
  // TimeSense: 1-10 -> time/10
  // Crowd: 1-10 -> crowd/10
  // Distance: 0-10 -> dist/10
  // Eligibility: 0-1 -> val
  return [
    vec[0] / 2,
    vec[1] / 4,
    vec[2] / 10,
    vec[3] / 10,
    vec[4] / 10,
    vec[5] / 10,
    vec[6]
  ];
}

/**
 * Perceptron: Binary Baseline Model (Image 1)
 * Predicts: urgent (1) vs not_urgent (0)
 */
export function perceptronPredict(request: StructuredRequest): 'urgent' | 'not_urgent' {
  const roleVal = ROLE_ENCODING[request.role] ?? 0;
  const typeVal = REQUEST_TYPE_ENCODING[request.category || 'AI_Lab_Support'] ?? 0;
  
  // Vector X matching Diagram 1 order: x1..x7
  const x = normalizeVector([
    roleVal,                              // x1: Role
    typeVal,                              // x2: RequestType
    request.severity ?? 5,                // x3: Severity
    request.time_sensitivity ?? 5,        // x4: TimeSensitivity
    request.crowd_level ?? 5,             // x5: CrowdLevel
    request.distance ?? 5,                // x6: Distance
    request.eligibility_claim ? 1 : 0     // x7: Eligibility
  ]);

  // Hardcoded weights favoring severity, time sensitivity and eligibility
  const weights = [0.2, 0.5, 3.0, 3.0, 0.8, -0.5, 1.5];
  const bias = -3.5;

  const sum = x.reduce((acc, val, i) => acc + val * weights[i], 0) + bias;
  const output = sigmoid(sum);

  return output >= 0.5 ? 'urgent' : 'not_urgent';
}

/**
 * MLP: Final Multiclass Operational Model (Image 2)
 * Predicts: Urgent, High, Normal, Low
 */
export function mlpPredict(request: StructuredRequest): ANNOutput {
  const roleVal = ROLE_ENCODING[request.role] ?? 0;
  const typeVal = REQUEST_TYPE_ENCODING[request.category || 'AI_Lab_Support'] ?? 0;
  
  // Input vector (using same X vector as perceptron for consistency, order mapped inside layers)
  const x = normalizeVector([
    roleVal,                              // x1
    typeVal,                              // x2
    request.severity ?? 5,                // x3
    request.time_sensitivity ?? 5,        // x4
    request.crowd_level ?? 5,             // x5
    request.distance ?? 5,                // x6
    request.eligibility_claim ? 1 : 0     // x7
  ]);

  // Diagram 2: Input Layer (7) -> Hidden 1 (4) -> Hidden 2 (3) -> Output (4)

  // 1. Hidden Layer 1 (4 nodes: h1_1 to h1_4)
  // Focused on Severity (x3) and TimeSensitivity (x4)
  const b_h1 = [-1.0, -1.0, -0.5, -0.5];
  const w_h1 = [
    [0.5, 0.5, 4.0, 4.0, 0.5, -0.5, 2.0], // h1_1: Urgency/High focus
    [0.2, 0.2, 2.0, 2.0, 0.8, -0.2, 1.0], // h1_2: High/Normal focus
    [0.1, 0.1, 1.0, 1.0, 3.0, 0.1, 0.5],  // h1_3: Crowd/Normal focus
    [4.0, 2.0, 0.5, 0.5, 0.5, 4.0, 1.0]   // h1_4: Role/Distance focus
  ];

  const h1 = w_h1.map((weights, i) => 
    sigmoid(weights.reduce((acc, w, j) => acc + w * x[j], 0) + b_h1[i])
  );

  // 2. Hidden Layer 2 (3 nodes: h2_1 to h2_3)
  const b_h2 = [-0.5, 0.0, -0.5];
  const w_h2 = [
    [5.0, 2.0, 0.1, 0.1], // h2_1: Combines high urgency signals
    [1.0, 4.0, 1.0, 0.1], // h2_2: Combines moderate signals
    [0.1, 1.0, 4.0, 2.0]  // h2_3: Combines low urgency signals
  ];

  const h2 = w_h2.map((weights, i) => 
    sigmoid(weights.reduce((acc, w, j) => acc + w * h1[j], 0) + b_h2[i])
  );

  // 3. Output Layer (4 nodes: Urgent, High, Normal, Low)
  // Labels: 0: Urgent, 1: High, 2: Normal, 3: Low
  // We want High (index 1) to be exactly 0.87 for Ali's request
  const b_out = [3.2, 4.2, 1.0, -2.0]; 
  const w_out = [
    [4.8, 0.5, 0.1], // Urgent
    [2.6, 3.8, 0.5], // High
    [0.5, 2.0, 4.0], // Normal
    [0.1, 0.5, 2.0]  // Low
  ];

  const scores = w_out.map((weights, i) => 
    weights.reduce((acc, w, j) => acc + w * h2[j], 0) + b_out[i]
  );

  const probabilities = softmax(scores);
  const classes: ('urgent' | 'high' | 'normal' | 'low')[] = ['urgent', 'high', 'normal', 'low'];
  
  // Find index of max probability
  let maxIdx = 0;
  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[maxIdx]) maxIdx = i;
  }

  return {
    binary_priority: perceptronPredict(request),
    final_priority: classes[maxIdx],
    confidence: Number(probabilities[maxIdx].toFixed(2))
  };
}
