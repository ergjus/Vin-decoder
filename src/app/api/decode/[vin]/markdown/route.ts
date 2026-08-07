import { decodeVin } from "@/lib/decode";
import { buildLlmMarkdown } from "@/lib/llm-markdown";
import { validateVin } from "@/lib/vin/validate";

// Same decode as the web UI and the JSON API, rendered as Markdown — built
// for pasting into an LLM. e.g. /api/decode/1FTFW1ET9DFC10312/markdown

export async function GET(
  req: Request,
  { params }: { params: Promise<{ vin: string }> }
) {
  const { vin: rawVin } = await params;
  const validation = validateVin(rawVin);
  if (!validation.ok) {
    return new Response(validation.message, { status: 400 });
  }
  const vin = validation.vin;

  try {
    const vehicle = await decodeVin(vin);
    const origin = new URL(req.url).origin;
    const markdown = await buildLlmMarkdown(vehicle, {
      pageUrl: `${origin}/vin/${vin}`,
      stickerUrl: `${origin}/api/sticker/${vin}`,
    });
    return new Response(markdown, {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "cache-control": "public, s-maxage=86400",
      },
    });
  } catch {
    return new Response("The NHTSA decode service didn't respond. Try again later.", {
      status: 502,
    });
  }
}
