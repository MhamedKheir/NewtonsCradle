// src/scene/lighting.js

// 🆕 أضف هذا السطر
import * as THREE from 'three';
import { Config } from '../config/config.js';

export function setupLighting(scene) {
    // 1. الإضاءة المحيطية النهارية الشاملة
    const ambientLight = new THREE.AmbientLight(Config.environment.ambientColor, Config.environment.ambientIntensity);
    scene.add(ambientLight);

    // 2. ضوء الشمس الأساسي الساطع
    const dirLight = new THREE.DirectionalLight(Config.environment.dirLightColor, Config.environment.dirLightIntensity);
    dirLight.position.set(25, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;

    const d = 30;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0002;
    scene.add(dirLight);

    // 3. إضاءة ثانوية زرقاء (Sky Bounce Light)
    const skyLight = new THREE.DirectionalLight(0xddeeff, 1.2);
    skyLight.position.set(-25, 20, -20);
    scene.add(skyLight);
}
