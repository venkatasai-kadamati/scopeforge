import { ToolDefinition, ToolAnalysis, CapabilityAnalysisResponse, PermissionDecision } from "../../types";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

const ToolAnalysisItemSchema = z.object({
  name: z.string(),
  decision: z.enum(["required", "approval", "blocked"]),
  reason: z.string().min(10)
});

const CapabilityResponseSchema = z.object({
  tools: z.array(ToolAnalysisItemSchema),
  summary: z.string().optional()
});

export function extractJsonFromText(raw: string): string {
  let cleaned = raw.trim();
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    cleaned = match[1].trim();
  }
  return cleaned;
}

/**
 * Fallback semantic analyzer when LLM API key is not present or API call fails.
 * Guarantees a robust, flawless hackathon demo without external dependencies.
 */
export function getFallbackCapabilityAnalysis(
  purpose: string,
  tools: ToolDefinition[]
): CapabilityAnalysisResponse {
  const pLower = purpose.toLowerCase();

  const isInboxAssistant =
    (pLower.includes("draft") || pLower.includes("summar")) &&
    (pLower.includes("never send") || pLower.includes("not send") || pLower.includes("inbox") || pLower.includes("explicit user action"));

  const isExecutiveBriefing =
    pLower.includes("briefing") || pLower.includes("executive") || pLower.includes("digest");

  const isSupportTriager =
    !isExecutiveBriefing &&
    (pLower.includes("support") || pLower.includes("triag") || (pLower.includes("ticket") && pLower.includes("categoriz")));

  const toolAnalyses: ToolAnalysis[] = tools.map(tool => {
    let decision: PermissionDecision = "blocked";
    let reason = "Capability is outside this agent's declared scope of responsibility.";

    if (isInboxAssistant) {
      switch (tool.name) {
        case "searchEmails":
          decision = "required";
          reason = "Needed to locate, filter, and prioritize inbox messages for review.";
          break;
        case "readEmail":
          decision = "required";
          reason = "Essential to inspect email content and context in order to generate summaries.";
          break;
        case "createDraft":
          decision = "required";
          reason = "The agent's stated task explicitly requires preparing draft replies without dispatching.";
          break;
        case "downloadAttachment":
          decision = "approval";
          reason = "Attachments can harbor malicious macros or untrusted executables; human verification required.";
          break;
        case "sendEmail":
          decision = "blocked";
          reason = "The declared purpose explicitly forbids autonomous sending; the agent is only authorized to create drafts.";
          break;
        case "deleteEmail":
          decision = "blocked";
          reason = "Deletion is destructive and completely unnecessary for summarization and drafting.";
          break;
        case "modifyLabels":
          decision = "blocked";
          reason = "Modifying mailbox labels is not authorized or required for reading and drafting.";
          break;
        case "moveEmail":
          decision = "blocked";
          reason = "Moving correspondence across mailboxes introduces mailbox mutation risks not in the agent's mandate.";
          break;
      }
    } else if (isSupportTriager) {
      switch (tool.name) {
        case "searchEmails":
          decision = "required";
          reason = "Needed to scan and fetch incoming support queues.";
          break;
        case "readEmail":
          decision = "required";
          reason = "Needed to review customer issues and ticket descriptions.";
          break;
        case "modifyLabels":
          decision = "required";
          reason = "Core responsibility: tagging and triaging tickets by category and urgency.";
          break;
        case "createDraft":
          decision = "required";
          reason = "Prepares template responses for Tier 1 customer questions.";
          break;
        case "downloadAttachment":
          decision = "approval";
          reason = "Customer attachments (screenshots, logs) may contain PII; require agent sign-off.";
          break;
        case "sendEmail":
          decision = "approval";
          reason = "Outbound emails must be vetted by a human supervisor before dispatch.";
          break;
        case "deleteEmail":
        case "moveEmail":
          decision = "blocked";
          reason = "Support triagers should never permanently remove or relocate correspondence.";
          break;
      }
    } else if (isExecutiveBriefing) {
      switch (tool.name) {
        case "searchEmails":
          decision = "required";
          reason = "Required to find high-priority messages from the preceding 24 hours.";
          break;
        case "readEmail":
          decision = "required";
          reason = "Needed to read executive communications to assemble the briefing digest.";
          break;
        case "downloadAttachment":
          decision = "approval";
          reason = "Downloading board decks or spreadsheets requires executive operator confirmation.";
          break;
        default:
          decision = "blocked";
          reason = "The executive briefing agent is strictly read-only; mutation capabilities are blocked.";
          break;
      }
    } else {
      // General semantic heuristic for arbitrary custom purposes
      if (tool.name === "searchEmails" && (pLower.includes("search") || pLower.includes("read") || pLower.includes("inbox") || pLower.includes("find") || pLower.includes("scan"))) {
        decision = "required";
        reason = "Required to discover relevant email threads based on user intent.";
      } else if (tool.name === "readEmail" && (pLower.includes("read") || pLower.includes("summar") || pLower.includes("check") || pLower.includes("inspect") || pLower.includes("inbox"))) {
        decision = "required";
        reason = "Required to inspect email content for the specified task.";
      } else if (tool.name === "createDraft" && (pLower.includes("draft") || pLower.includes("reply") || pLower.includes("write") || pLower.includes("compose"))) {
        decision = "required";
        reason = "Permits formulating responses without unauthorized outbound dispatch.";
      } else if (tool.name === "downloadAttachment") {
        decision = "approval";
        reason = "External file downloads pose untrusted content risk; human confirmation recommended.";
      } else if (tool.name === "sendEmail") {
        const wantsSend = (pLower.includes("send email") || pLower.includes("send message") || pLower.includes("dispatch")) &&
          !pLower.includes("never send") && !pLower.includes("not send") && !pLower.includes("without sending");
        decision = wantsSend ? "approval" : "blocked";
        reason = wantsSend ? "Outbound dispatch carries high external impact; requires explicit human approval." : "Autonomous outbound sending is blocked to prevent data exfiltration.";
      } else if (tool.name === "deleteEmail") {
        const wantsDelete = pLower.includes("delete") && !pLower.includes("never delete") && !pLower.includes("not delete");
        decision = wantsDelete ? "approval" : "blocked";
        reason = wantsDelete ? "Deletion is destructive; human confirmation required." : "Destructive mailbox purge capability denied by least-privilege default.";
      } else if (tool.name === "modifyLabels") {
        const wantsLabels = (pLower.includes("label") || pLower.includes("tag") || pLower.includes("categor") || pLower.includes("triag")) &&
          !pLower.includes("never modify") && !pLower.includes("not modify");
        decision = wantsLabels ? "required" : "blocked";
        reason = wantsLabels ? "Required to categorize and tag messages based on intent." : "Label mutation capability not requested by declared agent purpose.";
      } else if (tool.name === "moveEmail") {
        const wantsMove = (pLower.includes("move") || pLower.includes("archive") || pLower.includes("folder") || pLower.includes("organiz")) &&
          !pLower.includes("never move") && !pLower.includes("not move");
        decision = wantsMove ? "approval" : "blocked";
        reason = wantsMove ? "Folder relocation affects mailbox state; human sign-off recommended." : "Relocating emails across folders introduces unnecessary mutation authority.";
      } else {
        decision = "blocked";
        reason = `Tool capability '${tool.name}' is not necessary to fulfill the declared task.`;
      }
    }

    return {
      name: tool.name,
      decision,
      reason
    };
  });

  return {
    tools: toolAnalyses,
    summary: `Compiled least-privilege capability matrix. Granted access only to the minimum required tools.`,
    source: "fallback-fixture",
    modelName: "deterministic-heuristic-engine"
  };
}

