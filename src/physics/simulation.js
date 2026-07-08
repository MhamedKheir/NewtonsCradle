// src/physics/simulation.js

import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { Config } from '../config/config.js';
import { PendulumBall } from './pendulum.js';
import {
    buildBallVisuals,
    buildInteractionHelpers,
    updateBallVisuals,
    removeBallVisuals,
    rebuildBallMesh
} from '../scene/pendulumVisuals.js';

export class SimulationManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.balls = [];

        this.initMaterials();
        this.buildCradleStructure();
        this.generateBalls();
    }

    initMaterials() {
        this.woodTexture = this.createWoodTexture();
        this.woodBaseMaterial = new THREE.MeshStandardMaterial({
            map: this.woodTexture,
            color: 0x7a4b25,
            roughness: 0.8,
            metalness: 0.02
        });
        this.baseMaterial = this.woodBaseMaterial;
        this.baseSupportMaterial = new THREE.MeshStandardMaterial({
            color: 0x161312,
            roughness: 0.92,
            metalness: 0.12
        });

        this.baseMode = Config.environment.baseMode || 'mirror';
        this.customMasses = {};
    }

    createWoodTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 512, 0);
        gradient.addColorStop(0, '#6d3f1d');
        gradient.addColorStop(0.5, '#8b5730');
        gradient.addColorStop(1, '#5a3218');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 256);

        for (let y = 0; y < 256; y += 32) {
            ctx.fillStyle = y % 64 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
            ctx.fillRect(0, y, 512, 16);
        }

        ctx.strokeStyle = 'rgba(40, 18, 8, 0.25)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 40; i++) {
            const y = Math.random() * 256;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(128, y + Math.random() * 8 - 4, 384, y + Math.random() * 8 - 4, 512, y);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        texture.anisotropy = 8;
        return texture;
    }


    buildCradleStructure() {
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.98,
            roughness: 0.08,
            envMapIntensity: 2.5
        });

        const tableTopY = 3.4;


        const barGeo = new THREE.CylinderGeometry(0.14, 0.14, 11, 24);
        const frontBar = new THREE.Mesh(barGeo, frameMat);
        frontBar.rotation.z = Math.PI / 2;
        frontBar.position.set(0, tableTopY + 5.5, 1.5);
        frontBar.castShadow = true;
        frontBar.receiveShadow = true;
        this.scene.add(frontBar);

        const backBar = new THREE.Mesh(barGeo, frameMat);
        backBar.rotation.z = Math.PI / 2;
        backBar.position.set(0, tableTopY + 5.5, -1.5);
        backBar.castShadow = true;
        backBar.receiveShadow = true;
        this.scene.add(backBar);

        // الأعمدة الرأسية
        const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 5.5, 24);
        const pillarY = tableTopY + 2.75;
        const pillarPositions = [
            [-5.3, pillarY, 1.5],
            [5.3, pillarY, 1.5],
            [-5.3, pillarY, -1.5],
            [5.3, pillarY, -1.5]
        ];
        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeo, frameMat);
            pillar.position.set(...pos);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);
        });

        // القاعدة والمرآة
        const baseWidth = 11.9;
        const baseDepth = 4.2;
        const mirrorThickness = 0.045;
        const baseY = tableTopY + 0.0005;

        const supportGeo = new THREE.BoxGeometry(baseWidth, mirrorThickness, baseDepth);
        this.cradleBaseSupport = new THREE.Mesh(supportGeo, this.baseSupportMaterial);
        this.cradleBaseSupport.position.set(0, tableTopY - mirrorThickness * 0.5, 0);
        this.cradleBaseSupport.castShadow = false;
        this.cradleBaseSupport.receiveShadow = true;
        this.scene.add(this.cradleBaseSupport);

        const baseGeo = new THREE.PlaneGeometry(baseWidth, baseDepth);

        // قاعدة الخشب
        this.cradleBaseWood = new THREE.Mesh(baseGeo, this.woodBaseMaterial);
        this.cradleBaseWood.rotation.x = -Math.PI / 2;
        this.cradleBaseWood.position.set(0, baseY, 0);
        this.cradleBaseWood.castShadow = false;
        this.cradleBaseWood.receiveShadow = true;
        this.scene.add(this.cradleBaseWood);

        // المرآة العاكسة
        const reflectorGeo = baseGeo;
        const mirrorSize = new THREE.Vector2();
        this.renderer.getDrawingBufferSize(mirrorSize);
        const mirrorTextureWidth = Math.min(4096, Math.max(1024, Math.floor(mirrorSize.x)));
        const mirrorTextureHeight = Math.min(2048, Math.max(512, Math.floor(mirrorSize.y)));
        this.cradleBaseMirror = new Reflector(reflectorGeo, {
            color: 0xffffff,
            textureWidth: mirrorTextureWidth,
            textureHeight: mirrorTextureHeight,
            clipBias: 0.0005,
            recursion: 1
        });
        this.cradleBaseMirror.rotation.x = -Math.PI / 2;
        this.cradleBaseMirror.position.set(0, baseY, 0);
        this.cradleBaseMirror.userData.isMirror = true;
        this.scene.add(this.cradleBaseMirror);

        this.setBaseMode(this.baseMode, true);
    }

    updateMirrorReflection() {
        if (this.baseMode !== 'mirror' || !this.cradleBaseMirror) return;
        this.cradleBaseMirror.visible = true;
    }

    setBaseMode(mode, skipConfigUpdate = false) {
        const nextMode = mode === 'wood' ? 'wood' : 'mirror';
        this.baseMode = nextMode;

        if (!skipConfigUpdate) {
            Config.environment.baseMode = nextMode;
        }

        if (this.cradleBaseMirror) {
            this.cradleBaseMirror.visible = nextMode === 'mirror';
        }
        if (this.cradleBaseWood) {
            this.cradleBaseWood.visible = nextMode === 'wood';
        }
        this.cradleBase = nextMode === 'mirror' ? this.cradleBaseMirror : this.cradleBaseWood;
    }


    generateBalls() {
    this.balls.forEach(b => {
        removeBallVisuals(b);
    });
    this.balls = [];

    const count = Config.balls.count || 6;


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


    const positions = [];
    const spacing = 0.01;
    let totalWidth = 0;
    for (let i = 0; i < count; i++) {
        totalWidth += radii[i] * 2;
        if (i < count - 1) totalWidth += spacing;
    }
    let startX = -totalWidth / 2 + radii[0];

    for (let i = 0; i < count; i++) {
        if (i === 0) {
            positions.push(startX);
        } else {
            const distance = radii[i - 1] + radii[i] + spacing;
            positions.push(positions[i - 1] + distance);
        }
    }


    for (let i = 0; i < count; i++) {
        const pivotX = positions[i];
        const pivot = new THREE.Vector3(pivotX, 9, 0);
        const ball = new PendulumBall(i, pivot, this.scene);


        buildBallVisuals(ball);
        buildInteractionHelpers(ball);


        if (this.customMasses && this.customMasses[i] !== undefined) {
            const newRadius = ball.setMass(this.customMasses[i]);
            rebuildBallMesh(ball, newRadius);
        }

        this.balls.push(ball);
    }
}

    updateBallsPositions() {
    const count = this.balls.length;
    if (count === 0) return;


    const radii = this.balls.map(ball => ball.radius);


    const positions = [];
    const spacing = 0.01;

    let totalWidth = 0;
    for (let i = 0; i < count; i++) {
        totalWidth += radii[i] * 2;
        if (i < count - 1) totalWidth += spacing;
    }

    let startX = -totalWidth / 2 + radii[0];

    for (let i = 0; i < count; i++) {
        if (i === 0) {
            positions.push(startX);
        } else {
            const distance = radii[i - 1] + radii[i] + spacing;
            positions.push(positions[i - 1] + distance);
        }
    }


    for (let i = 0; i < count; i++) {
        const ball = this.balls[i];
        const pivotX = positions[i];
        ball.pivot.x = pivotX;


        ball.position.x = ball.pivot.x + ball.length * Math.sin(ball.angle);
        ball.position.y = ball.pivot.y - ball.length * Math.cos(ball.angle);
        ball.position.z = ball.pivot.z;


        updateBallVisuals(ball);
    }
}

    updateBallSize(ball, newRadius) {
    if (!ball) return;


    ball.radius = newRadius;
    rebuildBallMesh(ball, newRadius);
    this.updateBallsPositions();
    updateBallVisuals(ball);
}


    updateBallVisualsAll() {
        this.balls.forEach(ball => updateBallVisuals(ball));
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

    setCustomMass(index, mass) {
        if (!this.customMasses) this.customMasses = {};
        this.customMasses[index] = mass;
    }

    resetAllMasses() {
        this.customMasses = {};
        this.generateBalls();
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

    rebuildBallVisuals(ball, newRadius) {
        removeBallVisuals(ball);
        buildBallVisuals(ball);
        buildInteractionHelpers(ball);
        updateBallVisuals(ball);
    }
}
