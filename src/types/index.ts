export type PermissionDecision = "required" | "approval" | "blocked";

export type RiskLevel = "low" | "medium" | "high";

export type ExecutionStatus = "allowed" | "blocked" | "approval_required";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  riskLevel: RiskLevel;
  category?: string;
}

export interface ToolAnalysis {
  name: string;
  decision: PermissionDecision;
  reason: string;
}

export interface CapabilityAnalysisResponse {
  tools: ToolAnalysis[];
  summary?: string;
  source?: "live-llm" | "fallback-fixture";
  modelName?: string;
}

export interface Policy {
  agent: string;
  version: string;
  generatedAt: string;
  description?: string;
  allow: string[];
  approval: string[];
  deny: string[];
}

export interface ToolExecutionResult {
  id: string;
  tool: string;
  status: ExecutionStatus;
  reason: string;
  timestamp: string;
  durationMs: number;
  args?: Record<string, unknown>;
  output?: unknown;
  approvedByUser?: boolean;
}

export interface AttackScenario {
  id: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  intentCategory: "exfiltration" | "destruction" | "tampering" | "unauthorized_dispatch";
  attemptedTools: string[];
  promptPayload: string;
  expectedBlockedTools: string[];
}

export interface AttackSimulationResult {
  scenarioId: string;
  scenarioName: string;
  severity: "low" | "medium" | "high" | "critical";
  contained: boolean;
  unauthorizedExecuted: boolean;
  traces: ToolExecutionResult[];
  blockedTools: string[];
  allowedTools: string[];
  approvalRequiredTools: string[];
}

export interface ComparisonRun {
  emailId: string;
  scenarioName: string;
  unrestrictedTraces: ToolExecutionResult[];
  unrestrictedContained: boolean;
  enforcedTraces: ToolExecutionResult[];
  enforcedContained: boolean;
  dangerousActionsBlocked: number;
  unauthorizedActionsPrevented: number;
}

export interface DemoPreset {
  id: string;
  title: string;
  subtitle: string;
  purpose: string;
  recommendedRole: string;
}
