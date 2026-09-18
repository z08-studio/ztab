export function node(tag, className = "", text = "") {
    const element = document.createElement(tag);
    element.className = className;
    if (text)
        element.textContent = text;
    return element;
}

const ICON_PATHS = {
    coffee: "M4 8h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm12 1h2a3 3 0 0 1 0 6h-2M7 3v2M11 3v2M3 23h15",
    monitor: "M4 3h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM12 19v3M8 22h8",
    tabs: "M3 8h18M8 8v13M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    groups: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
    saved: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4-6 4Z",
    search: "M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
    keyboard: "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 4h.01M11 9h.01M15 9h.01M19 9h.01M5 13h.01M9 13h.01M13 13h.01M17 13h.01M8 16h8",
    refresh: "M20 7v5h-5M4 17v-5h5M6.1 6a8 8 0 0 1 13.2 3L20 12M4 12l.7 3A8 8 0 0 0 18 18",
    close: "m6 6 12 12M6 18 18 6",
    more: "M5 12h.01M12 12h.01M19 12h.01",
    chevron: "m9 5 7 7-7 7",
    plus: "M12 5v14M5 12h14",
    move: "M13 5h7v7M20 5l-9 9M10 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5",
    sort: "M8 4v16m-4-4 4 4 4-4M14 5h7M14 10h5M14 15h3",
    folder: "M3 7V5a2 2 0 0 1 2-2h5l2 4h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
    pin: "m16 3 5 5-4 1-4 4v4l-2 2-6-6 2-2h4l4-4 1-4ZM2 22l6-6"
};

export function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", name === "more" ? "3.5" : "1.7");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", ICON_PATHS[name] || ICON_PATHS.tabs);
    svg.append(path);
    return svg;
}

export function field(label, input) {
    const wrapper = node("label", "field");
    wrapper.append(node("span", "", label), input);
    return wrapper;
}

export function textInput(value = "", options = {}) {
    const input = document.createElement("input");
    input.type = options.type || "text";
    input.value = value;
    input.required = options.required !== false;
    input.maxLength = options.maxLength || 80;
    if (options.placeholder)
        input.placeholder = options.placeholder;
    return input;
}

export function selectInput(options, value) {
    const select = document.createElement("select");
    for (const [id, label] of options) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = label;
        select.append(option);
    }
    select.value = value;
    return select;
}

function restoreFocus(anchor) {
    const focusKey = anchor?.dataset.focusKey;
    const currentAnchor = focusKey ? [...document.querySelectorAll("[data-focus-key]")].find((control) => control.dataset.focusKey === focusKey) : anchor;
    const available = currentAnchor?.isConnected && !currentAnchor.disabled && !currentAnchor.closest("[hidden]");
    (available ? currentAnchor : document.getElementById("tab-list"))?.focus({ preventScroll: true });
}

export function openDialog({ title, body, submitLabel = "Save", onSubmit }) {
    const focusAnchor = document.activeElement;
    const dialog = node("dialog", "dialog");
    dialog.setAttribute("aria-labelledby", "dialog-title");
    const form = node("form");
    const heading = node("h2", "dialog-title", title);
    heading.id = "dialog-title";
    const error = node("p", "form-error");
    error.setAttribute("role", "alert");
    const actions = node("div", "dialog-actions");
    const cancel = node("button", "secondary", "Cancel");
    cancel.type = "button";
    cancel.addEventListener("click", () => dialog.close());
    const submit = node("button", "primary", submitLabel);
    submit.type = "submit";
    actions.append(cancel, submit);
    form.append(heading, body, error, actions);
    dialog.append(form);
    document.body.append(dialog);
    let busy = false;
    form.addEventListener("input", () => { error.textContent = ""; });
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (busy)
            return;
        busy = true;
        cancel.disabled = submit.disabled = true;
        error.textContent = "";
        try {
            await onSubmit();
            dialog.close();
        }
        catch (reason) {
            error.textContent = reason?.message || "Could not save. Try again.";
        }
        finally {
            busy = false;
            cancel.disabled = submit.disabled = false;
        }
    });
    dialog.addEventListener("cancel", (event) => {
        if (busy)
            event.preventDefault();
    });
    dialog.addEventListener("close", () => {
        dialog.remove();
        // Saving can replace the launcher's row; another dialog may already
        // have opened before this asynchronous close event is delivered.
        if (!document.querySelector("dialog[open]")) restoreFocus(focusAnchor);
    }, { once: true });
    dialog.showModal();
    return dialog;
}

let currentMenu = null;
export function closeMenu() {
    currentMenu?.remove();
    currentMenu = null;
}

export function openMenu(anchor, items, onError) {
    closeMenu();
    const focusAnchor = () => restoreFocus(anchor);
    const menu = node("div", "menu");
    menu.setAttribute("popover", "auto");
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", anchor.getAttribute("aria-label") || "Actions");
    const buttons = items.map((item) => {
        const button = node("button", item.danger ? "destructive" : "", item.label);
        button.type = "button";
        button.setAttribute("role", "menuitem");
        button.disabled = item.disabled === true;
        button.addEventListener("click", () => {
            closeMenu();
            focusAnchor();
            Promise.resolve().then(item.run).catch(onError);
        });
        menu.append(button);
        return button;
    });
    menu.addEventListener("keydown", (event) => {
        const enabled = buttons.filter((button) => !button.disabled);
        const index = enabled.indexOf(document.activeElement);
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1
                : (index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length;
            enabled[next]?.focus();
        }
        if (event.key === "Escape") {
            event.preventDefault();
            closeMenu();
            focusAnchor();
        }
    });
    document.body.append(menu);
    currentMenu = menu;
    menu.showPopover();
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(rect.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(rect.bottom + 4, innerHeight - menu.offsetHeight - 8))}px`;
    buttons.find((button) => !button.disabled)?.focus();
    menu.addEventListener("toggle", (event) => {
        if (event.newState === "closed") {
            menu.remove();
            if (currentMenu === menu)
                currentMenu = null;
        }
    });
}
