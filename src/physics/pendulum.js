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

        // متغيرات 2D
        this.angle = 0;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;

        this.isBeingDragged = false;
        this.mouseTargetPosition = null;
        this.mouseTargetAngle = 0;
        this.scene = scene;

        // ❌ تم حذف buildVisuals و buildInteractionHelpers من هنا
        // ✅ سيتم بناؤها بواسطة الشخص الثاني عبر simulation.js
    }

    // ============================================
    // ✅ فيزياء 2D
    // ============================================
    step2D(dt) {
        if (this.isBeingDragged) {
            this.angularVelocity = 0;
            this.angularAcceleration = 0;
            this.velocity.set(0, 0, 0);
            return;
        }

        const g = Config.physics.gravity;
        const drag = Config.physics.angularDamping || 0.00015;

        this.angularAcceleration = -(g / this.length) * Math.sin(this.angle) - drag * this.angularVelocity;
        this.angularVelocity += this.angularAcceleration * dt;
        this.angle += this.angularVelocity * dt;

        this.position.x = this.pivot.x + this.length * Math.sin(this.angle);
        this.position.y = this.pivot.y - this.length * Math.cos(this.angle);
        this.position.z = this.pivot.z;

        const speed = this.length * this.angularVelocity;
        this.velocity.set(speed * Math.cos(this.angle), speed * Math.sin(this.angle), 0);
    }

    // ============================================
    // ✅ فيزياء 3D
    // ============================================
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

        this.angle = Math.atan2(this.position.x - this.pivot.x, -(this.position.y - this.pivot.y));
    }

    // ============================================
    // ✅ اختيار الوضع
    // ============================================
    step(dt) {
        if (Config.physics.mode === '3d') {
            this.step3D(dt);
        } else {
            this.step2D(dt);
        }
    }

    // ============================================
    // ✅ حساب السرعة الخطية
    // ============================================
    updateVelocity() {
        const speed = this.length * this.angularVelocity;
        this.velocity.set(
            speed * Math.cos(this.angle),
            speed * Math.sin(this.angle),
            0
        );
    }

    // ============================================
    // ✅ حساب الطاقة
    // ============================================
    getMetrics() {
        const displacement = this.position.clone().sub(this.pivot);
        const angle = Math.atan2(displacement.x, -displacement.y) * (180 / Math.PI);
        const ke = 0.5 * this.mass * this.velocity.lengthSq();
        const height = this.position.y - (this.pivot.y - this.length);
        const pe = this.mass * Config.physics.gravity * Math.max(0, height);
        return { velocity: this.velocity, angle, ke, pe };
    }

    // ============================================
    // ✅ تغيير الكتلة
    // ============================================
    setMass(newMass) {
    this.mass = newMass;
    const baseMass = Config.balls.defaultMass || 1.0;
    const massMultiplier = newMass / baseMass;
    const radiusScale = Math.cbrt(massMultiplier);
    const newRadius = Config.balls.radius * radiusScale;
    this.radius = newRadius;

    // ✅ إرجاع نصف القطر الجديد
    return newRadius;
}

    // ============================================
    // ✅ دوال السحب
    // ============================================
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
