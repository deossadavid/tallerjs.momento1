var _CLAVE_CARRITO    = "carritoBurger";
var _URL_CLIENTES     = "http://localhost:3000/api/clientes";
var _URL_PEDIDOS      = "http://localhost:3000/api/pedidos";

var _ENV_FIJO         = 5.00;
var _TASA_IVA         = 0.19;
var _RECARGO_COD      = 0.05;

document.addEventListener("DOMContentLoaded", function () {
  _dibujarResumenCheckout();
  _enlazarFormulario();
  _escucharCambioPago();
});

function _enlazarFormulario() {
  var formulario = document.getElementById("form-checkout");

  if (!formulario) {
    console.error('Formulario #form-checkout no encontrado en el DOM');
    return;
  }

  formulario.addEventListener("submit", _manejarEnvioPedido);
}

function _escucharCambioPago() {
  var opciones = document.querySelectorAll('input[name="metodo-pago"]');

  opciones.forEach(function (op) {
    op.addEventListener("change", function () {
      _dibujarResumenCheckout();
    });
  });
}

function _leerCarrito() {
  var raw = localStorage.getItem(_CLAVE_CARRITO);
  return raw ? JSON.parse(raw) : [];
}

function _guardarCarrito(arr) {
  localStorage.setItem(_CLAVE_CARRITO, JSON.stringify(arr));
}

function _metodoPagoActivo() {
  var checked = document.querySelector('input[name="metodo-pago"]:checked');
  return checked ? checked.value : "";
}

function _computarTotales(items) {
  var base = items.reduce(function (acum, it) {
    return acum + (Number(it.precio) * Number(it.cantidad));
  }, 0);

  var envio    = items.length ? _ENV_FIJO : 0;
  var iva      = base * _TASA_IVA;
  var metodo   = _metodoPagoActivo();
  var recargo  = metodo === "contra-entrega" ? base * _RECARGO_COD : 0;
  var total    = base + envio + iva + recargo;

  return { subtotal: base, domicilio: envio, impuestos: iva, recargoMetodo: recargo, total: total, metodoPago: metodo };
}

