function validBounds(bounds) {
    return bounds && ["left", "top", "width", "height"].every((key) => Number.isFinite(bounds[key]))
        && bounds.width > 0 && bounds.height > 0;
}

export function normalizeDisplays(displays) {
    const active = (Array.isArray(displays) ? displays : [])
        .filter((display) => display && display.isEnabled !== false && display.activeState !== "inactive"
            && !display.mirroringSourceId && validBounds(display.bounds))
        .sort((a, b) => Number(b.isPrimary === true) - Number(a.isPrimary === true)
            || a.bounds.left - b.bounds.left || a.bounds.top - b.bounds.top || String(a.id).localeCompare(String(b.id)));
    const named = active.map((display, index) => ({
        ...display,
        name: (typeof display.name === "string" ? display.name.trim() : "")
            || (display.isInternal ? "Built-in display" : `Display ${index + 1}`)
    }));
    const counts = new Map();
    const seen = new Map();
    for (const display of named) {
        const key = display.name.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    return named.map((display) => {
        const key = display.name.toLowerCase();
        const number = (seen.get(key) || 0) + 1;
        seen.set(key, number);
        return { ...display, name: counts.get(key) > 1 ? `${display.name} (${number})` : display.name };
    });
}

export function findWindowDisplay(win, displays) {
    if (!validBounds(win))
        return null;
    const centerX = win.left + win.width / 2;
    const centerY = win.top + win.height / 2;
    let best = null;
    let bestArea = -1;
    let bestDistance = Infinity;
    for (const display of displays) {
        const bounds = display.bounds;
        const right = bounds.left + bounds.width;
        const bottom = bounds.top + bounds.height;
        const width = Math.max(0, Math.min(win.left + win.width, right) - Math.max(win.left, bounds.left));
        const height = Math.max(0, Math.min(win.top + win.height, bottom) - Math.max(win.top, bounds.top));
        const area = width * height;
        const dx = Math.max(bounds.left - centerX, 0, centerX - right);
        const dy = Math.max(bounds.top - centerY, 0, centerY - bottom);
        const distance = dx * dx + dy * dy;
        // Use logical desktop coordinates, including negative offsets. A window
        // spanning screens belongs to the screen containing most of its area.
        if (area > bestArea || (area === bestArea && distance < bestDistance)) {
            best = display;
            bestArea = area;
            bestDistance = distance;
        }
    }
    // Some platforms report off-screen sentinel bounds for minimized windows.
    return win.state === "minimized" && bestArea <= 0 ? null : best;
}
