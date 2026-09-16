import { Policy, ExecutionStatus, ToolExecutionResult } from "../../types";
import { executeMockTool } from "../mcp/mock-executor";

export interface PolicyEvaluation {
  status: ExecutionStatus;
  reason: string;
}

/**
 * Deterministic Runtime Policy Gate.
 * The LLM is NEVER called at runtime to decide allow/block.
 * Pure deterministic code enforces the compiled capability policy.
 */
export function evaluateToolCall(
  toolName: string,
  policy: Policy
): PolicyEvaluation {
  const trimmed = (toolName || "").trim();
  const deny = policy?.deny || [];
  const approval = policy?.approval || [];
  const allow = policy?.allow || [];

  // If explicitly denied
  if (deny.includes(trimmed)) {
    return {
      status: "blocked",
      reason: `${trimmed} is outside this agent's required capability scope and blocked by policy.`
    };
  }

  // If requires human approval
  if (approval.includes(trimmed)) {
    return {
      status: "approval_required",
      reason: `${trimmed} carries elevated risk or data exposure; explicit human approval is required prior to execution.`
    };
  }

  // If explicitly allowed
  if (allow.includes(trimmed)) {
    return {
      status: "allowed",
      reason: `${trimmed} is authorized under the compiled least-privilege policy.`
    };
  }

  // Default closed / Zero-trust fallback: If not explicitly allowed or approval, block!
  return {
    status: "blocked",
    reason: `${trimmed} is not recognized in the agent's authorized capability scope (default-deny).`
  };
}

/**
 * Execute a tool call through the ScopeForge Policy Gate.
 * Returns the trace record and simulated output if allowed.
 */
export function executeGatedToolCall(
  toolName: string,
  policy: Policy | null, // If null, represents Unrestricted / Vulnerable baseline
  args: Record<string, unknown> = {},
  bypassPolicy = false,
  userApproved = false
): ToolExecutionResult {
  const startTime = Date.now();
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  const id = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const trimmed = (toolName || "").trim();

  // If no policy (Unrestricted mode) or explicit bypass
  if (!policy || bypassPolicy) {
    const mockOutput = executeMockTool(trimmed, args);
    const durationMs = Date.now() - startTime + Math.floor(Math.random() * 20 + 5);
    return {
      id,
      tool: trimmed,
      status: "allowed",
      reason: "UNRESTRICTED: No policy gate active. Capability executed without least-privilege boundary.",
      timestamp,
      durationMs,
      args,
      output: mockOutput
    };
  }

  // If already approved by human in the loop
  const approvalList = policy.approval || [];
  if (userApproved && approvalList.includes(trimmed)) {
    const mockOutput = executeMockTool(trimmed, args);
    const durationMs = Date.now() - startTime + Math.floor(Math.random() * 25 + 10);
    return {
      id,
      tool: trimmed,
      status: "allowed",
      reason: `Human operator manually approved invocation of elevated capability: ${trimmed}.`,
      timestamp,
      durationMs,
      args,
      output: mockOutput,
      approvedByUser: true
    };
  }

  // Evaluate against deterministic policy engine
  const evaluation = evaluateToolCall(trimmed, policy);

  if (evaluation.status === "allowed") {
    const mockOutput = executeMockTool(trimmed, args);
    const durationMs = Date.now() - startTime + Math.floor(Math.random() * 20 + 5);
    return {
      id,
      tool: toolName,
      status: "allowed",
      reason: evaluation.reason,
      timestamp,
      durationMs,
      args,
      output: mockOutput
    };
  }

  if (evaluation.status === "approval_required") {
    const durationMs = Date.now() - startTime + 5;
    return {
      id,
      tool: toolName,
      status: "approval_required",
      reason: evaluation.reason,
      timestamp,
      durationMs,
      args,
      output: {
        paused: true,
        actionRequired: "Human in the loop approval required to dispatch this tool call."
      }
    };
  }

  // Blocked
  const durationMs = Date.now() - startTime + 3;
  return {
    id,
    tool: toolName,
    status: "blocked",
    reason: evaluation.reason,
    timestamp,
    durationMs,
    args,
    output: {
      blocked: true,
      violation: "CAPABILITY_SCOPE_VIOLATION",
      policyAction: "Execution terminated deterministically before mock tool invocation."
    }
  };
}
