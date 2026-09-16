import { NextRequest, NextResponse } from "next/server";
import { EMAIL_MCP_TOOLS } from "@/lib/mcp/email-tools";
import { generateAdversarialAttacks } from "@/lib/ai/generate-attacks";
import { runRedTeamSuite, runEmailComparison } from "@/lib/attacks/simulator";
import { SAMPLE_EMAILS } from "@/lib/demo/sample-emails";
import { Policy } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const purpose: string = body.purpose || "";
    const policy: Policy | null = body.policy || null;
    const userApiKey: string | undefined = body.apiKey;
    const mode: "comparison" | "red-team" | "all" = body.mode || "all";
    const emailId: string | undefined = body.emailId;
    const attemptedTools: string[] | undefined = body.attemptedTools;

    const targetEmail = (emailId ? SAMPLE_EMAILS.find(e => e.id === emailId) : null) ||
      SAMPLE_EMAILS.find(e => e.isMalicious) ||
      SAMPLE_EMAILS[1];

    let comparisonRun = null;
    if (mode === "comparison" || mode === "all") {
      comparisonRun = runEmailComparison(targetEmail, policy, attemptedTools);
    }

    let attacks = null;
    let suiteResult = null;
    if (mode === "red-team" || mode === "all") {
      const activePolicy: Policy = policy || {
        agent: "unrestricted-baseline",
        version: "0.0",
        generatedAt: new Date().toISOString(),
        allow: EMAIL_MCP_TOOLS.map(t => t.name),
        approval: [],
        deny: []
      };
      attacks = await generateAdversarialAttacks(purpose, EMAIL_MCP_TOOLS, activePolicy, userApiKey);
      suiteResult = runRedTeamSuite(attacks, activePolicy);
    }

    return NextResponse.json({
      success: true,
      attacks,
      suiteResult,
      comparisonRun
    });
  } catch (err) {
    console.error("API /api/attacks error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to run adversarial attacks"
      },
      { status: 500 }
    );
  }
}
