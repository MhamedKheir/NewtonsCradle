// src/ui/controlPanel.js

// ✅ هذا الملف لا يحتاج THREE، فقط Config
import * as THREE from 'three';
import { Config } from '../config/config.js';

export class ControlPanel {
    constructor(simManager, sceneSetup) {
        this.simManager = simManager;
        this.sceneSetup = sceneSetup;
        // ✅ الحصول على مدير الصوت من PhysicsEngine
        this.soundManager = null;
        this.initDOMReferences();
        this.bindEvents();
        this.syncSlidersWithConfig();
        this.updateMassStatus();
        // ✅ الحصول على مدير الصوت بعد تهيئة PhysicsEngine
        setTimeout(() => {
            this.soundManager = this.simManager?.soundManager || null;
            if (this.soundManager) {
                this.btnToggleSound.innerText = this.soundManager.enabled ? '🔊 تشغيل' : '🔇 إيقاف';
                this.sldSoundVolume.value = this.soundManager.volume * 100;
                this.lblSoundVolume.innerText = Math.round(this.soundManager.volume * 100) + '%';
            }
        }, 100);
    }

    initDOMReferences() {
        this.panel = document.getElementById('control-panel');
        this.toggleBtn = document.getElementById('toggle-control');
        this.btnPause = document.getElementById('btn-pause');
        this.btnReset = document.getElementById('btn-reset');

        this.sldBallCount = document.getElementById('sld-ball-count');
        this.lblBallCount = document.getElementById('lbl-ball-count');
        this.sldStringLength = document.getElementById('sld-string-length');
        this.lblStringLength = document.getElementById('lbl-string-length');
        this.sldTimeScale = document.getElementById('sld-time-scale');
        this.lblTimeScale = document.getElementById('lbl-time-scale');

        this.sldGravity = document.getElementById('sld-gravity');
        this.lblGravity = document.getElementById('lbl-gravity');
        this.sldRestitution = document.getElementById('sld-restitution');
        this.lblRestitution = document.getElementById('lbl-restitution');
        this.sldAngularDamping = document.getElementById('sld-angular-damping');
        this.lblAngularDamping = document.getElementById('lbl-angular-damping');

        this.sldAmbient = document.getElementById('sld-ambient');
        this.lblAmbient = document.getElementById('lbl-ambient');
        this.selectMode = document.getElementById('select-mode');
        this.selectBase = document.getElementById('select-base');

        this.selectBall = document.getElementById('select-ball');
        this.selectMass = document.getElementById('select-mass');
        this.btnApplyMass = document.getElementById('btn-apply-mass');
        this.massStatus = document.getElementById('mass-status');
        this.btnResetMasses = document.getElementById('btn-reset-masses');

        this.sldMouseSens = document.getElementById('sld-mouse-sens');
        this.lblMouseSens = document.getElementById('lbl-mouse-sens');
        this.chkShowPath = document.getElementById('chk-show-path');
        this.chkShowAngle = document.getElementById('chk-show-angle');
        this.sldReturnSpeed = document.getElementById('sld-return-speed');
        this.lblReturnSpeed = document.getElementById('lbl-return-speed');

        // ✅ عناصر التحكم بالصوت
        this.btnToggleSound = document.getElementById('btn-toggle-sound');
        this.sldSoundVolume = document.getElementById('sld-sound-volume');
        this.lblSoundVolume = document.getElementById('lbl-sound-volume');
        this.lblSoundStatus = document.getElementById('lbl-sound-status');
    }

