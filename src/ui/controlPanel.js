// src/ui/controlPanel.js

// ✅ هذا الملف لا يحتاج THREE، فقط Config
import * as THREE from 'three';
import { Config } from '../config/config.js';

export class ControlPanel {
    constructor(simManager, sceneSetup) {
        this.simManager = simManager;
        this.sceneSetup = sceneSetup;
        this.initDOMReferences();
        this.bindEvents();
        this.syncSlidersWithConfig();
        this.updateMassStatus();
    }

    initDOMReferences() {
        this.panel = document.getElementById('control-panel');
        this.toggleBtn = document.getElementById('toggle-control');
        this.btnPause = document.getElementById('btn-pause');
        this.btnReset = document.getElementById('btn-reset');

        this.sldGravity = document.getElementById('sld-gravity');
        this.lblGravity = document.getElementById('lbl-gravity');
        this.sldRestitution = document.getElementById('sld-restitution');
        this.lblRestitution = document.getElementById('lbl-restitution');
        this.sldAngularDamping = document.getElementById('sld-angular-damping');
        this.lblAngularDamping = document.getElementById('lbl-angular-damping');

        this.sldAmbient = document.getElementById('sld-ambient');
        this.lblAmbient = document.getElementById('lbl-ambient');
        this.selectMode = document.getElementById('select-mode');

        this.selectBall = document.getElementById('select-ball');
        this.selectMass = document.getElementById('select-mass');
        this.btnApplyMass = document.getElementById('btn-apply-mass');
        this.massStatus = document.getElementById('mass-status');
        this.btnResetMasses = document.getElementById('btn-reset-masses');

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
            this.lblRestitution.innerText = val.toFixed(2);  // ✅ 0.98 وليس 98.0%
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
            if (this.lblRestitution) this.lblRestitution.innerText = val.toFixed(2);  // ✅ 0.98 وليس 98.0%
        }

        if (this.sldAngularDamping) {
            this.sldAngularDamping.value = Config.physics.angularDamping;
            if (this.lblAngularDamping) this.lblAngularDamping.innerText = Config.physics.angularDamping.toFixed(3);
        }
        if (this.selectMode) {
            this.selectMode.value = Config.physics.mode || '2d';
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
