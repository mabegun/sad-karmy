import { DB } from './db.js';
import { escapeHtml } from './utils.js';
import { openModal, closeModal } from './modals.js';
import { renderSettings } from './settings.js';
import { deleteGoalNow } from './goals.js';
import { deleteSeedNow } from './seeds.js';

let deleteTimers = {};

export function handleDeleteClick(type, id, btnElement) {
    const key = type + id;
    if (deleteTimers[key]) {
        clearTimeout(deleteTimers[key]);
        delete deleteTimers[key];
        if (type === 'goal') deleteGoalNow(id);
        else deleteSeedNow(id);
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

export function showSeedsList(goalId, type) {
    const seeds = DB.getSeeds().filter(s => s.goalId === goalId);
    let list = [];
    let title = "";
    if (type === 'planned') {
        list = seeds.filter(s => !s.isActionDone);
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
        body.innerHTML = list.map(s => `<div class="seed-list-item ${type === 'done' ? 'done-item' : ''}"><div><b>Для кого:</b> ${escapeHtml(s.person)}</div><div><b>Действие:</b> ${escapeHtml(s.action)}</div></div>`).join('');
    }
    openModal();
}

function renderGoals() {
    const container = document.getElementById('tab-goals');
    const goals = DB.getGoals().filter(g => !g.completed);
    const allSeeds = DB.getSeeds();
    if (goals.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83D\uDDFA</div>Твои вершины ждут покорения</div>'; return; }
    container.innerHTML = goals.map(g => {
        const relatedSeeds = allSeeds.filter(s => s.goalId === g.id);
        const plannedCount = relatedSeeds.filter(s => !s.isActionDone).length;
        const doneCount = relatedSeeds.filter(s => s.isActionDone && !s.isGoalAchieved).length;
        return `<div class="card"><div class="card-body"><div class="card-title">Цель: ${escapeHtml(g.desire)}</div><div class="card-text">Исправить: ${escapeHtml(g.problem)}</div>
            <div class="counters-container"><div class="counter-badge ${plannedCount === 0 ? 'zero' : ''}" onclick="window._app.showSeedsList(${g.id}, 'planned')">\uD83C\uDF31 План: ${plannedCount}</div><div class="counter-badge done ${doneCount === 0 ? 'zero' : ''}" onclick="window._app.showSeedsList(${g.id}, 'done')">\uD83D\uDE4F Сделано: ${doneCount}</div></div>
            <div class="card-actions"><button class="btn btn-warning" onclick="window._app.openEditGoalModal(${g.id})">✎</button><button class="btn btn-success" onclick="window._app.achieveGoal(${g.id})">✓</button><button class="btn btn-danger" onclick="window._app.handleDeleteClick('goal', ${g.id}, this)">Удалить</button></div></div></div>`;
    }).join('');
}

function renderPlanting() {
    const container = document.getElementById('tab-planting');
    const seeds = DB.getSeeds().filter(s => !s.isActionDone);
    if (seeds.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83C\uDF31</div>Время посадки</div>'; return; }
    container.innerHTML = seeds.map(s => `<div class="card"><div class="card-body"><div class="card-meta">\uD83C\uDFAF ${escapeHtml(s.goalText)}</div><div class="card-title">Для: ${escapeHtml(s.person)}</div><div class="card-text">${escapeHtml(s.action)}</div>
        <div class="card-actions"><button class="btn btn-warning" onclick="window._app.openEditSeedModal(${s.id})">✎</button><button class="btn btn-success" onclick="window._app.completeSeedAction(${s.id})">✓ Сделано</button><button class="btn btn-danger" onclick="window._app.handleDeleteClick('seed', ${s.id}, this)">Удалить</button></div></div></div>`).join('');
}

function renderDone() {
    const container = document.getElementById('tab-done');
    const seeds = DB.getSeeds().filter(s => s.isActionDone && !s.isGoalAchieved);
    if (seeds.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83D\uDE4F</div>Список пуст</div>'; return; }
    container.innerHTML = seeds.map(s => `<div class="card"><div class="card-body"><div class="card-meta">\uD83C\uDFAF ${escapeHtml(s.goalText)}</div><div class="card-title">Для: ${escapeHtml(s.person)}</div><div class="card-text">${escapeHtml(s.action)}</div>
        <div class="card-actions"><button class="btn btn-primary" onclick="window._app.undoSeedAction(${s.id})">↩ Вернуть</button><button class="btn btn-danger" onclick="window._app.handleDeleteClick('seed', ${s.id}, this)">Удалить</button></div></div></div>`).join('');
}

function renderHarvest() {
    const container = document.getElementById('tab-harvest');
    const seeds = DB.getSeeds().filter(s => s.isGoalAchieved);
    if (seeds.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83C\uDF3E</div>Урожай созреет скоро</div>'; return; }
    container.innerHTML = seeds.map(s => `<div class="card" style="border-left-color: var(--success-color);"><div class="card-body"><div class="card-title" style="color: var(--success-color);">Урожай: ${escapeHtml(s.goalText)}</div><div class="card-text">Для <b>${escapeHtml(s.person)}</b>: ${escapeHtml(s.action)}</div>
        <div class="card-actions"><button class="btn btn-primary" onclick="window._app.undoHarvest(${s.goalId})">← Вернуть</button><button class="btn btn-danger" onclick="window._app.handleDeleteClick('seed', ${s.id}, this)">Удалить</button></div></div></div>`).join('');
}

export function render() {
    renderGoals();
    renderPlanting();
    renderDone();
    renderHarvest();
    renderSettings();
}
