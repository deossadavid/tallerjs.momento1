var _BASE_API = 'http://localhost:3000/api';
var _itemsCarrito = [];
var _catalogoProductos = [];

window.addEventListener('DOMContentLoaded', function () {
  _fetchClientes();
  _fetchProductos();

  var frm = document.getElementById('formulario-pedido');
  if (frm) {
    frm.addEventListener('submit', function (e) {
      e.preventDefault();
      _enviarPedido();
    });
  }
});

// ── CARGA INICIAL ──────────────────────────────────────────────

async function _fetchClientes() {
  try {
    var res = await fetch(`${_BASE_API}/clientes`);
    if (!res.ok) throw new Error('Error al cargar clientes');

    var lista   = await res.json();
    var selectEl = document.getElementById('id_cliente');

    lista.forEach(function (c) {
      var op = document.createElement('option');
      op.value       = c.id_cliente;
      op.textContent = `${c.nombre} ${c.apellido}`;
      selectEl.appendChild(op);
    });
  } catch (err) {
    console.error('Error:', err);
    alert('Error al cargar los clientes');
  }
}

async function _fetchProductos() {
  try {
    var res = await fetch(`${_BASE_API}/productos`);
    if (!res.ok) throw new Error('Error al cargar productos');

    _catalogoProductos = await res.json();
    var selectEl        = document.getElementById('id_producto');

    _catalogoProductos.forEach(function (p) {
      var op = document.createElement('option');
      op.value            = p.id;
      op.textContent      = `${p.nombre} - $${parseFloat(p.precio).toFixed(2)}`;
      op.dataset.precio   = p.precio;
      selectEl.appendChild(op);
    });
  } catch (err) {
    console.error('Error:', err);
    alert('Error al cargar los productos');
  }
}

// ── GESTIÓN DEL CARRITO ────────────────────────────────────────

function agregarProducto() {
  var selProd  = document.getElementById('id_producto');
  var cantEl   = document.getElementById('cantidad_producto');

  if (!selProd.value) {
    alert('Selecciona un producto');
    return;
  }

  var cant = parseInt(cantEl.value);
  if (cant <= 0) {
    alert('La cantidad debe ser mayor a 0');
    return;
  }

  var pid  = parseInt(selProd.value);
  var prod = _catalogoProductos.find(function (p) { return p.id === pid; });

  if (!prod) {
    alert('Producto no encontrado');
    return;
  }

  var existente = _itemsCarrito.find(function (it) { return it.id_producto === pid; });

  if (existente) {
    existente.cantidad += cant;
  } else {
    _itemsCarrito.push({
      id_producto: pid,
      nombre:      prod.nombre,
      precio:      parseFloat(prod.precio),
      cantidad:    cant
    });
  }

  console.log('Carrito actualizado:', _itemsCarrito);
  _renderTablaCarrito();
  _recalcularTotal();

  selProd.value  = '';
  cantEl.value   = '1';
}

