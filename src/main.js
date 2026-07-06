// src/main.js

// 🆕 أضف هذين السطرين
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { SceneSetup } from './scene/scene.js';
import { setupLighting } from './scene/lighting.js';
import { SimulationManager } from './physics/simulation.js';
import { PhysicsEngine } from './physics/physics.js';
import { setupKeyboardShortcuts } from './controls/controls.js';
import { ControlPanel } from './ui/controlPanel.js';
import { DataPanel } from './ui/dataPanel.js';
// ✅ استيراد مدير الصوت
import { SoundManager } from './audio/soundManager.js';

class Application {
    constructor() {
        // ✅ تهيئة مدير الصوت
        this.soundManager = new SoundManager();

        // 1. بناء المشهد الأساسي والإضاءة
        this.sceneSetup = new SceneSetup('canvas-container');
        setupLighting(this.sceneSetup.scene);

        // 2. تمرير الـ renderer إلى مدير المحاكاة
        this.simManager = new SimulationManager(this.sceneSetup.scene, this.sceneSetup.renderer);

        // ✅ تمرير مدير الصوت إلى PhysicsEngine
        PhysicsEngine.setSoundManager(this.soundManager);

        // 3. ربط واجهات التحكم والبيانات
        this.controlPanel = new ControlPanel(this.simManager, this.sceneSetup);
        this.dataPanel = new DataPanel(this.simManager);

        // 4. تهيئة عناصر التحكم بالفأرة
        setupKeyboardShortcuts(this.simManager, this.sceneSetup);

        this.clock = new THREE.Clock();
        this.animate();

        // ✅ تهيئة الصوت عند أول تفاعل مع المستخدم
        this.initAudioOnInteraction();
    }

    // ✅ تهيئة الصوت عند أول نقرة أو لمسة (مطلوب في بعض المتصفحات)
    initAudioOnInteraction() {
        const events = ['click', 'touchstart', 'keydown'];
        const init = () => {
            this.soundManager.init();
            events.forEach(e => document.removeEventListener(e, init));
        };
        events.forEach(e => document.addEventListener(e, init, { once: true }));
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const dt = this.clock.getDelta();

        // معالجة خطوات الحركة الفيزيائية
        PhysicsEngine.update(this.simManager.balls, dt);

        // مزامنة الأشكال ثلاثية الأبعاد
        this.simManager.balls.forEach(ball => ball.updateVisuals());


        // تحديث الكاميرا الحرة
        this.sceneSetup.controls.update();

        // الحسابات والتحليلات
        this.simManager.calculateGlobalMetrics();
        this.dataPanel.update();

        // رندرة المشهد النهائي
        this.sceneSetup.renderer.render(this.sceneSetup.scene, this.sceneSetup.camera);
    }
}

// الإقلاع التلقائي للتطبيق عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    new Application();
});
