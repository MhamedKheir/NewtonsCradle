// src/scene/pendulumVisuals.js

import * as THREE from 'three';
import { Config } from '../config/config.js';


export function buildBallVisuals(ball) {
    const scene = ball.scene;
    const radius = ball.radius;
    const pivot = ball.pivot;
    const position = ball.position;


    const ballGeo = new THREE.SphereGeometry(radius, 64, 64);
    ball.material = new THREE.MeshStandardMaterial({
        color: 0xb58a44,
        metalness: 0.8,
        roughness: 0.0003,
        envMapIntensity: 3.2
    });

    ball.mesh = new THREE.Mesh(ballGeo, ball.material);
    ball.mesh.castShadow = true;
    ball.mesh.receiveShadow = true;
    ball.mesh.userData = { ballId: ball.id };
    scene.add(ball.mesh);


    const ringGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 24);
    const ringMat = new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        metalness: 0.96,
        roughness: 0.08
    });
    ball.topRing = new THREE.Mesh(ringGeo, ringMat);
    ball.topRing.castShadow = true;
    ball.topRing.receiveShadow = true;
    scene.add(ball.topRing);


    const lineMat = new THREE.LineBasicMaterial({ color: 0xb8b8b8 });

    const stringGeo1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pivot.x, pivot.y, 0.9),
        position
    ]);
    ball.stringLine1 = new THREE.Line(stringGeo1, lineMat);
    scene.add(ball.stringLine1);

    const stringGeo2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pivot.x, pivot.y, -0.9),
        position
    ]);
    ball.stringLine2 = new THREE.Line(stringGeo2, lineMat);
    scene.add(ball.stringLine2);
}

export function rebuildBallMesh(ball, newRadius) {
    if (!ball || !ball.mesh) return;

    const scene = ball.scene;
    const oldMaterial = ball.material;
    const oldPosition = ball.position.clone();
    const oldUserData = ball.mesh.userData;
    const oldCastShadow = ball.mesh.castShadow;
    const oldReceiveShadow = ball.mesh.receiveShadow;


    if (ball.mesh) {
        ball.mesh.geometry.dispose();
        if (ball.mesh.parent) {
            ball.mesh.parent.remove(ball.mesh);
        }
    }


    const ballGeo = new THREE.SphereGeometry(newRadius, 64, 64);
    const newMesh = new THREE.Mesh(ballGeo, oldMaterial);
    newMesh.castShadow = oldCastShadow;
    newMesh.receiveShadow = oldReceiveShadow;
    newMesh.userData = oldUserData;
    newMesh.position.copy(oldPosition);

    ball.mesh = newMesh;
    scene.add(newMesh);


    updateBallVisuals(ball);
}


export function buildInteractionHelpers(ball) {
    const scene = ball.scene;
    const pivot = ball.pivot;
    const length = ball.length;

    const pathPoints = [];
    for (let a = -Math.PI / 2; a <= Math.PI / 2; a += 0.05) {
        pathPoints.push(new THREE.Vector3(
            pivot.x + Math.sin(a) * length,
            pivot.y - Math.cos(a) * length,
            pivot.z
        ));
    }
    const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMat = new THREE.LineDashedMaterial({
        color: 0x00d4ff,
        dashSize: 0.3,
        gapSize: 0.1
    });
    ball.predictedPath = new THREE.Line(pathGeo, pathMat);
    ball.predictedPath.computeLineDistances();
    ball.predictedPath.visible = false;
    scene.add(ball.predictedPath);
}


export function updateBallVisuals(ball) {

    ball.mesh.position.copy(ball.position);
    ball.topRing.position.copy(ball.position);
    ball.topRing.position.y += ball.radius;


    const pos1 = ball.stringLine1.geometry.attributes.position.array;
    pos1[0] = ball.pivot.x;
    pos1[1] = ball.pivot.y;
    pos1[2] = 1.5;
    pos1[3] = ball.position.x;
    pos1[4] = ball.position.y + ball.radius;
    pos1[5] = ball.position.z;
    ball.stringLine1.geometry.attributes.position.needsUpdate = true;


    const pos2 = ball.stringLine2.geometry.attributes.position.array;
    pos2[0] = ball.pivot.x;
    pos2[1] = ball.pivot.y;
    pos2[2] = -1.5;
    pos2[3] = ball.position.x;
    pos2[4] = ball.position.y + ball.radius;
    pos2[5] = ball.position.z;
    ball.stringLine2.geometry.attributes.position.needsUpdate = true;
}


export function setHoverState(ball, isHovered) {
    if (ball.isBeingDragged) return;
    if (isHovered) {
        ball.material.roughness = 0.1;
        ball.material.emissive.setHex(0x222222);
    } else {
        ball.material.roughness = 0.02;
        ball.material.emissive.setHex(0x000000);
    }
}

export function setSelectedState(ball, isSelected) {
    if (isSelected) {
        ball.material.emissive.setHex(0x0055aa);
        if (Config.mouseControl.showPath) ball.predictedPath.visible = true;
    } else {
        ball.material.emissive.setHex(0x000000);
        ball.predictedPath.visible = false;
    }
}


export function removeBallVisuals(ball) {
    const scene = ball.scene;
    if (ball.mesh) {
        scene.remove(ball.mesh);
        ball.mesh.geometry.dispose();
    }
    if (ball.topRing) {
        scene.remove(ball.topRing);
        ball.topRing.geometry.dispose();
    }
    if (ball.stringLine1) {
        scene.remove(ball.stringLine1);
        ball.stringLine1.geometry.dispose();
    }
    if (ball.stringLine2) {
        scene.remove(ball.stringLine2);
        ball.stringLine2.geometry.dispose();
    }
    if (ball.predictedPath) {
        scene.remove(ball.predictedPath);
        ball.predictedPath.geometry.dispose();
    }
}
