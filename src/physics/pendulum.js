// src/physics/pendulum.js

import * as THREE from 'three';
import { Config } from '../config/config.js';

export class PendulumBall {
    constructor(id, initPivot, scene) {
        this.id = id;
        this.radius = Config.balls.radius;
        this.mass = Config.balls.defaultMass;
        this.pivot = initPivot.clone();
        this.length = Config.physics.stringLength;

        // الموضع في 3D
        this.position = initPivot.clone().add(new THREE.Vector3(0, -this.length, 0));
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);

        // ✅ متغيرات 2D
        this.angle = 0;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;

        this.isBeingDragged = false;
        this.mouseTargetPosition = null;
        this.mouseTargetAngle = 0;
        this.scene = scene;

        this.buildVisuals(scene);
        this.buildInteractionHelpers();
    }

    buildVisuals(scene) {
        const ballGeo = new THREE.SphereGeometry(this.radius, 64, 64);
        this.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.02,
            envMapIntensity: 4.5
        });

        this.mesh = new THREE.Mesh(ballGeo, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData = { ballId: this.id };
        scene.add(this.mesh);

        const ringGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1.0, roughness: 0.1 });
        this.topRing = new THREE.Mesh(ringGeo, ringMat);
        this.topRing.castShadow = true;
        scene.add(this.topRing);

        const lineMat = new THREE.LineBasicMaterial({ color: 0xcccccc });

        // خيطان مزدوجان
        const stringGeo1 = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(this.pivot.x, this.pivot.y, 1.5),
            this.position
        ]);
        this.stringLine1 = new THREE.Line(stringGeo1, lineMat);

        const stringGeo2 = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(this.pivot.x, this.pivot.y, -1.5),
            this.position
        ]);
        this.stringLine2 = new THREE.Line(stringGeo2, lineMat);

        scene.add(this.stringLine1);
        scene.add(this.stringLine2);
    }

    buildInteractionHelpers() {
        const pathPoints = [];
        for (let a = -Math.PI / 2; a <= Math.PI / 2; a += 0.05) {
            pathPoints.push(new THREE.Vector3(
                this.pivot.x + Math.sin(a) * this.length,
                this.pivot.y - Math.cos(a) * this.length,
                this.pivot.z
            ));
        }
        const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
        const pathMat = new THREE.LineDashedMaterial({ color: 0x00d4ff, dashSize: 0.3, gapSize: 0.1 });
        this.predictedPath = new THREE.Line(pathGeo, pathMat);
        this.predictedPath.computeLineDistances();
        this.predictedPath.visible = false;
        this.scene.add(this.predictedPath);
    }

    updateVelocity() {
        const speed = this.length * this.angularVelocity;
        this.velocity.set(
            speed * Math.cos(this.angle),
            speed * Math.sin(this.angle),
            0
        );
    }

    step2D(dt) {
        // ✅ إذا كانت الكرة مسحوبة، لا نطبق الفيزياء
        if (this.isBeingDragged) {
            this.angularVelocity = 0;
            this.angularAcceleration = 0;
            this.velocity.set(0, 0, 0);
            return;
        }

        const g = Config.physics.gravity;
        const drag = Config.physics.angularDamping || 0.00015;

        // ✅ المعادلة التفاضلية للبندول
        this.angularAcceleration = -(g / this.length) * Math.sin(this.angle) - drag * this.angularVelocity;

        // ✅ التكامل العددي (طريقة أويلر)
        this.angularVelocity += this.angularAcceleration * dt;
        this.angle += this.angularVelocity * dt;

        // ✅ تحديث الموضع من الزاوية
        this.position.x = this.pivot.x + this.length * Math.sin(this.angle);
        this.position.y = this.pivot.y - this.length * Math.cos(this.angle);
        this.position.z = this.pivot.z;

        // ✅ تحديث السرعة الخطية
        const speed = this.length * this.angularVelocity;
        this.velocity.set(speed * Math.cos(this.angle), speed * Math.sin(this.angle), 0);
    }

    // ✅ تحديث 3D
    step3D(dt) {
        if (this.isBeingDragged) return;

        const g = Config.physics.gravity;
        const drag = Config.physics.angularDamping || 0.00015;

        const gravityForce = new THREE.Vector3(0, -g * this.mass, 0);
        const ropeVector = new THREE.Vector3().subVectors(this.position, this.pivot);
        const ropeDirection = ropeVector.clone().normalize();

        const speedSq = this.velocity.lengthSq();
        const gravityContribution = gravityForce.dot(ropeDirection);
        const tensionMagnitude = -(this.mass * speedSq / this.length) + gravityContribution;
        const tensionForce = ropeDirection.clone().multiplyScalar(tensionMagnitude);

        const dragForce = this.velocity.clone().multiplyScalar(-drag * this.mass);

        const totalForce = new THREE.Vector3()
            .add(gravityForce)
            .add(tensionForce)
            .add(dragForce);
        const acceleration = totalForce.divideScalar(this.mass);

        this.velocity.addScaledVector(acceleration, dt);
        this.position.addScaledVector(this.velocity, dt);

        const correctedRope = new THREE.Vector3().subVectors(this.position, this.pivot).setLength(this.length);
        this.position.copy(this.pivot).add(correctedRope);

        const velocityRopeComponent = this.velocity.dot(ropeDirection);
        this.velocity.addScaledVector(ropeDirection, -velocityRopeComponent);

        // تحديث الزاوية 2D من الموقع 3D (للتتبع)
        this.angle = Math.atan2(this.position.x - this.pivot.x, -(this.position.y - this.pivot.y));
    }

    // ✅ التبديل التلقائي حسب الوضع
    step(dt) {
        if (Config.physics.mode === '3d') {
            this.step3D(dt);
        } else {
            this.step2D(dt);
        }
    }

    // ✅ تحديث البصريات
    updateVisuals() {
    this.mesh.position.copy(this.position);
    this.topRing.position.copy(this.position);
    this.topRing.position.y += this.radius;

    // ✅ تحديث الخيط الأول
    const pos1 = this.stringLine1.geometry.attributes.position.array;
    pos1[0] = this.pivot.x;
    pos1[1] = this.pivot.y;
    pos1[2] = 1.5;
    pos1[3] = this.position.x;
    pos1[4] = this.position.y + this.radius;  // ✅ يبدأ من أعلى الكرة
    pos1[5] = this.position.z;
    this.stringLine1.geometry.attributes.position.needsUpdate = true;

    // ✅ تحديث الخيط الثاني
    const pos2 = this.stringLine2.geometry.attributes.position.array;
    pos2[0] = this.pivot.x;
    pos2[1] = this.pivot.y;
    pos2[2] = -1.5;
    pos2[3] = this.position.x;
    pos2[4] = this.position.y + this.radius;  // ✅ يبدأ من أعلى الكرة
    pos2[5] = this.position.z;
    this.stringLine2.geometry.attributes.position.needsUpdate = true;
}

    // ✅ دوال الحالة
    setHoverState(isHovered) {
        if (this.isBeingDragged) return;
        if (isHovered) {
            this.material.roughness = 0.1;
            this.material.emissive.setHex(0x222222);
        } else {
            this.material.roughness = 0.02;
            this.material.emissive.setHex(0x000000);
        }
    }

    setSelectedState(isSelected) {
        if (isSelected) {
            this.material.emissive.setHex(0x0055aa);
            if (Config.mouseControl.showPath) this.predictedPath.visible = true;
        } else {
            this.material.emissive.setHex(0x000000);
            this.predictedPath.visible = false;
        }
    }

    getMetrics() {
        const displacement = this.position.clone().sub(this.pivot);
        const angle = Math.atan2(displacement.x, -displacement.y) * (180 / Math.PI);
        const ke = 0.5 * this.mass * this.velocity.lengthSq();
        const height = this.position.y - (this.pivot.y - this.length);
        const pe = this.mass * Config.physics.gravity * Math.max(0, height);
        return { velocity: this.velocity, angle, ke, pe };
    }

    setMass(newMass) {
    this.mass = newMass;
    const baseMass = Config.balls.defaultMass || 1.0;
    const massMultiplier = newMass / baseMass;
    const radiusScale = Math.cbrt(massMultiplier);
    this.radius = Config.balls.radius * radiusScale;
    this.updateVisuals();
}

    // ✅ دوال السحب
    setDragPosition(position) {
        this.isBeingDragged = true;
        this.mouseTargetPosition = position.clone();
        this.velocity.set(0, 0, 0);
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
    }

    setDragAngle(angle) {
        this.isBeingDragged = true;
        this.mouseTargetAngle = angle;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.position.x = this.pivot.x + this.length * Math.sin(angle);
        this.position.y = this.pivot.y - this.length * Math.cos(angle);
        this.position.z = this.pivot.z;
    }

    release() {
        this.isBeingDragged = false;
        this.mouseTargetPosition = null;
        this.mouseTargetAngle = 0;
    }
}
