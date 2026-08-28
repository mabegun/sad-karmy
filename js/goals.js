import { DB } from './db.js';
import { escapeHtml, escapeAttr } from './utils.js';
import { openModal, closeModal, openInstruction } from './modals.js';
import { triggerRender } from './events.js';

export function saveGoal() {
    const fix = document.getElementById('input-fix').value;
    const want = document.getElementById('input-want').value;
    if (!fix || !want) return alert('Заполни поля');
    const goals = DB.getGoals();
    goals.push({ id: Date.now(), problem: fix, desire: want, completed: false });
    DB.saveGoals(goals);
    closeModal();
    triggerRender();
}

export function openEditGoalModal(id) {
    const goal = DB.getGoals().find(g => g.id === id);
    if (!goal) return;
    document.getElementById('modal-title').innerText = "Редактировать цель \uD83C\uDFAF";
    document.getElementById('modal-body').innerHTML = `
        <div style="background: rgba(255,255,255,0.7); border-left: 3px solid var(--accent-color); padding: 12px; margin-bottom: 15px; font-size: 13px; line-height: 1.5; border-radius: 4px;">
            <b>Шаг 1. Ставим цель</b><br>
            Уточни, что тебя не устраивает и чего ты хочешь достичь.
        </div>
        <label>Что не устраивает в жизни и хочется исправить?</label>
        <input type="text" id="input-fix" value="${escapeAttr(goal.problem)}">
        <label>Что хочешь получить взамен?</label>
        <input type="text" id="input-want" value="${escapeAttr(goal.desire)}">
        <button class="btn btn-success" style="width:100%; margin-bottom: 10px;" onclick="window._app.saveEditedGoal(${id})">Сохранить изменения</button>
        <a href="#" onclick="window._app.closeAndOpenInstruction(); return false;" style="font-size: 12px; color: var(--primary-color);">\uD83D\uDCD6 Открыть полную инструкцию</a>
    `;
    closeModal();
    openModal();
}

export function saveEditedGoal(id) {
    let goals = DB.getGoals();
    const newFix = document.getElementById('input-fix').value;
    const newWant = document.getElementById('input-want').value;
    if (!newFix || !newWant) return alert('Заполни поля');
    goals = goals.map(g => g.id === id ? { ...g, problem: newFix, desire: newWant } : g);
    let seeds = DB.getSeeds().map(s => s.goalId === id ? { ...s, goalText: newWant } : s);
    DB.saveGoals(goals);
    DB.saveSeeds(seeds);
    closeModal();
    triggerRender();
}

export function achieveGoal(id) {
    if (!confirm('Достигнута цель?')) return;
    let goals = DB.getGoals().map(g => g.id === id ? { ...g, completed: true } : g);
    let seeds = DB.getSeeds().map(s => s.goalId === id ? { ...s, isGoalAchieved: true } : s);
    DB.saveGoals(goals);
    DB.saveSeeds(seeds);
    triggerRender();
}

export function deleteGoalNow(id) {
    DB.saveGoals(DB.getGoals().filter(g => g.id !== id));
    triggerRender();
}

export function undoHarvest(goalId) {
    if (!confirm('Вернуть цель и все связанные семена обратно?\nСделанные поступки останутся сделанными.')) return;
    let goals = DB.getGoals().map(g =>
        g.id === goalId ? { ...g, completed: false } : g
    );
    let seeds = DB.getSeeds().map(s =>
        s.goalId === goalId ? { ...s, isGoalAchieved: false } : s
    );
    DB.saveGoals(goals);
    DB.saveSeeds(seeds);
    triggerRender();
}

export function openNewGoalModal() {
    document.getElementById('modal-title').innerText = "Новая цель \uD83C\uDFAF";
    document.getElementById('modal-body').innerHTML = `
        <div style="background: rgba(255,255,255,0.7); border-left: 3px solid var(--accent-color); padding: 12px; margin-bottom: 15px; font-size: 13px; line-height: 1.5; border-radius: 4px;">
            <b>Шаг 1. Ставим цель</b><br>
            Выбери то, что тебя сейчас не устраивает в жизни. Сформулируй, <b>чего ты хочешь</b> получить положительного взамен.<br>
            <i>Пример: «Хочу больше клиентов» или «Хочу чувствовать себя увереннее в отношениях».</i>
        </div>
        <label>Что не устраивает в жизни и хочется исправить?</label>
        <input type="text" id="input-fix" placeholder="Например: нехватка денег, одиночество...">
        <label>Что хочешь получить взамен?</label>
        <input type="text" id="input-want" placeholder="Например: стабильный доход, близкие отношения...">
        <button class="btn btn-success" style="width:100%; margin-bottom: 10px;" onclick="window._app.saveGoal()">Сохранить цель</button>
        <a href="#" onclick="window._app.closeAndOpenInstruction(); return false;" style="font-size: 12px; color: var(--primary-color);">\uD83D\uDCD6 Открыть полную инструкцию</a>
    `;
    openModal();
}

export function closeAndOpenInstruction() {
    closeModal();
    openInstruction();
}
