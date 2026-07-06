// src/audio/soundManager.js

export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.35;
        this.lastPlayTime = 0;
        this.minInterval = 0.015; // تقليل الفاصل الزمني لتصادمات أسرع
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

    // ✅ ✅ ✅ صوت معدني واقعي ✅ ✅ ✅
    playMetalHit(intensity = 1.0) {
        if (!this.enabled) return;

        // منع التكرار السريع جداً
        const now = performance.now() / 1000;
        if (now - this.lastPlayTime < this.minInterval) return;
        this.lastPlayTime = now;

        try {
            const ctx = this.init();
            if (!ctx) return;

            // ✅ شدة الصوت بناءً على قوة التصادم
            const vol = Math.min(this.volume * intensity * 1.5, 0.6);

            // ============================================
            // 1️⃣ الصوت الأساسي (النغمة الرئيسية)
            // ============================================
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();

            // تردد عالي معدني (كلما زاد كان الصوت أكثر حدة)
            const baseFreq = 700 + Math.random() * 400 + intensity * 150;
            osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
            // انخفاض سريع في التردد (تأثير "الرنين")
            osc1.frequency.exponentialRampToValueAtTime(
                baseFreq * 0.4,
                ctx.currentTime + 0.04
            );

            osc1.type = 'triangle';
            gain1.gain.setValueAtTime(vol * 0.7, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);

            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.06);

            // ============================================
            // 2️⃣ النغمة الثانوية (رنين معدني)
            // ============================================
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();

            // تردد أعلى (رنين)
            const harmonicFreq = baseFreq * 1.5 + Math.random() * 100;
            osc2.frequency.setValueAtTime(harmonicFreq, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(
                harmonicFreq * 0.3,
                ctx.currentTime + 0.03
            );

            osc2.type = 'triangle';
            gain2.gain.setValueAtTime(vol * 0.35, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.04);

            // ============================================
            // 3️⃣ ضوضاء معدنية (تأثير "الصدمة")
            // ============================================
            const bufferSize = ctx.sampleRate * 0.015;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                const t = i / ctx.sampleRate;
                // ضوضاء بيضاء مع تخميد سريع
                data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 80);
                // إضافة نغمة معدنية خفيفة للضوضاء
                data[i] += Math.sin(2 * Math.PI * 2000 * t) * 0.15 * Math.exp(-t * 60);
            }

            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = buffer;

            const gainNoise = ctx.createGain();
            gainNoise.gain.setValueAtTime(vol * 0.25, ctx.currentTime);
            gainNoise.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

            noiseSource.connect(gainNoise);
            gainNoise.connect(ctx.destination);
            noiseSource.start(ctx.currentTime);
            noiseSource.stop(ctx.currentTime + 0.015);

            // ============================================
            // 4️⃣ تأثير "الرنين" المتأخر (صدى معدني خفيف)
            // ============================================
            if (intensity > 0.4) {
                const osc3 = ctx.createOscillator();
                const gain3 = ctx.createGain();

                osc3.frequency.setValueAtTime(baseFreq * 0.6, ctx.currentTime + 0.02);
                osc3.type = 'sine';
                gain3.gain.setValueAtTime(vol * 0.15, ctx.currentTime + 0.02);
                gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

                osc3.connect(gain3);
                gain3.connect(ctx.destination);
                osc3.start(ctx.currentTime + 0.02);
                osc3.stop(ctx.currentTime + 0.08);
            }

        } catch (e) {
            console.warn('خطأ في تشغيل الصوت المعدني:', e);
        }
    }

    // ✅ نسخة احتياطية: صوت بسيط (في حال فشل الصوت المعقد)
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

            const freq = 800 + Math.random() * 400;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.2, ctx.currentTime + 0.05);
            osc.type = 'sine';

            const vol = Math.min(this.volume * intensity * 1.2, 0.5);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.05);
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
