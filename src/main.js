// src/main.js

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { SceneSetup } from './scene/scene.js';
import { setupLighting } from './scene/lighting.js';
import { SimulationManager } from './physics/simulation.js';
import { PhysicsEngine } from './physics/physics.js';
import { setupKeyboardShortcuts } from './controls/controls.js';
import { ControlPanel } from './ui/controlPanel.js';
import { DataPanel } from './ui/dataPanel.js';
import { SoundManager } from './audio/soundManager.js';

class Application {
    constructor() {
        // ✅ تهيئة مدير الصوت
        this.soundManager = new SoundManager();

        // 1. بناء المشهد الأساسي والإضاءة
        this.sceneSetup = new SceneSetup('canvas-container');
        setupLighting(this.sceneSetup.scene);

        // 2. مدير المحاكاة (الشخص الثاني)
        this.simManager = new SimulationManager(this.sceneSetup.scene, this.sceneSetup.renderer);

        // 3. ربط الصوت بالفيزياء (الشخص الخامس)
        PhysicsEngine.setSoundManager(this.soundManager);

        // 4. واجهات التحكم (الشخص الرابع)
        this.controlPanel = new ControlPanel(this.simManager, this.sceneSetup, this.soundManager);
        this.dataPanel = new DataPanel(this.simManager);

        // 5. التفاعل (الشخص الرابع)
        setupKeyboardShortcuts(this.simManager, this.sceneSetup);

        this.clock = new THREE.Clock();
        this.animate();

        // 6. تهيئة الصوت عند أول تفاعل
        this.initAudioOnInteraction();
    }

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

        // ✅ 1. الفيزياء (الشخص الثالث)
        PhysicsEngine.update(this.simManager.balls, dt);

        // ✅ 2. تحديث البصريات (الشخص الثاني)
        // ✅ استخدم updateBallVisualsAll بدلاً من forEach
        this.simManager.updateBallVisualsAll();

        // ✅ 3. المرآة (الشخص الثاني)
        this.simManager.updateMirrorReflection();

        // ✅ 4. الكاميرا (الشخص الثاني)
        this.sceneSetup.controls.update();

        // ✅ 5. المقاييس والبيانات (الشخص الرابع)
        this.simManager.calculateGlobalMetrics();
        this.dataPanel.update();

        // ✅ 6. العرض (الشخص الثاني)
        this.sceneSetup.renderer.render(this.sceneSetup.scene, this.sceneSetup.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Application();
});
