import { Policy, ToolAnalysis } from "../../types";
import YAML from "yaml";

export interface PolicyMetrics {
  totalCapabilities: number;
  requiredCount: number;
  approvalCount: number;
  blockedCount: number;
  removedAuthorityPercent: number;
}

export function generatePolicyFromAnalysis(
  agentName: string,
  analysis: ToolAnalysis[],
  description?: string
): Policy {
  const allow: string[] = [];
  const approval: string[] = [];
  const deny: string[] = [];

  for (const item of analysis) {
    if (item.decision === "required") {
      allow.push(item.name);
    } else if (item.decision === "approval") {
      approval.push(item.name);
    } else {
      deny.push(item.name);
    }
  }

  return {
    agent: agentName.toLowerCase().replace(/[^a-z0-9-_]/g, "-") || "inbox-assistant",
    version: "1.0",
    generatedAt: new Date().toISOString(),
    description: description || "Least-privilege capability policy compiled by ScopeForge",
    allow,
    approval,
    deny
  };
}

export function policyToYaml(policy: Policy): string {
  const obj = {
    agent: policy.agent,
    version: policy.version,
    description: policy.description,
    generatedAt: policy.generatedAt,
    allow: policy.allow,
    approval: policy.approval,
    deny: policy.deny
  };
  return YAML.stringify(obj, { indent: 2 });
}

export function computePolicyMetrics(
  totalToolsCount: number,
  analysis: ToolAnalysis[]
): PolicyMetrics {
  const requiredCount = analysis.filter(t => t.decision === "required").length;
  const approvalCount = analysis.filter(t => t.decision === "approval").length;
  const blockedCount = analysis.filter(t => t.decision === "blocked").length;

  const total = totalToolsCount > 0 ? totalToolsCount : analysis.length;
  const removedAuthorityPercent = total > 0 ? Math.round((blockedCount / total) * 100) : 0;

  return {
    totalCapabilities: total,
    requiredCount,
    approvalCount,
    blockedCount,
    removedAuthorityPercent
  };
}
