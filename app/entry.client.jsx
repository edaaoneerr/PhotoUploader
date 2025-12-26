import { hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@shopify/shopify-app-react-router/react";
import routes from "virtual:shopify-app/routes";

hydrateRoot(
  document,
  <RouterProvider routes={routes} />
);
