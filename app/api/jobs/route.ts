import { NextRequest } from "next/server";

import { searchSGJobs } from "@/app/actions/searchJobs";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim() || undefined;
    const { jobs, reason } = await searchSGJobs(query);

    return Response.json({ jobs, reason });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch jobs.";

    return Response.json({ error: message }, { status: 500 });
  }
}
