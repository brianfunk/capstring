/**
 * The interactive API Reference (Swagger UI), served by the API function itself at GET /api when
 * the client asks for HTML (a browser). Non-browser clients get the JSON service info instead.
 * Kept as a module so the function bundle has no file-system dependency.
 */
export const SWAGGER_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <script src="/theme-init.js"></script>
  <title>capstring API Reference</title>
  <meta name="description" content="OpenAPI reference for the capstring HTTP API: transform text into every style, batch, spell check, count, lorem ipsum, and SVG badges. Try every endpoint in the browser.">
  <link rel="icon" type="image/svg+xml" href="/icon.svg">
  <link rel="apple-touch-icon" href="/icon.svg">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css">
  <link rel="stylesheet" href="/site.css">
  <link rel="stylesheet" href="/swagger-theme.css">
</head>
<body>
  <div class="site-shell"><header data-site-header></header></div>
  <div id="swagger-ui"></div>
  <div class="site-shell"><footer data-site-footer></footer></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js" crossorigin="anonymous"></script>
  <script src="/site.js"></script>
  <script>
    window.addEventListener('load', async () => {
      // The spec is written against the canonical host; point "Servers" at wherever this page is served from
      const spec = await fetch('/openapi.json').then((r) => r.json());
      spec.servers = [{ url: location.origin + '/api', description: location.hostname }];
      window.ui = SwaggerUIBundle({
        spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        displayRequestDuration: true,
        defaultModelsExpandDepth: 1,
        tryItOutEnabled: true,
        filter: true,
        tagsSorter: 'alpha'
      });
    });
  </script>
</body>
</html>
`;
