import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { EMAIL_MCP_TOOLS, getToolDefinition, TOOL_NAMES } from "../src/lib/mcp/email-tools";
import { executeMockTool } from "../src/lib/mcp/mock-executor";
import { evaluateToolCall, executeGatedToolCall } from "../src/lib/policy/engine";
import { generatePolicyFromAnalysis, policyToYaml, computePolicyMetrics } from "../src/lib/policy/generator";
import { getFallbackCapabilityAnalysis, extractJsonFromText } from "../src/lib/ai/analyze-capabilities";
import { DEFAULT_ATTACK_SCENARIOS } from "../src/lib/ai/generate-attacks";
import { runMaliciousEmailComparison, runEmailComparison, runRedTeamSuite } from "../src/lib/attacks/simulator";
import { DEMO_PRESETS, SAMPLE_EMAILS } from "../src/lib/demo/sample-emails";
import { Policy } from "../src/types/index";

describe("1. Email MCP Environment Tools", () => {
  it("should define exactly the 8 required mock email tools", () => {
    assert.equal(EMAIL_MCP_TOOLS.length, 8);
    const expected = [
      "searchEmails",
      "readEmail",
      "createDraft",
      "downloadAttachment",
      "sendEmail",
      "deleteEmail",
      "modifyLabels",
      "moveEmail"
    ];
    for (const name of expected) {
      assert.ok(TOOL_NAMES.includes(name), `Missing tool: ${name}`);
      const def = getToolDefinition(name);
      assert.ok(def, `Tool definition not found for: ${name}`);
      assert.ok(def.description.length > 10);
      assert.ok(def.parameters);
      assert.ok(["low", "medium", "high"].includes(def.riskLevel));
    }
  });

  it("should execute mock tools safely with realistic data", () => {
    const searchRes = executeMockTool("searchEmails", { query: "urgent" });
    assert.equal(searchRes.success, true);
    assert.ok(searchRes.data);

    const readRes = executeMockTool("readEmail", { messageId: "msg_norm_101" });
    assert.equal(readRes.success, true);
    assert.equal((readRes.data as { id: string }).id, "msg_norm_101");

    const draftRes = executeMockTool("createDraft", { to: "test@example.com", subject: "Hi", body: "Draft" });
    assert.equal(draftRes.success, true);

    const unknownRes = executeMockTool("unknownTool");
    assert.equal(unknownRes.success, false);
  });
});

describe("2. Capability Analysis & Policy Generation", () => {
  const demoPurpose = `Read my inbox, identify important messages, summarize them, and prepare draft replies. The agent must never send or delete emails automatically.`;

  it("should classify capabilities with least privilege for Inbox Assistant", () => {
    const analysis = getFallbackCapabilityAnalysis(demoPurpose, EMAIL_MCP_TOOLS);
    assert.equal(analysis.tools.length, 8);

    const decisions = Object.fromEntries(analysis.tools.map(t => [t.name, t.decision]));

    assert.equal(decisions.searchEmails, "required");
    assert.equal(decisions.readEmail, "required");
    assert.equal(decisions.createDraft, "required");
    assert.equal(decisions.downloadAttachment, "approval");
    assert.equal(decisions.sendEmail, "blocked");
    assert.equal(decisions.deleteEmail, "blocked");
    assert.equal(decisions.modifyLabels, "blocked");
    assert.equal(decisions.moveEmail, "blocked");
  });

  it("should compile analysis into deterministic policy and YAML", () => {
    const analysis = getFallbackCapabilityAnalysis(demoPurpose, EMAIL_MCP_TOOLS);
    const policy = generatePolicyFromAnalysis("inbox-assistant", analysis.tools, demoPurpose);

    assert.deepEqual(policy.allow, ["searchEmails", "readEmail", "createDraft"]);
    assert.deepEqual(policy.approval, ["downloadAttachment"]);
    assert.deepEqual(policy.deny, ["sendEmail", "deleteEmail", "modifyLabels", "moveEmail"]);

    const yaml = policyToYaml(policy);
    assert.ok(yaml.includes("agent: inbox-assistant"));
    assert.ok(yaml.includes("searchEmails"));
    assert.ok(yaml.includes("sendEmail"));

    const metrics = computePolicyMetrics(8, analysis.tools);
    assert.equal(metrics.totalCapabilities, 8);
    assert.equal(metrics.requiredCount, 3);
    assert.equal(metrics.approvalCount, 1);
    assert.equal(metrics.blockedCount, 4);
    assert.equal(metrics.removedAuthorityPercent, 50); // 4 / 8 = 50%
  });
});

