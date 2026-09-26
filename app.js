const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const app = document.getElementById("app");
const fileInput = document.getElementById("file-input");
const previewImg = document.getElementById("preview-img");
const statusMsg = document.getElementById("status-msg");
const voucherForm = document.getElementById("voucher-form");

if (app) {
  app.style.display = "block";
}

const tabs = document.querySelectorAll(".tab-btn");
const views = document.querySelectorAll(".view");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const viewName = tab.dataset.view;

    tabs.forEach((item) => {
      item.classList.remove("active");
    });

    views.forEach((view) => {
      view.classList.remove("active");
    });

    tab.classList.add("active");

    const selectedView = document.getElementById(
      "view-" + viewName
    );

    if (selectedView) {
      selectedView.classList.add("active");
    }

    if (viewName === "registro") {
      cargarRegistro();
    }
  });
});

function mostrarEstado(texto, tipo = "normal") {
  if (!statusMsg) return;

  statusMsg.hidden = false;
  statusMsg.textContent = texto;
  statusMsg.className = "status-msg " + tipo;
}

function limpiarFormulario() {
  if (!voucherForm) return;

  voucherForm.reset();

  const estado = voucherForm.querySelector(
    '[name="estado"]'
  );

  if (estado) {
    estado.value = "RECIBIDO";
  }
}

function convertirFecha(valor) {
  if (!valor) return "";

  const texto = String(valor).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return texto;
  }

  const partes = texto.split(/[\/\-]/);

  if (partes.length === 3) {
    if (partes[0].length === 4) {
      return texto;
    }

    if (partes[2].length === 4) {
      return `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}`;
    }
  }

  return "";
}

function ponerValor(nombre, valor) {
  const campo = voucherForm?.querySelector(
    `[name="${nombre}"]`
  );

  if (!campo || valor === undefined || valor === null) {
    return;
  }

  campo.value = valor;
}

function llenarFormulario(datos) {
  if (!datos || !voucherForm) return;

  ponerValor("numero_voucher", datos.numero_voucher);
  ponerValor("aerolinea", datos.aerolinea);
  ponerValor("huesped", datos.huesped || datos.pasajero);
  ponerValor("vuelo", datos.vuelo);

  ponerValor(
    "fecha_vuelo",
    convertirFecha(datos.fecha_vuelo)
  );

  ponerValor(
    "fecha_emision",
    convertirFecha(datos.fecha_emision)
  );

  ponerValor("habitacion", datos.habitacion);
  ponerValor("servicio", datos.servicio);
  ponerValor("dias", datos.dias);
  ponerValor("noches", datos.noches);
  ponerValor("pax", datos.pax);
  ponerValor("operado_por", datos.operado_por);
  ponerValor("cabina", datos.cabina);
  ponerValor("fare_level", datos.fare_level);
  ponerValor("observaciones", datos.observaciones);

  const estado = voucherForm.querySelector(
    '[name="estado"]'
  );

  if (estado) {
    estado.value = datos.estado || "RECIBIDO";
  }

  voucherForm.hidden = false;
}

function archivoABase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("No se pudo leer la imagen."));
    };

    reader.readAsDataURL(file);
  });
}

async function procesarVoucher(file) {
  if (!file) return;

  try {
    limpiarFormulario();

    previewImg.hidden = false;
    previewImg.src = URL.createObjectURL(file);

    voucherForm.hidden = true;

    mostrarEstado(
      "Leyendo el voucher...",
      "loading"
    );

    const base64 = await archivoABase64(file);

    mostrarEstado(
      "Analizando la información del voucher...",
      "loading"
    );

    const respuesta = await fetch("/api/ocr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: base64
      })
    });

    const textoRespuesta = await respuesta.text();

    let resultado;

    try {
      resultado = JSON.parse(textoRespuesta);
    } catch {
      throw new Error(
        "El servidor respondió con información inválida."
      );
    }

    if (!respuesta.ok) {
      throw new Error(
        resultado.error ||
        "No se pudo procesar el voucher."
      );
    }

    const datos =
      resultado.data ||
      resultado.result ||
      resultado.voucher ||
      resultado;

    llenarFormulario(datos);

    mostrarEstado(
      "Voucher analizado. Revisa los datos antes de guardar.",
      "success"
    );

  } catch (error) {

    console.error("Error procesando voucher:", error);

    mostrarEstado(
      error.message ||
      "No se pudo procesar el voucher.",
      "error"
    );

    voucherForm.hidden = true;
  }
}

if (fileInput) {
  fileInput.addEventListener("change", async (event) => {

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await procesarVoucher(file);
  });
}