function _renderTablaCarrito() {
  var tbody = document.getElementById('carrito-items');
  tbody.innerHTML = '';

  if (!_itemsCarrito.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay productos agregados</td></tr>';
    return;
  }

  _itemsCarrito.forEach(function (item, idx) {
    var parcial = item.precio * item.cantidad;
    var fila    = document.createElement('tr');
    fila.innerHTML = `
      <td>${item.nombre}</td>
      <td>$${item.precio.toFixed(2)}</td>
      <td>
        <input type="number" min="1" value="${item.cantidad}"
               onchange="modificarCantidad(${idx}, this.value)" class="form-control" style="width:80px;">
      </td>
      <td>$${parcial.toFixed(2)}</td>
      <td>
        <button type="button" class="btn btn-sm btn-danger" onclick="quitarItem(${idx})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

function modificarCantidad(idx, nuevaVal) {
  var num = parseInt(nuevaVal);

  if (num <= 0) {
    quitarItem(idx);
    return;
  }

  _itemsCarrito[idx].cantidad = num;
  _renderTablaCarrito();
  _recalcularTotal();
}

function quitarItem(idx) {
  _itemsCarrito.splice(idx, 1);
  _renderTablaCarrito();
  _recalcularTotal();
}

// ── CÁLCULOS ───────────────────────────────────────────────────

function _calcularEnvio(base) {
  var UMBRAL_GRATIS = 50000;
  var TARIFA        = 8000;
  return base > UMBRAL_GRATIS ? 0 : TARIFA;
}

function _recalcularTotal() {
  if (!_itemsCarrito.length) {
    document.getElementById('total-pedido').textContent = '$0.00';
    document.getElementById('aumento').value = '0';
    return;
  }

  var base      = _itemsCarrito.reduce(function (s, it) { return s + (it.precio * it.cantidad); }, 0);
  var dcto      = parseFloat(document.getElementById('descuento').value) || 0;
  var envio     = _calcularEnvio(base);

  document.getElementById('aumento').value = envio.toFixed(2);

  var total = base - dcto + envio;
  console.log(`Base: $${base.toFixed(2)} | Dcto: -$${dcto.toFixed(2)} | Envío: +$${envio.toFixed(2)} | Total: $${Math.max(total, 0).toFixed(2)}`);

  document.getElementById('total-pedido').textContent = `$${Math.max(total, 0).toFixed(2)}`;
}

// ── ENVÍO DEL PEDIDO ───────────────────────────────────────────

async function _enviarPedido() {
  var idCliente  = document.getElementById('id_cliente').value;
  var metodoPago = document.getElementById('metodo_pago').value;
  var dcto       = parseFloat(document.getElementById('descuento').value) || 0;
  var envio      = parseFloat(document.getElementById('aumento').value)   || 0;

  if (!idCliente)  { alert('Selecciona un cliente');   return; }
  if (!metodoPago) { alert('Selecciona un método de pago'); return; }
  if (!_itemsCarrito.length) { alert('Agregar al menos un producto al carrito'); return; }

  var base = _itemsCarrito.reduce(function (s, it) { return s + (it.precio * it.cantidad); }, 0);

  var cuerpo = {
    id_cliente:  parseInt(idCliente),
    metodo_pago: metodoPago,
    descuento:   dcto,
    aumento:     envio,
    productos:   _itemsCarrito.map(function (it) {
      return { id_producto: it.id_producto, cantidad: it.cantidad, precio: it.precio };
    })
  };

  console.log('Enviando pedido:', cuerpo);
  console.log(`Resumen: Subtotal $${base.toFixed(2)} | Descuento $${dcto.toFixed(2)} | Domicilio $${envio.toFixed(2)} | Total $${(base - dcto + envio).toFixed(2)}`);

  try {
    var res = await fetch(`${_BASE_API}/pedidos`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(cuerpo)
    });

    if (!res.ok) {
      var err = await res.json();
      throw new Error(err.message || 'Error al crear el pedido');
    }

    var resultado = await res.json();
    alert(`Pedido creado exitosamente - ID: ${resultado.id || resultado.insertId}`);

    _resetearFormularioPedido();
    setTimeout(function () { window.location.href = 'listado-pedidos.html'; }, 1500);

  } catch (err) {
    console.error('Error:', err);
    alert('Error al crear el pedido: ' + err.message);
  }
}

function _resetearFormularioPedido() {
  document.getElementById('formulario-pedido').reset();
  _itemsCarrito = [];
  _renderTablaCarrito();
  _recalcularTotal();
  document.getElementById('id_cliente').value  = '';
  document.getElementById('metodo_pago').value = '';
}

// Caché de precios — pendiente de implementación
function _cachePrecio(id, precio) {
  void id; void precio;
}

// Notificación de stock bajo — integración futura con alertas
function _alertaStockBajo(idProducto) {
  void idProducto;
}
