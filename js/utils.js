export function escapeHtml(text) {
    if (!text) return "";
    return String(text).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
}

/**
 * Escapes a string for safe insertion into double-quoted HTML attributes.
 * On top of HTML entities, also escapes backtick, backslash, and newlines
 * which could break out of a backtick-wrapped template literal attribute.
 */
export function escapeAttr(text) {
    if (!text) return "";
    const escaped = escapeHtml(text);
    return escaped
        .replace(/`/g, '&#96;')
        .replace(/\\/g, '&#92;')
        .replace(/\n/g, '&#10;')
        .replace(/\r/g, '&#13;')
}

export function fmtDate(ts) {
    if (!ts) return '';
    try { return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); } catch (e) { return ''; }
}

export function markInvalid(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    if (!el.value.trim()) {
        el.classList.add('invalid');
        setTimeout(() => el.classList.remove('invalid'), 600);
        el.focus();
        return true;
    }
    return false;
}
