export function openModal() {
    document.getElementById('modal').classList.add('active');
}

export function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

/** Кастомный confirm — возвращает Promise<boolean> */
export function confirmModal(title, text, confirmText = 'Подтвердить', danger = false) {
    return new Promise(resolve => {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerHTML = `
            <div style="font-size:14px;line-height:1.6;color:var(--text-ink);margin-bottom:20px;">${text}</div>
            <div style="display:flex;gap:10px;">
                <button class="btn btn-primary" style="flex:1;" id="confirm-cancel">Отмена</button>
                <button class="btn ${danger ? 'btn-danger' : 'btn-success'}" style="flex:1;${danger ? 'background:var(--danger-color);color:white;border-color:var(--danger-color);' : ''}" id="confirm-ok">${confirmText}</button>
            </div>
        `;
        openModal();
        document.getElementById('confirm-cancel').onclick = () => { closeModal(); resolve(false); };
        document.getElementById('confirm-ok').onclick = () => { closeModal(); resolve(true); };
    });
}

/** Кастомный alert */
export function alertModal(title, text) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = `
        <div style="font-size:14px;line-height:1.6;color:var(--text-ink);">${text}</div>
        <button class="btn btn-primary" style="width:100%;margin-top:20px;" onclick="window._app.closeModal()">OK</button>
    `;
    openModal();
}

export function openInfoMenu() {
    document.getElementById('info-menu-modal').classList.add('active');
}

export function closeInfoMenu() {
    document.getElementById('info-menu-modal').classList.remove('active');
}

export function openInstruction() {
    document.getElementById('instruction-modal').classList.add('active');
}

export function closeInstruction() {
    document.getElementById('instruction-modal').classList.remove('active');
}

export function openPrivacy() {
    document.getElementById('privacy-modal').classList.add('active');
}

export function closePrivacy() {
    document.getElementById('privacy-modal').classList.remove('active');
}

export function openInstall() {
    document.getElementById('install-modal').classList.add('active');
}

export function closeInstall() {
    document.getElementById('install-modal').classList.remove('active');
}

export function openMeditationModal() {
    document.getElementById('meditation-modal').classList.add('active');
}

export function closeMeditationModal() {
    document.getElementById('meditation-modal').classList.remove('active');
}
