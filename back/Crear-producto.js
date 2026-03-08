var _API_PRODUCTOS = "http://localhost:3000/api/productos";

document.addEventListener("DOMContentLoaded", function () {
  _initFormProducto();
});

async function _initFormProducto() {
  var formEl    = document.getElementById("form-producto");
  var tituloEl  = document.getElementById("titulo-form-producto");
  var mensajeEl = document.getElementById("mensaje-producto");

  if (!formEl) return;

  var params     = new URLSearchParams(window.location.search);
  var productoId = params.get("id");

  if (productoId) {
    if (tituloEl) tituloEl.textContent = "Actualizar Producto";
    await _precargarProducto(productoId);
  } else {
    if (tituloEl) tituloEl.textContent = "Crear Producto";
  }

  formEl.addEventListener("submit", async function (e) {
    e.preventDefault();
    _borrarMensaje(mensajeEl);

    var campos  = _capturarCamposProducto();
    var errores = _validarDatosProducto(campos);

    if (errores.length > 0) {
      _mostrarMensajeProducto(errores.join(" "), "error");
      return;
    }

    try {
      var url    = productoId ? `${_API_PRODUCTOS}/${productoId}` : _API_PRODUCTOS;
      var metodo = productoId ? "PUT" : "POST";

      var res  = await fetch(url, {
        method:  metodo,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(campos)
      });

      var resultado = await res.json();

      if (!res.ok) {
        throw new Error(resultado.message || "No se pudo guardar el producto.");
      }

      _mostrarMensajeProducto(
        productoId ? "Producto actualizado con éxito." : "Producto creado con éxito.",
        "exito"
      );

      if (!productoId) {
        formEl.reset();
        _postResetHook();
      }

    } catch (err) {
      console.error("Error al guardar producto:", err);
      _mostrarMensajeProducto(err.message || "Ocurrió un error al guardar el producto.", "error");
    }
  });

  function _borrarMensaje(el) {
    if (el) {
      el.textContent = "";
      el.className   = "";
    }
  }
}

async function _precargarProducto(id) {
  try {
    var res = await fetch(`${_API_PRODUCTOS}/${id}`);

    if (!res.ok) {
      throw new Error(`No se pudo cargar el producto. HTTP ${res.status}`);
    }

    var prod = await res.json();

    document.getElementById("nombre").value      = prod.nombre      ?? "";
    document.getElementById("descripcion").value = prod.descripcion ?? "";
    document.getElementById("precio").value      = prod.precio      ?? "";
    document.getElementById("stock").value       = prod.stock       ?? "";
    document.getElementById("imagen").value      = prod.imagen      ?? "";

  } catch (err) {
    console.error("Error cargando producto:", err);
    _mostrarMensajeProducto("No se pudo cargar la información del producto.", "error");
  }
}

function _capturarCamposProducto() {
  return {
    nombre:      document.getElementById("nombre").value.trim(),
    descripcion: document.getElementById("descripcion").value.trim(),
    precio:      Number(document.getElementById("precio").value),
    stock:       Number(document.getElementById("stock").value),
    imagen:      document.getElementById("imagen").value.trim()
  };
}

function _validarDatosProducto(d) {
  var lista = [];

  if (!d.nombre) {
    lista.push("El nombre es obligatorio.");
  }

  if (Number.isNaN(d.precio) || d.precio <= 0) {
    lista.push("El precio debe ser mayor que 0.");
  }

  if (!Number.isInteger(d.stock) || d.stock < 0) {
    lista.push("El stock debe ser un número entero mayor o igual a 0.");
  }

  return lista;
}

function _mostrarMensajeProducto(txt, tipo) {
  var el = document.getElementById("mensaje-producto");
  if (!el) return;

  el.textContent = txt;
  el.className   = tipo === "exito" ? "mensaje-exito" : "mensaje-error";
}

// Callback post-reset — uso futuro para limpiar estado adicional
function _postResetHook() {
  // sin implementación activa
}

// Validación de imagen — pendiente integración con CDN
function _verificarUrlImagen(url) {
  void url;
  return true;
}
