const archivo = document.getElementById("file-input");
const imagen = document.getElementById("preview-img");
const estado = document.getElementById("status-msg");
const formulario = document.getElementById("voucher-form");

const tabs = document.querySelectorAll(".tab-btn");
const vistas = document.querySelectorAll(".view");


// =====================================================
// FUNCIÓN PRINCIPAL: EXTRAER DATOS DEL OCR
// =====================================================

function llenarCamposDesdeOCR(texto) {

  if (!formulario) return;


  function ponerCampo(nombre, valor) {

    const campo =
      formulario.elements.namedItem(nombre);

    if (campo && valor) {
      campo.value = valor.trim();
    }
  }


  function convertirFecha(fechaTexto) {

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

    const limpio =
      fechaTexto
        .toUpperCase()
        .replace(/\s+/g, "");

    const match =
      limpio.match(
        /^(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})$/
      );

    if (!match) {
      return "";
    }

    return (
      "20" +
      match[3] +
      "-" +
      meses[match[2]] +
      "-" +
      match[1].padStart(2, "0")
    );
  }


  const lineas =
    texto
      .replace(/\r/g, "")
      .split("\n")
      .map(linea => linea.trim())
      .filter(Boolean);


  console.log("LÍNEAS OCR:", lineas);


  // =====================================================
  // NÚMERO DE VOUCHER
  // =====================================================

  for (let i = 0; i < lineas.length; i++) {

    if (/VOUCHER\s*ID/i.test(lineas[i])) {

      let encontrado =
        lineas[i].match(/\d{6,}/);

      if (!encontrado && lineas[i + 1]) {

        encontrado =
          lineas[i + 1].match(/\d{6,}/);

      }

      if (encontrado) {

        ponerCampo(
          "numero_voucher",
          encontrado[0]
        );

      }

      break;
    }
  }


  // =====================================================
  // HUÉSPED
  // =====================================================

  for (let i = 0; i < lineas.length; i++) {

    if (
      /^(NOMBRE|NAME)\b/i.test(
        lineas[i]
      )
    ) {

      let valor =
        lineas[i]
          .replace(
            /^(NOMBRE|NAME)\s*[:\-]?\s*/i,
            ""
          )
          .trim();

      if (!valor && lineas[i + 1]) {
        valor =
          lineas[i + 1].trim();
      }

      if (
        valor &&
        !/^(FLIGHT|VUELO|DATE|FECHA|ISSUED|EMITIDO|SERVICE|SERVICIO)$/i.test(valor)
      ) {

        ponerCampo(
          "huesped",
          valor.replace(/\s+/g, " ")
        );

      }

      break;
    }
  }


  // =====================================================
  // VUELO
  // =====================================================

  for (let i = 0; i < lineas.length; i++) {

    if (
      /^(VUELO|FLIGHT)\b/i.test(
        lineas[i]
      )
    ) {

      let valor =
        lineas[i]
          .replace(
            /^(VUELO|FLIGHT)\s*[:\-]?\s*/i,
            ""
          )
          .trim();

      if (
        !valor ||
        /^FLIGHT$/i.test(valor) ||
        /^VUELO$/i.test(valor)
      ) {

        if (lineas[i + 1]) {
          valor =
            lineas[i + 1].trim();
        }

      }

      const encontrado =
        valor.match(
          /\b([A-Z]{2,3}\s*\d{1,5})\b/i
        );

      if (encontrado) {

        ponerCampo(
          "vuelo",
          encontrado[1]
            .replace(/\s+/g, "")
            .toUpperCase()
        );

      }

      break;
    }
  }


  // =====================================================
  // FECHA DE VUELO
  // =====================================================

  for (let i = 0; i < lineas.length; i++) {

    if (
      /FECHA\s*VUELO|FLIGHT\s*DATE/i.test(
        lineas[i]
      )
    ) {

      let valor =
        lineas[i]
          .replace(
            /.*?(FECHA\s*VUELO|FLIGHT\s*DATE)\s*[:\-]?\s*/i,
            ""
          )
          .trim();

      if (!valor && lineas[i + 1]) {
        valor =
          lineas[i + 1].trim();
      }

      const encontrado =
        valor.match(
          /\b\d{1,2}\s*[A-Z]{3}\s*\d{2}\b/i
        );

      if (encontrado) {

        const fecha =
          convertirFecha(
            encontrado[0]
          );

        if (fecha) {

          ponerCampo(
            "fecha_vuelo",
            fecha
          );

        }

      }

      break;
    }
  }


  // =====================================================
  // FECHA DE EMISIÓN
  // =====================================================

  for (let i = 0; i < lineas.length; i++) {

    if (
      /^(EMITIDO|ISSUED)\b/i.test(
        lineas[i]
      )
    ) {

      let valor =
        lineas[i]
          .replace(
            /^(EMITIDO|ISSUED)\s*[:\-]?\s*/i,
            ""
          )
          .trim();

      if (!valor && lineas[i + 1]) {
        valor =
          lineas[i + 1].trim();
      }

      const encontrado =
        valor.match(
          /\b\d{1,2}\s*[A-Z]{3}\s*\d{2}\b/i
        );

      if (encontrado) {

        const fecha =
          convertirFecha(
            encontrado[0]
          );

        if (fecha) {

          ponerCampo(
            "fecha_emision",
            fecha
          );

        }

      }

      break;
    }
  }


  // =====================================================
  // DÍAS
  // =====================================================

  const dias =
    texto.match(
      /(\d+)\s*DAY\b/i
    );

  if (dias) {

    ponerCampo(
      "dias",
      dias[1]
    );

  }


  // =====================================================
  // NOCHES
  // =====================================================

  const noches =
    texto.match(
      /(\d+)\s*NIGHT\b/i
    );

  if (noches) {

    ponerCampo(
      "noches",
      noches[1]
    );

  }


  // =====================================================
  // OPERADO POR
  // =====================================================

  for (let i = 0; i < lineas.length; i++) {

    if (
      /OPERADO\s*POR|OPERATED\s*BY/i.test(
        lineas[i]
      )
    ) {

      let valor =
        lineas[i]
          .replace(
            /.*?(OPERADO\s*POR|OPERATED\s*BY)\s*[:\-]?\s*/i,
            ""
          )
          .trim();

      if (!valor && lineas[i + 1]) {
        valor =
          lineas[i + 1].trim();
      }

      if (valor) {

        ponerCampo(
          "operado_por",
          valor
        );

      }

      break;
    }
  }


  // =====================================================
  // CABINA
  // =====================================================

  for (let i = 0; i < lineas.length; i++) {

    if (
      /^(CABINA|CABIN)\b/i.test(
        lineas[i]
      )
    ) {

      let valor =
        lineas[i]
          .replace(
            /^(CABINA|CABIN)\s*[:\-]?\s*/i,
            ""
          )
          .trim();

      if (!valor && lineas[i + 1]) {
        valor =
          lineas[i + 1].trim();
      }

      const encontrado =
        valor.match(
          /\b([A-Z])\b/i
        );

      if (encontrado) {

        ponerCampo(
          "cabina",
          encontrado[1].toUpperCase()
        );

      }

      break;
    }
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

    const patron =
      new RegExp(
        "\\b" +
        aerolinea.replace(
          /\s+/g,
          "\\s+"
        ) +
        "\\b",
        "i"
      );

    if (patron.test(texto)) {

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

  const nivelesTarifa = [
    "INSIGNIA",
    "CLASSIC",
    "FLEX",
    "BUSINESS",
    "PREMIUM",
    "AV-LM1"
  ];

  for (const nivel of nivelesTarifa) {

    const patron =
      new RegExp(
        "\\b" +
        nivel.replace(
          "-",
          "\\-"
        ) +
        "\\b",
        "i"
      );

    if (patron.test(texto)) {

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

    tab.addEventListener(
      "click",
      () => {

        tabs.forEach((item) => {
          item.classList.remove("active");
        });

        vistas.forEach((vista) => {
          vista.classList.remove("active");
        });

        tab.classList.add("active");

        const vista =
          document.getElementById(
            "view-" + tab.dataset.view
          );

        if (vista) {
          vista.classList.add("active");
        }

        // Cuando abrimos Registro,
        // cargamos los vouchers guardados.
        if (
          tab.dataset.view === "registro"
        ) {
          cargarRegistro();
        }

      }
    );

  });

}


// =====================================================
// CARGAR FOTO Y EJECUTAR OCR
// =====================================================

if (archivo) {

  archivo.addEventListener(
    "change",
    async function () {

      const foto =
        this.files[0];

      if (!foto) {
        return;
      }

      imagen.src =
        URL.createObjectURL(
          foto
        );

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
                  info.status ===
                    "recognizing text" &&
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

        console.log(texto);


        // IMPORTANTE:
        // Aquí NO mostramos alert().
        // El texto pasa directamente
        // al parser.

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
// SUPABASE
// =====================================================

const supabaseClient =
  window.supabaseClient ||
  (
    window.supabase &&
    window.SUPABASE_URL &&
    window.SUPABASE_ANON_KEY
      ? window.supabase.createClient(
          window.SUPABASE_URL,
          window.SUPABASE_ANON_KEY
        )
      : null
  );


// =====================================================
// VARIABLES DEL REGISTRO
// =====================================================

const registroList =
  document.getElementById(
    "registro-list"
  );

const buscador =
  document.getElementById(
    "search-input"
  );

const botonExportar =
  document.getElementById(
    "btn-export"
  );

let registros = [];


// =====================================================
// CARGAR REGISTROS DESDE SUPABASE
// =====================================================

async function cargarRegistro() {

  if (!registroList) {
    return;
  }


  if (!supabaseClient) {

    registroList
    // =====================================================
// BUSCAR REGISTROS
// =====================================================

if (buscador) {

  buscador.addEventListener(
    "input",
    function () {

      const termino =
        this.value
          .trim()
          .toLowerCase();


      if (!termino) {

        mostrarRegistros(
          registros
        );

        return;
      }


      const filtrados =
        registros.filter(
          (voucher) => {

            const texto = [

              voucher.numero_voucher,
              voucher.huesped,
              voucher.vuelo,
              voucher.aerolinea

            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


            return texto.includes(
              termino
            );

          }
        );


      mostrarRegistros(
        filtrados
      );

    }
  );

}


// =====================================================
// GUARDAR VOUCHER
// =====================================================

if (formulario) {

  formulario.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      if (!supabaseClient) {

        if (estado) {

          estado.hidden = false;

          estado.textContent =
            "No se pudo conectar con Supabase.";

        }

        return;
      }


      const datos =
        Object.fromEntries(
          new FormData(
            formulario
          )
        );


      function convertirNumero(
        valor
      ) {

        if (
          valor === "" ||
          valor === null ||
          valor === undefined
        ) {

          return null;

        }

        return Number(valor);

      }


      const payload = {

        numero_voucher:
          datos.numero_voucher ||
          null,

        aerolinea:
          datos.aerolinea ||
          null,

        huesped:
          datos.huesped ||
          null,

        vuelo:
          datos.vuelo ||
          null,

        fecha_vuelo:
          datos.fecha_vuelo ||
          null,

        fecha_emision:
          datos.fecha_emision ||
          null,

        habitacion:
          datos.habitacion ||
          null,

        servicio:
          datos.servicio ||
          null,

        dias:
          convertirNumero(
            datos.dias
          ),

        noches:
          convertirNumero(
            datos.noches
          ),

        pax:
          convertirNumero(
            datos.pax
          ),

        operado_por:
          datos.operado_por ||
          null,

        cabina:
          datos.cabina ||
          null,

        fare_level:
          datos.fare_level ||
          null,

        estado:
          datos.estado ||
          "RECIBIDO",

        observaciones:
          datos.observaciones ||
          null

      };


      if (estado) {

        estado.hidden = false;

        estado.textContent =
          "Guardando voucher...";

      }


      const { error } =
        await supabaseClient
          .from("vouchers")
          .insert([
            payload
          ]);


      if (error) {

        console.error(
          "Error guardando voucher:",
          error
        );


        if (estado) {

          estado.textContent =
            "No se pudo guardar el voucher.";

        }

        return;
      }


      if (estado) {

        estado.textContent =
          "Voucher guardado correctamente.";

      }


      formulario.reset();

      formulario.hidden = true;


      if (imagen) {

        imagen.hidden = true;

        imagen.removeAttribute(
          "src"
        );

      }


      if (archivo) {

        archivo.value = "";

      }


      await cargarRegistro();

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


// =====================================================
// EXPORTAR A EXCEL
// =====================================================

if (botonExportar) {

  botonExportar.addEventListener(
    "click",
    () => {

      if (!registros.length) {

        alert(
          "No hay registros para exportar."
        );

        return;

      }


      if (!window.XLSX) {

        alert(
          "No se pudo cargar el exportador de Excel."
        );

        return;

      }


      const datosExcel =
        registros.map(
          (voucher) => ({

            "Número voucher":
              voucher.numero_voucher || "",

            "Aerolínea":
              voucher.aerolinea || "",

            "Pasajero":
              voucher.huesped || "",

            "Vuelo":
              voucher.vuelo || "",

            "Fecha vuelo":
              voucher.fecha_vuelo || "",

            "Fecha emisión":
              voucher.fecha_emision || "",

            "Habitación":
              voucher.habitacion || "",

            "Servicio":
              voucher.servicio || "",

            "Días":
              voucher.dias ?? "",

            "Noches":
              voucher.noches ?? "",

            "PAX":
              voucher.pax ?? "",

            "Operado por":
              voucher.operado_por || "",

            "Cabina":
              voucher.cabina || "",

            "Nivel tarifa":
              voucher.fare_level || "",

            "Estado":
              voucher.estado || "",

            "Observaciones":
              voucher.observaciones || ""

          })
        );


      const hoja =
        XLSX.utils.json_to_sheet(
          datosExcel
        );


      const libro =
        XLSX.utils.book_new();
    }

     
