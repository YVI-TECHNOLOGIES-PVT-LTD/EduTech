import { Request, Response } from 'express';
import { openApiDocument } from '../openapi.spec';

export class SwaggerRenderer {
  public static renderHtml(specUrl = '/api/docs.json'): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EduTrack ERP — API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; font-family: sans-serif; }
    .swagger-ui .topbar { background-color: #1e293b; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
  }
}

export class SwaggerController {
  public getJsonSpec = (req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(openApiDocument, null, 2));
  };

  public getUi = (req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'text/html');
    res.send(SwaggerRenderer.renderHtml());
  };
}
