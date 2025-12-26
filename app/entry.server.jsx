import { renderToString } from "react-dom/server";
import { RouterProvider } from "@shopify/shopify-app-react-router/react";
import routes from "virtual:shopify-app/routes";
import { addDocumentResponseHeaders } from "./shopify.server";

export default function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  context
) {
  addDocumentResponseHeaders(request, responseHeaders);

  const html = renderToString(
    <RouterProvider
      routes={routes}
      url={request.url}
      context={context}
    />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response(`<!DOCTYPE html>${html}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
