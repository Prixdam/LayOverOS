const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// ---------- Navegación entre pestañas ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`view-${btn.dataset.view}`).classList.add("active");
    if (btn.dataset.view === "registro") cargarRegistro();
  });
});

// ---------- Captura + OCR ----------
const fileInput = document.getElementById("file-input");
const previewImg = document.getElementById("preview-img");
const statusMsg = document.getElementById("status-msg");
const voucherForm = document.getElementById("voucher-form");

function setStatus(text, type) {
  statusMsg.textContent = text;
  statusMsg.className = "status-msg" + (type ? ` ${type}` : "");
  statusMsg.hidden = !text;
}

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const base64 = await fileToBase64(file);
  previewImg.src = `data:${file.type};base64,${base64}`;
  previewImg.hidden = false;
  voucherForm.hidden = true;

  setStatus("Leyendo el voucher con IA...", null);

  try {
    const res = await fetch("/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64, mediaType: file.type }),
    });
    if (!res.ok) throw new Error("Fallo la extracción");
    const data = await res.json();

    voucherForm.numero_voucher.value = data.numero_voucher || "";
    voucherForm.fecha_voucher.value = data.fecha_voucher || "";
    voucherForm.huesped.value = data.huesped || "";
    voucherForm.habitacion.value = data.habitacion || "";
    voucherForm.proveedor.value = data.proveedor || "";
    voucherForm.monto.value = data.monto || "";
    voucherForm.moneda.value = data.moneda || "COP";
    voucherForm.observaciones.value = data.observaciones || "";

    voucherForm.hidden = false;
    setStatus("Revisa y corrige si algo no quedó bien, luego guarda.", "success");
  } catch (err) {
    console.error(err);
    setStatus("No se pudo leer el voucher automáticamente. Puedes llenar los datos a mano abajo.", "error");
    voucherForm.hidden = false;
  }
});

document.getElementById("btn-cancel").addEventListener("click", resetCapture);

voucherForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(voucherForm);
  const record = Object.fromEntries(fd.entries());
  record.monto = record.monto ? Number(record.monto) : null;

  const { error } = await supabase.from("vouchers").insert([record]);
  if (error) {
    console.error(error);
    setStatus("Error al guardar: " + error.message, "error");
    return;
  }
  setStatus("Voucher guardado en el registro ✅", "success");
  resetCapture(true);
});

function resetCapture(keepStatus) {
  fileInput.value = "";
  previewImg.hidden = true;
  voucherForm.hidden = true;
  voucherForm.reset();
  if (!keepStatus) setStatus("", null);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Registro ----------
const registroList = document.getElementById("registro-list");
const searchInput = document.getElementById("search-input");
let vouchersCache = [];

async function cargarRegistro() {
  registroList.innerHTML = `<p class="empty-state">Cargando registros...</p>`;
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .order("fecha_voucher", { ascending: false });

  if (error) {
    registroList.innerHTML = `<p class="empty-state">Error cargando datos: ${error.message}</p>`;
    return;
  }
  vouchersCache = data || [];
  renderRegistro(vouchersCache);
}

function renderRegistro(list) {
  if (!list.length) {
    registroList.innerHTML = `<p class="empty-state">Todavía no hay vouchers registrados.</p>`;
    return;
  }
  registroList.innerHTML = list.map(v => `
    <div class="voucher-card">
      <div>
        <div class="vc-main">${v.huesped || "Sin nombre"} · Hab. ${v.habitacion || "-"}</div>
        <div class="vc-sub">#${v.numero_voucher || "-"} · ${v.proveedor || "-"} · ${v.fecha_voucher || "-"}</div>
      </div>
      <div class="vc-amount">${v.monto ? Number(v.monto).toLocaleString("es-CO") : "-"} ${v.moneda || ""}</div>
    </div>
  `).join("");
}

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  renderRegistro(vouchersCache.filter(v =>
    (v.huesped || "").toLowerCase().includes(q) ||
    (v.habitacion || "").toLowerCase().includes(q) ||
    (v.numero_voucher || "").toLowerCase().includes(q)
  ));
});

// ---------- Exportar a Excel ----------
document.getElementById("btn-export").addEventListener("click", () => {
  if (!vouchersCache.length) return alert("No hay datos para exportar.");
  const rows = vouchersCache.map(v => ({
    "N° Voucher": v.numero_voucher,
    "Fecha": v.fecha_voucher,
    "Huésped": v.huesped,
    "Habitación": v.habitacion,
    "Proveedor": v.proveedor,
    "Monto": v.monto,
    "Moneda": v.moneda,
    "Observaciones": v.observaciones,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vouchers");
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `vouchers_${fecha}.xlsx`);
});
