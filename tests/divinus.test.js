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
const slot = (n, port = 8553 + n) => ({ id: 'camera-' + n, status: 'unknown', rtsp_port: port });
const manifest = cameras => ({ version: 1, discovery: 'launcher-manifest', cameras });
let registry = manifest([slot(1)]), failure = 0, jsonFailure = false;
const calls = [];
const fetch = async (url, options) => {
	calls.push(url); assert.strictEqual(url, '/api/cameras');
	assert.strictEqual(options.credentials, 'same-origin'); assert.strictEqual(options.cache, 'no-store');
	if (failure === 'network') throw new Error('network failure');
	if (failure) return { ok: false, status: failure };
	return { ok: true, json: async () => { if (jsonFailure) throw new Error('bad JSON'); return registry; } };
};
vm.runInNewContext(source, { document: { getElementById: id => { assert(elements[id], id); return elements[id]; }, createElement: element }, fetch });
const flush = () => new Promise(resolve => setImmediate(resolve));
const refresh = () => elements.refresh.handlers.click();
const grid = elements['camera-grid'];
const status = elements['status-message'];
const empty = elements['empty-message'];
const body = i => grid.children[i].children[0].children[0];
async function invalid(value, pattern = /Invalid camera/) {
	registry = value; await refresh();
	assert.match(status.textContent, pattern); assert.strictEqual(grid.children.length, 0); assert.strictEqual(empty.hidden, true);
}
(async () => {
	await flush(); await flush();
	assert.deepStrictEqual(calls, ['/api/cameras']);
	for (let count = 0; count <= 4; count++) {
		registry = manifest(Array.from({ length: count }, (_, i) => slot(count - i)));
		await refresh();
		assert.strictEqual(grid.children.length, count);
		assert.strictEqual(empty.hidden, count !== 0);
		assert.match(status.textContent, count ? new RegExp(count + ' configured camera slot') : /No configured camera slots/);
		for (let i = 0; i < count; i++) {
			assert.strictEqual(body(i).children[0].textContent, 'camera-' + (i + 1));
			assert.match(body(i).children[1].textContent, /unknown.*not verified/i);
			assert.match(body(i).children[2].textContent, new RegExp('port: ' + (8554 + i)));
		}
	}
	await invalid(manifest([slot(1), slot(1)]));
	await invalid(manifest([slot(1), slot(2), slot(3), slot(4), slot(1)]), /maximum 4/);
	await invalid(manifest([slot(5)]));
	await invalid(manifest([{ ...slot(1), status: 'live' }]));
	for (const port of [0, -1, 65536, 1.5, '8554', null]) await invalid(manifest([slot(1, port)]));
	for (const port of [1, 65535]) {
		registry = manifest([slot(1, port)]); await refresh();
		assert.match(body(0).children[2].textContent, new RegExp('port: ' + port));
	}
	for (const value of [{ version: 1, cameras: [] }, { ...manifest([]), discovery: 'local-only' }, { ...manifest([]), version: 2 }, { ...manifest([]), cameras: {} }, null]) await invalid(value, /Invalid camera registry/);
	for (const error of [404, 503, 'network']) {
		registry = manifest([slot(1)]); failure = 0; await refresh();
		assert.strictEqual(grid.children.length, 1);
		failure = error; await refresh();
		assert.match(status.textContent, error === 'network' ? /network failure/ : new RegExp('HTTP ' + error));
		assert.strictEqual(grid.children.length, 0); assert.strictEqual(empty.hidden, true);
	}
	failure = 0; jsonFailure = true; await refresh();
	assert.match(status.textContent, /bad JSON/); assert.strictEqual(grid.children.length, 0); assert.strictEqual(empty.hidden, true);
	jsonFailure = false; registry = manifest([]); await refresh();
	assert.match(status.textContent, /No configured camera slots/); assert.strictEqual(empty.hidden, false);
	console.log('Divinus frontend tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
