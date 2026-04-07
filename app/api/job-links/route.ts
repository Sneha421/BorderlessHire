import { NextRequest } from "next/server";

import { searchJobPortals } from "@/lib/exa";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      applyUrl?: string;
      company?: string;
      title?: string;
      query?: string;
    };

    if (!body.applyUrl || !body.company || !body.title || !body.query) {
      return Response.json(
        { error: "applyUrl, company, title, and query are required." },
        { status: 400 }
      );
    }

    const portals = await searchJobPortals({
      applyUrl: body.applyUrl,
      company: body.company,
      title: body.title,
      query: body.query
    });

    return Response.json({ portals });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch job portals.";

    return Response.json({ error: message }, { status: 500 });
  }
}
