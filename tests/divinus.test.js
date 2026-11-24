'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../www/index.html'), 'utf8');
const source = fs.readFileSync(path.join(__dirname, '../www/a/divinus.js'), 'utf8');
function element() { return { hidden: false, textContent: '', children: [], handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, append(...items) { this.children.push(...items); }, replaceChildren() { this.children = []; } }; }
const elements = {};
for (const [, id] of html.matchAll(/id="([^"]+)"/g)) elements[id] = element();
const calls = [];
let registry = { version: 1, discovery: 'launcher-manifest', cameras: [
	{ id: 'camera-1', status: 'unknown', rtsp_port: 8554 },
	{ id: 'camera-4', status: 'unknown', rtsp_port: 9554 }
] };
let failure = 0;
const fetch = async (url, options) => {
	calls.push(url); assert(url.startsWith('/') && !url.startsWith('//')); assert.strictEqual(options.credentials, 'same-origin');
	if (failure) return { ok: false, status: failure };
	return { ok: true, json: async () => registry };
};
vm.runInNewContext(source, { document: { getElementById: id => { assert(elements[id], id); return elements[id]; }, createElement: element }, fetch });
const flush = () => new Promise(resolve => setImmediate(resolve));
(async () => {
	await flush(); await flush();
	assert.deepStrictEqual(calls, ['/api/cameras']);
	assert.match(elements['status-message'].textContent, /2 configured camera slots/);
	assert.strictEqual(elements['camera-grid'].children.length, 2);
	assert.match(elements['camera-grid'].children[0].children[0].children[0].children[0].textContent, /camera-1/);
	registry = { version: 1, cameras: [] }; await elements.refresh.handlers.click();
	assert.strictEqual(elements['camera-grid'].children.length, 0);
	assert.strictEqual(elements['empty-message'].hidden, false);
	failure = 503; await elements.refresh.handlers.click();
	assert.match(elements['status-message'].textContent, /503/);
	failure = 0; registry = { version: 1, cameras: [{ id: 'camera-5', status: 'unknown', rtsp_port: 8554 }] }; await elements.refresh.handlers.click();
	assert.match(elements['status-message'].textContent, /Invalid camera slot/);
	registry = { version: 1, cameras: [{ id: 'camera-1', status: 'live', rtsp_port: 8554 }] }; await elements.refresh.handlers.click();
	assert.match(elements['status-message'].textContent, /Invalid camera slot/);
	console.log('Divinus frontend tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
