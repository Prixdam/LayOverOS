
const cliente = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const archivo = document.getElementById("file-input");
const imagen = document.getElementById("preview-img");
const estado = document.getElementById("status-msg");
const formulario = document.getElementById("voucher-form");

function mensaje(texto) {
  estado.hidden = false;
  estado.textContent = texto;
}

function comprimirFoto(foto) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();

    lector.onerror = () => reject(
      new Error("No se pudo abrir la foto.")
    );

    lector.onload = () => {
      const original = new Image();

      original.onerror = () => reject(
        new Error("La imagen no es válida.")
      );

      original.onload = () => {
        const escala = Math.min(
          1,
          1600 / Math.max(original.width, original.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(original.width * escala);
        canvas.height = Math.round(original.height * escala);

        canvas.getContext("2d").drawImage(
          original, 0, 0, canvas.width, canvas.height
        );

        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      original.src = lector.result;
    };

    lector.readAsDataURL(foto);
  });
}

function llenarFormulario(datos) {
  const campos = [
    "numero_voucher", "aerolinea", "huesped",
    "vuelo", "fecha_vuelo", "fecha_emision",
    "habitacion", "servicio", "dias", "noches",
    "pax", "operado_por", "cabina",
    "fare_level", "observaciones"
  ];

  for (const nombre of campos) {
    const campo = formulario.elements.namedItem(nombre);
    if (!campo) continue;

    let valor = datos[nombre];

    if (nombre === "huesped") {
      valor = valor || datos.pasajero;
    }

    if (campo.type === "date" && valor) {
      const fecha = new Date(valor);
      valor = /^\d{4}-\d{2}-\d{2}$/.test(valor)
        ? valor
        : Number.isNaN(fecha.getTime())
          ? ""
          : fecha.toISOString().slice(0, 10);
    }

    campo.value = valor ?? "";
  }

  formulario.elements.namedItem("estado").value = "RECIBIDO";
  formulario.hidden = false;
}

archivo.addEventListener("change", async () => {
  const foto = archivo.files[0];
  if (!foto) return;

  formulario.hidden = true;
  mensaje("Preparando la fotografía...");

  try {
    const base64 = await comprimirFoto(foto);

    imagen.src = base64;
    imagen.hidden = false;

    mensaje("Analizando voucher con IA...");

    const respuesta = await fetch("/api/ocr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image: base64 })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error || "El servidor no pudo leer el voucher."
      );
    }

    const datos =
      resultado.data ||
      resultado.voucher ||
      resultado.result ||
      resultado;

    llenarFormulario(datos);
    mensaje("¡Voucher analizado! Revisa los datos.");

  } catch (error) {
    console.error(error);
    mensaje("Error: " + error.message);
  }
});

document.getElementById("btn-cancel").onclick = () => {
  formulario.reset();
  formulario.hidden = true;
  imagen.hidden = true;
  imagen.removeAttribute("src");
  archivo.value = "";
  estado.hidden = true;
};

document.querySelectorAll(".tab-btn").forEach(boton => {
  boton.onclick = () => {
    document.querySelectorAll(".tab-btn").forEach(
      b => b.classList.remove("active")
    );

    document.querySelectorAll(".view").forEach(
      v => v.classList.remove("active")
    );

    boton.classList.add("active");

    document.getElementById(
      "view-" + boton.dataset.view
    ).classList.add("active");
  };
});

formulario.addEventListener("submit", async evento => {
  evento.preventDefault();

  const datos = Object.fromEntries(
    new FormData(formulario).entries()
  );

  for (const campo of ["dias", "noches", "pax"]) {
    datos[campo] = datos[campo] === ""
      ? null
      : Number(datos[campo]);
  }

  for (const campo of ["fecha_vuelo", "fecha_emision"]) {
    datos[campo] ||= null;
  }

  mensaje("Guardando voucher...");

  const { error } = await cliente
    .from("vouchers")
    .insert(datos);

  mensaje(error
    ? "Error al guardar: " + error.message
    : "¡Voucher guardado correctamente!"
  );

  if (!error) {
    formulario.hidden = true;
    archivo.value = "";
  }
});
