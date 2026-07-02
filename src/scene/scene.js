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

        // 1. أرضية خشبية (تكرار أقل = واقعية أعلى)
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = 256;
        floorCanvas.height = 256;
        const ctx = floorCanvas.getContext('2d');
        ctx.fillStyle = '#422a18';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#22140b';
        ctx.lineWidth = 3;
        for (let i = 0; i <= 256; i += 64) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 256);
            ctx.stroke();
        }
        for (let j = 0; j <= 256; j += 128) {
            for (let i = 0; i < 256; i += 64) {
                const shift = (i / 64) % 2 === 0 ? 0 : 64;
                ctx.beginPath();
                ctx.moveTo(i, j + shift);
                ctx.lineTo(i + 64, j + shift);
                ctx.stroke();
            }
        }
        const floorTexture = new THREE.CanvasTexture(floorCanvas);
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(12, 12);

        const floorMat = new THREE.MeshStandardMaterial({
            map: floorTexture,
            roughness: 0.45,
            metalness: 0.03
        });

        const floorGeo = new THREE.PlaneGeometry(size, size);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -5;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // 2. جدران (تكرار أقل + ألوان أهدأ)
        const wallCanvas = document.createElement('canvas');
        wallCanvas.width = 256;
        wallCanvas.height = 256;
        const wCtx = wallCanvas.getContext('2d');
        wCtx.fillStyle = '#8a6d53';
        wCtx.fillRect(0, 0, 256, 256);
        wCtx.strokeStyle = '#a3876c';
        wCtx.lineWidth = 2;
        for (let x = 0; x <= 256; x += 128) {
            for (let y = 0; y <= 256; y += 128) {
                wCtx.beginPath();
                wCtx.arc(x + 64, y + 64, 30, 0, Math.PI * 2);
                wCtx.stroke();

                wCtx.beginPath();
                wCtx.moveTo(x + 64, y + 25);
                wCtx.lineTo(x + 103, y + 64);
                wCtx.lineTo(x + 64, y + 103);
                wCtx.lineTo(x + 25, y + 64);
                wCtx.closePath();
                wCtx.stroke();
            }
        }
        const wallTexture = new THREE.CanvasTexture(wallCanvas);
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(10, 5);

        const wallMat = new THREE.MeshStandardMaterial({
            map: wallTexture,
            roughness: 0.72,
            metalness: 0.02,
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
            color: 0xe8dece,
            roughness: 0.82,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = size / 2 - 5;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);

        // 3. شباك واقعي + سما زرقاء خارجية
        const windowGroup = new THREE.Group();

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xe9e2d6,
            roughness: 0.58,
            metalness: 0.02
        });

        const glassTrimMat = new THREE.MeshStandardMaterial({
            color: 0xd8cfbf,
            roughness: 0.64,
            metalness: 0.01
        });

        // إطار خارجي مسطح على الجدار
        const outerFrameGeo = new THREE.BoxGeometry(15.2, 19.8, 0.28);
        const outerFrame = new THREE.Mesh(outerFrameGeo, frameMat);
        outerFrame.castShadow = true;
        outerFrame.receiveShadow = true;
        windowGroup.add(outerFrame);

        // إطار داخلي وحواجز رفيعة على نفس مستوى الجدار
        const innerFrameGeo = new THREE.BoxGeometry(13.8, 18.0, 0.16);
        const innerFrame = new THREE.Mesh(innerFrameGeo, glassTrimMat);
        innerFrame.position.z = 0.03;
        innerFrame.castShadow = true;
        innerFrame.receiveShadow = true;
        windowGroup.add(innerFrame);

        const muntinGeoVertical = new THREE.BoxGeometry(0.14, 18.0, 0.12);
        const muntinGeoHorizontal = new THREE.BoxGeometry(13.0, 0.14, 0.12);

        const mullionV = new THREE.Mesh(muntinGeoVertical, glassTrimMat);
        mullionV.position.z = 0.11;
        mullionV.castShadow = true;
        mullionV.receiveShadow = true;
        windowGroup.add(mullionV);

        const mullionH = new THREE.Mesh(muntinGeoHorizontal, glassTrimMat);
        mullionH.position.z = 0.11;
        mullionH.castShadow = true;
        mullionH.receiveShadow = true;
        windowGroup.add(mullionH);

        // زجاج واقعي
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xeaf5ff,
            transmission: 0.92,
            transparent: true,
            opacity: 0.18,
            roughness: 0.02,
            metalness: 0.0,
            ior: 1.5,
            thickness: 0.22,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02
        });

        const glassGeo = new THREE.BoxGeometry(12.6, 17.4, 0.05);
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.z = 0.05;
        glass.castShadow = false;
        glass.receiveShadow = false;
        windowGroup.add(glass);

        const glassBackingGeo = new THREE.PlaneGeometry(12.8, 17.6);
        const glassBackingMat = new THREE.MeshBasicMaterial({
            color: 0x9dcbff,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide
        });
        const glassBacking = new THREE.Mesh(glassBackingGeo, glassBackingMat);
        glassBacking.position.z = -0.03;
        windowGroup.add(glassBacking);

        const frameCapGeo = new THREE.BoxGeometry(15.2, 0.18, 0.18);
        const frameCapTop = new THREE.Mesh(frameCapGeo, frameMat);
        frameCapTop.position.set(0, 9.82, 0.05);
        frameCapTop.castShadow = true;
        frameCapTop.receiveShadow = true;
        windowGroup.add(frameCapTop);

        const frameCapBottom = new THREE.Mesh(frameCapGeo, frameMat);
        frameCapBottom.position.set(0, -9.82, 0.05);
        frameCapBottom.castShadow = true;
        frameCapBottom.receiveShadow = true;
        windowGroup.add(frameCapBottom);

        // مكان الشباك على الجدار اليسار
        windowGroup.rotation.y = Math.PI / 2;
        windowGroup.position.set(-size / 2 + 0.01, 10, 0);
        this.scene.add(windowGroup);

        // سما خارجية زرقاء (لوح خلف الشباك)
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 1024;
        skyCanvas.height = 1024;
        const sctx = skyCanvas.getContext('2d');

        const grad = sctx.createLinearGradient(0, 0, 0, 1024);
        grad.addColorStop(0, '#4e8fdb');
        grad.addColorStop(0.58, '#80baf3');
        grad.addColorStop(1, '#d9edff');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 1024, 1024);

        // غيوم خفيفة
        for (let i = 0; i < 14; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 380;
            const r = 36 + Math.random() * 75;
            const alpha = 0.04 + Math.random() * 0.05;
            sctx.beginPath();
            sctx.fillStyle = `rgba(255,255,255,${alpha})`;
            sctx.ellipse(x, y, r * 1.4, r, 0, 0, Math.PI * 2);
            sctx.fill();
        }

        // وهج شمس خافت لزيادة الإحساس بالعمق الخارجي
        const sunGlow = sctx.createRadialGradient(760, 180, 10, 760, 180, 180);
        sunGlow.addColorStop(0, 'rgba(255,255,255,0.5)');
        sunGlow.addColorStop(0.25, 'rgba(255,245,220,0.2)');
        sunGlow.addColorStop(1, 'rgba(255,245,220,0)');
        sctx.fillStyle = sunGlow;
        sctx.beginPath();
        sctx.arc(760, 180, 180, 0, Math.PI * 2);
        sctx.fill();

        const skyTexture = new THREE.CanvasTexture(skyCanvas);
        skyTexture.colorSpace = THREE.SRGBColorSpace;

        const skyMat = new THREE.MeshBasicMaterial({
            map: skyTexture,
            side: THREE.DoubleSide
        });

        const skyPlane = new THREE.Mesh(new THREE.PlaneGeometry(46, 34), skyMat);
        skyPlane.position.set(-size / 2 - 6.2, 10, 0);
        skyPlane.rotation.y = Math.PI / 2;
        this.scene.add(skyPlane);

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
        const tableMat = new THREE.MeshStandardMaterial({
            map: tableTexture,
            roughness: 0.35,
            metalness: 0.03
        });

        this.table = new THREE.Mesh(tableGeo, tableMat);
        this.table.position.y = -2;
        this.table.receiveShadow = true;
        this.table.castShadow = true;
        this.scene.add(this.table);

        const legGeo = new THREE.CylinderGeometry(0.25, 0.25, 3, 16);
        const legPositions = [
            [-5.5, -3.5, 5.5],
            [5.5, -3.5, 5.5],
            [-5.5, -3.5, -5.5],
            [5.5, -3.5, -5.5]
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
