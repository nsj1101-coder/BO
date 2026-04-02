import { getTrackingScript } from "@/lib/tracking-script";

export async function GET() {
  const script = getTrackingScript();
  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
