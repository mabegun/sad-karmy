import { DB } from './db.js';
import { escapeHtml, fmtDate } from './utils.js';
import { openModal, closeModal } from './modals.js';
import { triggerRender } from './events.js';
import { renderSettings } from './settings.js';
import { deleteGoalNow } from './goals.js';
import { deleteSeedNow } from './seeds.js';

let deleteTimers = {};
let undoSnapshots = {}; // { key: { goals, seeds } }
let toastTimer = null;

// ==================== ТОСТ (2.5) ====================

export function showToast(message, actionLabel, onAction) {
    const container = document.getElementById('toast-container');
    container.innerHTML = '';
    const toast = document.createElement('div');
    toast.className = 'toast';
    let html = `<span class="toast-message">${escapeHtml(message)}</span>`;
    if (actionLabel && onAction) {
        html += `<button class="toast-action">${escapeHtml(actionLabel)}</button>`;
    }
    toast.innerHTML = html;
    container.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    if (actionLabel && onAction) {
        toast.querySelector('.toast-action').addEventListener('click', () => {
            onAction();
            hideToast();
        });
    }
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 5000);
}

function hideToast() {
    const container = document.getElementById('toast-container');
    const toast = container.querySelector('.toast');
    if (!toast) return;
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => container.innerHTML = '', { once: true });
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
}

// ==================== УДАЛЕНИЕ С ОТМЕНОЙ (2.5) ====================

export function handleDeleteClick(type, id, btnElement) {
    const key = type + id;
    if (deleteTimers[key]) {
        clearTimeout(deleteTimers[key]);
        delete deleteTimers[key];
        // Save snapshot before deleting
        undoSnapshots[key] = { goals: JSON.parse(JSON.stringify(DB.getGoals())), seeds: JSON.parse(JSON.stringify(DB.getSeeds())) };
        if (type === 'goal') deleteGoalNow(id);
        else deleteSeedNow(id);
        showToast(
            type === 'goal' ? 'Цель удалена' : 'Семя удалено',
            'Отменить',
            () => {
                const snap = undoSnapshots[key];
                if (snap) {
                    DB.saveGoals(snap.goals);
                    DB.saveSeeds(snap.seeds);
                    delete undoSnapshots[key];
                    triggerRender();
                }
            }
        );
        // Clean up snapshot after toast expires
        setTimeout(() => delete undoSnapshots[key], 6000);
    } else {
        btnElement.classList.add('btn-delete-confirm');
        btnElement.innerText = "Точно?";
        deleteTimers[key] = setTimeout(() => {
            btnElement.classList.remove('btn-delete-confirm');
            btnElement.innerText = "Удалить";
            delete deleteTimers[key];
        }, 3000);
    }
}

// ==================== МОДАЛКА СЕМЯН (v2.5.0) ====================

export function showSeedsList(goalId, type) {
    const seeds = DB.getSeeds().filter(s => s.goalId === goalId);
    let list = [];
    let title = "";
    if (type === 'planned') {
        list = seeds.filter(s => !s.isActionDone && !s.isGoalAchieved);
        title = "\uD83C\uDF31 Запланированные";
    } else {
        list = seeds.filter(s => s.isActionDone && !s.isGoalAchieved);
        title = "\uD83D\uDE4F Сделанные";
    }
    const body = document.getElementById('modal-body');
    const header = document.getElementById('modal-title');
    header.innerText = title;
    if (list.length === 0) {
        body.innerHTML = '<p style="text-align:center; color:#8D6E63">Список пуст</p>';
    } else {
        body.innerHTML = list.map(s => {
            const dateStr = s.createdAt ? ` · посеяно ${fmtDate(s.createdAt)}` : '';
            const doneDateStr = s.doneAt ? ` · сделано ${fmtDate(s.doneAt)}` : '';
            const actionBtn = type === 'planned'
                ? `<button class="btn btn-success" style="flex:0 0 auto;" onclick="window._app.seedListAction('done', ${s.id}, ${goalId}, 'planned')">✓ Сделано</button>`
                : `<button class="btn btn-primary" style="flex:0 0 auto;" onclick="window._app.seedListAction('undo', ${s.id}, ${goalId}, 'done')">↩ В план</button>`;
            return `<div class="seed-list-item ${type === 'done' ? 'done-item' : ''}"><div><b>Для кого:</b> ${escapeHtml(s.person)}</div><div><b>Действие:</b> ${escapeHtml(s.action)}</div><div style="font-size:11px;color:var(--accent-dark);margin-top:4px;">${dateStr || doneDateStr}</div><div style="margin-top:8px;display:flex;gap:8px;">${actionBtn}</div></div>`;
        }).join('');
    }
    openModal();
}

export function seedListAction(action, seedId, goalId, listType) {
    if (action === 'done') {
        const seeds = DB.getSeeds().map(s => s.id === seedId ? { ...s, isActionDone: true, doneAt: Date.now() } : s);
        DB.saveSeeds(seeds);
    } else {
        const seeds = DB.getSeeds().map(s => s.id === seedId ? { ...s, isActionDone: false, doneAt: undefined } : s);
        DB.saveSeeds(seeds);
    }
    showSeedsList(goalId, listType);
    triggerRender();
}

