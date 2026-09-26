document.body.innerHTML = "<h1 style='font-size:40px;padding:30px'>APP.JS SÍ SE ESTÁ EJECUTANDO 🔥</h1>";
alert("APP.JS CARGADO");
// =====================================================
// LAYOVEROS - APP.JS
// =====================================================


// =====================================================
// SUPABASE
// =====================================================

const supabase = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// =====================================================
// ELEMENTOS DEL LOGIN
// =====================================================

const loginScreen = document.getElementById("login-screen");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");


// =====================================================
// ELEMENTOS DE LA APLICACIÓN
// =====================================================

const app = document.getElementById("app");

const fileInput = document.getElementById("file-input");
const previewImg = document.getElementById("preview-img");
const statusMsg = document.getElementById("status-msg");
const voucherForm = document.getElementById("voucher-form");


// =====================================================
// ESTADO INICIAL
// =====================================================

app.style.display = "none";
loginScreen.style.display = "flex";


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener("submit", async (e) => {
  alert("EL LOGIN ESTÁ FUNCIONANDO");

  e.preventDefault();

  loginError.textContent = "";

  const usuario = document
    .getElementById("login-usuario")
    .value
    .trim()
    .toUpperCase();

  const password = document
    .getElementById("login-password")
    .value;


  // Comprobar campos

  if (!usuario || !password) {

    loginError.textContent =
      "Completa usuario y contraseña.";

    return;
  }


  // Usuario permitido

  if (usuario !== "JDIAZ") {

    loginError.textContent =
      "Usuario incorrecto.";

    return;
  }


  // Autenticación real con Supabase

  const { data, error } =
    await supabase.auth.signInWithPassword({

      email: "jdiaz@layoveros.local",

      password: password

    });


  if (error) {

    console.error("Error de autenticación:", error);

    loginError.textContent =
      "Contraseña incorrecta.";

    return;
  }


  // Buscar perfil

  const { data: perfil, error: perfilError } =
    await supabase
      .from("profiles")
      .select("usuario, nombre, rol, activo")
      .eq("id", data.user.id)
      .single();


  if (perfilError || !perfil) {

    await supabase.auth.signOut();

    loginError.textContent =
      "No se encontró el perfil del usuario.";

    return;
  }


  // Comprobar usuario activo

  if (!perfil.activo) {

    await supabase.auth.signOut();

    loginError.textContent =
      "Este usuario está desactivado.";

    return;
  }


  // Comprobar rol

  if (perfil.rol !== "ADMIN") {

    await supabase.auth.signOut();

    loginError.textContent =
      "Este usuario no tiene permisos de administrador.";

    return;
  }


  // Login correcto

  entrarAplicacion(perfil);

});


// =====================================================
// ENTRAR A LA APLICACIÓN
// =====================================================

function entrarAplicacion(perfil) {

  loginScreen.style.display = "none";

  app.style.display = "block";

  console.log(
    "Sesión iniciada:",
    perfil.usuario,
    perfil.rol
  );

}


// =====================================================
// VERIFICAR SESIÓN EXISTENTE
// =====================================================

async function verificarSesion() {

  const {
    data: { session }
  } = await supabase.auth.getSession();


  if (!session) {

    loginScreen.style.display = "flex";

    app.style.display = "none";

    return;

  }


  const { data: perfil, error } =
    await supabase
      .from("profiles")
      .select("usuario, nombre, rol, activo")
      .eq("id", session.user.id)
      .single();


  if (
    error ||
    !perfil ||
    !perfil.activo ||
    perfil.rol !== "ADMIN"
  ) {

    await supabase.auth.signOut();

    loginScreen.style.display = "flex";

    app.style.display = "none";

    return;

  }


  entrarAplicacion(perfil);

}


// =====================================================
// NAVEGACIÓN
// =====================================================

document.querySelectorAll(".tab-btn").forEach((btn) => {

  btn.addEventListener("click", () => {

    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => {
        b.classList.remove("active");
      });


    document
      .querySelectorAll(".view")
      .forEach((v) => {
        v.classList.remove("active");
      });


    btn.classList.add("active");


    const view =
      document.getElementById(
        `view-${btn.dataset.view}`
      );


    if (view) {

      view.classList.add("active");

    }


    if (btn.dataset.view === "registro") {

      cargarRegistro();

    }

  });

});


// =====================================================
// MENSAJES
// =====================================================

function setStatus(text, type) {

  statusMsg.textContent = text;

  statusMsg.className =
    "status-msg" +
    (type ? ` ${type}` : "");

  statusMsg.hidden = !text;

}


// =====================================================
// CONVERTIR ARCHIVO A BASE64
// =====================================================

function fileToBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();


    reader.onload = () => {

      const result = reader.result;

      const base64 =
        result.split(",")[1];

      resolve(base64);

    };


    reader.onerror = reject;

    reader.readAsDataURL(file);

  });

}


// =====================================================
// CAPTURA + OCR
// =====================================================

fileInput.addEventListener("change", async (e) => {

  const file = e.target.files[0];


  if (!file) {

    return;

  }


  try {

    const base64 =
      await fileToBase64(file);


    previewImg.src =
      `data:${file.type};base64,${base64}`;


    previewImg.hidden = false;

    voucherForm.hidden = true;


    setStatus(
      "Leyendo el voucher con IA...",
      null
    );


    const res = await fetch("/api/ocr", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        image: base64,

        mediaType: file.type

      })

    });


    if (!res.ok) {

      throw new Error(
        "Falló la extracción del voucher"
      );

    }


    const data = await res.json();


    console.log(
      "Datos extraídos por IA:",
      data
    );


    // ==========================================
    // LLENAR FORMULARIO
    // ==========================================

    voucherForm.elements[
      "numero_voucher"
    ].value =
      data.numero_voucher || "";


    voucherForm.elements[
      "aerolinea"
    ].value =
      data.aerolinea || "";


    voucherForm.elements[
      "huesped"
    ].value =
      data.huesped || "";


    voucherForm.elements[
      "vuelo"
    ].value =
      data.vuelo || "";


    voucherForm.elements[
      "fecha_vuelo"
    ].value =
      data.fecha_vuelo || "";


    voucherForm.elements[
      "fecha_emision"
    ].value =
      data.fecha_emision || "";


    voucherForm.elements[
      "habitacion"
    ].value =
      data.habitacion || "";


    voucherForm.elements[
      "servicio"
    ].value =
      data.servicio || "";


    voucherForm.elements[
      "dias"
    ].value =
      data.dias ?? "";


    voucherForm.elements[
      "noches"
    ].value =
      data.noches ?? "";


    voucherForm.elements[
      "pax"
    ].value =
      data.pax ?? "";


    voucherForm.elements[
      "operado_por"
    ].value =
      data.operado_por || "";


    voucherForm.elements[
      "cabina"
    ].value =
      data.cabina || "";


    voucherForm.elements[
      "fare_level"
    ].value =
      data.fare_level || "";


    voucherForm.elements[
      "estado"
    ].value =
      data.estado || "RECIBIDO";


    voucherForm.elements[
      "observaciones"
    ].value =
      data.observaciones || "";


    voucherForm.hidden = false;


    setStatus(
      "Voucher leído. Revisa los datos antes de guardarlo.",
      "success"
    );


  } catch (err) {

    console.error(err);


    setStatus(
      "No se pudo leer el voucher automáticamente. Puedes ingresar los datos manualmente.",
      "error"
    );


    voucherForm.hidden = false;

  }

});


// =====================================================
// CANCELAR CAPTURA
// =====================================================

document
  .getElementById("btn-cancel")
  .addEventListener("click", () => {

    resetCapture(false);

  });


// =====================================================
// REINICIAR CAPTURA
// =====================================================

function resetCapture(showMessage = true) {

  fileInput.value = "";

  previewImg.src = "";

  previewImg.hidden = true;

  voucherForm.reset();

  voucherForm.hidden = true;


  if (showMessage) {

    setStatus(
      "Captura cancelada.",
      null
    );

  } else {

    setStatus(
      "",
      null
    );

  }

}


// =====================================================
// GUARDAR VOUCHER
// =====================================================

voucherForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    setStatus(
      "Guardando voucher...",
      null
    );


    try {

      const fd =
        new FormData(voucherForm);


      const record =
        Object.fromEntries(
          fd.entries()
        );


      // Convertir números

      record.dias =
        record.dias
          ? Number(record.dias)
          : null;


      record.noches =
        record.noches
          ? Number(record.noches)
          : null;


      record.pax =
        record.pax
          ? Number(record.pax)
          : null;


      // Estado

      record.estado =
        record.estado ||
        "RECIBIDO";


      // Guardar en Supabase

      const { error } =
        await supabase
          .from("vouchers")
          .insert([record]);


      if (error) {

        console.error(
          "Error guardando voucher:",
          error
        );

        throw error;

      }


      setStatus(
        "Voucher guardado correctamente.",
        "success"
      );


      resetCapture(false);


      // Ir a Registro

      document
        .querySelectorAll(".tab-btn")
        .forEach((btn) => {

          btn.classList.remove("active");

        });


      document
        .querySelectorAll(".view")
        .forEach((view) => {

          view.classList.remove("active");

        });


      const registroBtn =
        document.querySelector(
          '[data-view="registro"]'
        );


      const registroView =
        document.getElementById(
          "view-registro"
        );


      if (registroBtn) {

        registroBtn.classList.add("active");

      }


      if (registroView) {

        registroView.classList.add("active");

      }


      cargarRegistro();


    } catch (err) {

      console.error(err);


      setStatus(
        "No se pudo guardar el voucher.",
        "error"
      );

    }

  }
);


