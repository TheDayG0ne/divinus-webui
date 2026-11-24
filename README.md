# Divinus WebUI x86

An experimental Divinus-facing frontend derived from [OpenIPC/majestic-webui](https://github.com/OpenIPC/majestic-webui), retaining its logo, Bootstrap theme and visual components. The default entry point is a deliberately small Divinus-specific page; the inherited Majestic CGI pages and tools are **not** a supported Divinus interface.

## Implemented

- Status from `GET /api/status`.
- MJPEG preview from `/mjpeg` when `/api/mjpeg` reports it enabled, and a snapshot link when `/api/jpeg` reports JPEG enabled.
- Read and update `mirror`, `flip` and `antiflicker` with `/api/isp`; explicitly persist the current configuration with `/api/cmd?save`. Divinus updates configuration here; it does not promise that the ISP hardware changes immediately. Restart may be required.

Availability depends on the Divinus build, configuration, device and browser. No Majestic `/api/v1`, CGI, WebRTC, settings tree, firmware management, recording manager or login flow is claimed to work. This is not yet validated on a physical x86 camera.

## Deployment

Divinus serves its own embedded page at `/` and does **not** serve this `index.html` there. Its optional static file handler uses filesystem paths and supplies an incorrect MIME type; do not expose that handler to untrusted clients. Serve `www/` using a separate HTTP server, and reverse proxy `/api/`, `/mjpeg` and `/image.jpg` to Divinus on the same origin. An illustrative nginx configuration follows (adapt paths, ports, authentication and network access to your installation):

```nginx
server {
    listen 8081;
    root /opt/divinus-webui/www;
    location = / { try_files /index.html =404; }
    location = /index.html { try_files $uri =404; }
    location ^~ /a/ { try_files $uri =404; }
    location = /favicon.ico { try_files $uri =404; }
    location ^~ /api/ { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host:$server_port; }
    location = /mjpeg { proxy_pass http://127.0.0.1:8080; proxy_buffering off; proxy_read_timeout 1h; }
    location = /image.jpg { proxy_pass http://127.0.0.1:8080; }
    location / { return 404; }
}
```

Configure Divinus to listen on port 8080 and restrict direct access to it. Divinus Basic authentication, if enabled, is passed through by nginx; configure appropriate TLS and access control at the proxy and do not expose either service directly to the internet. Divinus uses state-changing GET requests; its own cross-site protections and authentication depend on the deployed version and proxy headers. Test them before deployment. Do not expose the inherited CGI scripts, setup pages, or sensitive files. The proxy example does not integrate Divinus's first-claim flow: provision the device separately first. Divinus API and JPEG/MJPEG capabilities can differ between versions and platforms.

## Development

`node tests/divinus.test.js` exercises the frontend against mocked Divinus responses; it is not a substitute for testing with a real device. Original upstream tests remain available via `npm test` and mostly cover inherited Majestic code, not this page.

MIT licensed; see `LICENSE`.
