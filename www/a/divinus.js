(function () {
	'use strict';
	const $ = id => document.getElementById(id);
	async function request(path) {
		const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store' });
		if (!response.ok) throw new Error('HTTP ' + response.status);
		return response.json();
	}
	function message(id, text) { $(id).textContent = text; }
	async function status() {
		try {
			const data = await request('/api/status');
			const list = $('status');
			list.replaceChildren();
			for (const [key, label] of [['chip', 'Chip'], ['sensor', 'Sensor'], ['uptime', 'Uptime'], ['memory', 'Memory'], ['loadavg', 'Load average']]) {
				if (data[key] == null) continue;
				const dt = document.createElement('dt'), dd = document.createElement('dd');
				dt.textContent = label;
				dd.textContent = Array.isArray(data[key]) ? data[key].join(', ') : String(data[key]);
				list.append(dt, dd);
			}
			message('status-message', '');
		} catch (e) { message('status-message', 'Status unavailable: ' + e.message); }
	}
	function showIsp(data) {
		$('mirror').checked = data.mirror === true;
		$('flip').checked = data.flip === true;
		$('antiflicker').value = data.antiflicker;
		for (const id of ['mirror', 'flip', 'antiflicker', 'apply', 'save']) $(id).disabled = false;
	}
	async function loadIsp() {
		try { showIsp(await request('/api/isp')); }
		catch (e) { message('isp-message', 'Image settings unavailable: ' + e.message); }
	}
	$('isp-form').addEventListener('submit', async event => {
		event.preventDefault();
		const values = new URLSearchParams({ mirror: String($('mirror').checked), flip: String($('flip').checked), antiflicker: $('antiflicker').value });
		$('apply').disabled = true;
		try {
			const data = await request('/api/isp?' + values);
			showIsp(data);
			message('isp-message', 'Configuration updated. Save to persist; hardware may require restart.');
		} catch (e) { message('isp-message', 'Update failed: ' + e.message); $('apply').disabled = false; }
	});
	$('save').addEventListener('click', async () => {
		if (!confirm('Save the current Divinus configuration to disk?')) return;
		$('save').disabled = true;
		try {
			const data = await request('/api/cmd?save');
			if (data.code !== 0) throw new Error('code ' + data.code);
			message('isp-message', 'Configuration saved.');
		} catch (e) { message('isp-message', 'Save failed: ' + e.message); }
		finally { $('save').disabled = false; }
	});
	const audioFields = ['enable', 'bitrate', 'gain', 'srate'];
	function showAudio(data) {
		if (typeof data.enable !== 'boolean' || !audioFields.slice(1).every(key => Number.isInteger(data[key]))) throw new Error('Unexpected audio response');
		$('audio-enable').checked = data.enable;
		for (const key of audioFields.slice(1)) $('audio-' + key).value = data[key];
		for (const key of audioFields) $('audio-' + key).disabled = false;
		$('audio-apply').disabled = false;
	}
	async function loadAudio() {
		try { showAudio(await request('/api/audio')); }
		catch (e) { message('audio-message', 'Audio settings unavailable: ' + e.message); }
	}
	$('audio-form').addEventListener('submit', async event => {
		event.preventDefault();
		const values = new URLSearchParams();
		values.set('enable', String($('audio-enable').checked));
		for (const key of audioFields.slice(1)) values.set(key, $('audio-' + key).value);
		$('audio-apply').disabled = true;
		try {
			showAudio(await request('/api/audio?' + values));
			message('audio-message', 'Configuration updated; save separately to persist. Verify audio on the device.');
		} catch (e) { message('audio-message', 'Update failed: ' + e.message); $('audio-apply').disabled = false; }
	});
	let playing = false;
	function preview(on) {
		playing = on;
		$('preview').hidden = !on;
		$('preview-note').hidden = on;
		$('preview-toggle').textContent = on ? 'Stop preview' : 'Start preview';
		if (on) $('preview').src = '/mjpeg';
		else $('preview').removeAttribute('src');
	}
	$('preview').addEventListener('error', () => { preview(false); message('preview-note', 'MJPEG stream unavailable. Check the device and its configuration.'); });
	$('preview-toggle').addEventListener('click', () => { if (playing) message('preview-note', 'Preview stopped.'); preview(!playing); });
	$('refresh').addEventListener('click', status);
	async function media() {
		try {
			const data = await request('/api/mjpeg');
			if (data.enable) { $('preview-toggle').disabled = false; preview(true); }
			else message('preview-note', 'MJPEG is disabled in Divinus.');
		} catch (e) { message('preview-note', 'MJPEG availability unknown: ' + e.message); }
		try { const data = await request('/api/jpeg'); $('snapshot').hidden = !data.enable; } catch (_) { /* Optional endpoint. */ }
	}
	status(); loadIsp(); loadAudio(); media();
}());