    updateSoundUI() {
        if (!this.soundManager) return;

        if (this.btnToggleSound) {
            this.btnToggleSound.innerText = this.soundManager.enabled ? '🔊 تشغيل' : '🔇 إيقاف';
        }
        if (this.lblSoundStatus) {
            this.lblSoundStatus.innerText = this.soundManager.enabled ? '🟢 مفعل' : '🔴 معطل';
            this.lblSoundStatus.style.color = this.soundManager.enabled ? '#00e676' : '#ff6b6b';
        }
        if (this.sldSoundVolume) {
            this.sldSoundVolume.value = this.soundManager.volume * 100;
        }
        if (this.lblSoundVolume) {
            this.lblSoundVolume.innerText = Math.round(this.soundManager.volume * 100) + '%';
        }
    }

    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.panel.classList.toggle('collapsed'));

        this.btnPause.addEventListener('click', () => {
            Config.state.isPaused = !Config.state.isPaused;
            this.btnPause.innerText = Config.state.isPaused ? "Play / تشغيل" : "Pause / إيقاف";
        });

        this.btnReset.addEventListener('click', () => {
            this.simManager.balls.forEach(b => {
                if (b.setAngle) b.setAngle(0);
                else {
                    // إذا لم توجد setAngle، نضبط الموضع يدوياً
                    b.angle = 0;
                    b.angularVelocity = 0;
                    b.velocity.set(0, 0, 0);
                    b.position.x = b.pivot.x;
                    b.position.y = b.pivot.y - b.length;
                    b.position.z = b.pivot.z;
                }
            });
            Config.state.collisionCount = 0;
        });

        this.sldGravity.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            Config.physics.gravity = val;
            this.lblGravity.innerText = val.toFixed(2);
        });

        this.sldRestitution.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            Config.physics.restitution = val;
            this.lblRestitution.innerText = val.toFixed(2);
        });

        if (this.sldAngularDamping) {
            this.sldAngularDamping.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                Config.physics.angularDamping = val;
                this.lblAngularDamping.innerText = val.toFixed(3);
            });
        }

        if (this.sldAmbient) {
            this.sldAmbient.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                Config.environment.ambientIntensity = val;
                if (this.lblAmbient) this.lblAmbient.innerText = val.toFixed(2);

                this.sceneSetup.scene.traverse(child => {
                    if (child.isAmbientLight) {
                        child.intensity = val;
                    }
                    if (child.isDirectionalLight) {
                        child.intensity = val * 2.5;
                    }
                });
            });
        }
        if (this.sldBallCount) {
            this.sldBallCount.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                Config.balls.count = val;
                if (this.lblBallCount) this.lblBallCount.innerText = val;

                // إعادة توليد الكرات
                if (this.simManager) {
                    this.simManager.generateBalls();
                    // إعادة تعيين حالة الإيقاف
                    Config.state.isPaused = true;
                    if (this.btnPause) {
                        this.btnPause.innerText = "Play / تشغيل";
                    }
                }
            });
        }

        if (this.sldStringLength) {
            this.sldStringLength.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                Config.physics.stringLength = val;
                if (this.lblStringLength) this.lblStringLength.innerText = val.toFixed(1);

                // تحديث طول الخيط لكل الكرات
                if (this.simManager && this.simManager.balls) {
                    this.simManager.balls.forEach(ball => {
                        ball.length = val;
                        ball.stringRestLength = val;
                        ball.stringCurrentLength = val;
                    });
                    // إعادة تعيين الكرات إلى وضع السكون
                    this.simManager.resetBalls();
                    Config.state.isPaused = true;
                    if (this.btnPause) {
                        this.btnPause.innerText = "Play / تشغيل";
                    }
                }
            });
        }

        if (this.sldTimeScale) {
            this.sldTimeScale.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                Config.physics.timeScale = val;
                if (this.lblTimeScale) this.lblTimeScale.innerText = val.toFixed(1);
            });
        }

        if (this.selectMode) {
            this.selectMode.addEventListener('change', (e) => {
                const mode = e.target.value;
                Config.physics.mode = mode;
                console.log(`🔄 تم التبديل إلى وضع ${mode}`);

                // إعادة تعيين جميع الكرات
                if (this.simManager) {
                    this.simManager.resetBalls();
                }

                // إعادة تعيين حالة الإيقاف
                Config.state.isPaused = true;
                if (this.btnPause) {
                    this.btnPause.innerText = "Play / تشغيل";
                }
            });
        }

        if (this.selectBase) {
            this.selectBase.addEventListener('change', (e) => {
                const mode = e.target.value;
                Config.environment.baseMode = mode;
                if (this.simManager && this.simManager.setBaseMode) {
                    this.simManager.setBaseMode(mode);
                }
                console.log(`🪞 تم التبديل إلى وضع القاعدة ${mode}`);
            });
        }

        // ✅ حدث تطبيق الوزن
        if (this.btnApplyMass) {
            this.btnApplyMass.addEventListener('click', () => {
                this.applyMassChange();
            });
        }

        // ✅ تحديث الحالة عند تغيير الاختيار
        if (this.selectBall) {
            this.selectBall.addEventListener('change', () => this.updateMassStatus());
        }
        if (this.selectMass) {
            this.selectMass.addEventListener('change', () => this.updateMassStatus());
        }
        if (this.btnResetMasses) {
            this.btnResetMasses.addEventListener('click', () => {
                this.resetAllMasses();
            });
        }

        if (this.sldMouseSens) {
            this.sldMouseSens.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                Config.mouseControl.sensitivity = val;
                if (this.lblMouseSens) {
                    this.lblMouseSens.innerText = Math.round((val / 2.0) * 100);
                }
                console.log(`🖱️ حساسية الماوس: ${val}`);
            });
        }

        if (this.chkShowPath) {
            this.chkShowPath.addEventListener('change', (e) => {
                Config.mouseControl.showPath = e.target.checked;
                console.log(`🖱️ إظهار مسار السحب: ${e.target.checked}`);
            });
        }

        if (this.chkShowAngle) {
            this.chkShowAngle.addEventListener('change', (e) => {
                Config.mouseControl.showAngle = e.target.checked;
                console.log(`🖱️ إظهار الزاوية: ${e.target.checked}`);
                // إزالة المؤشر إذا تم إخفاء الزاوية
                if (!e.target.checked) {
                    const indicator = document.getElementById('mouse-angle-indicator');
                    if (indicator) indicator.remove();
                }
            });
        }

        if (this.sldReturnSpeed) {
            this.sldReturnSpeed.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                Config.mouseControl.returnSpeed = val;
                if (this.lblReturnSpeed) {
                    this.lblReturnSpeed.innerText = Math.round((val / 2.0) * 100);
                }
                console.log(`🖱️ سرعة الارتداد: ${val}`);
            });
        }

        // ✅ ✅ ✅ أحداث التحكم بالصوت ✅ ✅ ✅
        if (this.btnToggleSound) {
            this.btnToggleSound.addEventListener('click', () => {
                if (this.soundManager) {
                    const isEnabled = this.soundManager.enabled;
                    this.soundManager.toggle(!isEnabled);
                    this.updateSoundUI();
                }
            });
        }

        if (this.sldSoundVolume) {
            this.sldSoundVolume.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (this.soundManager) {
                    this.soundManager.setVolume(val / 100);
                }
                if (this.lblSoundVolume) {
                    this.lblSoundVolume.innerText = val + '%';
                }
            });
        }
    }


    applyMassChange() {
        if (!this.simManager || !this.simManager.balls) {
            console.warn('لا توجد كرات لتعديل وزنها');
            return;
        }

        const ballIndex = parseInt(this.selectBall.value);
        const massMultiplier = parseFloat(this.selectMass.value);
        const baseMass = Config.balls.defaultMass || 1.0;
        const newMass = baseMass * massMultiplier;

        // ✅ حفظ الكتلة المخصصة
        if (this.simManager.setCustomMass) {
            this.simManager.setCustomMass(ballIndex, newMass);
        }

        // ✅ إعادة توليد جميع الكرات (سيتم توزيعها حسب الحجم)
        this.simManager.generateBalls();

        // ✅ تحديث الحالة
        this.updateMassStatus();

        console.log(`✅ تم تغيير الكرة ${ballIndex + 1} إلى كتلة ${newMass.toFixed(2)} كغ`);
    }

    // ✅ دالة تحديث الشكل البصري للكرة
    updateBallVisuals(ball, newRadius) {
        // حذف المجسم القديم
        if (ball.mesh) {
            ball.mesh.geometry.dispose();
            ball.scene.remove(ball.mesh);
        }

        // إنشاء مجسم جديد بالحجم الجديد
        const ballGeo = new THREE.SphereGeometry(newRadius, 64, 64);
        const newMesh = new THREE.Mesh(ballGeo, ball.material);
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        newMesh.userData = { ballId: ball.id };
        newMesh.position.copy(ball.position);
        ball.mesh = newMesh;
        ball.scene.add(newMesh);

        // ✅ تحديث الحلقة العلوية
        if (ball.topRing) {
            ball.topRing.scale.set(
                newRadius / Config.balls.radius,
                1,
                newRadius / Config.balls.radius
            );
        }

        // ✅ تحديث التصادمات (نصف القطر الجديد)
        // سيتم استخدامه تلقائياً في PhysicsEngine
    }

    updateMassStatus() {
        if (!this.massStatus) return;

        const ballIndex = parseInt(this.selectBall?.value || 0);
        const massMultiplier = parseFloat(this.selectMass?.value || 1);
        const baseMass = Config.balls.defaultMass || 1.0;
        const newMass = baseMass * massMultiplier;
        const radiusScale = Math.cbrt(massMultiplier);
        const newRadius = Config.balls.radius * radiusScale;

        const ball = this.simManager?.balls?.[ballIndex];
        const currentMass = ball?.mass || newMass;

        this.massStatus.innerHTML = `
            🏋️ الكرة ${ballIndex + 1}:
            الوزن = ${currentMass.toFixed(2)} كغ
            | الحجم = ${(ball?.radius || newRadius).toFixed(3)} م
            ${massMultiplier > 1 ? '🔴' : '⚪'}
        `;
    }

    resetAllMasses() {
        if (!this.simManager) {
            console.warn('لا يوجد مدير محاكاة');
            return;
        }

        // ✅ إعادة تعيين الكتل المخصصة
        if (this.simManager.resetAllMasses) {
            this.simManager.resetAllMasses();
        } else {
            // إذا لم تكن الدالة موجودة، ننفذها يدوياً
            this.simManager.customMasses = {};
            this.simManager.generateBalls();
        }

        // ✅ تحديث واجهة المستخدم
        this.updateMassStatus();

        // ✅ إعادة تعيين القائمة المنسدلة إلى القيمة الافتراضية
        if (this.selectMass) {
            this.selectMass.value = '1';
        }

        console.log('🔄 تم إعادة تعيين جميع الكتل إلى القيم الافتراضية');
    }


    syncSlidersWithConfig() {
        if (this.selectBase) {
            this.selectBase.value = Config.environment.baseMode || 'mirror';
        }
        if (this.sldAmbient) {
            this.sldAmbient.value = Config.environment.ambientIntensity;
            if (this.lblAmbient) this.lblAmbient.innerText = Config.environment.ambientIntensity.toFixed(2);
        }
        if (this.sldGravity) {
            this.sldGravity.value = Config.physics.gravity;
            if (this.lblGravity) this.lblGravity.innerText = Config.physics.gravity.toFixed(2);
        }
        if (this.sldRestitution) {
            const val = Config.physics.restitution ?? 0.98;
            this.sldRestitution.value = val;
            if (this.lblRestitution) this.lblRestitution.innerText = val.toFixed(2);
        }

        if (this.sldAngularDamping) {
            this.sldAngularDamping.value = Config.physics.angularDamping;
            if (this.lblAngularDamping) this.lblAngularDamping.innerText = Config.physics.angularDamping.toFixed(3);
        }
        if (this.selectMode) {
            this.selectMode.value = Config.physics.mode || '2d';
        }

        if (this.sldMouseSens) {
            const val = Config.mouseControl.sensitivity ?? 0.75;
            this.sldMouseSens.value = val;
            if (this.lblMouseSens) {
                this.lblMouseSens.innerText = Math.round((val / 2.0) * 100);
            }
        }
        if (this.sldBallCount) {
            const val = Config.balls.count || 6;
            this.sldBallCount.value = val;
            if (this.lblBallCount) this.lblBallCount.innerText = val;
        }

        if (this.sldStringLength) {
            const val = Config.physics.stringLength || 4.4;
            this.sldStringLength.value = val;
            if (this.lblStringLength) this.lblStringLength.innerText = val.toFixed(1);
        }

        if (this.sldTimeScale) {
            const val = Config.physics.timeScale || 1.0;
            this.sldTimeScale.value = val;
            if (this.lblTimeScale) this.lblTimeScale.innerText = val.toFixed(1);
        }

        if (this.chkShowPath) {
            this.chkShowPath.checked = Config.mouseControl.showPath ?? true;
        }

        if (this.chkShowAngle) {
            this.chkShowAngle.checked = Config.mouseControl.showAngle ?? true;
        }

        if (this.sldReturnSpeed) {
            const val = Config.mouseControl.returnSpeed ?? 1.0;
            this.sldReturnSpeed.value = val;
            if (this.lblReturnSpeed) {
                this.lblReturnSpeed.innerText = Math.round((val / 2.0) * 100);
            }
        }

        // ✅ مزامنة عناصر التحكم بالصوت
        if (this.sldSoundVolume && this.soundManager) {
    this.sldSoundVolume.value = this.soundManager.volume * 100;
    if (this.lblSoundVolume) this.lblSoundVolume.innerText = Math.round(this.soundManager.volume * 100) + '%';
}
if (this.btnToggleSound && this.soundManager) {
    this.btnToggleSound.innerText = this.soundManager.enabled ? '🔊 تشغيل' : '🔇 إيقاف';
    if (this.lblSoundStatus) {
        this.lblSoundStatus.innerText = this.soundManager.enabled ? '🟢 مفعل' : '🔴 معطل';
        this.lblSoundStatus.style.color = this.soundManager.enabled ? '#00e676' : '#ff6b6b';
    }
}
    }

    updateSliders(g, r, ad) {
        Config.physics.gravity = g;
        Config.physics.restitution = r;
        Config.physics.angularDamping = ad;

        if (this.sldGravity) this.sldGravity.value = g;
        if (this.lblGravity) this.lblGravity.innerText = g.toFixed(2);
        if (this.sldRestitution) this.sldRestitution.value = r;
        if (this.lblRestitution) this.lblRestitution.innerText = (r * 100).toFixed(1) + '%';
        if (this.sldAngularDamping) this.sldAngularDamping.value = ad;
        if (this.lblAngularDamping) this.lblAngularDamping.innerText = ad.toFixed(4);
    }
}
