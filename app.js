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



// =====================================================
// SUPABASE (guardado y registro)
// =====================================================

const SUPABASE_URL = "https://hyosutjoajvmsqjjfacs.supabase.co";
const SUPABASE_KEY = "sb_publishable_P7KvAWyd6mORIFe9_IWi8A_T9M_1fAe";
const HOTEL_ID = "principal";

const db =
  SUPABASE_URL.startsWith("https://") && window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

let registros = [];

const listaRegistro = document.getElementById("registro-list");
const buscador = document.getElementById("search-input");
const botonExportar = document.getElementById("btn-export");


function escapar(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


function fechaLegible(iso) {
  if (!iso) return "";
  const partes = String(iso).split("-");
  if (partes.length !== 3) return iso;
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}


function registrosFiltrados() {
  const q = (buscador ? buscador.value : "").trim().toLowerCase();
  if (!q) return registros;

  return registros.filter((r) =>
    [r.numero_voucher, r.huesped, r.vuelo, r.aerolinea]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}


function pintarRegistros() {
  if (!listaRegistro) return;

  const filas = registrosFiltrados();

  if (!filas.length) {
    listaRegistro.innerHTML =
      '<p class="empty-state">No hay vouchers para mostrar.</p>';
    return;
  }

  listaRegistro.innerHTML = filas
    .map(
      (r) => `
      <div class="registro-item" style="border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:12px;margin-bottom:10px;">
        <strong>Voucher ${escapar(r.numero_voucher || "sin número")}</strong>
        <span style="float:right;font-size:12px;">${escapar(r.estado)}</span>
        <div>${escapar(r.huesped)}</div>
        <div style="font-size:13px;opacity:.8;">
          ${escapar(r.aerolinea)} ${escapar(r.vuelo)}
          ${r.fecha_vuelo ? "· " + fechaLegible(r.fecha_vuelo) : ""}
          ${r.noches ? "· " + escapar(r.noches) + " noches" : ""}
          ${r.pax ? "· " + escapar(r.pax) + " pax" : ""}
        </div>
        ${
          r.imagen_url
            ? `<a href="${escapar(r.imagen_url)}" target="_blank" rel="noopener">
                 <img src="${escapar(r.imagen_url)}" alt="Foto del voucher" loading="lazy"
                      style="width:100%;max-width:220px;border-radius:8px;margin-top:8px;display:block;">
               </a>`
            : ""
        }
      </div>`
    )
    .join("");
}


async function cargarRegistros() {
  if (!listaRegistro) return;

  if (!db) {
    listaRegistro.innerHTML =
      '<p class="empty-state">Falta configurar la URL de Supabase en app.js.</p>';
    return;
  }

  listaRegistro.innerHTML =
    '<p class="empty-state">Cargando registros...</p>';

  const { data, error } = await db
    .from("vouchers")
    .select("*")
    .eq("hotel_id", HOTEL_ID)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando registros:", error);
    listaRegistro.innerHTML =
      '<p class="empty-state">No se pudieron cargar los registros.</p>';
    return;
  }

  registros = data || [];
  pintarRegistros();
}


// ---- Foto del voucher (Supabase Storage) ----

async function reducirFoto(archivoImg) {
  try {
    const bmp = await createImageBitmap(archivoImg);
    const maximo = 1800;
    const escala = Math.min(1, maximo / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", 0.85)
    );
    return blob || archivoImg;
  } catch (err) {
    return archivoImg;
  }
}


async function subirFoto(archivoImg) {
  const blob = await reducirFoto(archivoImg);
  const ruta = HOTEL_ID + "/" + crypto.randomUUID() + ".jpg";

  const { error } = await db.storage
    .from("vouchers")
    .upload(ruta, blob, { contentType: blob.type || "image/jpeg" });

  if (error) throw error;

  return db.storage.from("vouchers").getPublicUrl(ruta).data.publicUrl;
}


// ---- Guardar voucher ----

if (formulario) {

  formulario.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!db) {
      if (estado) {
        estado.hidden = false;
        estado.textContent = "Falta configurar la URL de Supabase en app.js.";
      }
      return;
    }

    const enteros = ["dias", "noches", "pax"];
    const fila = { hotel_id: HOTEL_ID };

    for (const [clave, valor] of new FormData(formulario).entries()) {
      const limpio = typeof valor === "string" ? valor.trim() : valor;

      if (limpio === "") fila[clave] = null;
      else if (enteros.includes(clave)) fila[clave] = parseInt(limpio, 10);
      else fila[clave] = limpio;
    }

    if (!fila.numero_voucher) {
      if (estado) {
        estado.hidden = false;
        estado.textContent = "Escribe el número de voucher antes de guardar.";
      }
      return;
    }

    const boton = formulario.querySelector('button[type="submit"]');
    if (boton) boton.disabled = true;

    const foto = archivo && archivo.files ? archivo.files[0] : null;
    let avisoFoto = "";

    if (foto) {
      if (estado) {
        estado.hidden = false;
        estado.textContent = "Guardando voucher y foto...";
      }
      try {
        fila.imagen_url = await subirFoto(foto);
      } catch (err) {
        console.error("Error subiendo foto:", err);
        avisoFoto = " (la foto no se pudo subir)";
      }
    }

    const { error } = await db.from("vouchers").insert(fila);

    if (boton) boton.disabled = false;

    if (error) {
      console.error("Error guardando voucher:", error);
      if (estado) {
        estado.hidden = false;
        estado.textContent = "No se pudo guardar el voucher.";
      }
      return;
    }

    formulario.reset();
    formulario.hidden = true;

    if (imagen) {
      imagen.hidden = true;
      imagen.removeAttribute("src");
    }
    if (archivo) archivo.value = "";

    if (estado) {
      estado.hidden = false;
      estado.textContent = "Voucher guardado." + avisoFoto;
    }

    cargarRegistros();
  });
}


// ---- Búsqueda ----

if (buscador) {
  buscador.addEventListener("input", pintarRegistros);
}


// ---- Exportar a Excel ----

if (botonExportar) {

  botonExportar.addEventListener("click", () => {

    const filas = registrosFiltrados();

    if (!filas.length) {
      alert("No hay registros para exportar.");
      return;
    }

    if (!window.XLSX) {
      alert("No se pudo cargar la librería de Excel.");
      return;
    }

    const datos = filas.map((r) => ({
      "Número de voucher": r.numero_voucher,
      "Aerolínea": r.aerolinea,
      "Pasajero": r.huesped,
      "Vuelo": r.vuelo,
      "Fecha del vuelo": r.fecha_vuelo,
      "Fecha de emisión": r.fecha_emision,
      "Tipo de habitación": r.habitacion,
      "Servicio": r.servicio,
      "Días": r.dias,
      "Noches": r.noches,
      "PAX": r.pax,
      "Nivel de tarifa": r.fare_level,
      "Operado por": r.operado_por,
      "Cabina": r.cabina,
      "Estado": r.estado,
      "Observaciones": r.observaciones,
      "Foto": r.imagen_url,
      "Registrado": r.created_at
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Vouchers");

    const hoy = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(libro, "vouchers_" + hoy + ".xlsx");
  });
}


// ---- Cargar al abrir la pestaña Registro y al iniciar ----

const pestanaRegistro = document.querySelector('.tab-btn[data-view="registro"]');

if (pestanaRegistro) {
  pestanaRegistro.addEventListener("click", cargarRegistros);
}

cargarRegistros();
