const archivo = document.getElementById("file-input");
const imagen = document.getElementById("preview-img");
const estado = document.getElementById("status-msg");
const formulario = document.getElementById("voucher-form");

const tabs = document.querySelectorAll(".tab-btn");
const vistas = document.querySelectorAll(".view");

const cliente = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

let vouchers = [];

function mostrarEstado(texto) {
  if (!estado) return;

  estado.hidden = false;
  estado.textContent = texto;
}

function normalizar(texto) {
  return String(texto || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function mayusculas(texto) {
  return normalizar(texto).toUpperCase();
}

function obtenerCampo(nombre) {
  if (!formulario) return null;

  return formulario.elements.namedItem(nombre);
}

function ponerCampo(nombre, valor) {
  const campo = obtenerCampo(nombre);

  if (!campo || valor === undefined || valor === null) {
    return;
  }

  campo.value = valor;
}

function buscarEtiqueta(texto, etiquetas) {
  const lineas = texto
    .split("\n")
    .map(normalizar)
    .filter(Boolean);

  for (let i = 0; i < lineas.length; i++) {
    const linea = mayusculas(lineas[i]);

    for (const etiquetaOriginal of etiquetas) {
      const etiqueta = mayusculas(etiquetaOriginal);

      const posicion = linea.indexOf(etiqueta);

      if (posicion === -1) continue;

      const despues = lineas[i]
        .substring(posicion + etiqueta.length)
        .replace(/^[:#\-\s]+/, "")
        .trim();

      if (despues) {
        return despues;
      }

      if (lineas[i + 1]) {
        return lineas[i + 1];
      }
    }
  }

  return "";
}

function convertirFecha(texto) {
  if (!texto) return "";

  const valor = mayusculas(texto);

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

  let match = valor.match(
    /\b(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{2,4})\b/
  );

  if (match) {
    let anio = match[3];

    if (anio.length === 2) {
      anio = "20" + anio;
    }

    return (
      anio +
      "-" +
      meses[match[2]] +
      "-" +
      match[1].padStart(2, "0")
    );
  }

  match = valor.match(
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/
  );

  if (match) {
    let anio = match[3];

    if (anio.length === 2) {
      anio = "20" + anio;
    }

    return (
      anio +
      "-" +
      match[2].padStart(2, "0") +
      "-" +
      match[1].padStart(2, "0")
    );
  }

  return "";
}

function extraerDatos(texto) {
  const voucher = buscarEtiqueta(texto, [
    "VOUCHER ID",
    "VOUCHERID",
    "VOUCHER"
  ]);

  const pasajero = buscarEtiqueta(texto, [
    "PASSENGER NAME",
    "PASSENGER",
    "NAME/"
  ]);

  const aerolinea = buscarEtiqueta(texto, [
    "AIRLINE",
    "AEROLINEA"
  ]);

  const vueloTexto = buscarEtiqueta(texto, [
    "FLIGHT NUMBER",
    "FLIGHT NO",
    "FLIGHT",
    "VUELO"
  ]);

  const vueloMatch = mayusculas(vueloTexto).match(
    /\b[A-Z]{2,3}\s?\d{1,5}\b/
  );

  const paxTexto = buscarEtiqueta(texto, [
    "PAX",
    "PASSENGERS"
  ]);

  const paxMatch = paxTexto.match(/\b\d+\b/);

  const servicio = buscarEtiqueta(texto, [
    "SERVICE",
    "SERVICES",
    "SERVICIO"
  ]);

  const operado = buscarEtiqueta(texto, [
    "OPERATED BY",
    "OPERATED",
    "OPERADO POR"
  ]);

  const cabina = buscarEtiqueta(texto, [
    "CABIN",
    "CABINA"
  ]);

  const tarifa = buscarEtiqueta(texto, [
    "FARE LEVEL",
    "FARE",
    "TARIFA"
  ]);

  const fechaVuelo = buscarEtiqueta(texto, [
    "FLIGHT DATE",
    "DATE OF FLIGHT",
    "TRAVEL DATE"
  ]);

  const fechaEmision = buscarEtiqueta(texto, [
    "ISSUED DATE",
    "ISSUE DATE",
    "ISSUED"
  ]);

  const habitacion = buscarEtiqueta(texto, [
    "ROOM NUMBER",
    "ROOM",
    "HABITACION"
  ]);

  const diasTexto = buscarEtiqueta(texto, [
    "DAYS",
    "DAY"
  ]);

  const nochesTexto = buscarEtiqueta(texto, [
    "NIGHTS",
    "NIGHT"
  ]);

  const diasMatch = diasTexto.match(/\b\d+\b/);
  const nochesMatch = nochesTexto.match(/\b\d+\b/);

  return {
    numero_voucher:
      voucher.match(/\d{6,15}/)?.[0] || "",

    aerolinea: aerolinea,

    huesped: pasajero,

    vuelo:
      vueloMatch
        ? vueloMatch[0].replace(/\s/g, "")
        : "",

    fecha_vuelo:
      convertirFecha(fechaVuelo),

    fecha_emision:
      convertirFecha(fechaEmision),

    habitacion:
      habitacion,

    servicio:
      servicio,

    dias:
      diasMatch
        ? Number(diasMatch[0])
        : null,

    noches:
      nochesMatch
        ? Number(nochesMatch[0])
        : null,

    pax:
      paxMatch
        ? Number(paxMatch[0])
        : null,

    operado_por:
      operado,

    cabina:
      cabina,

    fare_level:
      tarifa,

    observaciones:
      texto
  };
}

function llenarFormulario(datos) {
  if (!formulario) return;

  ponerCampo(
    "numero_voucher",
    datos.numero_voucher
  );

  ponerCampo(
    "aerolinea",
    datos.aerolinea
  );

  ponerCampo(
    "huesped",
    datos.huesped
  );

  ponerCampo(
    "vuelo",
    datos.vuelo
  );

  ponerCampo(
    "fecha_vuelo",
    datos.fecha_vuelo
  );

  ponerCampo(
    "fecha_emision",
    datos.fecha_emision
  );

  ponerCampo(
    "habitacion",
    datos.habitacion
  );

  ponerCampo(
    "servicio",
    datos.servicio
  );

  ponerCampo(
    "dias",
    datos.dias
  );

  ponerCampo(
    "noches",
    datos.noches
  );

  ponerCampo(
    "pax",
    datos.pax
  );

  ponerCampo(
    "operado_por",
    datos.operado_por
  );

  ponerCampo(
    "cabina",
    datos.cabina
  );

  ponerCampo(
    "fare_level",
    datos.fare_level
  );

  const estadoCampo =
    obtenerCampo("estado");

  if (estadoCampo) {
    estadoCampo.value = "RECIBIDO";
  }

  formulario.hidden = false;
}

function prepararOCR(foto) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();

    lector.onload = () => {
      const imagenOCR = new Image();

      imagenOCR.onload = () => {
        const maximo = 1600;

        const escala =
          Math.min(
            1,
            maximo /
              Math.max(
                imagenOCR.width,
                imagenOCR.height
              )
          );

        const canvas =
          document.createElement("canvas");

        canvas.width =
          Math.round(
            imagenOCR.width * escala
          );

        canvas.height =
          Math.round(
            imagenOCR.height * escala
          );

        const contexto =
          canvas.getContext("2d");

        contexto.drawImage(
          imagenOCR,
          0,
          0,
          canvas.width,
          canvas.height
        );

        canvas.toBlob(
          (blob) => {

            if (!blob) {
              reject(
                new Error(
                  "No se pudo preparar la imagen."
                )
              );

              return;
            }

            resolve(blob);
          },
          "image/jpeg",
          0.8
        );
      };

      imagenOCR.onerror = () => {
        reject(
          new Error(
            "No se pudo preparar la imagen."
          )
        );
      };

      imagenOCR.src = lector.result;
    };

    lector.onerror = () => {
      reject(
        new Error(
          "No se pudo leer la fotografía."
        )
      );
    };

    lector.readAsDataURL(foto);
  });
}

async function ejecutarOCR(foto) {
  mostrarEstado(
    "Preparando OCR..."
  );

  const imagenParaOCR =
    await prepararOCR(foto);

  mostrarEstado(
    "Analizando voucher..."
  );

  const resultado =
    await Tesseract.recognize(
      imagenParaOCR,
      "eng",
      {
        logger: function (info) {

          if (
            info.status ===
            "recognizing text"
          ) {

            const porcentaje =
              Math.round(
                info.progress * 100
              );

            mostrarEstado(
              "Analizando voucher... " +
              porcentaje +
              "%"
            );
          }
        }
      }
    );

  const texto =
    resultado.data.text.trim();

  console.log(
    "TEXTO OCR:",
    texto
  );

  const datos =
    extraerDatos(texto);

  console.log(
    "DATOS EXTRAÍDOS:",
    datos
  );

  llenarFormulario(datos);

  mostrarEstado(
    "Voucher analizado. Revisa los datos."
  );
}

if (archivo) {

  archivo.addEventListener(
    "change",
    async function () {

      const foto =
        this.files[0];

      if (!foto) return;

      imagen.src =
        URL.createObjectURL(foto);

      imagen.hidden = false;

      if (formulario) {
        formulario.hidden = true;
      }

      mostrarEstado(
        "Foto cargada. Preparando OCR..."
      );

      if (!window.Tesseract) {

        mostrarEstado(
          "No se pudo cargar el motor OCR."
        );

        return;
      }

      try {

        await ejecutarOCR(foto);

      } catch (error) {

        console.error(
          "Error OCR:",
          error
        );

        mostrarEstado(
          "No se pudo analizar el voucher."
        );
      }
    }
  );
}

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
        imagen.removeAttribute("src");
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

if (formulario) {

  formulario.addEventListener(
    "submit",
    async function (evento) {

      evento.preventDefault();

      const datos =
        Object.fromEntries(
          new FormData(formulario)
        );

      datos.dias =
        datos.dias
          ? Number(datos.dias)
          : null;

      datos.noches =
        datos.noches
          ? Number(datos.noches)
          : null;

      datos.pax =
        datos.pax
          ? Number(datos.pax)
          : null;

      datos.fecha_vuelo =
        datos.fecha_vuelo || null;

      datos.fecha_emision =
        datos.fecha_emision || null;

      mostrarEstado(
        "Guardando voucher..."
      );

      const resultado =
        await cliente
          .from("vouchers")
          .insert([datos]);

      if (resultado.error) {

        console.error(
          resultado.error
        );

        mostrarEstado(
          "Error al guardar: " +
          resultado.error.message
        );

        return;
      }

      mostrarEstado(
        "Voucher guardado correctamente."
      );

      formulario.hidden = true;

      await cargarRegistro();
    }
  );
}

async function cargarRegistro() {

  const registro =
    document.getElementById(
      "registro-list"
    );

  if (!registro) return;

  registro.innerHTML =
    '<p class="empty-state">Cargando registros...</p>';

  const resultado =
    await cliente
      .from("vouchers")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (resultado.error) {

    console.error(
      resultado.error
    );

    registro.innerHTML =
      '<p class="empty-state">No se pudieron cargar los vouchers.</p>';

    return;
  }

  vouchers =
    resultado.data || [];

  mostrarRegistro(vouchers);
}

function escapar(texto) {

  return String(
    texto ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function mostrarRegistro(datos) {

  const registro =
    document.getElementById(
      "registro-list"
    );

  if (!registro) return;

  if (!datos.length) {

    registro.innerHTML =
      '<p class="empty-state">No hay vouchers registrados.</p>';

    return;
  }

  registro.innerHTML =
    datos.map((voucher) => {

      const fecha =
        voucher.fecha_vuelo ||
        voucher.fecha_emision ||
        (
          voucher.created_at
            ? voucher.created_at.slice(
                0,
                10
              )
            : "Sin fecha"
        );

      return `
        <article class="registro-card">

          <div>
            <strong>
              ${escapar(
                voucher.numero_voucher ||
                "Sin Voucher ID"
              )}
            </strong>
          </div>

          <div>
            ${escapar(fecha)}
          </div>

          <div>
            ${escapar(
              voucher.huesped ||
              "Sin nombre"
            )}
          </div>

        </article>
      `;

    }).join("");
}

const buscador =
  document.getElementById(
    "search-input"
  );

if (buscador) {

  buscador.addEventListener(
    "input",
    function () {

      const termino =
        this.value
          .trim()
          .toLowerCase();

      if (!termino) {

        mostrarRegistro(
          vouchers
        );

        return;
      }

      const filtrados =
        vouchers.filter(
          (voucher) => {

            return [
              voucher.numero_voucher,
              voucher.huesped,
              voucher.fecha_vuelo,
              voucher.fecha_emision,
              voucher.aerolinea,
              voucher.vuelo
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(termino);
          }
        );

      mostrarRegistro(
        filtrados
      );
    }
  );
}

cargarRegistro();
