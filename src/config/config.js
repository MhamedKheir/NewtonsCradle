// src/config/config.js
export const Config = {
    physics: {
        gravity: 9.81,
        angularDamping: 0.005,
        restitution: 0.98,
        stringLength: 4.4,
        timeScale: 2.5,
        subSteps: 40,
        mode: '2d'  // القيمة الافتراضية 2D
    },
    balls: {
        count: 6,
        radius: 0.48,
        spacing: 0.0005,
         defaultMass: 1.0,
        defaultColor: '#ffffff',
        materials: {
            metalness: 1.0,
            roughness: 0.01
        }
    },
    mouseControl: {
        sensitivity: 0.75,
        showPath: true,
        showAngle: true,
        returnSpeed: 0.5
    },
    environment: {
        ambientColor: '#d6e4ff',
        ambientIntensity: 0.30,
        dirLightColor: '#fffaed',
        dirLightIntensity: 0.65,
        bgColor: '#1a1310',
        shadowsEnabled: true,
        roomSize: 150
    },
    state: {
        isPaused: true,
        collisionCount: 0,
        totalEnergy: 0,
        totalMomentum: 0,
    }
};
