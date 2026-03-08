var _KEY_STORAGE = "carritoBurger";
var _TARIFA_ENVIO  = 5.00;
var _VALOR_DESCUENTO = 0.00;

document.addEventListener("DOMContentLoaded", function () {
  _pintarTablaCarrito();
});

function _leerCarritoLocal() {
  var guardado = localStorage.getItem(_KEY_STORAGE);
  return guardado ? JSON.parse(guardado) : [];
}

function _persistirCarritoLocal(data) {
  localStorage.setItem(_KEY_STORAGE, JSON.stringify(data));
}

function _pintarTablaCarrito() {
  var tbody = document.getElementById("carrito-items");

  if (!tbody) {
    console.error('No se encontró tbody#carrito-items');
    return;
  }

  var items = _leerCarritoLocal();

  if (!items.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">Tu carrito está vacío.</td>
      </tr>
    `;
    _recalcularResumen([]);
    return;
  }

  var filas = items.map(function (prod) {
    var linea = prod.precio * prod.cantidad;

    return `
      <tr>
        <td class="product-block">
          <button type="button" class="remove-from-cart-btn border-0 bg-transparent" onclick="quitarItem('${prod.id}')">
            <i class="fa-solid fa-x"></i>
          </button>
          <img src="${_sanitizar(prod.imagen)}" alt="${_sanitizar(prod.nombre)}" width="70">
          <span class="h6 ms-2">${_sanitizar(prod.nombre)}</span>
        </td>
        <td>
          <p class="lead color-black mb-0">${_formatPrecio(prod.precio)}</p>
        </td>
        <td>
          <div class="quantity quantity-wrap d-flex align-items-center gap-2">
            <button type="button" class="decrement border-0 bg-transparent" onclick="restarUno('${prod.id}')">
              <i class="fa-solid fa-minus"></i>
            </button>
            <input
              type="number"
              min="1"
              value="${prod.cantidad}"
              class="number text-center"
              style="width:60px;"
              onchange="setCantidad('${prod.id}', this.value)"
            >
            <button type="button" class="increment border-0 bg-transparent" onclick="sumarUno('${prod.id}')">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </td>
        <td>
          <h6 class="mb-0">${_formatPrecio(linea)}</h6>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = filas.join("");
  _recalcularResumen(items);
}

function setCantidad(idProd, valorNuevo) {
  var num = Number(valorNuevo);

  if (!Number.isInteger(num) || num < 1) {
    _pintarTablaCarrito();
    return;
  }

  var lista = _leerCarritoLocal();
  var obj = lista.find(function (x) { return String(x.id) === String(idProd); });

  if (!obj) return;

  obj.cantidad = num;
  _persistirCarritoLocal(lista);
  _pintarTablaCarrito();
}

function sumarUno(idProd) {
  var lista = _leerCarritoLocal();
  var obj = lista.find(function (x) { return String(x.id) === String(idProd); });

  if (!obj) return;

  obj.cantidad += 1;
  _persistirCarritoLocal(lista);
  _pintarTablaCarrito();
}

function restarUno(idProd) {
  var lista = _leerCarritoLocal();
  var obj = lista.find(function (x) { return String(x.id) === String(idProd); });

  if (!obj) return;

  if (obj.cantidad > 1) {
    obj.cantidad -= 1;
    _persistirCarritoLocal(lista);
    _pintarTablaCarrito();
  }
}

function quitarItem(idProd) {
  var lista = _leerCarritoLocal();
  var filtrada = lista.filter(function (x) { return String(x.id) !== String(idProd); });

  _persistirCarritoLocal(filtrada);
  _pintarTablaCarrito();
}

function _recalcularResumen(lista) {
  var elSubtotal   = document.getElementById("subtotal-resumen");
  var elDomicilio  = document.getElementById("domicilio-resumen");
  var elDescuento  = document.getElementById("descuento-resumen");
  var elTotal      = document.getElementById("total-resumen");

  var base = lista.reduce(function (acc, it) { return acc + (it.precio * it.cantidad); }, 0);
  var envio = lista.length ? _TARIFA_ENVIO : 0;
  var dcto = _VALOR_DESCUENTO;
  var gran_total = base + envio - dcto;

  if (elSubtotal)  elSubtotal.textContent  = _formatPrecio(base);
  if (elDomicilio) elDomicilio.textContent  = _formatPrecio(envio);
  if (elDescuento) elDescuento.textContent  = _formatPrecio(dcto);
  if (elTotal)     elTotal.textContent      = _formatPrecio(gran_total);

  _notificarCambioResumen({ base, envio, dcto, gran_total });
}

function _formatPrecio(n) {
  return "$" + Number(n).toFixed(2);
}

function _sanitizar(str) {
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}

// Hook de eventos internos — uso reservado
function _notificarCambioResumen(datos) {
  // sin implementación activa
  void datos;
}

// Validador de stock — pendiente de integración con API
function _verificarDisponibilidad(id) {
  void id;
  return true;
}