// ==================== ИСТОРИЯ УРОЖАЯ (3.6) ====================

export function showHarvestTimeline(goalId) {
    const seeds = DB.getSeeds().filter(s => s.goalId === goalId);
    const goal = DB.getGoals().find(g => g.id === goalId);
    if (!goal) return;
    const sorted = [...seeds].sort((a, b) => (a.doneAt || a.createdAt || 0) - (b.doneAt || b.createdAt || 0));
    const total = sorted.length;
    const doneCount = sorted.filter(s => s.isActionDone).length;
    document.getElementById('modal-title').innerText = '\uD83C\uDF3E ' + escapeHtml(goal.desire);
    const body = document.getElementById('modal-body');
    if (sorted.length === 0) {
        body.innerHTML = '<p style="text-align:center; color:#8D6E63">Нет записей</p>';
    } else {
        body.innerHTML = `
            <div style="background:rgba(255,255,255,0.6);border-left:3px solid var(--success-color);padding:10px 12px;margin-bottom:15px;font-size:13px;border-radius:4px;color:var(--text-light);">
                Исправить: ${escapeHtml(goal.problem)}<br>
                <b>${doneCount}</b> из <b>${total}</b> семян сделано
            </div>
            <div class="timeline">${sorted.map((s, i) => {
                const isDone = s.isActionDone;
                const isHarv = s.isGoalAchieved;
                let dotClass = 'timeline-dot';
                let statusLabel = '';
                if (isHarv) { dotClass += ' harvested'; statusLabel = 'урожай'; }
                else if (isDone) { dotClass += ' done'; statusLabel = 'сделано'; }
                else { dotClass += ' planned'; statusLabel = 'в плане'; }
                let dateParts = [];
                if (s.createdAt) dateParts.push('запланировано ' + fmtDate(s.createdAt));
                if (s.doneAt) dateParts.push('сделано (посажено) ' + fmtDate(s.doneAt));
                const dateStr = dateParts.join(' → ');
                return `<div class="timeline-item">
                    <div class="${dotClass}"></div>
                    <div class="timeline-content">
                        <div style="font-size:12px;color:var(--accent-dark);margin-bottom:2px;">${dateStr}${statusLabel ? ' · ' + statusLabel : ''}</div>
                        <div><b>Для:</b> ${escapeHtml(s.person)}</div>
                        <div style="color:var(--text-light);">${escapeHtml(s.action)}</div>
                    </div>
                </div>`;
            }).join('')}</div>
            <div style="font-size:11px;color:var(--text-light);text-align:center;margin-top:12px;font-style:italic;">Поливай свои семена радостью</div>
        `;
    }
    openModal();
}

// ==================== РЕНДЕР ВКЛАДОК ====================