// =====================================================
// CARGAR REGISTRO
// =====================================================

async function cargarRegistro() {

  const lista =
    document.getElementById(
      "registro-list"
    );


  if (!lista) {

    return;

  }


  lista.innerHTML =
    `<p class="empty-state">Cargando registros...</p>`;


  const { data, error } =
    await supabase
      .from("vouchers")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);


    lista.innerHTML =
      `<p class="empty-state">
        No se pudieron cargar los registros.
      </p>`;


    return;

  }


  if (!data || data.length === 0) {

    lista.innerHTML =
      `<p class="empty-state">
        No hay vouchers registrados.
      </p>`;


    return;

  }


  renderRegistro(data);

}


// =====================================================
// ESCAPAR HTML
// =====================================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// =====================================================
// MOSTRAR REGISTRO
// =====================================================

function renderRegistro(data) {

  const lista =
    document.getElementById(
      "registro-list"
    );


  lista.innerHTML =
    data
      .map((voucher) => {

        return `

          <article class="voucher-card">

            <h3>
              ${escapeHTML(
                voucher.huesped ||
                "Sin pasajero"
              )}
            </h3>

            <p>
              <strong>Voucher:</strong>
              ${escapeHTML(
                voucher.numero_voucher ||
                "Sin número"
              )}
            </p>

            <p>
              <strong>Aerolínea:</strong>
              ${escapeHTML(
                voucher.aerolinea ||
                "Sin información"
              )}
            </p>

            <p>
              <strong>Vuelo:</strong>
              ${escapeHTML(
                voucher.vuelo ||
                "Sin información"
              )}
            </p>

            <p>
              <strong>Habitación:</strong>
              ${escapeHTML(
                voucher.habitacion ||
                "Sin información"
              )}
            </p>

            <p>
              <strong>Servicio:</strong>
              ${escapeHTML(
                voucher.servicio ||
                "Sin información"
              )}
            </p>

            <p>
              <strong>Fecha de vuelo:</strong>
              ${escapeHTML(
                voucher.fecha_vuelo ||
                "Sin información"
              )}
            </p>

            <p>
              <strong>Estado:</strong>
              ${escapeHTML(
                voucher.estado ||
                "RECIBIDO"
              )}
            </p>

          </article>

        `;

      })
      .join("");

}


// =====================================================
// BUSCADOR
// =====================================================

const searchInput =
  document.getElementById(
    "search-input"
  );


if (searchInput) {

  searchInput.addEventListener(
    "input",
    async () => {

      const search =
        searchInput.value
          .trim()
          .toLowerCase();


      const { data, error } =
        await supabase
          .from("vouchers")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false
            }
          );


      if (error) {

        console.error(error);

        return;

      }


      if (!search) {

        renderRegistro(data || []);

        return;

      }


      const filtrados =
        (data || []).filter(
          (voucher) => {

            const texto = [

              voucher.numero_voucher,

              voucher.aerolinea,

              voucher.huesped,

              voucher.vuelo,

              voucher.habitacion,

              voucher.servicio,

              voucher.estado

            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


            return texto.includes(search);

          }
        );


      renderRegistro(filtrados);

    }
  );

}


// =====================================================
// EXPORTAR A EXCEL
// =====================================================

const exportButton =
  document.getElementById(
    "btn-export"
  );


if (exportButton) {

  exportButton.addEventListener(
    "click",
    async () => {

      const { data, error } =
        await supabase
          .from("vouchers")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false
            }
          );


      if (error) {

        console.error(error);

        alert(
          "No se pudieron obtener los vouchers."
        );

        return;

      }


      if (!data || data.length === 0) {

        alert(
          "No hay vouchers para exportar."
        );

        return;

      }


      const filas =
        data.map((voucher) => ({

          "Número voucher":
            voucher.numero_voucher || "",

          "Aerolínea":
            voucher.aerolinea || "",

          "Huésped":
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
            voucher.observaciones || "",

          "Fecha registro":
            voucher.created_at || ""

        }));


      const worksheet =
        XLSX.utils.json_to_sheet(
          filas
        );


      const workbook =
        XLSX.utils.book_new();


      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Vouchers"
      );


      XLSX.writeFile(
        workbook,
        "LayOverOS_Vouchers.xlsx"
      );

    }
  );

}


// =====================================================
// INICIAR APLICACIÓN
// =====================================================

verificarSesion();
