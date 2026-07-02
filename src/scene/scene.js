// src/scene/scene.js

// 🆕 أضف هذين السطرين
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Config } from '../config/config.js';

export class SceneSetup {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(Config.environment.bgColor || 0x1a1310);

        this.initCamera();
        this.initRenderer();
        this.initControls();
        this.buildGiantRealisticRoom();

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 300);
        this.camera.position.set(0, 6, 22);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = Config.environment.shadowsEnabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.01;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 80;
    }

    buildGiantRealisticRoom() {
        const size = Config.environment.roomSize;

        // 1. أرضية خشبية
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = 256;
        floorCanvas.height = 256;
        const ctx = floorCanvas.getContext('2d');
        ctx.fillStyle = '#422a18';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#22140b';
        ctx.lineWidth = 3;
        for (let i = 0; i <= 256; i += 64) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
        }
        for (let j = 0; j <= 256; j += 128) {
            for (let i = 0; i < 256; i += 64) {
                const shift = (i / 64) % 2 === 0 ? 0 : 64;
                ctx.beginPath(); ctx.moveTo(i, j + shift); ctx.lineTo(i + 64, j + shift); ctx.stroke();
            }
        }
        const floorTexture = new THREE.CanvasTexture(floorCanvas);
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(30, 30);

        const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.35, metalness: 0.05 });
        const floorGeo = new THREE.PlaneGeometry(size, size);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -5;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // 2. ورق جدران
        const wallCanvas = document.createElement('canvas');
        wallCanvas.width = 256;
        wallCanvas.height = 256;
        const wCtx = wallCanvas.getContext('2d');
        wCtx.fillStyle = '#8a6d53';
        wCtx.fillRect(0, 0, 256, 256);
        wCtx.strokeStyle = '#a3876c';
        wCtx.lineWidth = 2;
        for(let x = 0; x <= 256; x += 128) {
            for(let y = 0; y <= 256; y += 128) {
                wCtx.beginPath(); wCtx.arc(x + 64, y + 64, 30, 0, Math.PI * 2); wCtx.stroke();
                wCtx.beginPath(); wCtx.moveTo(x + 64, y + 25); wCtx.lineTo(x + 103, y + 64); wCtx.lineTo(x + 64, y + 103); wCtx.lineTo(x + 25, y + 64); wCtx.closePath(); wCtx.stroke();
            }
        }
        const wallTexture = new THREE.CanvasTexture(wallCanvas);
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(24, 12);

        const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide });
        const wallGeo = new THREE.PlaneGeometry(size, size / 2);

        // الجدران الأربعة
        const backWall = new THREE.Mesh(wallGeo, wallMat);
        backWall.position.set(0, size / 4 - 5, -size / 2);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        const frontWall = new THREE.Mesh(wallGeo, wallMat);
        frontWall.position.set(0, size / 4 - 5, size / 2);
        frontWall.rotation.y = Math.PI;
        frontWall.receiveShadow = true;
        this.scene.add(frontWall);

        const rightWall = new THREE.Mesh(wallGeo, wallMat);
        rightWall.position.set(size / 2, size / 4 - 5, 0);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);

        const leftWall = new THREE.Mesh(wallGeo, wallMat);
        leftWall.position.set(-size / 2, size / 4 - 5, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        // السقف
        const ceilingGeo = new THREE.PlaneGeometry(size, size);
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xeaddcf, roughness: 0.75, side: THREE.DoubleSide });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = size / 2 - 5;
        this.scene.add(ceiling);

        // 3. شباك
        const windowGroup = new THREE.Group();
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, roughness: 0.1 });

        const outerFrameGeo = new THREE.BoxGeometry(0.5, 20, 15);
        const outerFrame = new THREE.Mesh(outerFrameGeo, frameMat);
        windowGroup.add(outerFrame);

        const glassGeo = new THREE.BoxGeometry(0.2, 19, 14);
        const glass = new THREE.Mesh(glassGeo, glassMat);
        windowGroup.add(glass);

        windowGroup.position.set(-size / 2 + 0.3, 10, 0);
        this.scene.add(windowGroup);

        // 4. طاولة خشبية
        const tableCanvas = document.createElement('canvas');
        tableCanvas.width = 256;
        tableCanvas.height = 256;
        const tCtx = tableCanvas.getContext('2d');
        tCtx.fillStyle = '#301c11';
        tCtx.fillRect(0, 0, 256, 256);
        tCtx.fillStyle = 'rgba(20, 10, 5, 0.15)';
        for (let i = 0; i < 40; i++) {
            tCtx.fillRect(0, Math.random() * 256, 256, Math.random() * 4);
        }
        const tableTexture = new THREE.CanvasTexture(tableCanvas);

        const tableGeo = new THREE.BoxGeometry(12, 0.6, 12);
        const tableMat = new THREE.MeshStandardMaterial({ map: tableTexture, roughness: 0.25, metalness: 0.05 });
        this.table = new THREE.Mesh(tableGeo, tableMat);
        this.table.position.y = -2;
        this.table.receiveShadow = true;
        this.table.castShadow = true;
        this.scene.add(this.table);

        const legGeo = new THREE.CylinderGeometry(0.25, 0.25, 3, 16);
        const legPositions = [[-5.5, -3.5, 5.5], [5.5, -3.5, 5.5], [-5.5, -3.5, -5.5], [5.5, -3.5, -5.5]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, tableMat);
            leg.position.set(...pos);
            leg.castShadow = true;
            leg.receiveShadow = true;
            this.scene.add(leg);
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
