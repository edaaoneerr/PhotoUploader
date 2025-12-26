import { hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@shopify/shopify-app-react-router/react";
import routes from "@shopify/shopify-app-react-router/routes";

hydrateRoot(
  document,
  <RouterProvider routes={routes} />
);
