(function () {
	'use strict';
	const $ = id => document.getElementById(id);
	async function request(path) {
		const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store' });
		if (!response.ok) throw new Error('HTTP ' + response.status);
		return response.json();
	}
	function message(id, text) { $(id).textContent = text; }
	function clear() {
		$('camera-grid').replaceChildren();
		$('empty-message').hidden = true;
	}
	function validSlot(camera) {
		return camera && typeof camera === 'object' && /^camera-[1-4]$/.test(camera.id) &&
			camera.status === 'unknown' && Number.isInteger(camera.rtsp_port) &&
			camera.rtsp_port >= 1 && camera.rtsp_port <= 65535;
	}
	function readSlots(data) {
		if (!data || data.version !== 1 || data.discovery !== 'launcher-manifest' || !Array.isArray(data.cameras)) {
			throw new Error('Invalid camera registry');
		}
		if (data.cameras.length > 4) throw new Error('Invalid camera registry: maximum 4 slots');
		const ids = new Set();
		for (const camera of data.cameras) {
			if (!validSlot(camera) || ids.has(camera.id)) throw new Error('Invalid camera slot in registry');
			ids.add(camera.id);
		}
		return data.cameras.slice().sort((a, b) => a.id.localeCompare(b.id));
	}
	function renderCamera(camera) {
		const col = document.createElement('div'); col.className = 'col-sm-6 col-xl-3';
		const card = document.createElement('div'); card.className = 'card camera-tile h-100';
		const body = document.createElement('div'); body.className = 'card-body';
		const title = document.createElement('h2'); title.className = 'h5';
		title.textContent = camera.id;
		const state = document.createElement('p'); state.className = 'small text-secondary mb-2';
		state.textContent = 'Status unknown — availability not verified.';
		const port = document.createElement('p'); port.className = 'small text-secondary mb-0';
		port.textContent = 'Configured RTSP port: ' + camera.rtsp_port + '. No stream route is advertised.';
		body.append(title, state, port); card.append(body); col.append(card);
		$('camera-grid').append(col);
	}
	let generation = 0;
	async function discover() {
		const current = ++generation;
		clear();
		message('status-message', 'Loading camera registry…');
		try {
			const data = await request('/api/cameras');
			if (current !== generation) return;
			const cameras = readSlots(data);
			cameras.forEach(renderCamera);
			if (!cameras.length) {
				$('empty-message').hidden = false;
				message('status-message', 'No configured camera slots.');
			} else {
				message('status-message', cameras.length + ' configured camera slot' + (cameras.length === 1 ? '' : 's') + '. Availability is unknown.');
			}
		} catch (error) {
			if (current !== generation) return;
			clear();
			message('status-message', 'Camera registry unavailable: ' + error.message);
		}
	}
	$('refresh').addEventListener('click', discover);
	discover();
}());