function renderGoals() {
    const container = document.getElementById('tab-goals');
    const goals = DB.getGoals().filter(g => !g.completed);
    const allSeeds = DB.getSeeds();
    if (goals.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83D\uDDFA</div><div class="empty-title">Посади первую цель</div><p class="empty-desc">Нажми «+» и опиши, чего хочешь достичь. Сад начинается с одного семени.</p></div>'; return; }
    container.innerHTML = goals.map((g, idx) => {
        const relatedSeeds = allSeeds.filter(s => s.goalId === g.id);
        const sown = relatedSeeds.length;
        const doneCount = relatedSeeds.filter(s => s.isActionDone).length;
        const harvested = relatedSeeds.filter(s => s.isGoalAchieved).length;
        const pctDone = sown ? Math.round(doneCount / sown * 100) : 0;
        const pctHarv = sown ? Math.round(harvested / sown * 100) : 0;
        const dateMeta = g.createdAt ? `<div class="card-meta">посажена ${fmtDate(g.createdAt)}</div>` : '';
        return `<div class="card" style="animation-delay: ${idx * 50}ms"><div class="card-body"><div class="card-title">Цель: ${escapeHtml(g.desire)}</div><div class="card-text">Исправить: ${escapeHtml(g.problem)}</div><div class="goal-progress"><div class="fill-done" style="width: ${pctDone}%"></div><div class="fill-harvest" style="width: ${pctHarv}%"></div></div><div class="counters-container"><div class="counter-badge ${sown === 0 ? 'zero' : ''}" onclick="window._app.showSeedsList(${g.id}, 'planned')">\uD83C\uDF31 План: ${sown}</div><div class="counter-badge done ${doneCount === 0 ? 'zero' : ''}" onclick="window._app.showSeedsList(${g.id}, 'done')">\uD83D\uDE4F Сделано: ${doneCount}</div>${harvested > 0 ? `<div class="counter-badge done" style="color:var(--success-color);border-color:var(--success-color);">\uD83C\uDF3E ${harvested}</div>` : ''}</div>${dateMeta}
            <div class="card-actions"><button class="btn btn-warning" onclick="window._app.openEditGoalModal(${g.id})">✎</button><button class="btn btn-success" onclick="window._app.achieveGoal(${g.id})">✓</button><button class="btn btn-danger" onclick="window._app.handleDeleteClick('goal', ${g.id}, this)">Удалить</button></div></div></div>`;
    }).join('');
}

function renderPlanting() {
    const container = document.getElementById('tab-planting');
    const seeds = DB.getSeeds().filter(s => !s.isActionDone && !s.isGoalAchieved);
    if (seeds.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83C\uDF31</div><div class="empty-title">Пора сеять семена</div><p class="empty-desc">Чтобы получить желаемое — сначала отдай это другому. Нажми «+» и спланируй добрый поступок.</p></div>'; return; }
    container.innerHTML = seeds.map((s, idx) => {
        const dateMeta = s.createdAt ? ` · посеяно ${fmtDate(s.createdAt)}` : '';
        return `<div class="card" style="animation-delay: ${idx * 50}ms"><div class="card-body"><div class="card-meta">\uD83C\uDFAF ${escapeHtml(s.goalText)}${dateMeta}</div><div class="card-title">Для: ${escapeHtml(s.person)}</div><div class="card-text">${escapeHtml(s.action)}</div>
        <div class="card-actions"><button class="btn btn-warning" onclick="window._app.openEditSeedModal(${s.id})">✎</button><button class="btn btn-success" onclick="window._app.completeSeedAction(${s.id})">✓ Сделано</button><button class="btn btn-danger" onclick="window._app.handleDeleteClick('seed', ${s.id}, this)">Удалить</button></div></div></div>`;
    }).join('');
}

function renderDone() {
    const container = document.getElementById('tab-done');
    const seeds = DB.getSeeds().filter(s => s.isActionDone && !s.isGoalAchieved);
    if (seeds.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83D\uDE4F</div><div class="empty-title">Копилка добрых дел пуста</div><p class="empty-desc">Отмечай сделанные поступки в «Плане» — и не забывай радоваться им в медитации.</p></div>'; return; }
    container.innerHTML = seeds.map((s, idx) => {
        const dateMeta = s.doneAt ? ` · сделано ${fmtDate(s.doneAt)}` : '';
        return `<div class="card" style="border-left-color: var(--success-color); animation-delay: ${idx * 50}ms"><div class="card-body"><div class="card-meta">\uD83C\uDFAF ${escapeHtml(s.goalText)}${dateMeta}</div><div class="card-title">Для: ${escapeHtml(s.person)}</div><div class="card-text">${escapeHtml(s.action)}</div>
        <div class="card-actions"><button class="btn btn-primary" onclick="window._app.undoSeedAction(${s.id})">↩ Вернуть</button><button class="btn btn-danger" onclick="window._app.handleDeleteClick('seed', ${s.id}, this)">Удалить</button></div></div></div>`;
    }).join('');
}

function renderHarvest() {
    const container = document.getElementById('tab-harvest');
    const harvestSeeds = DB.getSeeds().filter(s => s.isGoalAchieved);
    if (harvestSeeds.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83C\uDF3E</div><div class="empty-title">Урожай ещё впереди</div><p class="empty-desc">Когда цель достигнута — семена переместятся сюда. Продолжай сеять и радоваться.</p></div>'; return; }
    // Group by goal
    const byGoal = {};
    harvestSeeds.forEach(s => {
        if (!byGoal[s.goalId]) byGoal[s.goalId] = { goalText: s.goalText, seeds: [] };
        byGoal[s.goalId].seeds.push(s);
    });
    const goalIds = Object.keys(byGoal);
    container.innerHTML = goalIds.map((gid, idx) => {
        const g = byGoal[gid];
        const goal = DB.getGoals().find(gg => gg.id === parseInt(gid));
        const doneCount = g.seeds.filter(s => s.isActionDone).length;
        const totalCount = g.seeds.length;
        return `<div class="card harvest-card" style="border-left-color: var(--success-color); animation-delay: ${idx * 50}ms" onclick="window._app.showHarvestTimeline(${gid})"><div class="card-body"><div class="card-title" style="color: var(--success-color);">\uD83C\uDF3E ${escapeHtml(g.goalText)}</div><div class="card-text">${doneCount} из ${totalCount} семян собрали урожай</div>${goal && goal.createdAt ? `<div class="card-meta">цель посажена ${fmtDate(goal.createdAt)}</div>` : ''}
        <div class="card-actions"><button class="btn btn-primary" onclick="event.stopPropagation(); window._app.undoHarvest(${gid})">← Вернуть</button><button class="btn btn-danger" onclick="event.stopPropagation(); window._app.handleDeleteClick('goal', ${gid}, this)">Удалить цель</button></div></div></div>`;
    }).join('');
}

export function render() {
    renderGoals();
    renderPlanting();
    renderDone();
    renderHarvest();
    renderSettings();
}
