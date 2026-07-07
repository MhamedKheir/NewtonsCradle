// src/config/config.js
export const Config = {
    physics: {
        gravity: 9.81,
        angularDamping: 0.005,
        restitution: 0.98,
        stringLength: 4.4,
        timeScale: 3.7,
        subSteps: 80,
        mode: '2d'  // القيمة الافتراضية 2D
    },
    balls: {
        count: 6,
        radius: 0.48,
        spacing: 0.0005,
        defaultMass: 1.0,
        defaultColor: '0xb58a44',
        materials: {
            metalness: 0.9,
            roughness: 0.12
        }
    },
    mouseControl: {
        sensitivity: 0.75,
        showPath: true,
        showAngle: true,
        returnSpeed: 0.7
    },
    environment: {
        ambientColor: '#d6e4ff',
        ambientIntensity: 0.55,
        dirLightColor: '#fffaed',
        dirLightIntensity: 0.80,
        bgColor: '#e14f10',
        shadowsEnabled: true,
        roomSize: 150,
        baseMode: 'mirror'
    },
    state: {
        isPaused: true,
        collisionCount: 0,
        totalEnergy: 0,
        totalMomentum: 0,
    }
};
