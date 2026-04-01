(() => {
    const STYLE_ID = 'yt-speed-slider-style';
    const WIDGET_ID = 'yt-speed-slider-widget';

    const STORAGE_KEY = 'yt-speed-settings';

    const DEFAULTS = {
        minSpeed: 0.1,
        maxSpeed: 15.8,
        step: 0.1,
        defaultSpeed: 1.0,
        keys: { faster: 'KeyB', slower: 'KeyH', reset: 'KeyN' }
    };

    let settings = loadSettings();
    let currentSpeed = settings.defaultSpeed;

    function loadSettings() 
	{
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
				return Object.assign({}, DEFAULTS, JSON.parse(raw));
			}
        } catch (_) {}

        return Object.assign({}, DEFAULTS, { keys: Object.assign({}, DEFAULTS.keys) });
    }

    function saveSettings() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
    }

    function injectStyles() 
	{
        if (document.getElementById(STYLE_ID)) {
			return;
		}

        const style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `
            #yt-speed-slider-widget {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-left: 8px;
                padding: 0 12px;
                height: 36px;
                border-radius: 18px;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                font-family: 'Roboto Mono', 'Courier New', monospace;
                cursor: default;
                user-select: none;
                transition: background 0.2s ease;
                vertical-align: middle;
                flex-shrink: 0;
            }

            #yt-speed-slider-widget:hover { background: rgba(255,255,255,0.16); }

            #yt-speed-icon { font-size: 13px; opacity: 0.75; color: #fff; white-space: nowrap; }

            #yt-speed-track {
                position: relative; width: 90px; height: 4px;
                border-radius: 2px; background: rgba(255,255,255,0.2);
                cursor: pointer; flex-shrink: 0;
            }

            #yt-speed-fill {
                position: absolute; left: 0; top: 0; height: 100%;
                border-radius: 2px;
                background: linear-gradient(90deg, #ff4e4e, #ff9000);
                pointer-events: none; transition: width 0.05s ease; width: 0%;
            }

            #yt-speed-thumb {
                position: absolute; top: 50%;
                transform: translate(-50%, -50%);
                width: 12px; height: 12px; border-radius: 50%;
                background: #fff; box-shadow: 0 0 0 2px rgba(255,100,0,0.5);
                pointer-events: none; transition: box-shadow 0.15s ease, transform 0.15s ease;
            }

            #yt-speed-track:hover #yt-speed-thumb {
                box-shadow: 0 0 0 4px rgba(255,100,0,0.4);
                transform: translate(-50%, -50%) scale(1.2);
            }

            #yt-speed-label {
                font-size: 12px; font-weight: 600; color: #fff;
                min-width: 34px; text-align: right; letter-spacing: 0.5px;
                opacity: 0.9; transition: color 0.2s ease; white-space: nowrap;
            }

            #yt-speed-label.boosted { color: #ff9000; }

            .yt-speed-btn {
                display: flex; align-items: center; justify-content: center;
                width: 18px; height: 18px; border-radius: 50%;
                background: rgba(255,255,255,0.15); cursor: pointer;
                opacity: 0.7; transition: opacity 0.15s, background 0.15s; flex-shrink: 0;
            }

            .yt-speed-btn:hover { opacity: 1; background: rgba(255,255,255,0.25); }
            .yt-speed-btn svg { width: 11px; height: 11px; fill: #fff; }
            #yt-speed-gear svg { width: 13px; height: 13px; }

            #yt-speed-modal-overlay {
                position: fixed; inset: 0; z-index: 999999;
                background: rgba(0,0,0,0.72);
                display: none; align-items: center; justify-content: center;
            }

            #yt-speed-modal-overlay.open { display: flex; }

            #yt-speed-modal {
                background: #1e1e2e;
                border: 0.5px solid rgba(255,255,255,0.15);
                border-radius: 12px; padding: 20px; width: 320px;
                color: #fff; font-family: 'Roboto Mono','Courier New',monospace;
                font-size: 12px; box-sizing: border-box;
            }

            #yt-speed-modal h3 {
                margin: 0 0 14px; font-size: 13px; font-weight: 600;
                letter-spacing: 0.5px; display: flex; align-items: center;
                justify-content: space-between;
            }

            #yt-speed-modal h3 .close-btn {
                cursor: pointer; opacity: 0.45; font-size: 16px;
                line-height: 1; transition: opacity .15s;
            }

            #yt-speed-modal h3 .close-btn:hover { opacity: 0.9; }

            .yt-modal-section {
                background: rgba(255,255,255,0.05);
                border-radius: 8px; padding: 12px; margin-bottom: 10px;
            }

            .yt-modal-section-title {
                color: rgba(255,255,255,0.45); font-size: 10px;
                text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px;
            }

            .yt-field-row {
                display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
            }

            .yt-field-row:last-child { margin-bottom: 0; }

            .yt-field-row label { color: rgba(255,255,255,0.65); flex: 1; }

            .yt-field-row input[type=number] {
                width: 70px; background: rgba(255,255,255,0.1);
                border: 0.5px solid rgba(255,255,255,0.2); border-radius: 6px;
                padding: 4px 8px; color: #fff;
                font-family: inherit; font-size: 12px; outline: none;
                box-sizing: border-box;
            }

            .yt-field-row input[type=number]:focus {
                border-color: rgba(255,144,0,0.6); background: rgba(255,144,0,0.08);
            }

            .yt-field-hint { color: rgba(255,255,255,0.3); font-size: 10px; }

            .yt-keycap {
                background: rgba(255,255,255,0.12);
                border: 0.5px solid rgba(255,255,255,0.25);
                border-radius: 5px; padding: 3px 10px; cursor: pointer;
                min-width: 32px; text-align: center; transition: background .15s;
                font-family: inherit;
            }

            .yt-keycap:hover { background: rgba(255,255,255,0.2); }

            .yt-keycap.listening {
                background: rgba(255,144,0,0.25) !important;
                border-color: rgba(255,144,0,0.6) !important;
                color: rgba(255,144,0,0.9);
            }

            #yt-rebind-hint {
                color: rgba(255,144,0,0.8); font-size: 11px; margin-top: 8px; display: none;
            }

            .yt-modal-actions { display: flex; gap: 8px; margin-top: 14px; }

            .yt-modal-actions button {
                flex: 1; border-radius: 6px; padding: 7px; cursor: pointer;
                font-family: inherit; font-size: 12px; font-weight: 600; border-width: 0.5px;
            }

            #yt-modal-cancel {
                background: rgba(255,78,78,0.12); border-color: rgba(255,78,78,0.3);
                color: rgba(255,110,110,0.9);
            }

            #yt-modal-save {
                background: rgba(255,144,0,0.15); border-color: rgba(255,144,0,0.35);
                color: rgba(255,144,0,0.95);
            }

            #yt-speed-keyhint {
                position: fixed; bottom: 72px; left: 50%;
                transform: translateX(-50%) translateY(6px);
                background: rgba(0,0,0,0.82); color: #fff;
                font-family: 'Roboto Mono','Courier New',monospace;
                font-size: 13px; font-weight: 600; padding: 6px 14px;
                border-radius: 8px; pointer-events: none;
                opacity: 0; transition: opacity 0.15s ease, transform 0.15s ease;
                z-index: 99999; white-space: nowrap; letter-spacing: 0.5px;
            }

            #yt-speed-keyhint.visible {
                opacity: 1; transform: translateX(-50%) translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    function buildWidget() 
	{
        const widget = document.createElement('div');
        widget.id = WIDGET_ID;

        widget.innerHTML = `
            <span id="yt-speed-icon">⚡</span>
            <div id="yt-speed-track">
                <div id="yt-speed-fill"></div>
                <div id="yt-speed-thumb"></div>
            </div>
            <span id="yt-speed-label">1.0×</span>
            <div class="yt-speed-btn" id="yt-speed-reset" title="Reset to 1×">
                <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
            </div>
            <div class="yt-speed-btn" id="yt-speed-gear" title="Settings">
                <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
            </div>
        `;

        return widget;
    }

    function buildModal() 
	{
        const overlay = document.createElement('div');
        overlay.id = 'yt-speed-modal-overlay';

        overlay.innerHTML = `
            <div id="yt-speed-modal">
                <h3>⚙ Settings <span class="close-btn" id="yt-modal-close">✕</span></h3>

                <div class="yt-modal-section">
                    <div class="yt-modal-section-title">Speed limits</div>
                    <div class="yt-field-row">
                        <label>Min</label>
                        <input type="number" id="yt-inp-min" min="0.1" max="1.0" step="0.1">
                        <span class="yt-field-hint">×</span>
                    </div>
                    <div class="yt-field-row">
                        <label>Max</label>
                        <input type="number" id="yt-inp-max" min="1.0" max="16.0" step="0.1">
                        <span class="yt-field-hint">×</span>
                    </div>
                    <div class="yt-field-row">
                        <label>Step</label>
                        <input type="number" id="yt-inp-step" min="0.05" max="1.0" step="0.05">
                        <span class="yt-field-hint">×</span>
                    </div>
                </div>

                <div class="yt-modal-section">
                    <div class="yt-modal-section-title">Hot keys</div>
                    <div class="yt-field-row">
                        <label>Increase speed</label>
                        <div class="yt-keycap" data-action="faster" id="yt-key-faster"></div>
                    </div>
                    <div class="yt-field-row">
                        <label>Reduce speed</label>
                        <div class="yt-keycap" data-action="slower" id="yt-key-slower"></div>
                    </div>
                    <div class="yt-field-row">
                        <label>Reset speed (1×)</label>
                        <div class="yt-keycap" data-action="reset" id="yt-key-reset"></div>
                    </div>
                    <div id="yt-rebind-hint">Press any key...</div>
                </div>

                <div class="yt-modal-actions">
                    <button id="yt-modal-cancel">Cancel</button>
                    <button id="yt-modal-save">Save & Apply</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => 
		{
            if (e.target === overlay) {
				closeModal();
			}
        });

        document.getElementById('yt-modal-close').addEventListener('click', closeModal);
        document.getElementById('yt-modal-cancel').addEventListener('click', closeModal);
        document.getElementById('yt-modal-save').addEventListener('click', applyAndClose);

        let listeningEl = null;
        let listeningCapture = null;

        function startRebind(el) 
		{
            if (listeningEl) 
			{
                listeningEl.classList.remove('listening');
                document.removeEventListener('keydown', listeningCapture, true);
            }

            listeningEl = el;
            el.classList.add('listening');
            document.getElementById('yt-rebind-hint').style.display = 'block';

            listeningCapture = (e) => 
			{
                e.preventDefault(); 
				e.stopPropagation();

                const label = codeToLabel(e.code);
                el.textContent = label;

                el.dataset.code = e.code;
                el.classList.remove('listening');

                document.getElementById('yt-rebind-hint').style.display = 'none';
                document.removeEventListener('keydown', listeningCapture, true);

                listeningEl = null;
            };

            document.addEventListener('keydown', listeningCapture, true);
        }

        ['faster', 'slower', 'reset'].forEach(action => 
		{
            document.getElementById('yt-key-' + action).addEventListener('click', function () {
                startRebind(this);
            });
        });
    }

    function codeToLabel(code) 
	{
        if (code.startsWith('Key')) {
			return code.slice(3);
		}

        if (code.startsWith('Digit')) {
			return code.slice(5);
		}

        if (code.startsWith('Numpad')) {
			return 'Num' + code.slice(6);
		}

        const map = {
            'Space': 'Space', 'ArrowUp': '↑', 'ArrowDown': '↓',
            'ArrowLeft': '←', 'ArrowRight': '→',
            'BracketLeft': '[', 'BracketRight': ']',
            'Semicolon': ';', 'Quote': "'", 'Backquote': '`',
            'Minus': '-', 'Equal': '=', 'Comma': ',', 'Period': '.', 'Slash': '/'
        };

        return map[code] || code;
    }

    function openModal() 
	{
        const overlay = document.getElementById('yt-speed-modal-overlay');
        if (!overlay) {
			return;
		}

        document.getElementById('yt-inp-min').value = settings.minSpeed.toFixed(2);
        document.getElementById('yt-inp-max').value = settings.maxSpeed.toFixed(2);
        document.getElementById('yt-inp-step').value = settings.step.toFixed(2);

        ['faster', 'slower', 'reset'].forEach(action => {
            const el = document.getElementById('yt-key-' + action);
            el.textContent = codeToLabel(settings.keys[action]);
            el.dataset.code = settings.keys[action];
        });

        overlay.classList.add('open');
    }

    function closeModal() 
	{
        const overlay = document.getElementById('yt-speed-modal-overlay');
        if (overlay) {
			overlay.classList.remove('open');
		}
    }

    function applyAndClose() 
	{
        const minVal = parseFloat(document.getElementById('yt-inp-min').value);
        const maxVal = parseFloat(document.getElementById('yt-inp-max').value);
        const stepVal = parseFloat(document.getElementById('yt-inp-step').value);

        if (!isNaN(minVal) && minVal >= 0.1 && minVal < maxVal) settings.minSpeed = Math.round(minVal * 100) / 100;
        if (!isNaN(maxVal) && maxVal > settings.minSpeed && maxVal <= 16) settings.maxSpeed = Math.round(maxVal * 100) / 100;
        if (!isNaN(stepVal) && stepVal >= 0.05 && stepVal <= 1) settings.step = Math.round(stepVal * 100) / 100;

        ['faster', 'slower', 'reset'].forEach(action => {
            const el = document.getElementById('yt-key-' + action);
            if (el && el.dataset.code) settings.keys[action] = el.dataset.code;
        });

        saveSettings();

        const widget = document.getElementById(WIDGET_ID);
        if (widget) attachKeyboard(widget);

        closeModal();
    }

    function getVideo() {
        return document.querySelector('video.html5-main-video') || document.querySelector('video');
    }

    function setSpeed(speed, widget) 
	{
        speed = Math.round(Math.max(settings.minSpeed, Math.min(settings.maxSpeed, speed)) * 10) / 10;
        currentSpeed = speed;

        const video = getVideo();
        if (video) {
			video.playbackRate = speed;
		}

        const pct = ((speed - settings.minSpeed) / (settings.maxSpeed - settings.minSpeed)) * 100;
        widget.querySelector('#yt-speed-fill').style.width = pct + '%';
        widget.querySelector('#yt-speed-thumb').style.left = pct + '%';

        const label = widget.querySelector('#yt-speed-label');
        label.textContent = speed.toFixed(1) + '×';
        label.classList.toggle('boosted', speed > 1.5);
    }

    let keyhintTimeout = null;

    function showKeyHint(text) 
	{
        let hint = document.getElementById('yt-speed-keyhint');

        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'yt-speed-keyhint';
            document.body.appendChild(hint);
        }

        hint.textContent = text;
        hint.classList.add('visible');

        clearTimeout(keyhintTimeout);

        keyhintTimeout = setTimeout(() => hint.classList.remove('visible'), 900);
    }

    function attachDrag(widget) 
	{
        const track = widget.querySelector('#yt-speed-track');
        const reset = widget.querySelector('#yt-speed-reset');
        const gear  = widget.querySelector('#yt-speed-gear');
        let dragging = false;

        function speedFromEvent(e) 
		{
            const rect = track.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const raw = settings.minSpeed + pct * (settings.maxSpeed - settings.minSpeed);
            return Math.round(raw * 10) / 10;
        }

        track.addEventListener('mousedown', (e) => { dragging = true; setSpeed(speedFromEvent(e), widget); e.preventDefault(); });
        
		document.addEventListener('mousemove', (e) => { if (dragging) setSpeed(speedFromEvent(e), widget); });
        document.addEventListener('mouseup', () => { dragging = false; });
        
		track.addEventListener('click', (e) => setSpeed(speedFromEvent(e), widget));

        widget.addEventListener('wheel', (e) => 
		{
            e.preventDefault();
            const delta = e.deltaY < 0 ? settings.step : -settings.step;
            setSpeed(currentSpeed + delta, widget);
        }, { passive: false });

        reset.addEventListener('click', (e) => { e.stopPropagation(); setSpeed(settings.defaultSpeed, widget); });
        gear.addEventListener('click', (e) => { e.stopPropagation(); openModal(); });
    }

    function attachKeyboard(widget) 
	{
        if (window._ytSpeedKeyHandler) {
            document.removeEventListener('keydown', window._ytSpeedKeyHandler, true);
        }

        window._ytSpeedKeyHandler = (e) => 
		{
            const tag = document.activeElement && document.activeElement.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable) {
				return;
			}

            if (e.code === settings.keys.faster) 
			{
                const speed = Math.round(Math.min(settings.maxSpeed, currentSpeed + settings.step) * 10) / 10;
                setSpeed(speed, widget);
                showKeyHint('⚡ ' + speed.toFixed(1) + '×');
            } 
			else if (e.code === settings.keys.slower) 
			{
                const speed = Math.round(Math.max(settings.minSpeed, currentSpeed - settings.step) * 10) / 10;
                setSpeed(speed, widget);
                showKeyHint('⚡ ' + speed.toFixed(1) + '×');
            }
			else if (e.code === settings.keys.reset) 
			{
                setSpeed(settings.defaultSpeed, widget);
                showKeyHint('⚡ Reset 1.0×');
            }
        };

        document.addEventListener('keydown', window._ytSpeedKeyHandler, true);
    }

    function inject() 
	{
        if (document.getElementById(WIDGET_ID)) {
			return;
		}

        const container = document.getElementById('actions');
        if (!container) {
			return;
		}

        injectStyles();

        const widget = buildWidget();
        container.appendChild(widget);

        if (!document.getElementById('yt-speed-modal-overlay')) {
            buildModal();
        }

        setSpeed(currentSpeed, widget);
        attachDrag(widget);
        attachKeyboard(widget);

        const video = getVideo();
        if (video) 
		{
            video.addEventListener('ratechange', () => 
			{
                const spd = Math.max(settings.minSpeed, Math.min(settings.maxSpeed, video.playbackRate));

                if (Math.abs(spd - currentSpeed) > 0.05) {
					setSpeed(spd, widget);
				}
            });
        }
    }

    const observer = new MutationObserver(() => 
	{
        if (!document.getElementById(WIDGET_ID)) {
			inject();
		}
    });

    observer.observe(document.body, { childList: true, subtree: true });

    inject();
})();