function _dibujarResumenCheckout() {
  var contProductos  = document.getElementById("detalle-productos-checkout");
  var contTotal      = document.getElementById("total-checkout");

  if (!contProductos || !contTotal) {
    console.error("Elementos del resumen checkout no encontrados.");
    return;
  }

  var items = _leerCarrito();

  if (!items.length) {
    contProductos.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-16">
        <span class="lead">Tu carrito está vacío</span>
        <span class="lead">$0.00</span>
      </div>
    `;
    contTotal.textContent = "$0.00";
    return;
  }

  var tots = _computarTotales(items);

  var lineas = items.map(function (prod) {
    var parcial = Number(prod.precio) * Number(prod.cantidad);
    return `
      <div class="d-flex justify-content-between align-items-center mb-16">
        <div>
          <span class="lead d-block">${_escape(prod.nombre)}</span>
          <small>Cantidad: ${prod.cantidad}</small>
        </div>
        <span class="lead">${_moneda(parcial)}</span>
      </div>
    `;
  }).join("");

  contProductos.innerHTML = `
    ${lineas}
    <hr>
    <div class="d-flex justify-content-between align-items-center mb-16">
      <span class="lead">Subtotal</span>
      <span class="lead">${_moneda(tots.subtotal)}</span>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-16">
      <span class="lead">Domicilio</span>
      <span class="lead">${_moneda(tots.domicilio)}</span>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-16">
      <span class="lead">Impuestos</span>
      <span class="lead">${_moneda(tots.impuestos)}</span>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-16">
      <span class="lead">Recargo método (${tots.metodoPago || "sin seleccionar"})</span>
      <span class="lead">${_moneda(tots.recargoMetodo)}</span>
    </div>
  `;

  contTotal.textContent = _moneda(tots.total);
}

async function _manejarEnvioPedido(ev) {
  ev.preventDefault();

  var items = _leerCarrito();

  if (!items.length) {
    _mostrarAlerta("El carrito está vacío.", "error");
    return;
  }

  var campos  = _recolectarCampos();
  var fallos  = _validarCampos(campos);

  if (fallos.length) {
    _mostrarAlerta(fallos.join(" "), "error");
    return;
  }

  try {
    _toggleBotonSubmit(true);

    var idCliente = await _resolverCliente(campos);

    if (!idCliente) {
      throw new Error("No se pudo obtener el id del cliente.");
    }

    var calculado = _computarTotales(items);

    var body = {
      id_cliente:  Number(idCliente),
      descuento:   0,
      metodo_pago: campos.metodoPago,
      aumento:     Number(calculado.domicilio.toFixed(2)),
      productos:   items.map(function (it) {
        return {
          id_producto: Number(it.id),
          precio:      Number(it.precio),
          cantidad:    Number(it.cantidad)
        };
      })
    };

    console.log("Payload enviado a /api/pedidos:", body);

    var resp = await fetch(_URL_PEDIDOS, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body)
    });

    var data = await resp.json();
    console.log("Respuesta /api/pedidos:", data);

    if (!resp.ok) {
      throw new Error(data.message || "No se pudo crear el pedido.");
    }

    localStorage.setItem("ultimoPedido", JSON.stringify({
      id_pedido: data.id || data.id_pedido || null,
      fecha: new Date().toISOString()
    }));

    _guardarCarrito([]);
    window.location.href = "thankyou.html";

  } catch (err) {
    console.error("Error al procesar pedido:", err);
    _mostrarAlerta(err.message || "Falló la conexión con el servidor.", "error");
  } finally {
    _toggleBotonSubmit(false);
  }
}

function _recolectarCampos() {
  return {
    nombres:    document.getElementById("nombres-checkout")?.value.trim()    || "",
    apellidos:  document.getElementById("apellidos-checkout")?.value.trim()  || "",
    email:      document.getElementById("email-checkout")?.value.trim()      || "",
    celular:    document.getElementById("celular-checkout")?.value.trim()    || "",
    direccion:  document.getElementById("direccion-checkout")?.value.trim()  || "",
    direccion2: document.getElementById("direccion2-checkout")?.value.trim() || "",
    notas:      document.getElementById("notas-checkout")?.value.trim()      || "",
    metodoPago: _metodoPagoActivo()
  };
}

function _validarCampos(d) {
  var lista = [];

  if (!d.nombres)    lista.push("Los nombres son obligatorios.");
  if (!d.apellidos)  lista.push("Los apellidos son obligatorios.");
  if (!d.email)      lista.push("El email es obligatorio.");
  if (!d.celular)    lista.push("El celular es obligatorio.");
  if (!d.direccion)  lista.push("La dirección es obligatoria.");
  if (!d.metodoPago) lista.push("Debes seleccionar un método de pago.");

  var reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (d.email && !reEmail.test(d.email)) {
    lista.push("Debes ingresar un email válido.");
  }

  return lista;
}

async function _resolverCliente(campos) {
  var res  = await fetch(_URL_CLIENTES);
  var list = await res.json();

  if (!res.ok) throw new Error("No se pudo consultar la lista de clientes.");

  var existente = Array.isArray(list)
    ? list.find(function (c) { return (c.email || "").toLowerCase() === campos.email.toLowerCase(); })
    : null;

  if (existente && existente.id_cliente) {
    console.log("Cliente existente reutilizado:", existente);
    return existente.id_cliente;
  }

  var payload = {
    nombre:      campos.nombres,
    apellido:    campos.apellidos,
    email:       campos.email,
    celular:     campos.celular,
    direccion:   campos.direccion,
    direccion2:  campos.direccion2,
    descripcion: campos.notas
  };

  console.log("Payload enviado a /api/clientes:", payload);

  var crearRes = await fetch(_URL_CLIENTES, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload)
  });

  var creado = await crearRes.json();
  console.log("Respuesta /api/clientes:", creado);

  if (!crearRes.ok) throw new Error(creado.message || "No se pudo crear el cliente.");

  return creado.id;
}

function _toggleBotonSubmit(estado) {
  var btn = document.querySelector('#form-checkout button[type="submit"]');
  if (!btn) return;
  btn.disabled    = estado;
  btn.textContent = estado ? "Procesando..." : "Place Order";
}

function _mostrarAlerta(txt, tipo) {
  var el = document.getElementById("mensaje-checkout");

  if (!el) {
    el = document.createElement("div");
    el.id = "mensaje-checkout";
    el.style.marginBottom = "20px";
    var form = document.getElementById("form-checkout");
    form ? form.prepend(el) : document.body.prepend(el);
  }

  el.textContent = txt;
  el.className   = tipo === "error" ? "alert alert-danger" : "alert alert-success";
}

function _moneda(v) {
  return "$" + Number(v).toFixed(2);
}

function _escape(s) {
  return String(s)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}

// Módulo de logging externo — reservado para integración futura
function _enviarLogRemoto(evento, meta) {
  // sin implementación activa — pendiente de configuración
  void evento; void meta;
}

// Caché local de clientes — mejora de rendimiento pendiente
function _buscarClienteEnCache(email) {
  void email;
  return null;
}
