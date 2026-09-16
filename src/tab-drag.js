// Pointer capture keeps dragging inside the panel, including while its list
// scrolls. Mutations are delegated to the workspace's single background writer.
export function createTabDragController({ root, list, ungroupZone, canDrag, describeTab, groupName, onStart, onDrop, onEnd, onError }) {
    let pointer = null;
    let dragging = false;
    let target = null;
    let hoverTimer = null;
    let scrollFrame = null;
    let suppressUntil = 0;

    function clearTarget() {
        clearTimeout(hoverTimer);
        hoverTimer = null;
        target?.element.removeAttribute("data-drop");
        target?.element.querySelector(".drag-hint")?.remove();
        target = null;
    }

    function paintTarget() {
        if (!target) return;
        target.element.dataset.drop = target.ready ? target.mode : "pending";
        target.element.querySelector(".drag-hint")?.remove();
        const label = target.ready ? target.label : "Hold to group";
        if (label) {
            const hint = document.createElement("span");
            hint.className = "drag-hint";
            hint.textContent = label;
            target.element.append(hint);
        }
    }

    function chooseTarget(next) {
        if (!next) { clearTarget(); return; }
        const key = `${next.mode}:${next.tabId ?? next.groupId ?? ""}`;
        if (target?.key === key) return;
        clearTarget();
        target = { ...next, key, ready: !next.wait };
        paintTarget();
        if (next.wait) {
            hoverTimer = setTimeout(() => {
                if (!dragging || target?.key !== key) return;
                target.ready = true;
                paintTarget();
            }, 450);
        }
    }

    function updateTarget() {
        if (!dragging) return;
        const hit = document.elementFromPoint(pointer.x, pointer.y);
        if (!hit || !root.contains(hit)) { clearTarget(); return; }
        if (!ungroupZone.hidden && ungroupZone.contains(hit)) {
            chooseTarget({ mode: "ungroup", element: ungroupZone, label: "Remove from group" });
            return;
        }
        const header = hit.closest("[data-drop-group-id]");
        if (header) {
            const groupId = header.dataset.dropGroupId;
            chooseTarget(groupId !== pointer.source.groupId
                ? { mode: "join", groupId, element: header, label: `Add to ${groupName(groupId)}` } : null);
            return;
        }
        const row = hit.closest("[data-tab-id]");
        const tab = row?.querySelector("[data-drag-tab-id]") ? describeTab(Number(row.dataset.tabId)) : null;
        if (!tab || tab.id === pointer.source.id) { clearTarget(); return; }
        const rect = row.getBoundingClientRect();
        const y = pointer.y - rect.top;
        const edge = y < 8 ? "before" : y > rect.height - 8 ? "after" : null;
        const sameGroup = tab.groupId && tab.groupId === pointer.source.groupId;
        if (edge || sameGroup) {
            chooseTarget(tab.groupId || tab.windowId === pointer.source.windowId
                ? { mode: edge || (y < rect.height / 2 ? "before" : "after"), tabId: tab.id, groupId: tab.groupId, element: row } : null);
        }
        else {
            chooseTarget({ mode: tab.groupId ? "join" : "create", tabId: tab.id, groupId: tab.groupId, element: row,
                wait: true, label: tab.groupId ? `Add to ${groupName(tab.groupId)}` : "Create group" });
        }
    }

    function scrollWhileDragging() {
        if (!dragging) return;
        const rect = list.getBoundingClientRect();
        const inside = pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;
        if (inside && target?.mode !== "ungroup") {
            const distance = pointer.y < rect.top + 32 ? pointer.y - rect.top - 32
                : pointer.y > rect.bottom - 32 ? pointer.y - rect.bottom + 32 : 0;
            if (distance) {
                const before = list.scrollTop;
                list.scrollTop += Math.max(-12, Math.min(12, distance / 3));
                if (before !== list.scrollTop) updateTarget();
            }
        }
        scrollFrame = requestAnimationFrame(scrollWhileDragging);
    }

    function end(notify = true) {
        const wasDragging = dragging;
        dragging = false;
        clearTarget();
        cancelAnimationFrame(scrollFrame);
        scrollFrame = null;
        if (pointer && root.hasPointerCapture(pointer.id)) root.releasePointerCapture(pointer.id);
        pointer = null;
        delete list.dataset.dragging;
        list.querySelectorAll(".dragging").forEach((row) => row.classList.remove("dragging"));
        ungroupZone.hidden = true;
        if (wasDragging) {
            suppressUntil = Date.now() + 250;
            if (notify) onEnd();
        }
    }

    root.addEventListener("pointerdown", (event) => {
        const handle = event.target.closest("[data-drag-tab-id]");
        if (!handle || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.pointerType === "touch" || !canDrag()) return;
        const source = describeTab(Number(handle.dataset.dragTabId));
        if (!source) return;
        pointer = { id: event.pointerId, source, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY };
    });
    root.addEventListener("pointermove", (event) => {
        if (!pointer || event.pointerId !== pointer.id) return;
        if (!(event.buttons & 1)) { end(); return; }
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        if (!dragging && Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) < 6) return;
        event.preventDefault();
        if (!dragging) {
            if (!canDrag()) { end(); return; }
            dragging = true;
            root.setPointerCapture(event.pointerId);
            onStart();
            list.dataset.dragging = "true";
            list.querySelector(`[data-tab-id="${pointer.source.id}"]`)?.classList.add("dragging");
            ungroupZone.hidden = !pointer.source.groupId;
            scrollFrame = requestAnimationFrame(scrollWhileDragging);
        }
        updateTarget();
    });
    root.addEventListener("pointerup", (event) => {
        if (!pointer || event.pointerId !== pointer.id) return;
        const source = pointer.source;
        const chosen = target?.ready ? target : null;
        const wasDragging = dragging;
        end(false);
        if (wasDragging) {
            if (chosen) Promise.resolve().then(() => onDrop(source, chosen)).catch(onError).finally(onEnd);
            else onEnd();
        }
    });
    root.addEventListener("pointercancel", () => end());
    document.addEventListener("pointerup", () => { if (pointer && !dragging) end(); });
    root.addEventListener("lostpointercapture", () => { if (dragging) end(); });
    root.addEventListener("click", (event) => {
        if (Date.now() < suppressUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && dragging) { event.preventDefault(); end(); }
    });
    window.addEventListener("blur", () => end());
    return { active: () => dragging, cancel: () => end(), suppressClick: () => Date.now() < suppressUntil };
}