/**
 * Primary AI capability analyzer using Gemini when API key is provided,
 * with seamless fallback to verified semantic heuristics.
 */
export async function analyzeAgentCapabilities(
  purpose: string,
  tools: ToolDefinition[],
  userApiKey?: string
): Promise<CapabilityAnalysisResponse> {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return getFallbackCapabilityAnalysis(purpose, tools);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const toolsDescription = tools.map(t => ({
      name: t.name,
      description: t.description,
      riskLevel: t.riskLevel,
      parameters: t.parameters
    }));

    const systemInstruction = `You are ScopeForge, a least-privilege capability compiler for AI agents.
Given an agent's declared purpose and available tool schemas, calculate the absolute minimum capability set needed.

Classify every provided tool as one of:
- "required": essential to accomplish the declared purpose.
- "approval": potentially useful or high risk, requiring explicit human sign-off before invocation.
- "blocked": not strictly necessary, destructive, or introduces excess authority/attack surface.

Rules:
1. Prefer the least privileged classification (default to blocked if not clearly justified).
2. Reason from the semantic behavior and parameters of each tool, not just the name.
3. Every single tool from the provided list must be classified. Do not omit any tool.
4. Do not invent tools.
5. Provide a concise, clear technical reason for each decision.
6. Output MUST be valid JSON adhering strictly to the schema.`;

    const prompt = `AGENT PURPOSE:
"${purpose}"

AVAILABLE TOOLS:
${JSON.stringify(toolsDescription, null, 2)}

Return a JSON object:
{
  "tools": [
    {
      "name": "toolName",
      "decision": "required" | "approval" | "blocked",
      "reason": "Clear explanation grounded in least-privilege principles."
    }
  ],
  "summary": "One sentence summary of capability scope."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    const cleanJson = extractJsonFromText(responseText);
    const parsedJson = JSON.parse(cleanJson);
    const validated = CapabilityResponseSchema.parse(parsedJson);

    // Validate that all expected tools are present
    const toolMap = new Map(validated.tools.map(t => [t.name, t]));
    const validToolNames = new Set(tools.map(t => t.name));

    const sanitizedTools: ToolAnalysis[] = [];
    for (const tool of tools) {
      const match = toolMap.get(tool.name);
      if (match && validToolNames.has(match.name)) {
        sanitizedTools.push({
          name: match.name,
          decision: match.decision,
          reason: match.reason
        });
      } else {
        // Fallback for missing tool
        sanitizedTools.push({
          name: tool.name,
          decision: "blocked",
          reason: "Tool capability not deemed necessary by security compiler."
        });
      }
    }

    return {
      tools: sanitizedTools,
      summary: validated.summary || "Least-privilege policy compiled successfully.",
      source: "live-llm",
      modelName: "gemini-2.0-flash"
    };
  } catch (err) {
    console.warn("Gemini capability analysis failed, falling back to deterministic fixture:", err);
    const fallback = getFallbackCapabilityAnalysis(purpose, tools);
    return {
      ...fallback,
      summary: `[Fallback Engaged] Compiled using deterministic capability engine. (${err instanceof Error ? err.message : "API error"})`
    };
  }
}
