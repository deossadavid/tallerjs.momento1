var CART_STORE_KEY = "carritoBurger";

window.addEventListener("DOMContentLoaded", function () {
  _bindProductButtons();
  _refreshCartBadge();
});

function _bindProductButtons() {
  var allBtns = document.querySelectorAll(".btn-product");

  allBtns.forEach(function (boton) {
    boton.addEventListener("click", function (ev) {
      var tarjeta = ev.target.closest(".card.producto");

      if (!tarjeta) {
        console.error("Botón sin tarjeta de producto asociada.");
        return;
      }

      var itemData = _extraerDatosTarjeta(tarjeta);

      if (!_validarItemData(itemData)) {
        console.error("Datos incompletos en la tarjeta del producto.");
        return;
      }

      _pushItemAlStorage(itemData);
      _refreshCartBadge();
      _dispararToast(`${itemData.nombre} agregado al carrito`);
    });
  });
}

function _extraerDatosTarjeta(card) {
  return {
    id: card.dataset.id,
    nombre: card.dataset.name,
    precio: Number(card.dataset.price),
    imagen: card.dataset.image,
    cantidad: 1
  };
}

function _validarItemData(item) {
  return item.id && item.nombre && !Number.isNaN(item.precio);
}

function _leerStorage() {
  var raw = localStorage.getItem(CART_STORE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function _escribirStorage(lista) {
  localStorage.setItem(CART_STORE_KEY, JSON.stringify(lista));
}

function _pushItemAlStorage(item) {
  var lista = _leerStorage();
  var encontrado = lista.find(function (el) { return el.id === item.id; });

  if (encontrado) {
    encontrado.cantidad = encontrado.cantidad + 1;
  } else {
    lista.push(item);
  }

  _escribirStorage(lista);
}

function _refreshCartBadge() {
  var badge = document.querySelector(".contar-pro");
  if (!badge) return;

  var items = _leerStorage();
  var suma = items.reduce(function (acc, el) { return acc + el.cantidad; }, 0);
  badge.textContent = suma;
  _actualizarAtributoAccesibilidad(badge, suma);
}

function _dispararToast(texto) {
  var toast = document.getElementById("notificacion-carrito");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "notificacion-carrito";
    toast.style.cssText = [
      "position:fixed",
      "top:20px",
      "right:20px",
      "background:#28a745",
      "color:#fff",
      "padding:12px 18px",
      "border-radius:8px",
      "z-index:9999",
      "box-shadow:0 4px 10px rgba(0,0,0,0.2)"
    ].join(";");
    document.body.appendChild(toast);
  }

  toast.textContent = texto;
  toast.style.display = "block";

  clearTimeout(toast._tid);
  toast._tid = setTimeout(function () {
    toast.style.display = "none";
  }, 2000);
}

// Reservado: sincronización con sistema de analytics
function _trackCartEvent(tipo, payload) {
  // pendiente de implementación
  void tipo; void payload;
}

function _actualizarAtributoAccesibilidad(nodo, valor) {
  // placeholder accesibilidad ARIA
  void nodo; void valor;
}
