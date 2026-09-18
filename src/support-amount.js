import { parseSupportAmount, SUPPORT_AMOUNT_ERROR, SUPPORT_DEFAULT_AMOUNT } from "./shared/support.js";

export function initSupportAmount(root, onChange, initialAmount = SUPPORT_DEFAULT_AMOUNT) {
    const choices = [...root.querySelectorAll("input[type=radio]")];
    const customField = root.querySelector(".support-custom");
    const input = root.querySelector(".support-custom input");
    const error = root.querySelector(".support-amount-error");
    const parsed = parseSupportAmount(initialAmount);
    const preset = choices.find((choice) => choice.value === parsed?.amount);
    const customChoice = choices.find((choice) => choice.value === "custom");
    (preset || customChoice).checked = true;
    input.value = preset ? "" : String(initialAmount);

    function update(showError = false) {
        const custom = customChoice.checked;
        customField.hidden = !custom;
        const amount = parseSupportAmount(custom ? input.value : choices.find((choice) => choice.checked).value);
        const invalid = custom && !amount && (showError || input.value !== "");
        input.setAttribute("aria-invalid", String(invalid));
        error.textContent = invalid ? SUPPORT_AMOUNT_ERROR : "";
        onChange(amount);
    }

    choices.forEach((choice) => choice.addEventListener("change", () => {
        update();
        if (customChoice.checked) input.focus();
    }));
    input.addEventListener("input", () => update());
    input.addEventListener("blur", () => update(true));
    update();
}
