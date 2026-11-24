(function () {
	'use strict';
	const $ = id => document.getElementById(id);
	const MAX_CAMERAS = 4;
	let cameras = [];
	let selected = null;
	let playing = false;
	const centralOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : '';

	function cameraOrigin(camera) {
		if (!camera || camera.port == null || camera.port === '') return centralOrigin;
		const port = Number(camera.port);
		if (!Number.isInteger(port) || port < 1 || port > 65535) return centralOrigin;
		const u = new URL(centralOrigin);
		u.port = String(port);
		return u.origin;
	}
	function endpoint(camera, path) { return cameraOrigin(camera) + path; }
	async function request(camera, path) {
		const response = await fetch(endpoint(camera, path), { credentials: 'same-origin', cache: 'no-store' });
		if (!response.ok) throw new Error('HTTP ' + response.status);
		return response.json();
	}
	function message(id, text) { const node = $(id); if (node) node.textContent = text; }
	function numberPort(value) {
		const n = Number(value);
		return Number.isInteger(n) && n > 0 && n <= 65535 ? n : null;
	}
	function normalizeCameras(data) {
		const list = data && (data.cameras || data.instances || (data.launcher && data.launcher.cameras));
		if (!Array.isArray(list)) return [{ id: 1, name: 'Camera 1', port: numberPort(data && (data.web_port || data.port)) }];
		return list.slice(0, MAX_CAMERAS).map((item, index) => {
			item = item && typeof item === 'object' ? item : {};
			return { id: item.id || item.index || index + 1, name: item.name || item.label || ('Camera ' + (index + 1)), port: numberPort(item.web_port || item.webPort || item.port), available: item.available !== false && item.online !== false, status: item.status };
		}).filter(camera => camera.available);
	}
	function renderCameras() {
		const grid = $('camera-grid');
		grid.replaceChildren();
		$('empty-message').hidden = cameras.length !== 0;
		cameras.forEach(camera => {
			const col = document.createElement('div'); col.className = 'col-sm-6 col-xl-3';
			const card = document.createElement('button'); card.type = 'button'; card.className = 'card w-100 text-start h-100 camera-tile';
			const body = document.createElement('div'); body.className = 'card-body';
			const title = document.createElement('h2'); title.className = 'h5'; title.textContent = camera.name;
			const port = document.createElement('p'); port.className = 'small text-secondary mb-0'; port.textContent = camera.port ? 'Port ' + camera.port : 'Local camera';
			body.append(title, port); card.append(body); col.append(card); grid.append(col);
			card.addEventListener('click', () => select(camera));
		});
	}
	async function discover() {
		try {
			const data = await request(null, '/api/status');
			cameras = normalizeCameras(data);
			message('status-message', cameras.length ? cameras.length + ' camera' + (cameras.length === 1 ? '' : 's') + ' available' : 'No cameras available');
			renderCameras();
			if (!selected || !cameras.some(camera => camera.id === selected.id)) { if (cameras[0]) select(cameras[0]); else clearDetail(); }
		} catch (error) { cameras = []; renderCameras(); clearDetail(); message('status-message', 'Camera status unavailable: ' + error.message); }
	}
	function clearDetail() { $('camera-detail').hidden = true; }
	function showIsp(data) {
		$('mirror').checked = data.mirror === true; $('flip').checked = data.flip === true; $('antiflicker').value = data.antiflicker;
	}
	function preview(on) {
		playing = on; $('preview').hidden = !on; $('preview-note').hidden = on; $('preview-toggle').textContent = on ? 'Stop preview' : 'Start preview';
		if (on) $('preview').src = endpoint(selected, '/mjpeg'); else $('preview').removeAttribute('src');
	}
	async function select(camera) {
		selected = camera; $('camera-detail').hidden = false; $('settings-card').hidden = false; $('camera-title').textContent = camera.name; $('preview-title').textContent = camera.name + ' preview';
		preview(false); $('preview-note').textContent = 'Checking stream availability…'; $('preview-toggle').disabled = true; $('snapshot').hidden = true;
		try { await loadStatus(camera); } catch (_) { message('status-message', camera.name + ' is unavailable'); }
		try { showIsp(await request(camera, '/api/isp')); } catch (error) { message('isp-message', 'Image settings unavailable: ' + error.message); }
		try { const audio = await request(camera, '/api/audio'); $('audio-enable').checked = audio.enable === true; $('audio-bitrate').value = audio.bitrate; $('audio-gain').value = audio.gain; $('audio-srate').value = audio.srate; } catch (error) { message('audio-message', 'Audio settings unavailable: ' + error.message); }
		try { const media = await request(camera, '/api/mjpeg'); if (media.enable) { $('preview-toggle').disabled = false; preview(true); } else message('preview-note', 'MJPEG is disabled for this camera.'); } catch (error) { message('preview-note', 'MJPEG unavailable: ' + error.message); }
		try { const jpeg = await request(camera, '/api/jpeg'); $('snapshot').href = endpoint(camera, '/image.jpg'); $('snapshot').hidden = !jpeg.enable; } catch (_) { /* Optional endpoint. */ }
	}
	async function loadStatus(camera) {
		const data = await request(camera, '/api/status'); const list = $('status'); list.replaceChildren();
		for (const [key, label] of [['chip', 'Chip'], ['sensor', 'Sensor'], ['uptime', 'Uptime'], ['memory', 'Memory'], ['loadavg', 'Load average']]) {
			if (data[key] == null) continue; const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = Array.isArray(data[key]) ? data[key].join(', ') : String(data[key]); list.append(dt, dd);
		}
		$('camera-state').textContent = 'Available';
	}
	$('isp-form').addEventListener('submit', async event => { event.preventDefault(); const values = new URLSearchParams({ mirror: String($('mirror').checked), flip: String($('flip').checked), antiflicker: $('antiflicker').value }); $('apply').disabled = true; try { showIsp(await request(selected, '/api/isp?' + values)); message('isp-message', 'Configuration updated.'); } catch (error) { message('isp-message', 'Update failed: ' + error.message); } finally { $('apply').disabled = false; } });
	$('save').addEventListener('click', async () => { $('save').disabled = true; try { const data = await request(selected, '/api/cmd?save'); if (data.code !== 0) throw new Error('code ' + data.code); message('isp-message', 'Configuration saved.'); } catch (error) { message('isp-message', 'Save failed: ' + error.message); } finally { $('save').disabled = false; } });
	$('audio-form').addEventListener('submit', async event => { event.preventDefault(); const values = new URLSearchParams({ enable: String($('audio-enable').checked), bitrate: $('audio-bitrate').value, gain: $('audio-gain').value, srate: $('audio-srate').value }); try { const data = await request(selected, '/api/audio?' + values); $('audio-enable').checked = data.enable === true; message('audio-message', 'Audio configuration updated.'); } catch (error) { message('audio-message', 'Update failed: ' + error.message); } });
	$('preview').addEventListener('error', () => { preview(false); message('preview-note', 'MJPEG stream unavailable.'); });
	$('preview-toggle').addEventListener('click', () => preview(!playing));
	$('refresh').addEventListener('click', discover);
	discover();
}());
