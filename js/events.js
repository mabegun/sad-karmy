let renderCallback = null;

export function onRender(fn) {
    renderCallback = fn;
}

export function triggerRender() {
    if (renderCallback) renderCallback();
}
