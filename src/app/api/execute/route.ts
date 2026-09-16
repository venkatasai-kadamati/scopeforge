import { NextRequest, NextResponse } from "next/server";
import { executeGatedToolCall } from "@/lib/policy/engine";
import { Policy } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const toolName: string = body.toolName;
    const policy: Policy | null = body.policy || null;
    const args: Record<string, unknown> = body.args || {};
    const bypassPolicy: boolean = Boolean(body.bypassPolicy);
    const userApproved: boolean = Boolean(body.userApproved);

    if (!toolName) {
      return NextResponse.json(
        { success: false, error: "toolName is required" },
        { status: 400 }
      );
    }

    const trace = executeGatedToolCall(toolName, policy, args, bypassPolicy, userApproved);

    return NextResponse.json({
      success: true,
      trace
    });
  } catch (err) {
    console.error("API /api/execute error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to execute tool call"
      },
      { status: 500 }
    );
  }
}
