const d = document;

const CLOCK_OPTIONS = {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
};

export function digitalClock(clock) {
    const container = d.querySelector(clock);
    if (!container) {
        console.warn(`digitalClock: no se encontró el elemento "${clock}"`);
        return;
    }

    // Reutilizar el <h6> existente en vez de reescribir innerHTML cada segundo
    let output = container.querySelector("h6");
    if (!output) {
        output = d.createElement("h6");
        output.className = "p-0 m-0";
        container.appendChild(output);
    }

    const render = () => {
        output.textContent = new Date().toLocaleTimeString("en-US", CLOCK_OPTIONS);
    };

    render();
    setInterval(render, 1000);
}
