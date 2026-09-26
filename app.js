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

if (app) {
  app.style.display = "none";
}

if (loginScreen) {
  loginScreen.style.display = "flex";
}


// =====================================================
// LOGIN
// =====================================================

if (loginForm) {

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (loginError) {
      loginError.textContent = "";
    }

    const usuario = document
      .getElementById("login-usuario")
      .value
      .trim()
      .toUpperCase();

    const password = document
      .getElementById("login-password")
      .value;


    // -----------------------------------------------
    // VALIDAR CAMPOS
    // -----------------------------------------------

    if (!usuario || !password) {

      loginError.textContent =
        "Completa usuario y contraseña.";

      return;
    }


    // -----------------------------------------------
    // VALIDAR USUARIO
    // -----------------------------------------------

    if (usuario !== "JDIAZ") {

      loginError.textContent =
        "Usuario incorrecto.";

      return;
    }


    // -----------------------------------------------
    // AUTENTICAR CON SUPABASE
    // -----------------------------------------------

    loginError.textContent =
      "Verificando acceso...";


    try {

      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({

        email: "jdiaz@layoveros.local",

        password: password

      });


      if (error) {

        console.error(
          "Error de autenticación:",
          error
        );

        loginError.textContent =
          "Contraseña incorrecta.";

        return;
      }


      if (!data || !data.user) {

        loginError.textContent =
          "No se pudo iniciar la sesión.";

        return;
      }


      // ---------------------------------------------
      // BUSCAR PERFIL
      // ---------------------------------------------

      const {
        data: perfil,
        error: perfilError
      } = await supabase
        .from("profiles")
        .select(
          "usuario, nombre, rol, activo"
        )
        .eq(
          "id",
          data.user.id
        )
        .single();


      if (perfilError || !perfil) {

        console.error(
          "Error buscando perfil:",
          perfilError
        );

        await supabase.auth.signOut();

        loginError.textContent =
          "No se encontró el perfil del usuario.";

        return;
      }


      // ---------------------------------------------
      // COMPROBAR ESTADO
      // ---------------------------------------------

      if (!perfil.activo) {

        await supabase.auth.signOut();

        loginError.textContent =
          "Este usuario está desactivado.";

        return;
      }


      // ---------------------------------------------
      // COMPROBAR ROL
      // ---------------------------------------------

      if (perfil.rol !== "ADMIN") {

        await supabase.auth.signOut();

        loginError.textContent =
          "Este usuario no tiene permisos de administrador.";

        return;
      }


      // ---------------------------------------------
      // LOGIN CORRECTO
      // ---------------------------------------------

      entrarAplicacion(perfil);

    } catch (error) {

      console.error(
        "Error inesperado:",
        error
      );

      loginError.textContent =
        "Ocurrió un error al iniciar sesión.";

    }

  });

}


// =====================================================
// ENTRAR A LA APLICACIÓN
// =====================================================

function entrarAplicacion(perfil) {

  if (loginScreen) {
    loginScreen.style.display = "none";
  }

  if (app) {
    app.style.display = "block";
  }

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

  try {

    const {
      data: { session }
    } = await supabase.auth.getSession();


    if (!session) {

      if (loginScreen) {
        loginScreen.style.display = "flex";
      }

      if (app) {
        app.style.display = "none";
      }

      return;
    }


    // -----------------------------------------------
    // BUSCAR PERFIL
    // -----------------------------------------------

    const {
      data: perfil,
      error
    } = await supabase
      .from("profiles")
      .select(
        "usuario, nombre, rol, activo"
      )
      .eq(
        "id",
        session.user.id
      )
      .single();


    if (
      error ||
      !perfil ||
      !perfil.activo ||
      perfil.rol !== "ADMIN"
    ) {

      await supabase.auth.signOut();

      if (loginScreen) {
        loginScreen.style.display = "flex";
      }

      if (app) {
        app.style.display = "none";
      }

      return;
    }


    entrarAplicacion(perfil);

  } catch (error) {

    console.error(
      "Error verificando sesión:",
      error
    );

    if (loginScreen) {
      loginScreen.style.display = "flex";
    }

    if (app) {
      app.style.display = "none";
    }

  }

}


// =====================================================
// CERRAR SESIÓN
// =====================================================

async function cerrarSesion() {

  await supabase.auth.signOut();

 
