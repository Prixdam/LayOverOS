const archivo = document.getElementById("file-input");
const imagen = document.getElementById("preview-img");
const estado = document.getElementById("status-msg");
const formulario = document.getElementById("voucher-form");

const tabs = document.querySelectorAll(".tab-btn");
const vistas = document.querySelectorAll(".view");


function llenarCamposDesdeOCR(texto) {

  if (!formulario) return;

  function ponerCampo(nombre, valor) {

    const campo = formulario.elements.namedItem(nombre);

    if (campo && valor) {
      campo.value = valor.trim();
    }
  }


  function convertirFecha(fechaTexto) {

    const match = fechaTexto
      .toUpperCase()
      .replace(/\s+/g, "")
      .match(
        /^(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})$/
      );

    if (!match) return "";

    const meses = {
      JAN: "01",
      FEB: "02",
      MAR: "03",
      APR: "04",
      MAY: "05",
      JUN: "06",
      JUL: "07",
      AUG: "08",
      SEP: "09",
      OCT: "10",
      NOV: "11",
      DEC: "12"
    };

    return (
      "20" +
      match[3] +
      "-" +
      meses[match[2]] +
      "-" +
      match[1].padStart(2, "0")
    );
  }


  const lineas = texto
    .replace(/\r/g, "")
    .split("\n")
    .map(linea => linea.trim())
    .filter(Boolean);


  const textoCompleto = lineas.join("\n");


  // =====================================================
  // NÚMERO DE VOUCHER
  // =====================================================

  const voucher = textoCompleto.match(
    /VOUCHER\s*ID\s*[:\-]?\s*([0-9][0-9\s]{5,})/i
  );

  if (voucher) {

    ponerCampo(
      "numero_voucher",
      voucher[1].replace(/\s/g, "")
    );

  }


  // =====================================================
  // HUÉSPED
  // =====================================================

  const nombre = textoCompleto.match(
    /(?:NOMBRE|NAME)\s*[:\-]?\s*([A-ZÁÉÍÓÚÑ][^\n]+)/i
  );

  if (nombre) {

    let nombreLimpio = nombre[1]
      .replace(/\s+/g, " ")
      .trim();

    // Evitar que OCR capture otra etiqueta como nombre
    if (
      nombreLimpio &&
      !/^(FLIGHT|FECHA|DATE|ISSUED|EMITIDO|VOUCHER|SERVICE|SERVICIO)$/i.test(nombreLimpio)
    ) {

      ponerCampo(
        "huesped",
        nombreLimpio
      );

    }

  }


  // =====================================================
  // VUELO
  // =====================================================

  const vuelo = textoCompleto.match(
    /(?:VUELO|FLIGHT)\s*[:\-]?\s*(?:VUELO|FLIGHT)?\s*([A-Z]{2,3}\s*\d{1,5})/i
  );

  if (vuelo) {

    ponerCampo(
      "vuelo",
      vuelo[1].replace(/\s+/g, "").toUpperCase()
    );

  }


  // =====================================================
  // FECHA DE VUELO
  // =====================================================

  const fechaVuelo = textoCompleto.match(
    /(?:FECHA\s*VUELO|FLIGHT\s*DATE)\s*[:\-]?\s*(\d{1,2}\s*[A-Z]{3}\s*\d{2})/i
  );

  if (fechaVuelo) {

    const fecha = convertirFecha(
      fechaVuelo[1]
    );

    if (fecha) {

      ponerCampo(
        "fecha_vuelo",
        fecha
      );

    }

  }


  // =====================================================
  // FECHA DE EMISIÓN
  // =====================================================

  const fechaEmision = textoCompleto.match(
    /(?:EMITIDO|ISSUED)\s*[:\-]?\s*(\d{1,2}\s*[A-Z]{3}\s*\d{2})/i
  );

  if (fechaEmision) {

    const fecha = convertirFecha(
      fechaEmision[1]
    );

    if (fecha) {

      ponerCampo(
        "fecha_emision",
        fecha
      );

    }

  }


  // =====================================================
  // ESTADÍA
  // =====================================================

  const estancia = textoCompleto.match(
    /(?:TIEMPO\s*DE\s*ESTADIA|LENGTH\s*OF\s*STAY)\s*[:\-]?\s*([^\n]+)/i
  );

  if (estancia) {

    const dias = estancia[1].match(
      /(\d+)\s*DAY/i
    );

    const noches = estancia[1].match(
      /(\d+)\s*NIGHT/i
    );


    if (dias) {

      ponerCampo(
        "dias",
        dias[1]
      );

    }


    if (noches) {

      ponerCampo(
        "noches",
        noches[1]
      );

    }

  }


  // =====================================================
  // OPERADO POR
  // =====================================================

  const operado = textoCompleto.match(
    /(?:OPERADO\s*POR|OPERATED\s*BY)\s*[:\-]?\s*([^\n]+)/i
  );

  if (operado) {

    ponerCampo(
      "operado_por",
      operado[1]
        .replace(/\s+/g, " ")
        .trim()
    );

  }


  // =====================================================
  // CABINA
  // =====================================================

  const cabina = textoCompleto.match(
    /(?:CABINA|CABIN)\s*[:\-]?\s*([A-Z])/i
  );

  if (cabina) {

    ponerCampo(
      "cabina",
      cabina[1].toUpperCase()
    );

  }


  // =====================================================
  // AEROLÍNEA
  // =====================================================

  const aerolineas = [
    "AVIANCA",
    "LATAM",
    "COPA AIRLINES",
    "AMERICAN AIRLINES",
    "UNITED AIRLINES",
    "DELTA AIR LINES",
    "JETBLUE",
    "AIR CANADA",
    "IBERIA",
    "AEROMEXICO",
    "SPIRIT AIRLINES",
    "FRONTIER AIRLINES",
    "VIVA AEROBUS",
    "VIVA",
    "WINGO",
    "SATENA",
    "KLM",
    "AIR FRANCE",
    "LUFTHANSA",
    "TURKISH AIRLINES",
    "QATAR AIRWAYS",
    "EMIRATES"
  ];


  for (const aerolinea of aerolineas) {

    const patron = new RegExp(
      "\\b" +
      aerolinea.replace(/\s+/g, "\\s+") +
      "\\b",
      "i"
    );


    if (patron.test(textoCompleto)) {

      ponerCampo(
        "aerolinea",
        aerolinea
      );

      break;

    }

  }


  // =====================================================
  // NIVEL DE TARIFA
  // =====================================================
  // Solo se llena si aparece explícitamente.
  // Ejemplo: INSIGNIA
  // =====================================================

  const nivelesTarifa = [
    "INSIGNIA",
    "CLASSIC",
    "FLEX",
    "BUSINESS",
    "PREMIUM",
    "AV-LM1"
  ];


  for (const nivel of nivelesTarifa) {

    const patron = new RegExp(
      "\\b" +
      nivel.replace("-", "\\-") +
      "\\b",
      "i"
    );


    if (patron.test(textoCompleto)) {

      ponerCampo(
        "fare_level",
        nivel
      );

      break;

    }

  }


  console.log(
    "Campos identificados automáticamente."
  );

}



