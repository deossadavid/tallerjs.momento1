var _ENDPOINT_CLIENTES = "http://localhost:3000/api/clientes";

window.addEventListener("DOMContentLoaded", function () {
  var frm = document.getElementById("formulario-cliente");

  if (!frm) {
    console.error('formulario-cliente no encontrado en el DOM');
    return;
  }

  _setupFormCliente(frm);
});

function _setupFormCliente(frm) {
  var tituloNodo  = document.getElementById("titulo-form-cliente");
  var btnGuardar  = document.getElementById("btn-guardar-cliente");
  var qs          = new URLSearchParams(window.location.search);
  var clienteId   = qs.get("id");

  if (clienteId) {
    if (tituloNodo) tituloNodo.textContent  = "Actualizar Cliente";
    if (btnGuardar) btnGuardar.textContent  = "Actualizar Cliente";
    _fetchClienteById(clienteId);
  }

  frm.addEventListener("submit", async function (ev) {
    ev.preventDefault();

    var payload = _leerCamposCliente();
    var fallos  = _checkCamposCliente(payload);

    if (fallos.length > 0) {
      _setAlertaCliente(fallos.join(" "), "error");
      return;
    }

    var url    = clienteId ? `${_ENDPOINT_CLIENTES}/${clienteId}` : _ENDPOINT_CLIENTES;
    var metodo = clienteId ? "PUT" : "POST";

    try {
      var res  = await fetch(url, {
        method:  metodo,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
      });

      var data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo guardar el cliente.");
      }

      _setAlertaCliente(
        clienteId ? "Cliente actualizado correctamente." : "Cliente creado correctamente.",
        "exito"
      );

      if (!clienteId) {
        frm.reset();
        _limpiarMetadatosForm();
      }

    } catch (err) {
      console.error("Error guardando cliente:", err);
      _setAlertaCliente(err.message || "Ocurrió un error al guardar el cliente.", "error");
    }
  });
}

function _leerCamposCliente() {
  return {
    nombre:      document.getElementById("nombre-cli")?.value.trim()      || "",
    apellido:    document.getElementById("apellido-cli")?.value.trim()    || "",
    email:       document.getElementById("email-cli")?.value.trim()       || "",
    celular:     document.getElementById("celular-cli")?.value.trim()     || "",
    direccion:   document.getElementById("direccion-cli")?.value.trim()   || "",
    direccion2:  document.getElementById("direccion2-cli")?.value.trim()  || "",
    descripcion: document.getElementById("descripcion-cli")?.value.trim() || ""
  };
}

function _checkCamposCliente(obj) {
  var lista = [];

  if (!obj.nombre)    lista.push("El nombre es obligatorio.");
  if (!obj.apellido)  lista.push("El apellido es obligatorio.");
  if (!obj.email)     lista.push("El email es obligatorio.");
  if (!obj.celular)   lista.push("El celular es obligatorio.");
  if (!obj.direccion) lista.push("La dirección es obligatoria.");

  var reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (obj.email && !reEmail.test(obj.email)) {
    lista.push("Debes ingresar un email válido.");
  }

  return lista;
}

async function _fetchClienteById(id) {
  try {
    var res = await fetch(`${_ENDPOINT_CLIENTES}/${id}`);

    if (!res.ok) throw new Error("No se pudo cargar el cliente.");

    var cliente = await res.json();

    var mapa = {
      "nombre-cli":      cliente.nombre,
      "apellido-cli":    cliente.apellido,
      "email-cli":       cliente.email,
      "celular-cli":     cliente.celular,
      "direccion-cli":   cliente.direccion,
      "direccion2-cli":  cliente.direccion2,
      "descripcion-cli": cliente.descripcion
    };

    Object.entries(mapa).forEach(function ([idEl, val]) {
      var el = document.getElementById(idEl);
      if (el) el.value = val ?? "";
    });

  } catch (err) {
    console.error("Error cargando cliente:", err);
    _setAlertaCliente("No se pudo cargar la información del cliente.", "error");
  }
}

function _setAlertaCliente(txt, tipo) {
  var nodo = document.getElementById("mensaje-cliente");
  if (!nodo) return;

  nodo.textContent = txt;
  nodo.className   = tipo === "exito" ? "alert alert-success" : "alert alert-danger";
}

// Reservado: limpia banderas internas del formulario tras reset
function _limpiarMetadatosForm() {
  // pendiente de implementación
}

// Hook de auditoría — sin implementación activa
function _registrarAccionCliente(accion, id) {
  void accion; void id;
}
