// src/scene/scene.js

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

        // Shadows
        this.renderer.shadowMap.enabled = Config.environment.shadowsEnabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Color/Tone
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.95;

        // Physically correct lighting
        this.renderer.physicallyCorrectLights = true;

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

        // 1. أرضية خشبية طبيعية جميلة
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = 256;
        floorCanvas.height = 256;
        const ctx = floorCanvas.getContext('2d');
        ctx.fillStyle = '#c9a575';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#a67c52';
        ctx.lineWidth = 2;
        for (let i = 0; i <= 256; i += 64) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 256);
            ctx.stroke();
        }
        for (let j = 0; j <= 256; j += 128) {
            for (let i = 0; i < 256; i += 64) {
                const shift = (i / 64) % 2 === 0 ? 0 : 64;
                ctx.fillStyle = Math.random() > 0.5 ? '#b88a5f' : '#d4ad7d';
                ctx.fillRect(i, j + shift, 64, 64);
            }
        }
        const floorTexture = new THREE.CanvasTexture(floorCanvas);
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(12, 12);

        const floorMat = new THREE.MeshStandardMaterial({
            map: floorTexture,
            roughness: 0.55,
            metalness: 0.01
        });

        const floorGeo = new THREE.PlaneGeometry(size, size);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -5;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // 2. جدران بألوان دافئة مريحة مع ورق جدران مزخرفة
        const wallCanvas = document.createElement('canvas');
        wallCanvas.width = 512;
        wallCanvas.height = 512;
        const wCtx = wallCanvas.getContext('2d');
        wCtx.fillStyle = '#e8dcd0';
        wCtx.fillRect(0, 0, 512, 512);
        wCtx.strokeStyle = '#d9c9b8';
        wCtx.lineWidth = 1.5;
        for (let x = 0; x <= 512; x += 64) {
            for (let y = 0; y <= 512; y += 64) {
                wCtx.beginPath();
                wCtx.arc(x + 32, y + 32, 18, 0, Math.PI * 2);
                wCtx.stroke();
                wCtx.beginPath();
                wCtx.moveTo(x + 32, y + 16);
                wCtx.lineTo(x + 48, y + 32);
                wCtx.lineTo(x + 32, y + 48);
                wCtx.lineTo(x + 16, y + 32);
                wCtx.closePath();
                wCtx.stroke();
                wCtx.fillStyle = Math.random() > 0.5 ? 'rgba(200,180,160,0.08)' : 'rgba(220,200,180,0.05)';
                wCtx.fillRect(x, y, 64, 64);
                wCtx.fillStyle = '#d9c9b8';
            }
        }
        const wallTexture = new THREE.CanvasTexture(wallCanvas);
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(8, 4);

        const wallMat = new THREE.MeshStandardMaterial({
            map: wallTexture,
            roughness: 0.85,
            metalness: 0.0,
            side: THREE.DoubleSide
        });

        const wallGeo = new THREE.PlaneGeometry(size, size / 2);

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
        const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0xf0e8e0,
            roughness: 0.85,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = size / 2 - 5;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);

        // 3. طاولة خشبية كبيرة مرتفعة
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

        // ✅ طاولة أكبر وأكثر سمكاً
        const tableGeo = new THREE.BoxGeometry(24, 0.8, 24);
        const tableMat = new THREE.MeshStandardMaterial({
            map: tableTexture,
            roughness: 0.35,
            metalness: 0.03
        });

        this.table = new THREE.Mesh(tableGeo, tableMat);
        this.table.position.y = 3;
        this.table.receiveShadow = true;
        this.table.castShadow = true;
        this.scene.add(this.table);

        // ✅ أرجل الطاولة أطول - موضوعة بشكل صحيح على الأرضية
        const legGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
        const legPositions = [
            [-11, -1, 11],
            [11, -1, 11],
            [-11, -1, -11],
            [11, -1, -11]
        ];

        legPositions.forEach((pos) => {
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

