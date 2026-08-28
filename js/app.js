import { onRender } from './events.js';
import { render, handleDeleteClick, showSeedsList, seedListAction } from './render.js';
import { saveGoal, openEditGoalModal, saveEditedGoal, achieveGoal, undoHarvest, openNewGoalModal, closeAndOpenInstruction } from './goals.js';
import { saveSeed, openEditSeedModal, saveEditedSeed, completeSeedAction, undoSeedAction, openNewSeedModal } from './seeds.js';
import { openMeditation } from './meditation.js';
import { exportData, handleFileImport, toggleNotification, updateTime } from './settings.js';
import { openInfoMenu, closeInfoMenu, closeModal, openInstruction, closeInstruction, openPrivacy, closePrivacy, openInstall, closeInstall, closeMeditationModal } from './modals.js';
import { initVersionSystem, checkForUpdates, updateApp, confirmUpdate, hideUpdateNotification, updateVersionDisplay } from './version.js';

let currentTab = 'goals';

export function switchTab(tabName, element) {
    currentTab = tabName;
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById('tab-' + tabName).style.display = 'block';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if (element) element.classList.add('active');
}

export function openModalOrAction() {
    if (currentTab === 'harvest' || currentTab === 'done' || currentTab === 'settings') return;
    if (currentTab === 'goals') {
        openNewGoalModal();
    } else if (currentTab === 'planting') {
        openNewSeedModal();
    }
}

// Регистрируем render callback
onRender(render);

// Expose all handler functions to global scope for inline onclick
window._app = {
    switchTab,
    openModalOrAction,
    handleDeleteClick,
    showSeedsList,
    seedListAction,
    saveGoal,
    openEditGoalModal,
    saveEditedGoal,
    achieveGoal,
    undoHarvest,
    saveSeed,
    openEditSeedModal,
    saveEditedSeed,
    completeSeedAction,
    undoSeedAction,
    openMeditation,
    exportData,
    handleFileImport,
    toggleNotification,
    updateTime,
    openInfoMenu,
    closeInfoMenu,
    openInstruction,
    closeInstruction,
    openPrivacy,
    closePrivacy,
    openInstall,
    closeInstall,
    closeMeditationModal,
    closeModal,
    closeAndOpenInstruction,
    checkForUpdates,
    updateApp,
    confirmUpdate,
    hideUpdateNotification,
    updateVersionDisplay,
};

// Инициализация
render();
initVersionSystem();
