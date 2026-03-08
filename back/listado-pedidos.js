var _API_BASE = 'http://localhost:3000/api';
var _pedidosCache = [];

window.addEventListener('DOMContentLoaded', function () {
  _cargarListaPedidos();

  var inputBusq = document.querySelector('input[placeholder="Buscar Pedido"]');
  if (inputBusq) {
    inputBusq.addEventListener('keyup', _onFiltrarPedidos);
  }
});

// ── CARGA DE DATOS ─────────────────────────────────────────────

async function _cargarListaPedidos() {
  try {
    console.log('Iniciando carga de pedidos...');
    console.log('URL: ' + _API_BASE + '/pedidos');

    var res = await fetch(`${_API_BASE}/pedidos`);
    console.log('Respuesta recibida:', res.status);

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    var datos = await res.json();
    console.log('Pedidos cargados:', datos.length);
    _renderTablaPedidos(datos);

  } catch (err) {
    console.error('Error al cargar pedidos:', err);
    _setErrorTabla('Error al cargar los pedidos. ¿Está corriendo el backend en http://localhost:3000?');
  }
}

// ── RENDER ─────────────────────────────────────────────────────

function _renderTablaPedidos(lista) {
  var tbody = document.getElementById('tabla-pedidos');
  _pedidosCache  = lista;
  tbody.innerHTML = '';

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay pedidos registrados</td></tr>';
    return;
  }

  lista.forEach(function (p) {
    var fila  = document.createElement('tr');
    var fecha = new Date(p.fecha).toLocaleDateString('es-ES');

    var total = p.total;
    if (total === undefined || total === null || isNaN(total)) {
      total = (p.subtotal || 0) - (p.descuento || 0) + (p.aumento || 0);
    }
    if (isNaN(total) || total === undefined || total === null) total = 0;

    fila.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nombre} ${p.apellido}</td>
      <td>${p.email}</td>
      <td>${fecha}</td>
      <td>$${parseFloat(total).toFixed(2)}</td>
      <td>
        <span class="badge ${_badgeEstado(p.estado)}">
          ${p.estado}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-info"    onclick="mostrarDetallePedido(${p.id})"           title="Ver detalles"><i class="fas fa-eye"></i> Ver</button>
        <button class="btn btn-sm btn-warning" onclick="abrirModalEstado(${p.id}, '${p.estado}')" title="Cambiar estado"><i class="fas fa-edit"></i> Estado</button>
        <button class="btn btn-sm btn-danger"  onclick="pedirConfirmarEliminar(${p.id})"          title="Eliminar"><i class="fas fa-trash"></i> Eliminar</button>
      </td>
    `;

    tbody.appendChild(fila);
  });
}

function _badgeEstado(estado) {
  var mapa = {
    'pendiente':  'badge-warning',
    'procesando': 'badge-info',
    'completado': 'badge-success',
    'cancelado':  'badge-danger'
  };
  return mapa[estado.toLowerCase()] || 'badge-secondary';
}

// ── DETALLE DE PEDIDO ──────────────────────────────────────────

async function mostrarDetallePedido(id) {
  try {
    var res = await fetch(`${_API_BASE}/pedidos/${id}`);
    if (!res.ok) throw new Error('Error al obtener detalles');

    var pedido = await res.json();
    _abrirModalDetalle(pedido);

  } catch (err) {
    console.error('Error:', err);
    alert('Error al obtener los detalles del pedido');
  }
}

function _abrirModalDetalle(pedido) {
  var total = pedido.total;
  if (!total || isNaN(total)) {
    var base = (pedido.detalles || []).reduce(function (s, d) { return s + (d.precio * d.cantidad); }, 0);
    total = base - (pedido.descuento || 0) + (pedido.aumento || 0);
  }

  var filasDetalle = '';
  var acumBase = 0;

  if (pedido.detalles && pedido.detalles.length) {
    pedido.detalles.forEach(function (det) {
      var parcial = det.precio * det.cantidad;
      acumBase += parcial;
      filasDetalle += `
        <tr>
          <td>${det.producto_nombre}</td>
          <td>${det.cantidad}</td>
          <td>$${parseFloat(det.precio).toFixed(2)}</td>
          <td>$${parcial.toFixed(2)}</td>
        </tr>
      `;
    });
  }

  var cuerpo = `
    <h5>Pedido #${pedido.id}</h5>
    <p><strong>Cliente:</strong> ${pedido.nombre} ${pedido.apellido}</p>
    <p><strong>Email:</strong> ${pedido.email}</p>
    <p><strong>Fecha:</strong> ${new Date(pedido.fecha).toLocaleDateString('es-ES')}</p>
    <p><strong>Método de Pago:</strong> ${pedido.metodo_pago || 'N/A'}</p>
    <p><strong>Estado:</strong> <span class="badge badge-secondary">${pedido.estado}</span></p>
    <hr>
    <h6>Detalles del Pedido:</h6>
    <table class="table table-sm">
      <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
      <tbody>${filasDetalle}</tbody>
    </table>
    <hr>
    <div class="row">
      <div class="col-6">
        <p><strong>Subtotal:</strong> $${acumBase.toFixed(2)}</p>
        <p><strong>Descuento:</strong> -$${(pedido.descuento || 0).toFixed(2)}</p>
        <p><strong>Aumento/Envío:</strong> +$${(pedido.aumento || 0).toFixed(2)}</p>
      </div>
      <div class="col-6">
        <h5><strong>Total a Pagar:</strong> <span class="text-primary">$${total.toFixed(2)}</span></h5>
      </div>
    </div>
  `;

  var modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Detalles del Pedido</h5>
          <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
        </div>
        <div class="modal-body">${cuerpo}</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  $(modal).modal('show');
  $(modal).on('hidden.bs.modal', function () { modal.remove(); });
}

// ── CAMBIAR ESTADO ─────────────────────────────────────────────

async function abrirModalEstado(id, estadoActual) {
  var todos       = ['pendiente', 'procesando', 'completado', 'cancelado'];
  var disponibles = todos.filter(function (e) { return e !== estadoActual.toLowerCase(); });

  var optsHTML = '<select id="nuevoEstado" class="form-control mb-3">';
  disponibles.forEach(function (e) {
    optsHTML += `<option value="${e}">${e.charAt(0).toUpperCase() + e.slice(1)}</option>`;
  });
  optsHTML += '</select>';

  var modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id        = 'cambiarEstadoModal';
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Cambiar Estado del Pedido #${id}</h5>
          <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
        </div>
        <div class="modal-body">
          <p><strong>Estado Actual:</strong> <span class="badge badge-secondary">${estadoActual}</span></p>
          <label><strong>Nuevo Estado:</strong></label>
          ${optsHTML}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-primary" onclick="confirmarCambioEstado(${id}, document.getElementById('nuevoEstado').value, this)">Guardar Cambios</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  $(modal).modal('show');
  $(modal).on('hidden.bs.modal', function () { modal.remove(); });
}

async function confirmarCambioEstado(id, nuevoEstado, btn) {
  if (!nuevoEstado) { alert('Selecciona un nuevo estado'); return; }

  try {
    console.log(`Actualizando estado del pedido ${id} a ${nuevoEstado}`);

    var res = await fetch(`${_API_BASE}/pedidos/${id}/estado`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) {
      var err = await res.json();
      throw new Error(err.message || 'Error al actualizar estado');
    }

    $(document.getElementById('cambiarEstadoModal')).modal('hide');
    alert('✓ Estado actualizado correctamente');
    _cargarListaPedidos();

  } catch (err) {
    console.error('Error:', err);
    alert('Error al cambiar el estado del pedido: ' + err.message);
  }
}

// ── ELIMINAR PEDIDO ────────────────────────────────────────────

function pedirConfirmarEliminar(id) {
  if (confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
    _deleteRequest(id);
  }
}

async function _deleteRequest(id) {
  try {
    var res = await fetch(`${_API_BASE}/pedidos/${id}`, { method: 'DELETE' });

    if (!res.ok) throw new Error('Error al eliminar');

    alert('Pedido eliminado correctamente');
    _cargarListaPedidos();

  } catch (err) {
    console.error('Error:', err);
    alert('Error al eliminar el pedido');
  }
}

// ── BÚSQUEDA ───────────────────────────────────────────────────

function _onFiltrarPedidos(e) {
  var q = e.target.value.toLowerCase();

  if (!q.trim()) {
    _renderTablaPedidos(_pedidosCache);
    return;
  }

  var filtrados = _pedidosCache.filter(function (p) {
    return (
      p.id.toString().includes(q)        ||
      p.nombre.toLowerCase().includes(q) ||
      p.apellido.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)  ||
      p.estado.toLowerCase().includes(q)
    );
  });

  _renderTablaPedidos(filtrados);
}

function _setErrorTabla(msg) {
  var tbody = document.getElementById('tabla-pedidos');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center"><div class="alert alert-danger mb-0">${msg}</div></td></tr>`;
}

// Exportar pedidos a PDF — sin implementación
function _exportarPDF() {
  // pendiente de integración con librería de reportes
}

// Totales por rango de fechas — reservado
function _calcularTotalesPorRango(desde, hasta) {
  void desde; void hasta;
  return 0;
}
