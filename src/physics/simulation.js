// src/physics/simulation.js

// 🆕 أضف هذين السطرين
import * as THREE from 'three';
import { Config } from '../config/config.js';
import { PendulumBall } from './pendulum.js';

export class SimulationManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.balls = [];




        this.initMaterials();
        this.buildCradleStructure();
        this.setupRealisticSunlight();
        this.generateBalls();
    }




    initMaterials() {
        this.woodBaseMaterial = new THREE.MeshStandardMaterial({
            color: 0x24140a,
            roughness: 0.4,
            metalness: 0.0
        });
        this.baseMaterial = this.woodBaseMaterial;

    }

    setupRealisticSunlight() {
        this.sunLight = new THREE.DirectionalLight(
            Config.environment.dirLightColor,
            Config.environment.dirLightIntensity
        );
        this.sunLight.position.set(-60, 35, 10);
        this.sunLight.castShadow = true;

        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 200;

        const d = 25;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.bias = -0.0002;

        this.scene.add(this.sunLight);
    }

    buildCradleStructure() {
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.95,
            roughness: 0.05
        });

        const barGeo = new THREE.CylinderGeometry(0.1, 0.1, 11, 16);
        const frontBar = new THREE.Mesh(barGeo, frameMat);
        frontBar.rotation.z = Math.PI / 2;
        frontBar.position.set(0, 4, 1.5);
        this.scene.add(frontBar);

        const backBar = new THREE.Mesh(barGeo, frameMat);
        backBar.rotation.z = Math.PI / 2;
        backBar.position.set(0, 4, -1.5);
        this.scene.add(backBar);

        const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, 5.5, 16);
        const pillarPositions = [
            [-5.3, 1.25, 1.5],
            [5.3, 1.25, 1.5],
            [-5.3, 1.25, -1.5],
            [5.3, 1.25, -1.5]
        ];
        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeo, frameMat);
            pillar.position.set(...pos);
            pillar.castShadow = true;
            this.scene.add(pillar);
        });

        const baseGeo = new THREE.BoxGeometry(11.5, 0.3, 4);

        // ✅ استخدام المادة العادية فقط (بدون مرآة)
        this.cradleBase = new THREE.Mesh(baseGeo, this.woodBaseMaterial);
        this.cradleBase.position.set(0, -1.35, 0);
        this.cradleBase.receiveShadow = true;
        this.cradleBase.castShadow = true;
        this.scene.add(this.cradleBase);
    }





    generateBalls() {
    // تنظيف الكرات القديمة
    this.balls.forEach(b => {
        this.scene.remove(b.mesh);
        this.scene.remove(b.topRing);
        this.scene.remove(b.stringLine1);
        this.scene.remove(b.stringLine2);
        this.scene.remove(b.predictedPath);
    });
    this.balls = [];

    const count = Config.balls.count;

    // ✅ حساب أنصاف الأقطار الفعلية لكل كرة
    const radii = [];
    for (let i = 0; i < count; i++) {
        let radius = Config.balls.radius;
        if (this.customMasses && this.customMasses[i] !== undefined) {
            const baseMass = Config.balls.defaultMass || 1.0;
            const massMultiplier = this.customMasses[i] / baseMass;
            const radiusScale = Math.cbrt(massMultiplier);
            radius = Config.balls.radius * radiusScale;
        }
        radii.push(radius);
    }

    // ✅ حساب المواضع بحيث تكون الكرات متلامسة
    const positions = [];
    const spacing = 0.01; // فراق بسيط بين الكرات

    // الكرة الأولى في المنتصف أو في البداية
    let currentX = 0;

    // نبدأ من أقصى اليسار
    // نحسب العرض الكلي للمجموعة
    let totalWidth = 0;
    for (let i = 0; i < count; i++) {
        totalWidth += radii[i] * 2;
        if (i < count - 1) totalWidth += spacing;
    }

    // نقطة البداية (أقصى اليسار)
    let startX = -totalWidth / 2 + radii[0];

    for (let i = 0; i < count; i++) {
        if (i === 0) {
            positions.push(startX);
        } else {
            // المسافة بين مركز الكرة i-1 والكرة i
            const distance = radii[i-1] + radii[i] + spacing;
            positions.push(positions[i-1] + distance);
        }
    }

    // ✅ إنشاء الكرات في المواضع المحسوبة
    for (let i = 0; i < count; i++) {
        const pivotX = positions[i];
        const pivot = new THREE.Vector3(pivotX, 4, 0);
        const ball = new PendulumBall(i, pivot, this.scene);

        // ✅ تطبيق الكتلة المخصصة إذا كانت موجودة
        if (this.customMasses && this.customMasses[i] !== undefined) {
            ball.mass = this.customMasses[i];

            const baseMass = Config.balls.defaultMass || 1.0;
            const massMultiplier = ball.mass / baseMass;
            const radiusScale = Math.cbrt(massMultiplier);
            const newRadius = Config.balls.radius * radiusScale;
            ball.radius = newRadius;

            this.rebuildBallVisuals(ball, newRadius);
        }

        this.balls.push(ball);
    }
}

