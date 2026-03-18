/**
 * Procedural sound effects via Web Audio API
 * All sounds are generated — no audio files needed
 */

const SFX = {
    _ctx: null,
    _muted: false,
    _volume: 0.15,

    init() {
        if (this._ctx) return;
        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio not supported');
        }
    },

    mute(m) { this._muted = m; },

    _gain(vol) {
        const g = this._ctx.createGain();
        g.gain.value = (vol || 1) * this._volume;
        g.connect(this._ctx.destination);
        return g;
    },

    /** Short UI click — like a mechanical key */
    click() {
        if (!this._ctx || this._muted) return;
        const t = this._ctx.currentTime;
        const osc = this._ctx.createOscillator();
        const gain = this._gain(0.3);
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.03);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.05);
    },

    /** Positive chime — action succeeded */
    chime() {
        if (!this._ctx || this._muted) return;
        const t = this._ctx.currentTime;
        [520, 660, 780].forEach((freq, i) => {
            const osc = this._ctx.createOscillator();
            const gain = this._gain(0.2);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, t + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.03, t + i * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
            osc.connect(gain);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.25);
        });
    },

    /** Warning klaxon — danger event */
    klaxon() {
        if (!this._ctx || this._muted) return;
        const t = this._ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const osc = this._ctx.createOscillator();
            const gain = this._gain(0.4);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, t + i * 0.25);
            osc.frequency.linearRampToValueAtTime(380, t + i * 0.25 + 0.12);
            gain.gain.setValueAtTime(0, t + i * 0.25);
            gain.gain.linearRampToValueAtTime(0.06, t + i * 0.25 + 0.02);
            gain.gain.linearRampToValueAtTime(0.06, t + i * 0.25 + 0.1);
            gain.gain.linearRampToValueAtTime(0, t + i * 0.25 + 0.2);
            osc.connect(gain);
            osc.start(t + i * 0.25);
            osc.stop(t + i * 0.25 + 0.22);
        }
    },

    /** Phone ring — diplomatic call */
    phone() {
        if (!this._ctx || this._muted) return;
        const t = this._ctx.currentTime;
        for (let i = 0; i < 2; i++) {
            const osc1 = this._ctx.createOscillator();
            const osc2 = this._ctx.createOscillator();
            const gain = this._gain(0.2);
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.value = 440;
            osc2.frequency.value = 480;
            gain.gain.setValueAtTime(0, t + i * 0.4);
            gain.gain.linearRampToValueAtTime(0.03, t + i * 0.4 + 0.02);
            gain.gain.linearRampToValueAtTime(0.03, t + i * 0.4 + 0.15);
            gain.gain.linearRampToValueAtTime(0, t + i * 0.4 + 0.2);
            osc1.connect(gain);
            osc2.connect(gain);
            osc1.start(t + i * 0.4);
            osc1.stop(t + i * 0.4 + 0.2);
            osc2.start(t + i * 0.4);
            osc2.stop(t + i * 0.4 + 0.2);
        }
    },

    /** CRT power-on buzz */
    crtBuzz() {
        if (!this._ctx || this._muted) return;
        const t = this._ctx.currentTime;
        const bufferSize = this._ctx.sampleRate * 0.3;
        const buffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // Mix 60Hz hum with noise
            data[i] = Math.sin(2 * Math.PI * 60 * i / this._ctx.sampleRate) * 0.3
                     + (Math.random() * 2 - 1) * 0.1;
        }
        const src = this._ctx.createBufferSource();
        src.buffer = buffer;
        const gain = this._gain(0.3);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        src.connect(gain);
        src.start(t);
    },

    /** Negative buzz — bad outcome */
    error() {
        if (!this._ctx || this._muted) return;
        const t = this._ctx.currentTime;
        const osc = this._ctx.createOscillator();
        const gain = this._gain(0.3);
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.15);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.linearRampToValueAtTime(0.04, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.2);
    },

    /** Fade out background music over durationMs, then pause */
    fadeOutMusic(durationMs) {
        const audio = document.getElementById('bg-music');
        if (!audio) return;
        this._musicWasPlaying = !audio.paused;
        this._musicOriginalVolume = audio.volume;
        if (audio.paused) return;
        const steps = 20;
        const interval = durationMs / steps;
        const volStep = audio.volume / steps;
        let remaining = steps;
        this._fadeInterval = setInterval(() => {
            remaining--;
            audio.volume = Math.max(0, audio.volume - volStep);
            if (remaining <= 0) {
                clearInterval(this._fadeInterval);
                this._fadeInterval = null;
                audio.pause();
                audio.volume = 0;
            }
        }, interval);
    },

    /** Restore music volume and resume if it was playing before fade */
    restoreMusic() {
        const audio = document.getElementById('bg-music');
        if (!audio) return;
        if (this._fadeInterval) {
            clearInterval(this._fadeInterval);
            this._fadeInterval = null;
        }
        const vol = this._musicOriginalVolume !== undefined ? this._musicOriginalVolume : 0.3;
        audio.volume = vol;
        if (this._musicWasPlaying) {
            audio.play().catch(() => {});
        }
    },

    /** Day transition whoosh */
    transition() {
        if (!this._ctx || this._muted) return;
        const t = this._ctx.currentTime;
        const bufferSize = this._ctx.sampleRate * 0.4;
        const buffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const env = Math.sin(Math.PI * i / bufferSize);
            data[i] = (Math.random() * 2 - 1) * env * 0.15;
        }
        const src = this._ctx.createBufferSource();
        src.buffer = buffer;
        const gain = this._gain(0.2);
        const filter = this._ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.4);
        src.connect(filter);
        filter.connect(gain);
        src.start(t);
    },
};
