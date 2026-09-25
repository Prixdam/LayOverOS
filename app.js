const supabase = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// =====================================================
// NAVEGACIÓN
// =====================================================

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));

    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.remove("active"));

    btn.classList.add("active");

    document
      .getElementById(`view-${btn.dataset.view}`)
      .classList.add("active");

    if (btn.dataset.view === "registro") {
      cargarRegistro();
    }
  });
});


// =====================================================
// ELEMENTOS
// =====================================================

const fileInput = document.getElementById("file-input");
const previewImg = document.getElementById("preview-img");
const statusMsg = document.getElementById("status-msg");
const voucherForm = document.getElementById("voucher-form");


// =====================================================
// MENSAJES
// =====================================================

function setStatus(text, type) {
  statusMsg.textContent = text;
  statusMsg.className = "status-msg" + (type ? ` ${type}` : "");
  statusMsg.hidden = !text;
}


// =====================================================
// CAPTURA + OCR
// =====================================================

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  try {
    const base64 = await fileToBase64(file);

    previewImg.src = `data:${file.type};base64,${base64}`;
    previewImg.hidden = false;

    voucherForm.hidden = true;

    setStatus("Leyendo el voucher con IA...", null);

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
      throw new Error("Falló la extracción del voucher");
    }

    const data = await res.json();

    console.log("Datos extraídos por IA:", data);

    // ==========================================
    // LLENAR FORMULARIO
    // ==========================================

    voucherForm.elements["numero_voucher"].value =
      data.numero_voucher || "";

    voucherForm.elements["aerolinea"].value =
      data.aerolinea || "";

    voucherForm.elements["huesped"].value =
      data.huesped || "";

    voucherForm.elements["vuelo"].value =
      data.vuelo || "";

    voucherForm.elements["fecha_vuelo"].value =
      data.fecha_vuelo || "";

    voucherForm.elements["fecha_emision"].value =
      data.fecha_emision || "";

    voucherForm.elements["habitacion"].value =
      data.habitacion || "";

    voucherForm.elements["servicio"].value =
      data.servicio || "";

    voucherForm.elements["dias"].value =
      data.dias ?? "";

    voucherForm.elements["noches"].value =
      data.noches ?? "";

    voucherForm.elements["pax"].value =
      data.pax ?? "";

    voucherForm.elements["operado_por"].value =
      data.operado_por || "";

    voucherForm.elements["cabina"].value =
      data.cabina || "";

    voucherForm.elements["fare_level"].value =
      data.fare_level || "";

    voucherForm.elements["estado"].value =
      data.estado || "RECIBIDO";

    voucherForm.elements["observaciones"].value =
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
// GUARDAR VOUCHER
// =====================================================

voucherForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  setStatus("Guardando voucher...", null);

  const fd = new FormData(voucherForm);

  const record = Object.fromEntries(fd.entries());

  // Convertir números
  record.dias = record.dias
    ? Number(record.dias)
    : null;

  record.noches = record.noches
    ? Number(record.noches)
    : null;

  record.pax = record.pax
    ? Number(record.pax)
    : null;

  // Estado inicial
  record.estado = record.estado || "RECIB
    // =====================================================
// LOGIN LAYOVEROS
// =====================================================

const loginScreen = document.getElementById("login-screen");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const app = document.getElementById("app");


// Ocultar aplicación mientras no haya sesión
app.style.display = "none";


// =====================================================
// VERIFICAR SESIÓN
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

  await verificarPerfil(session.user.id);
}


// =====================================================
// VERIFICAR PERFIL
// =====================================================

async function verificarPerfil(userId) {

  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("usuario, nombre, rol, activo")
    .eq("id", userId)
    .single();


  if (error || !perfil || !perfil.activo) {

    await supabase.auth.signOut();

    loginScreen.style.display = "flex";
    app.style.display = "none";

    loginError.textContent =
      "Usuario sin permisos.";

    return;
  }


  if (perfil.rol !== "ADMIN") {

    await supabase.auth.signOut();

    loginScreen.style.display = "flex";
    app.style.display = "none";

    loginError.textContent =
      "Este usuario no tiene permisos de administrador.";

    return;
  }


  // LOGIN CORRECTO

  loginScreen.style.display = "none";
  app.style.display = "block";

  console.log(
    "Sesión iniciada:",
    perfil.usuario
  );
}


// =====================================================
// FORMULARIO LOGIN
// =====================================================

loginForm.addEventListener("submit", async (e) => {

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


  if (!usuario || !password) {

    loginError.textContent =
      "Completa usuario y contraseña.";

    return;
  }


  if (usuario !== "JDIAZ") {

    loginError.textContent =
      "Usuario incorrecto.";

    return;
  }


  const { data, error } =
    await supabase.auth.signInWithPassword({

      email: "jdiaz@layoveros.local",

      password: password

    });


  if (error) {

    console.error(error);

    loginError.textContent =
      "Usuario o contraseña incorrectos.";

    return;
  }


  await verificarPerfil(data.user.id);

});


// =====================================================
// INICIAR
// =====================================================

verificarSesion();
