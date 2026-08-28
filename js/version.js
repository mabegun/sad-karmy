let currentVersion = '...';
let serverVersion = null;
let swRegistration = null;
let updateAvailable = false;

import { openInfoMenu, closeInfoMenu } from './modals.js';

async function getVersionFromSW() {
    return new Promise((resolve) => {
        const controller = navigator.serviceWorker.controller;
        if (!controller) {
            resolve(null);
            return;
        }
        try {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.version);
            };
            controller.postMessage('GET_VERSION', [messageChannel.port2]);
            setTimeout(() => resolve(null), 2000);
        } catch (e) {
            resolve(null);
        }
    });
}

async function getServerVersion() {
    try {
        const response = await fetch('./version.json?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();
            return data.version;
        }
    } catch (e) {
        console.log('Не удалось получить версию с сервера');
    }
    return null;
}

function showUpdateNotification() {
    updateAvailable = true;
    const el = document.getElementById('update-notification');
    if (el) el.style.display = 'block';
    updateVersionDisplay();
}

function getWaitingWorker() {
    if (swRegistration && swRegistration.waiting) {
        return swRegistration.waiting;
    }
    return null;
}

export function updateVersionDisplay() {
    const versionEl = document.getElementById('app-version');
    const statusEl = document.getElementById('version-status');
    const updateBtn = document.getElementById('update-btn');
    const updateInfo = document.getElementById('update-info');
    
    if (!versionEl) return;
    versionEl.textContent = currentVersion;
    
    if (updateAvailable) {
        statusEl.className = 'version-status available';
        statusEl.textContent = '\u2B06\uFE0F Доступно обновление';
        if (updateBtn) updateBtn.style.display = 'block';
        if (updateInfo) updateInfo.style.display = 'block';
    } else {
        statusEl.className = 'version-status updated';
        statusEl.textContent = '\u2713 Актуальная версия';
        if (updateBtn) updateBtn.style.display = 'none';
        if (updateInfo) updateInfo.style.display = 'none';
    }
}

export async function checkForUpdates() {
    const statusEl = document.getElementById('version-status');
    const checkBtn = document.getElementById('check-update-btn');
    
    statusEl.className = 'version-status checking';
    statusEl.textContent = '\uD83D\uDD04 Проверка обновлений...';
    checkBtn.disabled = true;
    
    try {
        serverVersion = await getServerVersion();
        
        if (swRegistration) {
            await swRegistration.update();
            await new Promise(r => setTimeout(r, 2000));
        }
        
        const hasWaiting = !!getWaitingWorker();
        if (hasWaiting || (serverVersion && serverVersion !== currentVersion)) {
            showUpdateNotification();
        } else {
            updateAvailable = false;
            updateVersionDisplay();
        }
    } catch (error) {
        statusEl.className = 'version-status error';
        statusEl.textContent = '\u274C Ошибка проверки';
    }
    
    checkBtn.disabled = false;
}

export function updateApp() {
    // Пытаемся мягко: skipWaiting
    const worker = getWaitingWorker();
    if (worker) {
        worker.postMessage('skipWaiting');
        // controllerchange → reload произойдёт автоматически
        return;
    }
    // Жёсткий вариант: чистим всё и перезагружаем
    console.log('⏳ Принудительное обновление...');
    navigator.serviceWorker.getRegistrations().then(regs => {
        return Promise.all(regs.map(r => r.unregister()));
    }).then(() => {
        return caches.keys().then(keys => {
            return Promise.all(keys.map(k => caches.delete(k)));
        });
    }).then(() => {
        window.location.replace(window.location.pathname + '?v=' + Date.now());
    });
}

export function confirmUpdate() {
    if (confirm('Обновить приложение?\n\n\u2705 Ваши цели и семена сохранятся.')) {
        updateApp();
    }
}

export function hideUpdateNotification() {
    const el = document.getElementById('update-notification');
    if (el) el.style.display = 'none';
}

export function initVersionSystem() {
    if (!('serviceWorker' in navigator)) {
        currentVersion = '?.?.?';
        updateVersionDisplay();
        return;
    }
    
    // Перезагружаем после смены контроллера
    let reloadTriggered = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (reloadTriggered) return;
        reloadTriggered = true;
        window.location.reload();
    });
    
    // Принимаем версию от нового SW при активации
    navigator.serviceWorker.addEventListener('message', function (event) {
        if (event.data && event.data.type === 'VERSION') {
            currentVersion = event.data.version;
            updateVersionDisplay();
        }
    });
    
    window.addEventListener('load', async function () {
        try {
            swRegistration = await navigator.serviceWorker.register('./service-worker.js');
            console.log('\u2705 SW зарегистрирован:', swRegistration.scope);
            
            // Слушаем обновления ДО любых await
            swRegistration.addEventListener('updatefound', function () {
                const newWorker = swRegistration.installing;
                if (!newWorker) return;
                
                newWorker.addEventListener('statechange', function () {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('\u2B06\uFE0F Новый SW установлен, ждём применения');
                        showUpdateNotification();
                    }
                });
            });
            
            // Проверяем, не ждёт ли уже новый SW
            if (swRegistration.waiting) {
                console.log('\u2B06\uFE0F Найден waiting SW');
                showUpdateNotification();
            }
            
            // Получаем текущую версию
            currentVersion = await getVersionFromSW() || '?.?.?';
            updateVersionDisplay();
            
            // Автопроверка: сравниваем версию SW с версией на сервере
            try {
                const server = await getServerVersion();
                if (server && server !== currentVersion) {
                    console.log('\u2B06\uFE0F Версия на сервере (' + server + ') отличается от SW (' + currentVersion + ')');
                    await swRegistration.update();
                    await new Promise(r => setTimeout(r, 1500));
                    if (!getWaitingWorker() && server !== currentVersion) {
                        showUpdateNotification();
                    }
                }
            } catch (e) {
                console.log('Автопроверка версии не удалась:', e);
            }
            
        } catch (error) {
            console.log('\u274C Ошибка SW:', error);
            currentVersion = '?.?.?';
            updateVersionDisplay();
        }
    });
}