if (voucherForm) {
  voucherForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const formData = new FormData(voucherForm);

    const record = {
      numero_voucher:
        formData.get("numero_voucher") || null,

      aerolinea:
        formData.get("aerolinea") || null,

      huesped:
        formData.get("huesped") || null,

      vuelo:
        formData.get("vuelo") || null,

      fecha_vuelo:
        formData.get("fecha_vuelo") || null,

      fecha_emision:
        formData.get("fecha_emision") || null,

      habitacion:
        formData.get("habitacion") || null,

      servicio:
        formData.get("servicio") || null,

      dias:
        formData.get("dias")
          ? Number(formData.get("dias"))
          : null,

      noches:
        formData.get("noches")
          ? Number(formData.get("noches"))
          : null,

      pax:
        formData.get("pax")
          ? Number(formData.get("pax"))
          : null,

      operado_por:
        formData.get("operado_por") || null,

      cabina:
        formData.get("cabina") || null,

      fare_level:
        formData.get("fare_level") || null,

      estado:
        formData.get("estado") || "RECIBIDO",

      observaciones:
        formData.get("observaciones") || null
    };

    try {

      mostrarEstado(
        "Guardando voucher...",
        "loading"
      );

      const { error } = await supabaseClient
        .from("vouchers")
        .insert([record]);

      if (error) {
        throw error;
      }

      mostrarEstado(
        "Voucher guardado correctamente.",
        "success"
      );

      voucherForm.hidden = true;

      previewImg.hidden = true;
      previewImg.removeAttribute("src");

      fileInput.value = "";

      setTimeout(() => {
        statusMsg.hidden = true;
      }, 2500);

    } catch (error) {

      console.error(
        "Error guardando voucher:",
        error
      );

      mostrarEstado(
        error.message ||
        "No se pudo guardar el voucher.",
        "error"
      );
    }
  });
}

const btnCancel = document.getElementById("btn-cancel");

if (btnCancel) {
  btnCancel.addEventListener("click", () => {

    limpiarFormulario();

    voucherForm.hidden = true;

    previewImg.hidden = true;
    previewImg.removeAttribute("src");

    fileInput.value = "";

    if (statusMsg) {
      statusMsg.hidden = true;
    }
  });
}

async function cargarRegistro() {

  const lista = document.getElementById(
    "registro-list"
  );

  if (!lista) return;

  lista.innerHTML =
    '<p class="empty-state">Cargando registros...</p>';

  try {

    const { data, error } = await supabaseClient
      .from("vouchers")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      throw error;
    }

    renderizarRegistro(data || []);

  } catch (error) {

    console.error(
      "Error cargando registro:",
      error
    );

    lista.innerHTML =
      '<p class="empty-state">No se pudieron cargar los registros.</p>';
  }
}

function escapeHTML(valor) {

  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderizarRegistro(registros) {

  const lista = document.getElementById(
    "registro-list"
  );

  if (!lista) return;

  if (!registros.length) {

    lista.innerHTML =
      '<p class="empty-state">Todavía no hay vouchers registrados.</p>';

    return;
  }

  lista.innerHTML = registros.map((voucher) => {

    return `
      <article class="registro-card">

        <div>
          <strong>
            ${escapeHTML(voucher.numero_voucher || "Sin número")}
          </strong>

          <p>
            ${escapeHTML(voucher.huesped || "Sin pasajero")}
          </p>
        </div>

        <div>
          <span>
            ${escapeHTML(voucher.aerolinea || "Sin aerolínea")}
          </span>

          <span>
            ${escapeHTML(voucher.vuelo || "Sin vuelo")}
          </span>
        </div>

        <div>
          <span>
            Habitación:
            ${escapeHTML(voucher.habitacion || "N/A")}
          </span>

          <span>
            Servicio:
            ${escapeHTML(voucher.servicio || "N/A")}
          </span>
        </div>

        <div>
          <strong>
            ${escapeHTML(voucher.estado || "RECIBIDO")}
          </strong>
        </div>

      </article>
    `;

  }).join("");
}

const searchInput =
  document.getElementById("search-input");

if (searchInput) {

  searchInput.addEventListener(
    "input",
    async () => {

      const termino =
        searchInput.value
          .trim()
          .toLowerCase();

      const { data, error } =
        await supabaseClient
          .from("vouchers")
          .select("*")
          .order("created_at", {
            ascending: false
          });

      if (error) {
        console.error(error);
        return;
      }

      if (!termino) {
        renderizarRegistro(data || []);
        return;
      }

      const filtrados =
        (data || []).filter((voucher) => {

          return Object.values(voucher)
            .join(" ")
            .toLowerCase()
            .includes(termino);

        });

      renderizarRegistro(filtrados);
    }
  );
}

const btnExport =
  document.getElementById("btn-export");

if (btnExport) {

  btnExport.addEventListener(
    "click",
    async () => {

      try {

        const { data, error } =
          await supabaseClient
            .from("vouchers")
            .select("*")
            .order("created_at", {
              ascending: false
            });

        if (error) {
          throw error;
        }

        if (!data || !data.length) {
          alert("No hay vouchers para exportar.");
          return;
        }

        const hoja =
          XLSX.utils.json_to_sheet(data);

        const libro =
          XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          libro,
          hoja,
          "Vouchers"
        );

        XLSX.writeFile(
          libro,
          "LayOverOS_Vouchers.xlsx"
        );

      } catch (error) {

        console.error(error);

        alert(
          "No se pudo generar el archivo Excel."
        );
      }
    }
  );
}

cargarRegistro();
