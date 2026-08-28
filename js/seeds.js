import { DB } from './db.js';
import { escapeHtml, escapeAttr, markInvalid } from './utils.js';
import { openModal, closeModal, openInstruction } from './modals.js';
import { triggerRender } from './events.js';

export function saveSeed() {
    const goalId = parseInt(document.getElementById('input-goal-id').value);
    const goalObj = DB.getGoals().find(g => g.id === goalId);
    const person = document.getElementById('input-person').value;
    const action = document.getElementById('input-action').value;
    var bad1s = markInvalid('input-person'), bad2s = markInvalid('input-action'); if (!person || !action) return;
    const seeds = DB.getSeeds();
    seeds.push({ id: Date.now(), goalId: goalId, goalText: goalObj.desire, person: person, action: action, isActionDone: false, isGoalAchieved: false });
    DB.saveSeeds(seeds);
    closeModal();
    triggerRender();
}

export function openEditSeedModal(id) {
    const seed = DB.getSeeds().find(s => s.id === id);
    if (!seed) return;
    const activeGoals = DB.getGoals().filter(g => !g.completed);
    const options = activeGoals.map(g => `<option value="${g.id}" ${g.id === seed.goalId ? 'selected' : ''}>${escapeHtml(g.desire)}</option>`).join('');
    document.getElementById('modal-title').innerText = "Редактировать семя \uD83C\uDF31";
    document.getElementById('modal-body').innerHTML = `
        <div style="background: rgba(255,255,255,0.7); border-left: 3px solid var(--accent-color); padding: 12px; margin-bottom: 15px; font-size: 13px; line-height: 1.5; border-radius: 4px;">
            <b>Шаг 2. Сажаем семена</b><br>
            Уточни для кого и какой поступок планируешь совершить.
        </div>
        <label>Для какой цели сеем?</label>
        <select id="input-goal-id">${options}</select>
        <label>Для кого делаем доброе дело?</label>
        <input type="text" id="input-person" value="${escapeAttr(seed.person)}">
        <label>Какой поступок планируешь?</label>
        <input type="text" id="input-action" value="${escapeAttr(seed.action)}">
        <button class="btn btn-success" style="width:100%; margin-bottom: 10px;" onclick="window._app.saveEditedSeed(${id})">Сохранить изменения</button>
        <a href="#" onclick="window._app.closeAndOpenInstruction(); return false;" style="font-size: 12px; color: var(--primary-color);">\uD83D\uDCD6 Открыть полную инструкцию</a>
    `;
    closeModal();
    openModal();
}

export function saveEditedSeed(id) {
    const newGoalId = parseInt(document.getElementById('input-goal-id').value);
    const newGoalObj = DB.getGoals().find(g => g.id === newGoalId);
    const newPerson = document.getElementById('input-person').value;
    const newAction = document.getElementById('input-action').value;
    var bad1se = markInvalid('input-person'), bad2se = markInvalid('input-action'); if (!newPerson || !newAction) return;
    let seeds = DB.getSeeds().map(s => s.id === id ? { ...s, goalId: newGoalId, goalText: newGoalObj.desire, person: newPerson, action: newAction } : s);
    DB.saveSeeds(seeds);
    closeModal();
    triggerRender();
}

export function completeSeedAction(id) {
    let seeds = DB.getSeeds().map(s => s.id === id ? { ...s, isActionDone: true } : s);
    DB.saveSeeds(seeds);
    triggerRender();
}

export function undoSeedAction(id) {
    let seeds = DB.getSeeds().map(s => s.id === id ? { ...s, isActionDone: false } : s);
    DB.saveSeeds(seeds);
    triggerRender();
}

export function deleteSeedNow(id) {
    DB.saveSeeds(DB.getSeeds().filter(s => s.id !== id));
    triggerRender();
}

export function openNewSeedModal() {
    const activeGoals = DB.getGoals().filter(g => !g.completed);
    if (activeGoals.length === 0) { alert('Сначала создайте цель!'); return; }
    const options = activeGoals.map(g => `<option value="${g.id}">${escapeHtml(g.desire)}</option>`).join('');
    document.getElementById('modal-title').innerText = "Посеять семя \uD83C\uDF31";
    document.getElementById('modal-body').innerHTML = `
        <div style="background: rgba(255,255,255,0.7); border-left: 3px solid var(--accent-color); padding: 12px; margin-bottom: 15px; font-size: 13px; line-height: 1.5; border-radius: 4px;">
            <b>Шаг 2. Сажаем семена</b><br>
            <b>Правило кармы:</b> чтобы получить что-то, нужно сначала это отдать.<br>
            Найди человека, которому тоже нужно то, что хочешь получить ты. Придумай, как именно ты ему поможешь.<br>
            <i>Например: хочешь больше клиентов — помоги коллеге найти стажёра.</i>
        </div>
        <label>Для какой цели сеем?</label>
        <select id="input-goal-id">${options}</select>
        <label>Для кого делаем доброе дело?</label>
        <input type="text" id="input-person" placeholder="Имя человека или описание группы">
        <label>Какой поступок планируешь?</label>
        <input type="text" id="input-action" placeholder="Опиши конкретное действие">
        <button class="btn btn-success" style="width:100%; margin-bottom: 10px;" onclick="window._app.saveSeed()">Сохранить семя</button>
        <a href="#" onclick="window._app.closeAndOpenInstruction(); return false;" style="font-size: 12px; color: var(--primary-color);">\uD83D\uDCD6 Открыть полную инструкцию</a>
    `;
    openModal();
}
