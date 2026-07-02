// src/scene/lighting.js
import * as THREE from 'three';
import { Config } from '../config/config.js';

export function setupLighting(scene) {
    // 1) Ambient خفيف جداً حتى ما يصير المشهد Flat
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.12);
    scene.add(ambientLight);

    // 2) Hemisphere لتوزيع إضاءة طبيعي (سماء/أرض)
    const hemiLight = new THREE.HemisphereLight(0xe7eefc, 0x4a3f35, 0.35);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    // 3) ضوء رئيسي ناعم كأنه داخل من الشباك
    const dirLight = new THREE.DirectionalLight(0xfff4e6, 1.15);
    dirLight.position.set(-18, 20, 10);
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

    // 4) سبوت سقفي خفيف ليعطي إحساس غرفة حقيقية
    const ceilingSpot = new THREE.SpotLight(0xfff1dc, 0.75, 120, Math.PI / 5, 0.35, 1.2);
    ceilingSpot.position.set(0, 18, 0);
    ceilingSpot.target.position.set(0, -2, 0);
    ceilingSpot.castShadow = true;
    ceilingSpot.shadow.mapSize.set(1024, 1024);
    ceilingSpot.shadow.bias = -0.0001;
    scene.add(ceilingSpot);
    scene.add(ceilingSpot.target);

    // 5) Fill light خفيف جداً لكسر السواد القاسي
    const fill = new THREE.PointLight(0xffe6cc, 0.18, 60);
    fill.position.set(10, 6, -8);
    scene.add(fill);
}