// =====================================================
// PESTAÑAS
// =====================================================

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



// =====================================================
// OCR
// =====================================================

if (archivo) {

  archivo.addEventListener(
    "change",
    async function () {

      const foto = this.files[0];

      if (!foto) return;


      imagen.src =
        URL.createObjectURL(foto);

      imagen.hidden = false;


      if (estado) {

        estado.hidden = false;

        estado.textContent =
          "Foto cargada. Preparando OCR...";

      }


      if (!window.Tesseract) {

        if (estado) {

          estado.textContent =
            "No se pudo cargar el motor OCR.";

        }

        return;

      }


      try {

        const resultado =
          await Tesseract.recognize(
            foto,
            "eng",
            {

              logger: function (info) {

                if (
                  info.status === "recognizing text" &&
                  estado
                ) {

                  const porcentaje =
                    Math.round(
                      info.progress * 100
                    );


                  estado.textContent =
                    "Analizando voucher... " +
                    porcentaje +
                    "%";

                }

              }

            }
          );


        const texto =
          resultado.data.text.trim();


        console.log(
          "TEXTO OCR:"
        );

        console.log(
          texto
        );


        llenarCamposDesdeOCR(
          texto
        );


        if (formulario) {

          formulario.hidden = false;


          const observaciones =
            formulario.elements.namedItem(
              "observaciones"
            );


          if (observaciones) {

            observaciones.value =
              texto;

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

    }

  );

}



// =====================================================
// CANCELAR
// =====================================================

const cancelar =
  document.getElementById(
    "btn-cancel"
  );


if (cancelar) {

  cancelar.addEventListener(
    "click",
    () => {

      if (formulario) {

        formulario.reset();

        formulario.hidden = true;

      }


      if (imagen) {

        imagen.hidden = true;

        imagen.removeAttribute(
          "src"
        );

      }


      if (archivo) {

        archivo.value = "";

      }


      if (estado) {

        estado.hidden = true;

        estado.textContent = "";

      }

    }
  );

}
