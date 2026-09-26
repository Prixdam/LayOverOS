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
      .match(/^(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})$/);

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

    return `20${match[3]}-${meses[match[2]]}-${match[1].padStart(2, "0")}`;
  }

  const lineas = texto
    .replace(/\r/g, "")
    .split("\n")
    .map(linea => linea.trim())
    .filter(Boolean);

  const textoCompleto = lineas.join("\n");

  // NÚMERO DE VOUCHER
  const voucher = textoCompleto.match(
    /VOUCHER\s*ID\s*[:\-]?\s*([0-9][0-9\s]{5,})/i
  );

  if (voucher) {
    ponerCampo(
      "numero_voucher",
      voucher[1].replace(/\s/g, "")
    );
  }

  // HUÉSPED
  const nombre = textoCompleto.match(
    /NOMBRE\s*\/?\s*NAME\s*[:\-]?\s*([^\n]+)/i
  );

  if (nombre) {
    ponerCampo(
      "huesped",
      nombre[1].replace(/\s+/g, " ")
    );
  }

  // VUELO
  const vuelo = textoCompleto.match(
    /VUELO\s*\/?\s*FLIGHT\s*[:\-]?\s*([A-Z0-9]+)/i
  );

  if (vuelo) {
    ponerCampo("vuelo", vuelo[1]);
  }

  // FECHA DE VUELO
  const fechaVuelo = textoCompleto.match(
    /FECHA\s*VUELO\s*\/?\s*FLIGHT\s*DATE\s*[:\-]?\s*(\d{1,2}\s*[A-Z]{3}\s*\d{2})/i
  );

  if (fechaVuelo) {
    const fecha = convertirFecha(fechaVuelo[1]);

    if (fecha) {
      ponerCampo("fecha_vuelo", fecha);
    }
  }

  // FECHA DE EMISIÓN
  const fechaEmision = textoCompleto.match(
    /EMITIDO\s*\/?\s*ISSUED.*?(\d{1,2}\s*[A-Z]{3}\s*\d{2})/i
  );

  if (fechaEmision) {
    const fecha = convertirFecha(fechaEmision[1]);

    if (fecha) {
      ponerCampo("fecha_emision", fecha);
    }
  }

  // PAX
  const pax = textoCompleto.match(
    /PAX\s*POR\s*HABITACION\s*[:\-]?\s*(\d+)/i
  );

  if (pax) {
    ponerCampo("pax", pax[1]);
  }

  // ESTADÍA
  const estancia = textoCompleto.match(
    /TIEMPO\s*DE\s*ESTADIA\s*\/?\s*LENGTH\s*OF\s*STAY\s*[:\-]?\s*([^\n]+)/i
  );

  if (estancia) {

    const dias = estancia[1].match(/(\d+)\s*DAY/i);
    const noches = estancia[1].match(/(\d+)\s*NIGHT/i);

    if (dias) {
      ponerCampo("dias", dias[1]);
    }

    if (noches) {
      ponerCampo("noches", noches[1]);
    }
  }

  // SERVICIO
  const servicio = textoCompleto.match(
    /SERVICIO\s*\/?\s*SERVICE\s*[:\-]?\s*([^\n]+)/i
  );

  if (servicio) {
    ponerCampo("servicio", servicio[1]);
  }

  // OPERADO POR
  const operado = textoCompleto.match(
    /OPERADO\s*POR\s*\/?\s*OPERATED\s*BY\s*[:\-]?\s*([^\n]+)/i
  );

  if (operado) {
    ponerCampo("operado_por", operado[1]);
  }

  // CABINA
  const cabina = textoCompleto.match(
    /CABINA\s*\/?\s*CABIN\s*[:\-]?\s*([A-Z])/i
  );

  if (cabina) {
    ponerCampo("cabina", cabina[1].toUpperCase());
  }

  // AEROLÍNEA
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
    "VIVA",
    "VIVA AEROBUS",
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
      "\\b" + aerolinea.replace(/\s+/g, "\\s+") + "\\b",
      "i"
    );

    if (patron.test(textoCompleto)) {
      ponerCampo("aerolinea", aerolinea);
      break;
    }
  }

  // ESTADO
  const estadoCampo =
    formulario.elements.namedItem("estado");

  if (estadoCampo && !estadoCampo.value) {
    estadoCampo.value = "RECIBIDO";
  }

  console.log("Auto llenado ejecutado.");
}
function llenarCamposDesdeOCR(texto) {

  if (!formulario) {
    return;
  }

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
      .match(/^(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})$/);

    if (!match) {
      return "";
    }

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

    const dia = match[1].padStart(2, "0");
    const mes = meses[match[2]];
    const año = "20" + match[3];

    return `${año}-${mes}-${dia}`;
  }

  const lineas = texto
    .split(/\r?\n/)
    .map(linea => linea.trim())
    .filter(Boolean);

  const textoLimpio = lineas.join("\n");

  // VOUCHER ID
  const voucherMatch = textoLimpio.match(
    /VOUCHER\s*ID\s*[:\-]?\s*([0-9][0-9\s]{5,})/i
  );

  if (voucherMatch) {
    ponerCampo(
      "numero_voucher",
      voucherMatch[1].replace(/\s/g, "")
    );
  }

  // NOMBRE
  const nombreMatch = textoLimpio.match(
    /NOMBRE\s*\/?\s*NAME\s*[:\-]?\s*([^\n]+)/i
  );

  if (nombreMatch) {
    ponerCampo(
      "huesped",
      nombreMatch[1]
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  // VUELO
  const vueloMatch = textoLimpio.match(
    /VUELO\s*\/?\s*FLIGHT\s*[:\-]?\s*([A-Z0-9]+)/i
  );

  if (vueloMatch) {
    ponerCampo("vuelo", vueloMatch[1]);
  }

  // FECHA DE VUELO
  const fechaVueloMatch = textoLimpio.match(
    /FECHA\s*VUELO\s*\/?\s*FLIGHT\s*DATE\s*[:\-]?\s*([0-9]{1,2}\s*[A-Z]{3}\s*[0-9]{2})/i
  );

  if (fechaVueloMatch) {
    const fecha = convertirFecha(fechaVueloMatch[1]);

    if (fecha) {
      ponerCampo("fecha_vuelo", fecha);
    }
  }

  // FECHA DE EMISIÓN
  const fechaEmisionMatch = textoLimpio.match(
    /EMITIDO\s*\/?\s*ISSUED\s*[:\-]?\s*([0-9]{1,2}\s*[A-Z]{3}\s*[0-9]{2})/i
  );

  if (fechaEmisionMatch) {
    const fecha = convertirFecha(fechaEmisionMatch[1]);

    if (fecha) {
      ponerCampo("fecha_emision", fecha);
    }
  }

  // PAX
  const paxMatch = textoLimpio.match(
    /PAX\s*POR\s*HABITACION\s*[:\-]?\s*([0-9]+)/i
  );

  if (paxMatch) {
    ponerCampo("pax", paxMatch[1]);
  }

  // ESTADÍA
  const estanciaMatch = textoLimpio.match(
    /TIEMPO\s*DE\s*ESTADIA\s*\/?\s*LENGTH\s*OF\s*STAY\s*[:\-]?\s*([^\n]+)/i
  );

  if (estanciaMatch) {

    const estancia = estanciaMatch[1];

    const diasMatch = estancia.match(/(\d+)\s*DAY/i);
    const nochesMatch = estancia.match(/(\d+)\s*NIGHT/i);

    if (diasMatch) {
      ponerCampo("dias", diasMatch[1]);
    }

    if (nochesMatch) {
      ponerCampo("noches", nochesMatch[1]);
    }
  }

  // SERVICIO
  const servicioMatch = textoLimpio.match(
    /SERVICIO\s*\/?\s*SERVICE\s*[:\-]?\s*([^\n]+)/i
  );

  if (servicioMatch) {
    ponerCampo(
      "servicio",
      servicioMatch[1]
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  // OPERADO POR
  const operadoMatch = textoLimpio.match(
    /OPERADO\s*POR\s*\/?\s*OPERATED\s*BY\s*[:\-]?\s*([^\n]+)/i
  );

  if (operadoMatch) {
    ponerCampo(
      "operado_por",
      operadoMatch[1]
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  // CABINA
  const cabinaMatch = textoLimpio.match(
    /CABINA\s*\/?\s*CABIN\s*[:\-]?\s*([A-Z])/i
  );

  if (cabinaMatch) {
    ponerCampo("cabina", cabinaMatch[1].toUpperCase());
  }

  // AEROLÍNEA
  const aerolineaMatch = textoLimpio.match(
    /\b(AVIANCA)\b/i
  );

  if (aerolineaMatch) {
    ponerCampo("aerolinea", "AVIANCA");
  }

  // Estado inicial
  const estadoCampo =
    formulario.elements.namedItem("estado");

  if (estadoCampo && !estadoCampo.value) {
    estadoCampo.value = "RECIBIDO";
  }

  console.log("Campos identificados automáticamente.");
}

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
      llenarCamposDesdeOCR(texto);

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
