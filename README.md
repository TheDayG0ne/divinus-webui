# Divinus WebUI x86

A same-origin x86 dashboard derived from [OpenIPC/majestic-webui](https://github.com/OpenIPC/majestic-webui). It displays configured `camera-1` through `camera-4` slots from Divinus `GET /api/cameras` version 1. The launcher manifest is read-only: `status: unknown` does not mean a camera is connected, streaming or available. Empty, failed and invalid registries are reported without inventing a camera.

The dashboard deliberately does not invent stream, snapshot or settings routes. It does not create RTSP URLs from a port: the server contract does not provide a worker address or RTSP path, and no field explicitly authorizes a usable RTSP link. All requests and links use relative same-origin paths; no HTTP ports or origins are added.

Dynamic camera management, snapshot and live status are not implemented yet. The dashboard preserves this warning and shows only the configured slot identity and validated RTSP port. Other Divinus backends may differ. This frontend has not been validated on a physical x86 camera.

## Deployment

Serve `www/` from Divinus using `web_enable_static` and `DIVINUS_STATIC_ROOT`/the device static root. With `web_enable_auth`, the browser handles HTTP Basic authentication and API requests use `credentials: 'same-origin'`. Configure authentication in Divinus. On an unclaimed device Divinus serves its own first-claim page and handles `POST /setup`.

The registry requires a Divinus version providing `/api/cameras`; older versions produce an error rather than a fallback camera. See Divinus `doc/multi-camera.md` and `doc/uvc.md` for the contract and backend limitations.

## Development

Run `npm run test:divinus` for Node frontend and contract tests; these do not replace device testing. Original upstream tests remain available via `npm test` and mostly cover inherited Majestic code.

MIT licensed; see `LICENSE`.