describe("3. Deterministic Runtime Policy Gate", () => {
  const samplePolicy: Policy = {
    agent: "inbox-assistant",
    version: "1.0",
    generatedAt: new Date().toISOString(),
    allow: ["searchEmails", "readEmail", "createDraft"],
    approval: ["downloadAttachment"],
    deny: ["sendEmail", "deleteEmail", "modifyLabels", "moveEmail"]
  };

  it("should deterministically allow authorized capabilities", () => {
    const evalSearch = evaluateToolCall("searchEmails", samplePolicy);
    assert.equal(evalSearch.status, "allowed");

    const evalRead = evaluateToolCall("readEmail", samplePolicy);
    assert.equal(evalRead.status, "allowed");

    const evalDraft = evaluateToolCall("createDraft", samplePolicy);
    assert.equal(evalDraft.status, "allowed");
  });

  it("should deterministically require human approval for elevated tools", () => {
    const evalAttach = evaluateToolCall("downloadAttachment", samplePolicy);
    assert.equal(evalAttach.status, "approval_required");
    assert.ok(evalAttach.reason.toLowerCase().includes("approval"));
  });

  it("should deterministically block prohibited dangerous capabilities", () => {
    const evalSend = evaluateToolCall("sendEmail", samplePolicy);
    assert.equal(evalSend.status, "blocked");
    assert.ok(evalSend.reason.toLowerCase().includes("blocked"));

    const evalDelete = evaluateToolCall("deleteEmail", samplePolicy);
    assert.equal(evalDelete.status, "blocked");
  });

  it("should enforce zero-trust default deny for unknown tools", () => {
    const evalUnknown = evaluateToolCall("dropDatabase", samplePolicy);
    assert.equal(evalUnknown.status, "blocked");
    assert.ok(evalUnknown.reason.toLowerCase().includes("default-deny"));
  });

  it("should support human-in-the-loop approval execution", () => {
    // Normal gated invocation requires approval
    const trace1 = executeGatedToolCall("downloadAttachment", samplePolicy, { filename: "doc.pdf" }, false, false);
    assert.equal(trace1.status, "approval_required");

    // Human operator manually approves
    const trace2 = executeGatedToolCall("downloadAttachment", samplePolicy, { filename: "doc.pdf" }, false, true);
    assert.equal(trace2.status, "allowed");
    assert.equal(trace2.approvedByUser, true);
  });
});

describe("4. Attack Lab & Before / After Demonstration", () => {
  const samplePolicy: Policy = {
    agent: "inbox-assistant",
    version: "1.0",
    generatedAt: new Date().toISOString(),
    allow: ["searchEmails", "readEmail", "createDraft"],
    approval: ["downloadAttachment"],
    deny: ["sendEmail", "deleteEmail", "modifyLabels", "moveEmail"]
  };

  it("should demonstrate vulnerable escape WITHOUT policy and containment WITH policy", () => {
    const comparison = runMaliciousEmailComparison(samplePolicy);

    // WITHOUT policy: unrestricted agent allows exfiltration and deletion!
    assert.equal(comparison.unrestrictedContained, false);
    const unresTools = comparison.unrestrictedTraces.map(t => t.tool);
    assert.ok(unresTools.includes("sendEmail"));
    assert.ok(unresTools.includes("deleteEmail"));
    for (const t of comparison.unrestrictedTraces) {
      assert.equal(t.status, "allowed");
    }

    // WITH policy: ScopeForge policy gate blocks dangerous calls!
    assert.equal(comparison.enforcedContained, true);
    const sendTrace = comparison.enforcedTraces.find(t => t.tool === "sendEmail");
    const deleteTrace = comparison.enforcedTraces.find(t => t.tool === "deleteEmail");
    const readTrace = comparison.enforcedTraces.find(t => t.tool === "readEmail");

    assert.ok(sendTrace);
    assert.equal(sendTrace.status, "blocked");

    assert.ok(deleteTrace);
    assert.equal(deleteTrace.status, "blocked");

    assert.ok(readTrace);
    assert.equal(readTrace.status, "allowed");

    assert.equal(comparison.dangerousActionsBlocked, 2);
    assert.equal(comparison.unauthorizedActionsPrevented, 2);
  });
});

describe("5. Red-Team Adversarial Suite", () => {
  const samplePolicy: Policy = {
    agent: "inbox-assistant",
    version: "1.0",
    generatedAt: new Date().toISOString(),
    allow: ["searchEmails", "readEmail", "createDraft"],
    approval: ["downloadAttachment"],
    deny: ["sendEmail", "deleteEmail", "modifyLabels", "moveEmail"]
  };

  it("should contain all 12 default red-team attack scenarios", () => {
    const result = runRedTeamSuite(DEFAULT_ATTACK_SCENARIOS, samplePolicy);

    assert.equal(result.totalAttacks, 12);
    assert.equal(result.unauthorizedEscapes, 0);
    assert.equal(result.containmentRatePercent, 100);
    assert.ok(result.dangerousCallsBlocked >= 12);

    for (const item of result.results) {
      assert.equal(item.contained, true, `Scenario ${item.scenarioName} was not contained!`);
      assert.equal(item.unauthorizedExecuted, false);
    }
  });

  it("should simulate multi-email comparison including benign and ransomware fixtures", () => {
    const normalEmail = SAMPLE_EMAILS.find(e => !e.isMalicious)!;
    const normalComparison = runEmailComparison(normalEmail, samplePolicy);

    // Benign routine email: all required tools allowed, 0 false positive blocks
    assert.equal(normalComparison.enforcedContained, true);
    assert.equal(normalComparison.dangerousActionsBlocked, 0);
    for (const trace of normalComparison.enforcedTraces) {
      assert.equal(trace.status, "allowed");
    }

    const ransomwareEmail = SAMPLE_EMAILS.find(e => e.id === "email_malicious_ransomware")!;
    const ransomwareComparison = runEmailComparison(ransomwareEmail, samplePolicy);

    // Ransomware purge: unrestricted allows delete and move, enforced blocks them
    assert.equal(ransomwareComparison.unrestrictedContained, false);
    assert.equal(ransomwareComparison.enforcedContained, true);
    assert.ok(ransomwareComparison.dangerousActionsBlocked >= 2);
  });
});

