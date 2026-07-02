// src/controls/controls.js

import * as THREE from 'three';
import { Config } from '../config/config.js';

export function setupKeyboardShortcuts(simManager, sceneSetup) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedBall = null;
    let hoveredBall = null;
    let isDragging = false;

    const dragPlane = new THREE.Plane();
    const intersectionPoint = new THREE.Vector3();
    const dom = sceneSetup.renderer.domElement;

    function updateMouse(e) {
        const rect = dom.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }



    function updateAngleUI(angle) {
        if (!Config.mouseControl.showAngle) return;
        const deg = (angle * (180 / Math.PI)).toFixed(1);
        let indicator = document.getElementById('mouse-angle-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'mouse-angle-indicator';
            indicator.style.position = 'absolute';
            indicator.style.bottom = '80px';
            indicator.style.left = '50%';
            indicator.style.transform = 'translateX(-50%)';
            indicator.style.background = 'rgba(0,0,0,0.75)';
            indicator.style.padding = '8px 16px';
            indicator.style.borderRadius = '8px';
            indicator.style.color = '#00d4ff';
            indicator.style.fontFamily = 'Cairo, sans-serif';
            indicator.style.fontSize = '14px';
            indicator.style.zIndex = '100';
            indicator.style.pointerEvents = 'none';
            document.body.appendChild(indicator);
        }
        indicator.innerText = `زاوية السحب: ${deg}°`;
    }

    // Hover Detection
    dom.addEventListener('mousemove', (e) => {
        updateMouse(e);
        if (isDragging) return;

        raycaster.setFromCamera(mouse, sceneSetup.camera);
        const meshes = simManager.balls.map(b => b.mesh).filter(Boolean);
        const intersects = raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            const ball = simManager.balls.find(b => b.mesh === hitMesh);
            if (ball && ball !== hoveredBall) {
                if (hoveredBall) hoveredBall.setHoverState(false);
                hoveredBall = ball;
                hoveredBall.setHoverState(true);
                dom.style.cursor = 'grab';
            }
            if (sceneSetup.controls) sceneSetup.controls.enabled = false;
        } else {
            if (hoveredBall) {
                hoveredBall.setHoverState(false);
                hoveredBall = null;
                dom.style.cursor = 'default';
            }
            if (!isDragging && sceneSetup.controls) {
                sceneSetup.controls.enabled = true;
            }
        }
    });

    // MouseDown
    dom.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || isDragging) return;

        updateMouse(e);
        raycaster.setFromCamera(mouse, sceneSetup.camera);
        const meshes = simManager.balls.map(b => b.mesh).filter(Boolean);
        const intersects = raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            const clickedBall = simManager.balls.find(b => b.mesh === hitMesh);

            if (clickedBall) {
                isDragging = true;
                selectedBall = clickedBall;
                if (sceneSetup.controls) sceneSetup.controls.enabled = false;
                dom.style.cursor = 'grabbing';
                e.preventDefault();

                const camDir = new THREE.Vector3();
                sceneSetup.camera.getWorldDirection(camDir);
                dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), clickedBall.position);

                const mode = Config.physics.mode || '2d';

                simManager.balls.forEach(ball => {
                    if (ball === clickedBall) {
                        ball.isBeingDragged = true;
                        ball.velocity.set(0, 0, 0);
                        ball.angularVelocity = 0;
                        ball.angularAcceleration = 0;
                        ball.setSelectedState(true);

                        if (mode === '2d') {
                            ball.mouseTargetAngle = ball.angle;
                        }
                    } else {
                        ball.isBeingDragged = false;
                        ball.setSelectedState(false);
                    }
                });
            }
        }
    });

    // MouseMove
    dom.addEventListener('mousemove', (e) => {
        if (!isDragging || !selectedBall) return;

        raycaster.setFromCamera(mouse, sceneSetup.camera);
        if (!raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) return;

        const mode = Config.physics.mode || '2d';

        if (mode === '3d') {
            const targetPosition = intersectionPoint.clone();
            const direction = new THREE.Vector3().subVectors(targetPosition, selectedBall.pivot);
            const currentLength = direction.length();
            if (currentLength > 0.001) {
                direction.multiplyScalar(selectedBall.length / currentLength);
            } else {
                direction.set(0, -selectedBall.length, 0);
            }
            const constrainedPosition = selectedBall.pivot.clone().add(direction);
            selectedBall.position.copy(constrainedPosition);
            selectedBall.mouseTargetPosition = constrainedPosition.clone();

            const dx = selectedBall.position.x - selectedBall.pivot.x;
            const dy = selectedBall.pivot.y - selectedBall.position.y;
            updateAngleUI(Math.atan2(dx, dy));
        } else {
            const dx = intersectionPoint.x - selectedBall.pivot.x;
            const dy = selectedBall.pivot.y - intersectionPoint.y;
            let targetAngle = Math.atan2(dx, dy);
            const maxAngle = (90 * Math.PI) / 180;
            targetAngle = Math.max(-maxAngle, Math.min(maxAngle, targetAngle));

            selectedBall.angle = targetAngle;
            selectedBall.mouseTargetAngle = targetAngle;

            selectedBall.position.x = selectedBall.pivot.x + selectedBall.length * Math.sin(targetAngle);
            selectedBall.position.y = selectedBall.pivot.y - selectedBall.length * Math.cos(targetAngle);
            selectedBall.position.z = selectedBall.pivot.z;

            selectedBall.angularVelocity = 0;
            selectedBall.angularAcceleration = 0;

            if (simManager && simManager.applyDragChain) {
                simManager.applyDragChain(selectedBall);
            }

            updateAngleUI(targetAngle);
        }
    });

    // MouseUp
    const handleMouseUp = () => {
        if (isDragging && selectedBall) {
            const mode = Config.physics.mode || '2d';
            const g = Config.physics.gravity;
            const L = selectedBall.length;
            const returnSpeed = Config.mouseControl.returnSpeed || 1.0;

            if (mode === '3d') {
                // ✅ إفلات 3D (نفس السرعة)
                const displacement = selectedBall.position.clone().sub(selectedBall.pivot);
                const angle = Math.atan2(displacement.x, -displacement.y);
                const velocityMagnitude = Math.sqrt(2 * g * L * (1 - Math.cos(angle))) * returnSpeed;
                const direction = displacement.clone().normalize();
                direction.y = 0;
                if (direction.length() > 0.001) {
                    direction.normalize().multiplyScalar(velocityMagnitude);
                } else {
                    direction.set(velocityMagnitude, 0, 0);
                }
                selectedBall.velocity.copy(direction);
            } else {
                // ✅ إفلات 2D (مع تخفيف السرعة)
                const angle = selectedBall.angle;

                // ✅ عامل تخفيف السرعة (جربه بين 0.5 و 0.9)
                const speedFactor = 0.7;

                const velocityMagnitude = Math.sqrt(2 * g * L * (1 - Math.cos(angle))) * speedFactor * returnSpeed;
                const direction = angle > 0 ? -1 : 1;
                selectedBall.angularVelocity = direction * velocityMagnitude / L;

                selectedBall.position.x = selectedBall.pivot.x + L * Math.sin(angle);
                selectedBall.position.y = selectedBall.pivot.y - L * Math.cos(angle);
                selectedBall.position.z = selectedBall.pivot.z;

                const speed = L * selectedBall.angularVelocity;
                selectedBall.velocity.set(speed * Math.cos(angle), speed * Math.sin(angle), 0);
            }

            selectedBall.isBeingDragged = false;
            selectedBall.mouseTargetPosition = null;
            selectedBall.setSelectedState(false);
            selectedBall = null;
            isDragging = false;
            Config.state.isPaused = false;

            const btnPause = document.getElementById('btn-pause');
            if (btnPause) btnPause.innerText = "Pause / إيقاف";

            const indicator = document.getElementById('mouse-angle-indicator');
            if (indicator) indicator.remove();
            dom.style.cursor = 'default';
        }

        if (sceneSetup.controls) sceneSetup.controls.enabled = true;
    };

    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('mouseleave', handleMouseUp);
}
