// app/root.jsx
import { Outlet } from "react-router";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";

import "@shopify/polaris/build/esm/styles.css";

export default function Root() {
  return (
    <AppProvider i18n={enTranslations}>
      {/* Shopify'in kendi AppProvider'ı zaten app.jsx içinde,
          burada sadece Polaris'i sarmalıyoruz */}
      <Outlet />
    </AppProvider>
  );
}
