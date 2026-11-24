# Divinus WebUI x86

A single-origin x86 dashboard derived from [OpenIPC/majestic-webui](https://github.com/OpenIPC/majestic-webui), retaining its logo, Bootstrap theme, majestic visual components and x86 header. The dashboard discovers up to four available cameras from the launcher/status response and keeps camera API and media requests on the configured camera port; it does not embed or duplicate the full Majestic UI.

## Implemented

- Camera roster from the launcher/status response, capped at cameras 0..4; absent or unavailable cameras are not rendered and their settings are not shown.
- Same-origin API and media URLs, with `web_port`/`port` applied to each camera instance (no hard-coded port 80 and no separate duplicate UI).
- Status from `GET /api/status`.
- MJPEG preview from `/mjpeg` when `/api/mjpeg` reports it enabled, and a snapshot link when `/api/jpeg` reports JPEG enabled.
- Read and update `mirror`, `flip` and `antiflicker` with `/api/isp`; explicitly persist the current configuration with `/api/cmd?save`.

Availability depends on the Divinus build, configuration, device and browser. No Majestic `/api/v1`, CGI, WebRTC, settings tree, firmware management, recording manager or login flow is claimed to work. This is not yet validated on a physical x86 camera.

## Deployment

This frontend is intended to be served by Divinus itself: enable `web_enable_static` and point `DIVINUS_STATIC_ROOT`/the device static root at the contents of `www/`. The page, assets, API calls, snapshot and MJPEG stream then remain same-origin; no second web server or reverse proxy is part of this frontend.

When `web_enable_auth` is enabled, Divinus protects the page, assets, API and media endpoints with HTTP Basic authentication. The browser handles the challenge for a same-origin navigation, and the frontend uses `credentials: 'same-origin'` for API requests. Configure authentication in Divinus (`web_auth_user`, `web_auth_pass` and, if appropriate, `web_auth_skiplocal`) rather than adding a separate login or proxy layer. On an unclaimed device, Divinus serves its embedded first-claim page at `/` and accepts its documented `POST /setup` flow; this repository does not replace that server-owned setup page.

The frontend only relies on the Divinus endpoints documented in `D:\\OpenIPC-x86\\sources\\divinus\\doc\\endpoints.md`: `/api/status`, `/api/isp`, `/api/audio`, `/api/mjpeg`, `/api/jpeg`, `/api/cmd?save`, `/mjpeg` and `/image.jpg`. Endpoint availability still depends on the Divinus configuration and hardware. In particular, the x86 UVC backend can consume MJPEG or YUYV and encode H.264, but it does not provide audio and does not provide continuous MJPEG output; those UVC limitations must not be generalized to all Divinus platforms. The UI reports capability responses instead of promising a stream.

## Development

`node tests/divinus.test.js` exercises the frontend against mocked Divinus responses; it is not a substitute for testing with a real device. Original upstream tests remain available via `npm test` and mostly cover inherited Majestic code, not this page.

MIT licensed; see `LICENSE`.
