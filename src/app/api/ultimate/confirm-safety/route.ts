import type { NextRequest } from "next/server";
import { confirmUltimateSafety } from "@/lib/safety/ultimate-policy";

export async function POST(req: NextRequest): Promise<Response> {
  return confirmUltimateSafety(req);
}