rebuildBallVisuals(ball, newRadius) {
    if (!ball || !ball.mesh) return;

    const scene = this.scene;
    const oldMaterial = ball.material;
    const oldPosition = ball.position.clone();
    const oldUserData = ball.mesh.userData;

    // حذف المجسم القديم
    if (ball.mesh) {
        ball.mesh.geometry.dispose();
        if (ball.mesh.parent) {
            ball.mesh.parent.remove(ball.mesh);
        }
    }

    // إنشاء مجسم جديد
    const ballGeo = new THREE.SphereGeometry(newRadius, 64, 64);
    const newMesh = new THREE.Mesh(ballGeo, oldMaterial);
    newMesh.castShadow = true;
    newMesh.receiveShadow = true;
    newMesh.userData = oldUserData;
    newMesh.position.copy(oldPosition);

    ball.mesh = newMesh;
    scene.add(newMesh);

    // ✅ تحديث الحلقة العلوية
    if (ball.topRing) {
        const scaleFactor = newRadius / Config.balls.radius;
        ball.topRing.scale.set(scaleFactor, 1, scaleFactor);
    }

    // ✅ تحديث الخيوط
    ball.updateVisuals();
}

resetAllMasses() {
    this.customMasses = {};
    this.generateBalls();
    console.log('🔄 تم إعادة تعيين جميع الكتل إلى القيم الافتراضية');
}

    setCustomMass(index, mass) {
    if (!this.customMasses) this.customMasses = {};
    this.customMasses[index] = mass;
    console.log(`📝 تم حفظ الكتلة المخصصة للكرة ${index + 1}: ${mass} كغ`);
}

    constrainBallToPendulumArc(ball, xPosition) {
        const dx = xPosition - ball.pivot.x;
        const clampedDx = Math.max(-ball.length + 0.0001, Math.min(ball.length - 0.0001, dx));
        const angle = Math.asin(clampedDx / ball.length);
        ball.angle = angle;
        ball.position.x = ball.pivot.x + ball.length * Math.sin(angle);
        ball.position.y = ball.pivot.y - ball.length * Math.cos(angle);
        ball.position.z = ball.pivot.z;
        ball.angularVelocity = 0;
        ball.angularAcceleration = 0;
        ball.velocity.set(0, 0, 0);
    }

    applyDragChain(draggedBall) {
        if (!draggedBall || Config.physics.mode !== '2d') return;

        const draggedIndex = this.balls.indexOf(draggedBall);
        if (draggedIndex === -1) return;

        const spacing = Config.balls.spacing || 0;
        const movingLeft = draggedBall.position.x < draggedBall.pivot.x;

        if (movingLeft) {
            for (let i = draggedIndex - 1; i >= 0; i--) {
                const rightBall = this.balls[i + 1];
                const ball = this.balls[i];
                const minDistance = ball.radius + rightBall.radius + spacing;
                const targetX = rightBall.position.x - minDistance;
                this.constrainBallToPendulumArc(ball, targetX);
            }
        } else {
            for (let i = draggedIndex + 1; i < this.balls.length; i++) {
                const leftBall = this.balls[i - 1];
                const ball = this.balls[i];
                const minDistance = ball.radius + leftBall.radius + spacing;
                const targetX = leftBall.position.x + minDistance;
                this.constrainBallToPendulumArc(ball, targetX);
            }
        }
    }


    calculateGlobalMetrics() {
        let totalKE = 0;
        let totalPE = 0;
        let systemMomentum = new THREE.Vector3();
        this.balls.forEach(ball => {
            const metrics = ball.getMetrics();
            totalKE += metrics.ke;
            totalPE += metrics.pe;
            systemMomentum.add(metrics.velocity.clone().multiplyScalar(ball.mass));
        });
        Config.state.totalEnergy = totalKE + totalPE;
        Config.state.totalMomentum = systemMomentum.length();
    }

    resetBalls() {
        this.balls.forEach(ball => {
            ball.angle = 0;
            ball.angularVelocity = 0;
            ball.angularAcceleration = 0;
            ball.velocity.set(0, 0, 0);
            ball.position.set(ball.pivot.x, ball.pivot.y - ball.length, ball.pivot.z);
        });
        Config.state.collisionCount = 0;
    }
}
