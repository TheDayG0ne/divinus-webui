# Divinus WebUI x86

An experimental Divinus-facing frontend derived from [OpenIPC/majestic-webui](https://github.com/OpenIPC/majestic-webui), retaining its logo, Bootstrap theme and visual components. The default entry point is a deliberately small Divinus-specific page; the inherited Majestic CGI pages and tools are **not** a supported Divinus interface.

## Implemented

- Status from `GET /api/status`.
- MJPEG preview from `/mjpeg` when `/api/mjpeg` reports it enabled, and a snapshot link when `/api/jpeg` reports JPEG enabled.
- Read and update audio enable, bitrate, gain and sample rate via `/api/audio`. Applying restarts the audio pipeline; actual device support varies.
- Read and update `mirror`, `flip` and `antiflicker` with `/api/isp`; explicitly persist the current configuration with `/api/cmd?save`. Divinus updates configuration here; it does not promise that the ISP hardware changes immediately. Restart may be required.

Availability depends on the Divinus build, configuration, device and browser. No Majestic `/api/v1`, CGI, WebRTC, settings tree, firmware management, recording manager or login flow is claimed to work. This is not yet validated on a physical x86 camera.

## Deployment

This frontend is intended to be served by Divinus itself: enable `web_enable_static` and point `DIVINUS_STATIC_ROOT`/the device static root at the contents of `www/`. The page, assets, API calls, snapshot and MJPEG stream then remain same-origin; no second web server or reverse proxy is part of this frontend.

When `web_enable_auth` is enabled, Divinus protects the page, assets, API and media endpoints with HTTP Basic authentication. The browser handles the challenge for a same-origin navigation, and the frontend uses `credentials: 'same-origin'` for API requests. Configure authentication in Divinus (`web_auth_user`, `web_auth_pass` and, if appropriate, `web_auth_skiplocal`) rather than adding a separate login or proxy layer. On an unclaimed device, Divinus serves its embedded first-claim page at `/` and accepts its documented `POST /setup` flow; this repository does not replace that server-owned setup page.

The frontend only relies on the Divinus endpoints documented in `D:\\OpenIPC-x86\\sources\\divinus\\doc\\endpoints.md`: `/api/status`, `/api/isp`, `/api/audio`, `/api/mjpeg`, `/api/jpeg`, `/api/cmd?save`, `/mjpeg` and `/image.jpg`. Endpoint availability still depends on the Divinus configuration and hardware. In particular, the x86 UVC backend can consume MJPEG or YUYV and encode H.264, but it does not provide audio and does not provide continuous MJPEG output; those UVC limitations must not be generalized to all Divinus platforms. The UI reports capability responses instead of promising a stream.

## Development

`node tests/divinus.test.js` exercises the frontend against mocked Divinus responses; it is not a substitute for testing with a real device. Original upstream tests remain available via `npm test` and mostly cover inherited Majestic code, not this page.

MIT licensed; see `LICENSE`.
