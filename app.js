const app = document.getElementById("app");
const fileInput = document.getElementById("file-input");
const previewImg = document.getElementById("preview-img");
const statusMsg = document.getElementById("status-msg");

if (app) {
  app.style.display = "block";
}

if (fileInput) {
  fileInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    previewImg.src = URL.createObjectURL(file);
    previewImg.hidden = false;

    if (statusMsg) {
      statusMsg.hidden = false;
      statusMsg.textContent = "Foto cargada correctamente.";
    }

    console.log("Foto recibida:", file.name);
  });
}
