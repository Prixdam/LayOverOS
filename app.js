const archivo = document.getElementById("file-input");
const imagen = document.getElementById("preview-img");
const estado = document.getElementById("status-msg");
const formulario = document.getElementById("voucher-form");

if (archivo) {
  archivo.addEventListener("change", async function () {

    const foto = this.files[0];

    if (!foto) return;

    imagen.src = URL.createObjectURL(foto);
    imagen.hidden = false;

    estado.hidden = false;
    estado.textContent = "Foto cargada. Analizando voucher...";

    try {

      const lector = new FileReader();

      lector.onload = async function () {

        const respuesta = await fetch("/api/ocr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: lector.result
          })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            resultado.error || "Error al analizar el voucher"
          );
        }

        const datos =
          resultado.data ||
          resultado.voucher ||
          resultado.result ||
          resultado;

        console.log("DATOS OCR:", datos);

        formulario.hidden = false;

        const campos = [
          "numero_voucher",
          "aerolinea",
          "huesped",
          "vuelo",
          "fecha_vuelo",
          "fecha_emision",
          "habitacion",
          "servicio",
          "dias",
          "noches",
          "pax",
          "operado_por",
          "cabina",
          "fare_level",
          "observaciones"
        ];

        campos.forEach(function (nombre) {

          const campo = formulario.elements.namedItem(nombre);

          if (!campo) return;

          if (datos[nombre] !== undefined) {
            campo.value = datos[nombre] ?? "";
          }

        });

        estado.textContent =
          "Voucher analizado. Revisa los datos.";

      };

      lector.onerror = function () {
        throw new Error("No se pudo leer la fotografía.");
      };

      lector.readAsDataURL(foto);

    } catch (error) {

      console.error(error);

      estado.textContent =
        "Error al analizar: " + error.message;
    }

  });
}
