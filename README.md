# Smart-Campus-AI-Decision-Support-and-Automation-System
A smart automation solution for campus guide.

Project Overview
Smart Campus AI is a sophisticated, multi-modular decision-support system designed to automate and optimize campus management. It utilizes a custom-built AI pipeline that combines neural networks, symbolic logic, constraint satisfaction, and advanced search algorithms to handle requests ranging from academic scheduling to emergency services.
The AI Pipeline Flow
Every request follows a structured path through the Smart Campus AI Pipeline:
Preprocessing: Raw data is sanitized and converted into a numeric feature vector.
Router: Analyzes the request type and activates specific AI modules.
ANN Priority: Predicts urgency and assigns priority levels.
Logic/KB: Performs eligibility checks using First-Order Logic.
CSP Solver: Resolves scheduling conflicts for rooms and time slots.
Search Engine: Calculates the optimal path to the assigned destination.
Core AI Modules & Concepts
1. Intelligence Pipeline Router
The Router is the brains of the modular architecture. Instead of running every module for every request, it uses conditional logic to select a "Module Chain."
Feature: If you request "Navigation Only," it skips ANN and CSP to save latency. If you request a "Full Service," it runs all four AI stages in sequence, ensuring data consistency across the state.
2. Neural Priority Module (ANN)
This module handles priority estimation using two distinct architectures implemented from scratch:
Perceptron (Binary Baseline): Used as a comparison model. It takes the 7D feature vector and predicts a binary output: Urgent vs Not Urgent. It demonstrates the fundamental logic of weighted sums and the Sigmoid activation function.
Multi-Layer Perceptron (MLP): The primary operational model. It features a deep architecture: 7 Input Nodes → 4 Hidden Nodes → 3 Hidden Nodes → 4 Output Nodes.
Feature Vector: Fixed order: [Role, RequestType, Severity, TimeSensitivity, CrowdLevel, Distance, Eligibility].
Logic: Uses Softmax activation for multiclass classification, outputting probabilities for Low, Normal, High, and Urgent priorities with high confidence (e.g., Ali's request yields 87% confidence for "High").
3. Logic & Knowledge Base Module (FOL)
This module implements Symbolic AI using First-Order Logic (FOL) to validate eligibility. It reasoning through rules rather than probabilities.
Concepts Implemented:
Entailment: If a user is an instructor of AI, they are logically entitled to use Lab 1.
Rules Engine:
Teaches(x, AI) => Instructor(x, AI)
Instructor(x, AI) => UsesLab(x, Lab1)
Student(x) ∧ Completed(x, Programming) => Eligible(x, AI)
Output: Provides a boolean allowed status and a detailed explanation (logical proof) of the decision.
4. Constraint Satisfaction Module (CSP)
The CSP Solver schedules group sessions for slots 1-4. It treats groups as variables and time slots as domains.
Backtracking Search: Uses a recursive backtracking algorithm to find a feasible assignment that satisfies all constraints simultaneously.
Hard Constraints:
Clash Avoidance: G1 != G2, G1 != G4, G3 != G5, etc.
Examiner/Supervisor Clashes: Unique constraints like G1 != G3 (Examiner) and G2 != G5 (Supervisor).
Precedence: G4 < G3 (Group 4 must happen before Group 3).
5. Optimal Pathfinding & Search Module
A navigation engine built on a campus graph containing nodes like Main_Gate, AI_Lab, and Science_Block.
Algorithms:
A*: Uses Euclidean distance heuristics for optimal, informed search.
Dijkstra: Guaranteed shortest path based on edge weights.
Greedy Best-First: Prioritizes the heuristic for faster, though sometimes sub-optimal, results.
BFS/UCS/DFS: Standard uninformed search strategies for comparison.
Comparison Mode: For "Navigation Only" requests, the system calculates paths using multiple algorithms simultaneously, allowing users to compare efficiency (nodes expanded vs cost).
Technical Features
Reactive UI: Built with React 18 and Tailwind CSS, featuring a real-time "Pipeline Log" to visualize AI processing steps.
Fluid Animations: Powered by Framer Motion for smooth state transitions between request submission and result display.
Type Safety: Fully implemented in TypeScript with strict interfaces for request and output objects.
Campus Graph: A weighted adjacency list representing the physical campus layout for the search module.
How to Use
Submit Request: Enter details like Name, Role, and Request Category.
Define Context: Set Severity and Time Sensitivity (for the ANN) and provide an Eligibility Claim (for the Logic module).
Process: Click "Submit Request" to trigger the routing logic.
Visualize: Expand the "Pipeline Log" to see the numeric vector transformations and logic entailment proofs.
Navigate: Follow the visual map and algorithm stats provided by the Search module.