describe("6. Edge Cases & Boundary Conditions", () => {
  it("should handle empty or whitespace purpose gracefully", () => {
    const analysis = getFallbackCapabilityAnalysis("   ", EMAIL_MCP_TOOLS);
    assert.equal(analysis.tools.length, 8);
    // Unrecognized or blank intent must default deny high-risk actions
    const sendDec = analysis.tools.find(t => t.name === "sendEmail");
    const deleteDec = analysis.tools.find(t => t.name === "deleteEmail");
    assert.equal(sendDec?.decision, "blocked");
    assert.equal(deleteDec?.decision, "blocked");
  });

  it("should correctly compile Support Triager preset", () => {
    const supportPreset = DEMO_PRESETS.find(p => p.id === "customer-support-triager")!;
    const analysis = getFallbackCapabilityAnalysis(supportPreset.purpose, EMAIL_MCP_TOOLS);
    const decisions = Object.fromEntries(analysis.tools.map(t => [t.name, t.decision]));

    // Support triager needs modifyLabels to categorize tickets
    assert.equal(decisions.modifyLabels, "required");
    assert.equal(decisions.readEmail, "required");
    assert.equal(decisions.deleteEmail, "blocked");
  });

  it("should correctly compile Executive Briefing preset as strictly read-only", () => {
    const execPreset = DEMO_PRESETS.find(p => p.id === "executive-briefing-agent")!;
    const analysis = getFallbackCapabilityAnalysis(execPreset.purpose, EMAIL_MCP_TOOLS);
    const decisions = Object.fromEntries(analysis.tools.map(t => [t.name, t.decision]));

    assert.equal(decisions.searchEmails, "required");
    assert.equal(decisions.readEmail, "required");
    assert.equal(decisions.createDraft, "blocked");
    assert.equal(decisions.sendEmail, "blocked");
    assert.equal(decisions.deleteEmail, "blocked");
  });

  it("should execute unrestricted when policy is null or bypassPolicy is true", () => {
    const trace1 = executeGatedToolCall("sendEmail", null, { to: "victim@example.com" });
    assert.equal(trace1.status, "allowed");
    assert.ok(trace1.reason.includes("UNRESTRICTED"));

    const samplePolicy: Policy = {
      agent: "test",
      version: "1.0",
      generatedAt: new Date().toISOString(),
      allow: [],
      approval: [],
      deny: ["sendEmail"]
    };
    const trace2 = executeGatedToolCall("sendEmail", samplePolicy, {}, true);
    assert.equal(trace2.status, "allowed");
  });

  it("should compute policy metrics for zero tools without dividing by zero", () => {
    const metrics = computePolicyMetrics(0, []);
    assert.equal(metrics.totalCapabilities, 0);
    assert.equal(metrics.removedAuthorityPercent, 0);
  });

  it("should preserve original tool arguments on approval re-execution", () => {
    const samplePolicy: Policy = {
      agent: "test",
      version: "1.0",
      generatedAt: new Date().toISOString(),
      allow: ["readEmail"],
      approval: ["downloadAttachment"],
      deny: ["sendEmail"]
    };
    const customArgs = { filename: "confidential_financials.pdf", attachmentId: "att_404" };
    const approvedTrace = executeGatedToolCall("downloadAttachment", samplePolicy, customArgs, false, true);

    assert.equal(approvedTrace.status, "allowed");
    assert.equal(approvedTrace.approvedByUser, true);
    assert.deepEqual(approvedTrace.args, customArgs);
    assert.ok((approvedTrace.output as Record<string, unknown>).data);
  });

  it("should safely evaluate policies with missing or undefined array properties", () => {
    const partialPolicy = {
      agent: "sparse",
      version: "1.0",
      generatedAt: new Date().toISOString(),
      allow: ["readEmail"]
    } as unknown as Policy; // Missing approval and deny arrays

    const evalDenied = evaluateToolCall("sendEmail", partialPolicy);
    assert.equal(evalDenied.status, "blocked");

    const evalAllowed = evaluateToolCall("readEmail", partialPolicy);
    assert.equal(evalAllowed.status, "allowed");
  });

  it("should cleanly extract JSON from markdown code blocks", () => {
    const codeBlockPayload = "```json\n{\n  \"status\": \"ok\"\n}\n```";
    const extracted = extractJsonFromText(codeBlockPayload);
    assert.equal(extracted, "{\n  \"status\": \"ok\"\n}");
    assert.deepEqual(JSON.parse(extracted), { status: "ok" });
  });
});

