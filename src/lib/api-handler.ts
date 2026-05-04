import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors";

type RouteContext = { params: Record<string, string> };
type RouteHandler = (req: NextRequest, ctx?: RouteContext) => Promise<NextResponse>;

export function apiHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(err.toJSON(), { status: err.statusCode });
      }
      console.error(`[api] ${req.method} ${req.nextUrl.pathname}`, err);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
  };
}
