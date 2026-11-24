'use strict';

// Static contract checks for the future Divinus server integration. These do
// not build or start Divinus; they keep the frontend aligned with the
// read-only endpoint and first-claim contract in sources/divinus.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readDivinus = file => fs.readFileSync(path.join('D:\\OpenIPC-x86\\sources\\divinus', file), 'utf8');
const readme = read('README.md');
const page = read('www/index.html');
const script = read('www/a/divinus.js');
const endpoints = readDivinus('doc/endpoints.md');
const server = readDivinus('src/server.c');

const frontendEndpoints = ['/api/status', '/api/isp', '/api/audio', '/api/mjpeg',
	'/api/jpeg', '/api/cmd?save', '/mjpeg', '/image.jpg'];
for (const endpoint of frontendEndpoints) {
	assert(readme.includes(endpoint), `README documents ${endpoint}`);
}
assert(readme.includes('web_enable_static'), 'deployment uses Divinus static serving');
assert(readme.includes('POST /setup'), 'deployment describes the server-owned setup flow');
assert(!/proxy_pass|proxy_set_header/i.test(readme), 'frontend has no proxy configuration');
assert(!/```nginx/i.test(readme), 'frontend has no nginx configuration');
assert(page.includes("href=\"/image.jpg\""), 'snapshot is same-origin');
assert(script.includes("fetch(path, { credentials: 'same-origin'"), 'API uses same-origin credentials');
assert(!/https?:\/\//.test(script), 'frontend has no cross-origin API URL');
for (const endpoint of frontendEndpoints) {
	const documented = endpoint.split('?')[0];
	assert(endpoints.includes(`#### \`${documented}\``) ||
		(documented === '/mjpeg' && endpoints.includes('Continuous MJPEG stream')) ||
		(documented === '/image.jpg' && endpoints.includes('JPEG image')), `Divinus documents ${documented}`);
}
assert(server.includes('WWW-Authenticate: Basic'), 'Divinus challenges with Basic auth');
assert(server.includes('EQUALS(req->uri, "/setup")'), 'Divinus owns POST /setup');
assert(readDivinus('doc/uvc.md').includes('continuous MJPEG output is not supported'),
	'UVC limitation is scoped to the UVC backend documentation');
console.log('Divinus frontend contract checks passed');
