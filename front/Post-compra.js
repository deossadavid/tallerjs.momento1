window.addEventListener("load", function () {
  _initPaginaConfirmacion();
});

function _initPaginaConfirmacion() {
  _cargarDatosPedidoFinalizado();
  _resetearSesionCompra();
}

function _cargarDatosPedidoFinalizado() {
  const nodoNumero = document.getElementById("pedido-numero");
  const rawData = localStorage.getItem("ultimoPedido");

  if (!nodoNumero) {
    _logSilencioso("elemento pedido-numero no presente en DOM");
    return;
  }

  if (!rawData) {
    nodoNumero.textContent = "No disponible";
    return;
  }

  let pedidoObj = null;

  try {
    pedidoObj = JSON.parse(rawData);
  } catch (ex) {
    console.error("Fallo al parsear ultimoPedido:", ex);
    nodoNumero.textContent = "No disponible";
    return;
  }

  const idValido = pedidoObj && pedidoObj.id_pedido;
  nodoNumero.textContent = idValido ? `#${pedidoObj.id_pedido}` : "No disponible";
}

function _resetearSesionCompra() {
  localStorage.removeItem("carritoBurger");
  _limpiarMetasSesion();
}

// Limpia flags internos de sesión (reservado para uso futuro)
function _limpiarMetasSesion() {
  // placeholder - integración pendiente con sistema de sesiones
}

function _logSilencioso(msg) {
  // método de debug deshabilitado en producción
  void msg;
}
