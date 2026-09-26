const archivo = document.getElementById("file-input");
const imagen = document.getElementById("preview-img");
const estado = document.getElementById("status-msg");
const formulario = document.getElementById("voucher-form");

const tabs = document.querySelectorAll(".tab-btn");
const vistas = document.querySelectorAll(".view");

if (tabs.length) {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        item.classList.remove("active");
      });

      vistas.forEach((vista) => {
        vista.classList.remove("active");
      });

      tab.classList.add("active");

      const vista = document.getElementById(
        "view-" + tab.dataset.view
      );

      if (vista) {
        vista.classList.add("active");
      }
    });
  });
}

if (archivo) {
  archivo.addEventListener("change", async function () {

    const foto = this.files[0];

    if (!foto) {
      return;
    }

    imagen.src = URL.createObjectURL(foto);
    imagen.hidden = false;

    if (estado) {
      estado.hidden = false;
      estado.textContent = "Foto cargada. Preparando OCR...";
    }

    if (!window.Tesseract) {
      if (estado) {
        estado.textContent =
          "No se pudo cargar el motor OCR.";
      }

      return;
    }

    try {

      const resultado = await Tesseract.recognize(
        foto,
        "eng",
        {
          logger: function (info) {

            if (
              info.status === "recognizing text" &&
              estado
            ) {

              const porcentaje =
                Math.round(info.progress * 100);

              estado.textContent =
                "Analizando voucher... " +
                porcentaje +
                "%";
            }
          }
        }
      );

      const texto = resultado.data.text.trim();

      console.log("TEXTO OCR:");
      console.log(texto);

      if (formulario) {
        formulario.hidden = false;

        const observaciones =
          formulario.elements.namedItem(
            "observaciones"
          );

        if (observaciones) {
          observaciones.value = texto;
        }
      }

      if (estado) {
        estado.textContent =
          "Voucher analizado. Revisa la información.";
      }

    } catch (error) {

      console.error(
        "Error OCR:",
        error
      );

      if (estado) {
        estado.textContent =
          "No se pudo analizar el voucher.";
      }
    }
  });
}

const cancelar =
  document.getElementById("btn-cancel");

if (cancelar) {

  cancelar.addEventListener("click", () => {

    if (formulario) {
      formulario.reset();
      formulario.hidden = true;
    }

    if (imagen) {
      imagen.hidden = true;
      imagen.removeAttribute("src");
    }

    if (archivo) {
      archivo.value = "";
    }

    if (estado) {
      estado.hidden = true;
      estado.textContent = "";
    }
  });
}
