# Divinus WebUI x86

A same-origin x86 dashboard derived from [OpenIPC/majestic-webui](https://github.com/OpenIPC/majestic-webui). It displays the local pipeline from Divinus `GET /api/cameras` version 1. This registry does not discover devices or provide multi-camera routing: `local` is a logical pipeline ID, and `status: unknown` does not mean a camera is connected or available. An absent, failed or invalid registry is reported without inventing a camera.

The dashboard shows the registry's snapshot, MJPEG and MP4 **configured** flags, not backend support, readiness or a promise of frames. A configured snapshot link uses `/image.jpg` and may fail. System information comes from `/api/status`; its success does not establish camera liveness. All requests and links use relative same-origin paths; registry routes and ports are not used to construct destinations.

For the x86 UVC backend, continuous MJPEG and audio are unsupported. JPEG requires a captured MJPEG frame and is unavailable for YUYV. Image and audio controls are not exposed by this dashboard, rather than implying UVC supports them. Other Divinus backends may differ. This frontend has not been validated on a physical x86 camera.

## Deployment

Serve `www/` from Divinus using `web_enable_static` and `DIVINUS_STATIC_ROOT`/the device static root. With `web_enable_auth`, the browser handles HTTP Basic authentication and API requests use `credentials: 'same-origin'`. Configure authentication in Divinus. On an unclaimed device Divinus serves its own first-claim page and handles `POST /setup`.

The registry requires a Divinus version providing `/api/cameras`; older versions produce an error rather than a fallback camera. See Divinus `doc/multi-camera.md` and `doc/uvc.md` for the contract and backend limitations.

## Development

Run `npm run test:divinus` for Node frontend and contract tests; these do not replace device testing. Original upstream tests remain available via `npm test` and mostly cover inherited Majestic code.

MIT licensed; see `LICENSE`.
