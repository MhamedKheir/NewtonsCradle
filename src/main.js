

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

        this.soundManager = new SoundManager();


        this.sceneSetup = new SceneSetup('canvas-container');
        setupLighting(this.sceneSetup.scene);

        this.simManager = new SimulationManager(this.sceneSetup.scene, this.sceneSetup.renderer);
        PhysicsEngine.setSoundManager(this.soundManager);

        this.controlPanel = new ControlPanel(this.simManager, this.sceneSetup, this.soundManager);
        this.dataPanel = new DataPanel(this.simManager);

        setupKeyboardShortcuts(this.simManager, this.sceneSetup);

        this.clock = new THREE.Clock();
        this.animate();

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

        PhysicsEngine.update(this.simManager.balls, dt);

        this.simManager.updateBallVisualsAll();
        this.simManager.updateMirrorReflection();
        this.sceneSetup.controls.update();
        this.simManager.calculateGlobalMetrics();
        this.dataPanel.update();
        this.sceneSetup.renderer.render(this.sceneSetup.scene, this.sceneSetup.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Application();
});
