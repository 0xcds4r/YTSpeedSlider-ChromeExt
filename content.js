(() => {
	const STYLE_ID = 'yt-speed-slider-style';
	const WIDGET_ID = 'yt-speed-slider-widget';
	const DEFAULT_SPEED = 1.0;

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
				border: 1px solid rgba(255,255,255,0.15);
				font-family: 'Roboto Mono', 'Courier New', monospace;
				cursor: default;
				user-select: none;
				transition: background 0.2s ease, border-color 0.2s ease;
				vertical-align: middle;
				flex-shrink: 0;
			}

			#yt-speed-slider-widget:hover {
				background: rgba(255,255,255,0.16);
				border-color: rgba(255,255,255,0.3);
			}

			#yt-speed-icon {
				font-size: 13px;
				opacity: 0.75;
				letter-spacing: -0.5px;
				color: #fff;
				white-space: nowrap;
			}

			#yt-speed-track {
				position: relative;
				width: 90px;
				height: 4px;
				border-radius: 2px;
				background: rgba(255,255,255,0.2);
				cursor: pointer;
				flex-shrink: 0;
			}

			#yt-speed-fill {
				position: absolute;
				left: 0;
				top: 0;
				height: 100%;
				border-radius: 2px;
				background: linear-gradient(90deg, #ff4e4e, #ff9000);
				pointer-events: none;
				transition: width 0.05s ease;
				width: 0%;
			}

			#yt-speed-thumb {
				position: absolute;
				top: 50%;
				transform: translate(-50%, -50%);
				width: 12px;
				height: 12px;
				border-radius: 50%;
				background: #fff;
				box-shadow: 0 0 0 2px rgba(255,100,0,0.5);
				pointer-events: none;
				transition: box-shadow 0.15s ease, transform 0.15s ease;
				}

				#yt-speed-track:hover #yt-speed-thumb {
				box-shadow: 0 0 0 4px rgba(255,100,0,0.4);
				transform: translate(-50%, -50%) scale(1.2);
			}

			#yt-speed-label {
				font-size: 12px;
				font-weight: 600;
				color: #fff;
				min-width: 34px;
				text-align: right;
				letter-spacing: 0.5px;
				opacity: 0.9;
				transition: color 0.2s ease;
				white-space: nowrap;
			}

			#yt-speed-label.boosted {
				color: #ff9000;
			}

			#yt-speed-reset {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 18px;
				height: 18px;
				border-radius: 50%;
				background: rgba(255,255,255,0.15);
				cursor: pointer;
				opacity: 0.7;
				transition: opacity 0.15s, background 0.15s;
				flex-shrink: 0;
			}

			#yt-speed-reset:hover {
				opacity: 1;
				background: rgba(255,255,255,0.25);
			}

			#yt-speed-reset svg {
				width: 11px;
				height: 11px;
				fill: #fff;
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
			<div id="yt-speed-reset" title="Reset to 1×">
			<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
			</svg>
			</div>
		`;

		return widget;
	}

	function getVideo() {
		return document.querySelector('video.html5-main-video') || document.querySelector('video');
	}

	function setSpeed(speed, widget)
	{
		const video = getVideo();
		if (video) {
			video.playbackRate = speed;
		}

		const pct = ((speed - 1.0) / (15.0 - 1.0)) * 100;
		widget.querySelector('#yt-speed-fill').style.width = pct + '%';
		widget.querySelector('#yt-speed-thumb').style.left = pct + '%';

		const label = widget.querySelector('#yt-speed-label');
		label.textContent = speed.toFixed(1) + '×';
		label.classList.toggle('boosted', speed > 1.5);
	}

	function attachDrag(widget, currentSpeed)
	{
		const track = widget.querySelector('#yt-speed-track');
		const reset = widget.querySelector('#yt-speed-reset');
		let speed = currentSpeed;
		let dragging = false;

		function speedFromEvent(e) 
		{
			const rect = track.getBoundingClientRect();
			const clientX = e.touches ? e.touches[0].clientX : e.clientX;
			const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
			const raw = 1.0 + pct * (15.0 - 1.0);
			return Math.round(raw * 4) / 4;
		}

		track.addEventListener('mousedown', (e) => 
		{
			dragging = true;
			speed = speedFromEvent(e);
			setSpeed(speed, widget);
			e.preventDefault();
		});

		document.addEventListener('mousemove', (e) => 
		{
			if (!dragging) {
				return;
			}

			speed = speedFromEvent(e);
			setSpeed(speed, widget);
		});

		document.addEventListener('mouseup', () => { dragging = false; });

		track.addEventListener('click', (e) => 
		{
			speed = speedFromEvent(e);
			setSpeed(speed, widget);
		});

		widget.addEventListener('wheel', (e) => 
		{
			e.preventDefault();
			const delta = e.deltaY < 0 ? 0.25 : -0.25;
			speed = Math.max(1.0, Math.min(15.0, speed + delta));
			setSpeed(speed, widget);
		}, { passive: false });

		reset.addEventListener('click', (e) => 
		{
			e.stopPropagation();
			speed = DEFAULT_SPEED;
			setSpeed(speed, widget);
		});
  	}

	function inject() 
	{
		if (document.getElementById(WIDGET_ID)) {
			return;
		}

		const container = document.getElementById('top-level-buttons-computed');
		if (!container) {
			return;
		}

		injectStyles();

		const widget = buildWidget();
		container.appendChild(widget);

		setSpeed(DEFAULT_SPEED, widget);
		attachDrag(widget, DEFAULT_SPEED);

		const video = getVideo();
		if (video) 
		{
			video.addEventListener('ratechange', () => {
				const spd = Math.max(1.0, Math.min(15.0, video.playbackRate));
				setSpeed(spd, widget);
			});
		}
	}

	const observer = new MutationObserver(() => {
		if (!document.getElementById(WIDGET_ID)) {
			inject();
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });
	inject();
})();