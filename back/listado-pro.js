var _RUTA_PRODUCTOS = "http://localhost:3000/api/productos";

document.addEventListener("DOMContentLoaded", function () {
  _obtenerYRenderizarProductos();
});

async function _obtenerYRenderizarProductos() {
  var tbody  = document.getElementById("tabla-productos-body");
  var msgEl  = document.getElementById("mensaje-productos");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7">Cargando productos...</td>
    </tr>
  `;

  try {
    var res = await fetch(_RUTA_PRODUCTOS);

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    var lista = await res.json();

    if (!Array.isArray(lista) || !lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">No hay productos registrados.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = lista.map(function (p) {
      return `
        <tr>
          <td>${p.id ?? ""}</td>
          <td>${_sanitizeText(p.nombre ?? "")}</td>
          <td>${_sanitizeText(p.descripcion ?? "")}</td>
          <td>$${_fmtPrecio(p.precio)}</td>
          <td>${p.stock ?? 0}</td>
          <td>
            ${p.imagen
              ? `<img src="${_sanitizeAttr(p.imagen)}" alt="${_sanitizeAttr(p.nombre ?? "Producto")}" width="60">`
              : "Sin imagen"}
          </td>
          <td>
            <button type="button" onclick="goEditarProducto(${p.id})">Editar</button>
            <button type="button" onclick="goEliminarProducto(${p.id})">Eliminar</button>
          </td>
        </tr>
      `;
    }).join("");

    if (msgEl) {
      msgEl.textContent = "Productos cargados correctamente.";
      msgEl.className   = "mensaje-exito";
    }

  } catch (err) {
    console.error("Error al cargar productos:", err);

    tbody.innerHTML = `
      <tr>
        <td colspan="7">No se pudieron cargar los productos.</td>
      </tr>
    `;

    if (msgEl) {
      msgEl.textContent = "Error al cargar productos.";
      msgEl.className   = "mensaje-error";
    }
  }
}

function goEditarProducto(id) {
  window.location.href = `crear-pro.html?id=${id}`;
}

function goEliminarProducto(id) {
  console.log("Eliminar producto con id:", id);
  // conexión con DELETE /api/productos/:id pendiente
}

function _fmtPrecio(val) {
  var n = Number(val) || 0;
  return n.toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function _sanitizeText(str) {
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}

function _sanitizeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}

// Filtrado local de productos — sin implementación activa
function _filtrarProductosLocal(query) {
  void query;
  return [];
}

// Ordenamiento de columnas — reservado para siguiente iteración
function _sortTabla(columna, asc) {
  void columna; void asc;
}
