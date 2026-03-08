var _URL_CLIENTES = "http://localhost:3000/api/clientes";
var _cacheClientes = [];

window.addEventListener("DOMContentLoaded", function () {
  var inputSearch = document.getElementById("buscador-clientes");

  _traerClientes();

  if (inputSearch) {
    inputSearch.addEventListener("input", _onBuscarCliente);
  }
});

async function _traerClientes() {
  var tbody  = document.getElementById("tabla-clientes");
  var msgEl  = document.getElementById("mensaje-clientes");

  if (!tbody) {
    console.error('tbody#tabla-clientes no encontrado');
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td colspan="7">Cargando clientes...</td>
    </tr>
  `;

  try {
    var res = await fetch(_URL_CLIENTES);

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    var data = await res.json();
    _cacheClientes = Array.isArray(data) ? data : [];

    _pintarFilasClientes(_cacheClientes);

    if (msgEl) {
      msgEl.textContent = "Clientes cargados correctamente.";
      msgEl.className   = "alert alert-success";
    }

  } catch (err) {
    console.error("Error al cargar clientes:", err);

    tbody.innerHTML = `
      <tr>
        <td colspan="7">No se pudieron cargar los clientes.</td>
      </tr>
    `;

    if (msgEl) {
      msgEl.textContent = "Error al cargar clientes.";
      msgEl.className   = "alert alert-danger";
    }
  }
}

function _pintarFilasClientes(lista) {
  var tbody = document.getElementById("tabla-clientes");
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">No hay clientes registrados.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lista.map(function (c) {
    return `
      <tr>
        <td>${c.id_cliente ?? ""}</td>
        <td>${_xss(c.nombre ?? "")}</td>
        <td>${_xss(c.apellido ?? "")}</td>
        <td>${_xss(c.email ?? "")}</td>
        <td>${_xss(c.celular ?? "")}</td>
        <td>${_xss(c.direccion ?? "")}</td>
        <td>
          <button type="button" class="btn btn-warning btn-sm me-1"
                  onclick="irEditarCliente(${c.id_cliente})">Editar</button>
          <button type="button" class="btn btn-danger btn-sm"
                  onclick="borrarCliente(${c.id_cliente})">Eliminar</button>
        </td>
      </tr>
    `;
  }).join("");
}

function _onBuscarCliente() {
  var query = document.getElementById("buscador-clientes")?.value.toLowerCase().trim() || "";

  var filtrados = _cacheClientes.filter(function (c) {
    var n  = (c.nombre    || "").toLowerCase();
    var a  = (c.apellido  || "").toLowerCase();
    var e  = (c.email     || "").toLowerCase();
    var cel = (c.celular  || "").toLowerCase();
    var dir = (c.direccion|| "").toLowerCase();

    return n.includes(query) || a.includes(query) || e.includes(query)
        || cel.includes(query) || dir.includes(query);
  });

  _pintarFilasClientes(filtrados);
}

function irEditarCliente(id) {
  window.location.href = `crear-cliente.html?id=${id}`;
}

async function borrarCliente(id) {
  var ok = confirm("¿Seguro que deseas eliminar este cliente?");
  if (!ok) return;

  try {
    var res  = await fetch(`${_URL_CLIENTES}/${id}`, { method: "DELETE" });
    var data = await res.json();

    if (!res.ok) throw new Error(data.message || "No se pudo eliminar el cliente.");

    alert("Cliente eliminado correctamente.");
    await _traerClientes();

  } catch (err) {
    console.error("Error al eliminar cliente:", err);
    alert(err.message || "Ocurrió un error al eliminar el cliente.");
  }
}

function _xss(str) {
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}

// Exportar CSV — funcionalidad pendiente
function _exportarClientesCSV() {
  // sin implementación
}

// Paginación — reservado para versiones futuras
function _irPagina(num) {
  void num;
}
