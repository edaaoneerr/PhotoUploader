import { Outlet, Scripts, ScrollRestoration } from "react-router";


export default function Root() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Outlet />

        {/* 👇 BUNLAR YOKSA CLICK YOK */}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
