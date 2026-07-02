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

class Application {
    constructor() {
        // 1. بناء المشهد الأساسي والإضاءة
        this.sceneSetup = new SceneSetup('canvas-container');
        setupLighting(this.sceneSetup.scene);

        // 2. تمرير الـ renderer إلى مدير المحاكاة
        this.simManager = new SimulationManager(this.sceneSetup.scene, this.sceneSetup.renderer);

        // 3. ربط واجهات التحكم والبيانات
        this.controlPanel = new ControlPanel(this.simManager, this.sceneSetup);
        this.dataPanel = new DataPanel(this.simManager);

        // 4. تهيئة عناصر التحكم بالفأرة
        setupKeyboardShortcuts(this.simManager, this.sceneSetup);

        this.clock = new THREE.Clock();
        this.animate();
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
