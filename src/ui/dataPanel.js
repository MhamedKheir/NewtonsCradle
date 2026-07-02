// src/ui/dataPanel.js

// ✅ هذا الملف لا يحتاج THREE، فقط Config
import { Config } from '../config/config.js';

export class DataPanel {
    constructor(simManager) {
        this.simManager = simManager;
        this.panel = document.getElementById('data-panel');
        this.toggleBtn = document.getElementById('toggle-data');
        this.listContainer = document.getElementById('balls-data-list');
        this.btnCSV = document.getElementById('btn-csv');

        this.csvRecords = [];

        this.toggleBtn.addEventListener('click', () => this.panel.classList.toggle('collapsed'));
        this.btnCSV.addEventListener('click', () => this.exportToCSV());

        this.buildStructure();
    }

    buildStructure() {
        this.listContainer.innerHTML = '';
        this.simManager.balls.forEach(ball => {
            const div = document.createElement('div');
            div.className = 'ball-data-item';
            div.id = `data-item-${ball.id}`;
            div.innerHTML = `
                <h4>Sphere ${ball.id + 1}</h4>
                <div class="bar-chart-bg"><div id="bar-ke-${ball.id}" class="bar-fill ke-fill"></div></div>
                <div class="bar-chart-bg"><div id="bar-pe-${ball.id}" class="bar-fill pe-fill"></div></div>
                <p>Velocity X: <span id="val-vx-${ball.id}">0.0</span> m/s</p>
                <p>Angle: <span id="val-ang-${ball.id}">0.0</span>°</p>
            `;
            this.listContainer.appendChild(div);
        });
    }

    update() {
        // تحديث القيم العامة
        const totalEnergyEl = document.getElementById('val-total-energy');
        const totalMomentumEl = document.getElementById('val-total-momentum');
        const collisionsEl = document.getElementById('val-collisions');

        if (totalEnergyEl) totalEnergyEl.innerText = Config.state.totalEnergy.toFixed(2);
        if (totalMomentumEl) totalMomentumEl.innerText = Config.state.totalMomentum.toFixed(2);
        if (collisionsEl) collisionsEl.innerText = Config.state.collisionCount;

        // تحديث بيانات كل كرة
        this.simManager.balls.forEach(ball => {
            const metrics = ball.getMetrics();

            const vxEl = document.getElementById(`val-vx-${ball.id}`);
            const angEl = document.getElementById(`val-ang-${ball.id}`);
            const keBar = document.getElementById(`bar-ke-${ball.id}`);
            const peBar = document.getElementById(`bar-pe-${ball.id}`);

            if (vxEl) vxEl.innerText = metrics.velocity.x.toFixed(2);
            if (angEl) angEl.innerText = metrics.angle.toFixed(1);

            const maxEnergyWindow = 10;
            const kePercent = Math.min((metrics.ke / maxEnergyWindow) * 100, 100);
            const pePercent = Math.min((metrics.pe / maxEnergyWindow) * 100, 100);

            if (keBar) keBar.style.width = `${kePercent}%`;
            if (peBar) peBar.style.width = `${pePercent}%`;
        });

        // تسجيل البيانات للتصدير
        if (!Config.state.isPaused && this.csvRecords.length < 300) {
            this.csvRecords.push({
                timestamp: performance.now().toFixed(0),
                energy: Config.state.totalEnergy.toFixed(4),
                momentum: Config.state.totalMomentum.toFixed(4)
            });
        }
    }

    exportToCSV() {
        let csvContent = "data:text/csv;charset=utf-8,Timestamp(ms),TotalEnergy(J),TotalMomentum(Ns)\n";
        this.csvRecords.forEach(r => {
            csvContent += `${r.timestamp},${r.energy},${r.momentum}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "newtons_cradle_telemetry.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
