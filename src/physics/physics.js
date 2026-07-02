// src/physics/physics.js

import * as THREE from 'three';
import { Config } from '../config/config.js';

export class PhysicsEngine {
    static update(balls, dt) {
        if (dt <= 0) return;

        const isPaused = Config.state.isPaused;
        const subSteps = Config.physics.subSteps || 20;
        const sdt = dt * (Config.physics.timeScale || 1.0) / subSteps;
        const mode = Config.physics.mode || '2d';

        for (let step = 0; step < subSteps; step++) {
            balls.forEach(ball => {
                if (ball.isBeingDragged) {
                    if (mode === '3d' && ball.mouseTargetPosition) {
                        // 3D: تحديث الموضع من الماوس
                        const direction = new THREE.Vector3().subVectors(ball.mouseTargetPosition, ball.pivot);
                        const currentLength = direction.length();
                        if (currentLength > 0.001) {
                            direction.multiplyScalar(ball.length / currentLength);
                        } else {
                            direction.set(0, -ball.length, 0);
                        }
                        ball.position.copy(ball.pivot).add(direction);
                    } else if (mode === '2d' && ball.mouseTargetAngle !== undefined) {
                        // 2D: تحديث الموضع من الزاوية
                        ball.position.x = ball.pivot.x + ball.length * Math.sin(ball.mouseTargetAngle);
                        ball.position.y = ball.pivot.y - ball.length * Math.cos(ball.mouseTargetAngle);
                        ball.position.z = ball.pivot.z;
                    }
                    ball.velocity.set(0, 0, 0);
                    ball.angularVelocity = 0;
                    return;
                }

                if (isPaused) return;

                // ✅ استخدام الدالة المناسبة حسب الوضع
                ball.step(sdt);
            });

            if (isPaused) continue;

            // ✅ التصادمات حسب الوضع
            if (mode === '3d') {
                this.resolveCollision3D(balls);
            } else {
                this.resolveCollision2D(balls);
            }
        }
    }

    static resolveCollision2D(balls) {
        const e = Config.physics.restitution || 0.998;

        // أكثر من تمريرة حتى تنتقل الحركة عبر السلسلة بالكامل عند سحب كرة واحدة
        for (let pass = 0; pass < 3; pass++) {
            for (let i = 0; i < balls.length - 1; i++) {
            const b1 = balls[i];
            const b2 = balls[i + 1];

            // ✅ حساب المسافة بين الكرات
            const distance = b1.position.distanceTo(b2.position);
            const minDistance = b1.radius + b2.radius + (Config.balls.spacing || 0);

            // ✅ إذا كانت الكرات متباعدة، لا تفعل شيئاً
            if (distance >= minDistance) continue;

            // ✅ حساب التداخل والاتجاه
            const overlap = minDistance - distance;
            const normal = new THREE.Vector3().subVectors(b1.position, b2.position).normalize();

            // ✅ التعامل مع الكرات المسحوبة
            if (b1.isBeingDragged) {
                b2.position.addScaledVector(normal, -overlap);
                continue;
            } else if (b2.isBeingDragged) {
                b1.position.addScaledVector(normal, overlap);
                continue;
            }

            // ✅ فصل الكرات
            b1.position.addScaledVector(normal, overlap * 0.5);
            b2.position.addScaledVector(normal, -overlap * 0.5);

            // ✅ حساب السرعات الخطية من السرعات الزاوية
            const v1 = b1.angularVelocity * b1.length;
            const v2 = b2.angularVelocity * b2.length;
            const relVel = v1 - v2;

            // ✅ إذا كانت الكرات في حالة اقتراب
            if (relVel > 0) {
                const m1 = b1.mass;
                const m2 = b2.mass;
                const totalMass = m1 + m2;

                // ✅ معادلات التصادم المرن (حفظ الزخم والطاقة)
                const v1New = (m1 * v1 + m2 * v2 - m2 * e * relVel) / totalMass;
                const v2New = (m1 * v1 + m2 * v2 + m1 * e * relVel) / totalMass;

                // ✅ تحديث السرعات الزاوية
                b1.angularVelocity = v1New / b1.length;
                b2.angularVelocity = v2New / b2.length;

                // ✅ تحديث السرعات الخطية (للوحة البيانات)
                b1.velocity.set(v1New * Math.cos(b1.angle), v1New * Math.sin(b1.angle), 0);
                b2.velocity.set(v2New * Math.cos(b2.angle), v2New * Math.sin(b2.angle), 0);

                Config.state.collisionCount++;
            }
            }
        }
    }

    static resolveCollision3D(balls) {
        for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < balls.length; i++) {
                for (let j = i + 1; j < balls.length; j++) {
                const b1 = balls[i];
                const b2 = balls[j];

                const delta = b1.position.clone().sub(b2.position);
                const distance = delta.length();
                const minDistance = b1.radius + b2.radius + (Config.balls.spacing || 0);

                if (distance >= minDistance) continue;

                const overlap = minDistance - distance;
                const normal = delta.clone().normalize();

                if (b1.isBeingDragged) {
                    b2.position.addScaledVector(normal, -overlap);
                    continue;
                } else if (b2.isBeingDragged) {
                    b1.position.addScaledVector(normal, overlap);
                    continue;
                }

                b1.position.addScaledVector(normal, overlap * 0.5);
                b2.position.addScaledVector(normal, -overlap * 0.5);

                const relVelocity = b1.velocity.clone().sub(b2.velocity);
                const velAlongNormal = relVelocity.dot(normal);

                if (velAlongNormal < 0) {
                    const e = Config.physics.restitution || 0.998;
                    const impulse = -(1 + e) * velAlongNormal / (1 / b1.mass + 1 / b2.mass);
                    b1.velocity.addScaledVector(normal, impulse / b1.mass);
                    b2.velocity.addScaledVector(normal, -impulse / b2.mass);
                    Config.state.collisionCount++;
                }
                }
            }
        }
    }
}
