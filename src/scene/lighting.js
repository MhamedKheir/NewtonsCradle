// src/scene/lighting.js
import * as THREE from 'three';
import { Config } from '../config/config.js';

export function setupLighting(scene) {
    // 1) ✅ Ambient دافئ هادئ - زيادة الشدة إلى 0.50
    const ambientLight = new THREE.AmbientLight(0xf5e6d3, 0.50);  // ✅ من 0.15 إلى 0.50
    scene.add(ambientLight);

    // 2) Hemisphere لتوزيع إضاءة طبيعي دافئ
    const hemiLight = new THREE.HemisphereLight(0xf0dcc8, 0x8b7355, 0.32);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    // 3) ضوء رئيسي دافئ ناعم كأنه داخل من الشباك
    const dirLight = new THREE.DirectionalLight(0xffd9a8, 4.62);
    dirLight.position.set(-8, 22, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 90;

    const d = 22;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.00015;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    // 4) سبوت سقفي دافئ هادئ للإضاءة العامة فقط، بدون ظلال
    const ceilingSpot = new THREE.SpotLight(0xf5dfc0, 0.35, 120, Math.PI / 5, 0.35, 1.2);
    ceilingSpot.position.set(0, 18, 0);
    ceilingSpot.target.position.set(0, -2, 0);
    ceilingSpot.castShadow = false;
    ceilingSpot.shadow.mapSize.set(1024, 1024);
    ceilingSpot.shadow.bias = -0.0001;
    scene.add(ceilingSpot);
    scene.add(ceilingSpot.target);

    // 5) Fill light دافئ خفيف لكسر السواد القاسي
    const fill = new THREE.PointLight(0xf5d9b8, 0.1, 60);
    fill.position.set(10, 6, -8);
    scene.add(fill);
}
