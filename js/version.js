let currentVersion = '...';
let serverVersion = null;
let swRegistration = null;
let updateAvailable = false;
let waitingWorker = null;

import { openInfoMenu, closeInfoMenu } from './modals.js';

async function getVersionFromSW() {
    return new Promise((resolve) => {
        if (!navigator.serviceWorker.controller) {
            resolve(null);
            return;
        }
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            resolve(event.data.version);
        };
        navigator.serviceWorker.controller.postMessage('GET_VERSION', [messageChannel.port2]);
        setTimeout(() => resolve(null), 1000);
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

export function updateVersionDisplay() {
    const versionEl = document.getElementById('app-version');
    const statusEl = document.getElementById('version-status');
    const updateBtn = document.getElementById('update-btn');
    const updateInfo = document.getElementById('update-info');
    
    versionEl.textContent = currentVersion;
    
    if (updateAvailable) {
        statusEl.className = 'version-status available';
        statusEl.textContent = '⬆️ Доступно обновление';
        updateBtn.style.display = 'block';
        updateInfo.style.display = 'block';
    } else {
        statusEl.className = 'version-status updated';
        statusEl.textContent = '✓ Актуальная версия';
        updateBtn.style.display = 'none';
        updateInfo.style.display = 'none';
    }
}

export async function checkForUpdates() {
    const statusEl = document.getElementById('version-status');
    const checkBtn = document.getElementById('check-update-btn');
    
    statusEl.className = 'version-status checking';
    statusEl.textContent = '🔄 Проверка обновлений...';
    checkBtn.disabled = true;
    
    try {
        serverVersion = await getServerVersion();
        
        if (swRegistration) {
            await swRegistration.update();
        }
        
        if (serverVersion && serverVersion !== currentVersion) {
            updateAvailable = true;
        } else {
            updateAvailable = false;
        }
        
        updateVersionDisplay();
    } catch (error) {
        statusEl.className = 'version-status error';
        statusEl.textContent = '❌ Ошибка проверки';
    }
    
    checkBtn.disabled = false;
}

export function updateApp() {
    if (waitingWorker) {
        waitingWorker.postMessage('skipWaiting');
    }
    document.getElementById('update-notification').style.display = 'none';
    document.getElementById('update-btn').style.display = 'none';
    document.getElementById('update-info').style.display = 'none';
    updateAvailable = false;
}

export function confirmUpdate() {
    if (confirm('Обновить приложение?\n\n✅ Ваши цели и семена сохранятся.')) {
        updateApp();
    }
}

export function hideUpdateNotification() {
    document.getElementById('update-notification').style.display = 'none';
}

export function initVersionSystem() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async function () {
            try {
                swRegistration = await navigator.serviceWorker.register('./service-worker.js');
                console.log('✅ SW зарегистрирован:', swRegistration.scope);
                
                currentVersion = await getVersionFromSW() || '?.?.?';
                updateVersionDisplay();
                
                if (swRegistration.waiting) {
                    waitingWorker = swRegistration.waiting;
                    updateAvailable = true;
                    document.getElementById('update-notification').style.display = 'block';
                }
                
                swRegistration.addEventListener('updatefound', function () {
                    const newWorker = swRegistration.installing;
                    newWorker.addEventListener('statechange', async function () {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            waitingWorker = newWorker;
                            updateAvailable = true;
                            document.getElementById('update-notification').style.display = 'block';
                            currentVersion = await getVersionFromSW() || currentVersion;
                        }
                    });
                });
            } catch (error) {
                console.log('❌ Ошибка SW:', error);
                currentVersion = '?.?.?';
                updateVersionDisplay();
            }
        });
        
        navigator.serviceWorker.addEventListener('message', function (event) {
            if (event.data && event.data.type === 'VERSION') {
                currentVersion = event.data.version;
                updateVersionDisplay();
            }
        });
        
        // Перезагружаем после обновления по кнопке пользователя
        let reloadTriggered = false;
        navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (reloadTriggered) return;
            reloadTriggered = true;
            window.location.reload();
        });
    }
}
