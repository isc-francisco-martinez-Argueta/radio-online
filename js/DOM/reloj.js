const d = document;

export function digitalClock(clock) {
    setInterval(() => {
        // Obtener la hora actual en la zona horaria de Ciudad de México
        let options = {
            timeZone: 'America/Mexico_City',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        let clockHour = new Date().toLocaleTimeString('en-US', options);
        
        // Mostrar la hora en el elemento especificado
        d.querySelector(clock).innerHTML = `<h6 class="p-0 m-0">${clockHour}</h6>`;
    }, 1000);
}