import { DB } from './db.js';
import { openInfoMenu, closeModal } from './modals.js';
import { triggerRender } from './events.js';

export function renderSettings() {
    const container = document.getElementById('tab-settings');
    const config = DB.getConfig();
    container.innerHTML = `
        <h3 style="font-family: 'Cormorant Garamond', serif; border-bottom: 2px solid var(--accent-color); padding-bottom: 10px;">⚙️ Настройки</h3>
        <div class="settings-group">
            <div style="display: flex; justify-content: space-between; align-items: center;"><label style="margin: 0;">Уведомления</label><label class="toggle-switch"><input type="checkbox" id="notify-toggle" ${config.notify ? 'checked' : ''} onchange="window._app.toggleNotification(this.checked)"><span class="slider"></span></label></div>
            <div><label>Время напоминания</label><input type="time" id="reminder-time" value="${config.time}" onchange="window._app.updateTime(this.value)" style="margin-bottom: 0;"></div>
            <p class="dev-warning">⚠️ Уведомления в разработке.</p>
        </div>
        <h3 style="font-family: 'Cormorant Garamond', serif; border-bottom: 2px solid var(--accent-color); padding-bottom: 10px; margin-top: 30px;">💾 Резервная копия</h3>
        <div class="settings-group" style="text-align: center;">
            <button class="btn-action" onclick="window._app.exportData()">📤 Экспорт данных</button>
            <button class="btn-action import" onclick="document.getElementById('import-file-input').click()">📥 Импорт данных</button>
        </div>
        <button class="btn-action secondary" style="margin-top: 30px;" onclick="window._app.openInfoMenu()">📜 О приложении</button>`;
}

export function exportData() {
    const data = { goals: DB.getGoals(), seeds: DB.getSeeds(), config: DB.getConfig(), exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'saddharma_backup_' + new Date().toLocaleDateString('ru-RU').replace(/\./g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.goals && data.seeds) {
                if (confirm('Загрузить данные?')) {
                    DB.saveGoals(data.goals);
                    DB.saveSeeds(data.seeds);
                    if (data.config) DB.saveConfig(data.config);
                    alert('Готово!');
                    triggerRender();
                }
            } else alert('Неверный формат');
        } catch (err) { alert('Ошибка'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

export function toggleNotification(enabled) {
    let config = DB.getConfig();
    config.notify = enabled;
    DB.saveConfig(config);
    alert('В разработке.');
}

export function updateTime(time) {
    let config = DB.getConfig();
    config.time = time;
    DB.saveConfig(config);
}
