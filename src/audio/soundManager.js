// src/audio/soundManager.js

export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.6;
        this.lastPlayTime = 0;
        this.minInterval = 0.012;
    }

    init() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API غير مدعومة في هذا المتصفح');
                this.enabled = false;
            }
        }
        return this.audioContext;
    }

    playMetalHit(intensity = 1.0) {
        if (!this.enabled) return;

        const now = performance.now() / 1000;
        if (now - this.lastPlayTime < this.minInterval) return;
        this.lastPlayTime = now;

        try {
            const ctx = this.init();
            if (!ctx) return;


            const vol = Math.min(this.volume * intensity * 1.6, 0.7);



            const clickBufferSize = ctx.sampleRate * 0.008;
            const clickBuffer = ctx.createBuffer(1, clickBufferSize, ctx.sampleRate);
            const clickData = clickBuffer.getChannelData(0);

            for (let i = 0; i < clickBufferSize; i++) {
                const t = i / ctx.sampleRate;

                clickData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 900);
            }

            const clickSource = ctx.createBufferSource();
            clickSource.buffer = clickBuffer;

            const clickGain = ctx.createGain();
            clickGain.gain.setValueAtTime(vol * 0.9, ctx.currentTime);
            clickGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.008);

            clickSource.connect(clickGain);
            clickGain.connect(ctx.destination);
            clickSource.start(ctx.currentTime);
            clickSource.stop(ctx.currentTime + 0.008);



            const oscBody = ctx.createOscillator();
            const gainBody = ctx.createGain();


            const bodyFreq = 5700 + (Math.random() * 300) + (intensity * 100);
            oscBody.frequency.setValueAtTime(bodyFreq, ctx.currentTime);

            oscBody.frequency.exponentialRampToValueAtTime(bodyFreq * 0.85, ctx.currentTime + 0.02);

            oscBody.type = 'sine';
            gainBody.gain.setValueAtTime(vol * 0.6, ctx.currentTime);
            gainBody.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);

            oscBody.connect(gainBody);
            gainBody.connect(ctx.destination);
            oscBody.start(ctx.currentTime);
            oscBody.stop(ctx.currentTime + 0.025);


            const oscMetallic = ctx.createOscillator();
            const gainMetallic = ctx.createGain();

            const metallicFreq = bodyFreq * 2.3 + (Math.random() * 150);
            oscMetallic.frequency.setValueAtTime(metallicFreq, ctx.currentTime);
            oscMetallic.type = 'triangle';

            gainMetallic.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
            gainMetallic.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.018);

            oscMetallic.connect(gainMetallic);
            gainMetallic.connect(ctx.destination);
            oscMetallic.start(ctx.currentTime);
            oscMetallic.stop(ctx.currentTime + 0.018);

        } catch (e) {
            console.warn('خطأ في تشغيل صوت ارتطام البندول:', e);
        }
    }

    
    playSimpleHit(intensity = 1.0) {
        if (!this.enabled) return;

        const now = performance.now() / 1000;
        if (now - this.lastPlayTime < this.minInterval) return;
        this.lastPlayTime = now;

        try {
            const ctx = this.init();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            const freq = 3000 + Math.random() * 200;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.type = 'sine';

            const vol = Math.min(this.volume * intensity * 1.3, 0.6);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.02);
        } catch (e) {
            console.warn('خطأ في تشغيل الصوت البسيط:', e);
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    toggle(enabled) {
        this.enabled = enabled;
        if (enabled && !this.audioContext) {
            this.init();
        }
    }
}
