import type { AppLoadContext, EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext
) {
  const prohibitOutOfOrderStreaming =
    isBotRequest(request.headers.get("user-agent")) || remixContext.isSpaMode;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ABORT_DELAY);

  const body = await renderToReadableStream(
    <RemixServer
      context={remixContext}
      url={request.url}
      abortDelay={ABORT_DELAY}
    />,
    {
      signal: controller.signal,
      onError(error: unknown) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
        responseStatusCode = 500;
      },
    }
  );

  body.allReady.then(() => clearTimeout(timeoutId));

  if (prohibitOutOfOrderStreaming) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

function isBotRequest(userAgent: string | null) {
  if (!userAgent) {
    return false;
  }
  return isbot(userAgent);
}
