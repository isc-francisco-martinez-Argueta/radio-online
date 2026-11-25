const d = document;

/**
 * Sin internet (sobre todo en la app instalada, que abre aunque no haya conexión):
 *  - Franja fija bajo la barra: "Sin conexión · La radio en vivo necesita internet".
 *  - Al volver la conexión: se quita la franja y aparece el aviso "Conexión recuperada".
 *  - Marca <html class="sin-conexion"> para que el resto (reproductor, videos) se adapte.
 */
export default function conexion() {
    const $barra = d.createElement("div");
    $barra.className = "offline-bar";
    $barra.setAttribute("role", "status");
    $barra.hidden = true;
    $barra.innerHTML = `
        <i class="fas fa-wifi" aria-hidden="true"></i>
        <span><strong>Sin conexión.</strong> La radio en vivo necesita internet.</span>`;
    d.body.appendChild($barra);

    let estabaSinConexion = false;
    function pintar() {
        const sin = navigator.onLine === false;
        $barra.hidden = !sin;
        d.documentElement.classList.toggle("sin-conexion", sin);
        d.dispatchEvent(new CustomEvent("vos:conexion", { detail: { enLinea: !sin } }));

        if (!sin && estabaSinConexion) {
            d.dispatchEvent(new CustomEvent("vos:aviso", {
                detail: { message: "Conexión recuperada. Ya puedes escuchar la radio en vivo.", type: "success" },
            }));
        }
        estabaSinConexion = sin;
    }

    window.addEventListener("online", pintar);
    window.addEventListener("offline", pintar);
    pintar();
}
