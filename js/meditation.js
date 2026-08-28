import { DB } from './db.js';
import { escapeHtml } from './utils.js';
import { openMeditationModal } from './modals.js';

export function openMeditation() {
    const seeds = DB.getSeeds().filter(s => s.isActionDone && !s.isGoalAchieved);
    const mList = document.getElementById('meditation-list');
    if (seeds.length === 0) {
        mList.innerHTML = '<p style="text-align:center; color:#8D6E63">Нет добрых дел.</p>';
    } else {
        mList.innerHTML = seeds.map(s => `<div style="background: #fff; border-left: 3px solid var(--success-color); padding: 10px; margin-bottom: 10px; font-size: 14px;">Я сделал для <b>${escapeHtml(s.person)}</b>: ${escapeHtml(s.action)}.<br><span style="font-size: 12px; color: var(--text-light);">Чтобы получить: ${escapeHtml(s.goalText)}</span></div>`).join('');
    }
    openMeditationModal();
}
