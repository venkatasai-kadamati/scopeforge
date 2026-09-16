import { NextRequest, NextResponse } from "next/server";
import { EMAIL_MCP_TOOLS } from "@/lib/mcp/email-tools";
import { analyzeAgentCapabilities } from "@/lib/ai/analyze-capabilities";
import { generatePolicyFromAnalysis, policyToYaml, computePolicyMetrics } from "@/lib/policy/generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const purpose: string = body.purpose || "Read my inbox, identify important messages, summarize them, and prepare draft replies. The agent must never send or delete emails automatically.";
    const userApiKey: string | undefined = body.apiKey;
    const agentName: string = body.agentName || (body.presetId ? String(body.presetId).replace(/[^a-z0-9-_]/gi, "-") : "inbox-assistant");

    const analysisResponse = await analyzeAgentCapabilities(purpose, EMAIL_MCP_TOOLS, userApiKey);
    const policy = generatePolicyFromAnalysis(agentName, analysisResponse.tools, purpose);
    const policyYaml = policyToYaml(policy);
    const metrics = computePolicyMetrics(EMAIL_MCP_TOOLS.length, analysisResponse.tools);

    return NextResponse.json({
      success: true,
      analysis: analysisResponse.tools,
      summary: analysisResponse.summary,
      source: analysisResponse.source,
      modelName: analysisResponse.modelName,
      policy,
      policyYaml,
      metrics
    });
  } catch (err) {
    console.error("API /api/analyze error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to analyze agent capabilities"
      },
      { status: 500 }
    );
  }
}
