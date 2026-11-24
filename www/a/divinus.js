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
		$('camera-detail').hidden = true;
		$('empty-message').hidden = true;
		$('snapshot').hidden = true;
		$('status').replaceChildren();
	}
	let generation = 0;
	async function discover() {
		const current = ++generation;
		clear();
		message('system-message', '');
		message('status-message', 'Loading camera registry…');
		try {
			const data = await request('/api/cameras');
			if (current !== generation) return;
			if (!data || data.version !== 1 || !Array.isArray(data.cameras)) throw new Error('Invalid camera registry');
			if (!data.cameras.length) {
				$('empty-message').hidden = false;
				message('status-message', 'No camera pipeline registered.');
				return;
			}
			// The current registry describes only this process's local pipeline.
			const camera = data.cameras.find(item => item && item.id === 'local');
			if (!camera) throw new Error('Local pipeline not present in camera registry');
			const capabilities = camera.capabilities || {};
			const card = document.createElement('div');
			card.className = 'col-sm-6 col-xl-3';
			const body = document.createElement('div'); body.className = 'card card-body';
			const title = document.createElement('h2'); title.className = 'h5'; title.textContent = 'Local pipeline';
			const state = document.createElement('p'); state.className = 'small text-secondary mb-0';
			state.textContent = 'Camera status: ' + (camera.status === 'unknown' ? 'unknown' : 'not verified');
			body.append(title, state); card.append(body); $('camera-grid').append(card);
			$('camera-detail').hidden = false;
			message('camera-state', 'Status unknown');
			message('status-message', 'Local pipeline registered; camera availability is unknown.');
			message('capabilities', 'Configured: snapshot ' + (capabilities.snapshot_configured === true ? 'on' : capabilities.snapshot_configured === false ? 'off' : 'unknown') + ', MJPEG ' + (capabilities.mjpeg_configured === true ? 'on' : capabilities.mjpeg_configured === false ? 'off' : 'unknown') + ', MP4 ' + (capabilities.mp4_configured === true ? 'on' : capabilities.mp4_configured === false ? 'off' : 'unknown') + '. Configuration does not confirm backend support or availability.');
			$('snapshot').hidden = capabilities.snapshot_configured !== true;
			try {
				const status = await request('/api/status');
				if (current !== generation) return;
				for (const [key, label] of [['chip', 'Chip'], ['sensor', 'Sensor'], ['uptime', 'Uptime'], ['memory', 'Memory'], ['loadavg', 'Load average']]) {
					if (status[key] == null) continue;
					const dt = document.createElement('dt'), dd = document.createElement('dd');
					dt.textContent = label; dd.textContent = Array.isArray(status[key]) ? status[key].join(', ') : String(status[key]);
					$('status').append(dt, dd);
				}
			} catch (error) { if (current === generation) message('system-message', 'System status unavailable: ' + error.message); }
		} catch (error) {
			if (current !== generation) return;
			clear();
			message('status-message', 'Camera registry unavailable: ' + error.message);
		}
	}
	$('refresh').addEventListener('click', discover);
	discover();
}());
