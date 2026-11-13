import type { NextRequest } from "next/server";
import { executeUltimateAction } from "@/lib/safety/ultimate-policy";

export async function POST(req: NextRequest): Promise<Response> {
  return executeUltimateAction(req);
}
