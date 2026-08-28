import { DB } from './db.js';
import { escapeHtml } from './utils.js';
import { openModal, closeModal, openInfoMenu } from './modals.js';
import { triggerRender } from './events.js';

/** Strip HTML tags from all string fields in imported data to prevent stored XSS. */
function sanitizeString(val) {
    if (typeof val !== 'string') return val;
    return val.replace(/<\/?[a-zA-Z][^>]*>/g, '');
}

function sanitizeImportedData(data) {
    if (data.goals) data.goals = data.goals.map(g => ({
        ...g,
        problem: sanitizeString(g.problem),
        desire: sanitizeString(g.desire)
    }));
    if (data.seeds) data.seeds = data.seeds.map(s => ({
        ...s,
        person: sanitizeString(s.person),
        action: sanitizeString(s.action),
        goalText: sanitizeString(s.goalText)
    }));
    return data;
}

const CHANGELOG = [
    { version: '2.5.0', date: '2026-08-29', text: 'Интерактивные действия в модалке — отмечай «Сделано» и «Вернуть в план» прямо из списка семян цели.' },
    { version: '2.4.1', date: '2026-08-29', text: 'Исправление: при достижении цели недоделанные семена больше не остаются в Плане.' },
    { version: '2.4.0', date: '2026-08-29', text: 'Прогресс-бар цели, даты создания и выполнения, PNG-иконки для PWA.' },
    { version: '2.3.0', date: '2026-08-29', text: 'Мотивирующий заголовок, каскадные анимации карточек, развёрнутые пустые состояния, удаление с подтверждением.' },
    { version: '2.2.2', date: '2026-08', text: 'XSS-фикс: экранирование атрибутов, санитизация при импорте данных.' },
    { version: '2.2.0', date: '2026-08', text: '«Посев» переименован в «План», «Кофе-медитация» в «Медитация».' },
    { version: '2.0.0', date: '2026', text: 'Полный рефакторинг: 834 строки → 11 ES-модулей. Система обновлений PWA.' },
    { version: '1.0.0', date: '2025', text: 'Первый посев: цели, семена, копилка добрых дел и медитация.' }
];

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
        <h3 style="font-family: 'Cormorant Garamond', serif; border-bottom: 2px solid var(--accent-color); padding-bottom: 10px; margin-top: 30px;">📜 О приложении</h3>
        <div class="settings-group">
            <button class="btn-action secondary" onclick="window._app.openAbout()">📋 История версий</button>
            <button class="btn-action secondary" onclick="window._app.openInfoMenu()">ℹ️ О приложении</button>
        </div>
        <button class="btn-action danger" style="margin-top: 20px;" onclick="window._app.confirmWipeAll()">🗑 Очистить весь сад</button>`;
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
                    sanitizeImportedData(data);
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

export function confirmWipeAll() {
    document.getElementById('modal-title').innerText = '⚠️ Очистить весь сад?';
    document.getElementById('modal-body').innerHTML = `
        <div class="warning-box" style="margin-bottom: 15px;">
            <b>Все цели и семена будут удалены безвозвратно.</b><br><br>
            Сначала сделай <b>экспорт данных</b>, если хочешь сохранить копию.
        </div>
        <div style="display: flex; gap: 10px;">
            <button class="btn btn-primary" style="flex: 1;" onclick="window._app.closeModal()">Отмена</button>
            <button class="btn btn-danger" style="flex: 1; background: var(--danger-color); color: white; border-color: var(--danger-color);" onclick="window._app.wipeAll()">Очистить</button>
        </div>
    `;
    openModal();
}

export function wipeAll() {
    DB.saveGoals([]);
    DB.saveSeeds([]);
    closeModal();
    triggerRender();
}

export function openAbout() {
    const rows = CHANGELOG.map(c => `
        <div style="background: rgba(255,255,255,0.6); border-left: 3px solid var(--accent-color); padding: 12px; margin-bottom: 10px; border-radius: 4px; font-size: 13px; line-height: 1.5;">
            <b style="font-family: 'Cormorant Garamond', serif; font-size: 15px; color: var(--primary-color);">v${escapeHtml(c.version)}</b>
            <span style="color: var(--text-light); font-style: italic;"> · ${escapeHtml(c.date)}</span><br>
            ${escapeHtml(c.text)}
        </div>
    `).join('');
    document.getElementById('modal-title').innerText = 'Сад Кармы';
    document.getElementById('modal-body').innerHTML = `
        <div class="version-box">
            <div class="version-label">приложение для практики кармических семян</div>
            <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">по книгам Геше Майкла Роуча</div>
        </div>
        <div style="font-size: 12px; font-weight: bold; color: var(--accent-dark); letter-spacing: 0.5px; text-transform: uppercase; margin: 18px 0 10px;">История версий</div>
        ${rows}
        <div style="font-size: 12px; color: var(--text-light); font-style: italic; text-align: center; margin-top: 16px;">Сделано с радостью. Поливай свои семена.</div>
    `;
    openModal();
}
