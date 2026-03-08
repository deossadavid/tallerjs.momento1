var _API_USUARIOS = 'http://localhost:3000/api';
var _usuariosCache = [];

document.addEventListener('DOMContentLoaded', function () {
  _fetchUsuarios();

  var campo = document.querySelector('input[placeholder="Buscar Usuario"]');
  if (campo) {
    campo.addEventListener('keyup', _onBuscarUsuario);
  }
});

// ── UTILIDADES ─────────────────────────────────────────────────

function _parsearFecha(raw) {
  if (!raw) return 'N/A';

  try {
    var d = new Date(raw);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('es-ES');
  } catch (e) {
    console.error('Error al formatear fecha:', e);
    return 'N/A';
  }
}

// ── CARGA DE DATOS ─────────────────────────────────────────────

async function _fetchUsuarios() {
  try {
    console.log('Iniciando carga de usuarios...');
    console.log('URL: ' + _API_USUARIOS + '/usuarios');

    var res = await fetch(`${_API_USUARIOS}/usuarios`);
    console.log('Respuesta recibida:', res.status);

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    var datos = await res.json();
    console.log('Usuarios cargados:', datos);
    console.log('Cantidad:', datos.length);

    _pintarTablaUsuarios(datos);

  } catch (err) {
    console.error('Error completo:', err);
    _setErrorTablaUsuarios('Error al cargar los usuarios. Verifica que el backend esté corriendo en http://localhost:3000');
  }
}

// ── RENDER ─────────────────────────────────────────────────────

function _pintarTablaUsuarios(lista) {
  var tbody = document.getElementById('tabla-usuarios');
  _usuariosCache  = lista;
  tbody.innerHTML = '';

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay usuarios registrados</td></tr>';
    return;
  }

  lista.forEach(function (u) {
    var fila  = document.createElement('tr');
    var fecha = _parsearFecha(u.fecha_creacion);

    fila.innerHTML = `
      <td>${u.id}</td>
      <td><strong>${u.usuario}</strong></td>
      <td>
        <span class="badge ${_badgeRol(u.rol)}">
          ${u.rol}
        </span>
      </td>
      <td>${fecha}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="abrirPanelEdicion(${u.id}, '${u.usuario}', '${u.rol}')" title="Editar">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button class="btn btn-sm btn-danger" onclick="solicitarBorrado(${u.id}, '${u.usuario}')" title="Eliminar">
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </td>
    `;

    tbody.appendChild(fila);
  });
}

function _badgeRol(rol) {
  var tabla = {
    'administrador': 'badge-danger',
    'vendedor':      'badge-primary',
    'cajero':        'badge-success'
  };
  return tabla[rol.toLowerCase()] || 'badge-secondary';
}

// ── EDITAR USUARIO ─────────────────────────────────────────────

function abrirPanelEdicion(id, usuario, rol) {
  var modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id        = 'editarUsuarioModal';
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Editar Usuario: ${usuario}</h5>
          <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
        </div>
        <div class="modal-body">
          <form id="formulario-editar-usuario">
            <div class="form-outline mb-4">
              <select id="rol-editar" class="form-control" required>
                <option value="administrador" ${rol === 'administrador' ? 'selected' : ''}>Administrador</option>
                <option value="vendedor"      ${rol === 'vendedor'      ? 'selected' : ''}>Vendedor</option>
                <option value="cajero"        ${rol === 'cajero'        ? 'selected' : ''}>Cajero</option>
              </select>
              <label class="form-label" for="rol-editar">Rol</label>
            </div>
            <div class="form-outline mb-4">
              <input type="password" id="contrasena-editar" class="form-control" placeholder="Dejar en blanco para no cambiar" />
              <label class="form-label" for="contrasena-editar">Nueva Contraseña (opcional)</label>
              <small class="text-muted">Mínimo 6 caracteres</small>
            </div>
            <div class="form-outline mb-4">
              <input type="password" id="confirmar-contrasena-editar" class="form-control" placeholder="Confirmar nueva contraseña" />
              <label class="form-label" for="confirmar-contrasena-editar">Confirmar Contraseña</label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-primary" onclick="persistirCambiosUsuario(${id}, this)">Guardar Cambios</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  $(modal).modal('show');
  $(modal).on('hidden.bs.modal', function () { modal.remove(); });
}

async function persistirCambiosUsuario(id, btn) {
  var nuevoRol    = document.getElementById('rol-editar').value;
  var nuevaPass   = document.getElementById('contrasena-editar').value;
  var confirmPass = document.getElementById('confirmar-contrasena-editar').value;

  if (nuevaPass || confirmPass) {
    if (nuevaPass.length < 6) {
      alert('La contraseña debe tener mínimo 6 caracteres');
      return;
    }
    if (nuevaPass !== confirmPass) {
      alert('Las contraseñas no coinciden');
      return;
    }
  }

  var payload = { rol: nuevoRol };
  if (nuevaPass) payload.contrasena = nuevaPass;

  try {
    console.log('Actualizando usuario:', payload);

    var res = await fetch(`${_API_USUARIOS}/usuarios/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    if (!res.ok) {
      var err = await res.json();
      throw new Error(err.message || 'Error al actualizar usuario');
    }

    $(document.getElementById('editarUsuarioModal')).modal('hide');
    alert('✓ Usuario actualizado correctamente');
    _fetchUsuarios();

  } catch (err) {
    console.error('Error:', err);
    alert('Error al actualizar el usuario: ' + err.message);
  }
}

// ── ELIMINAR USUARIO ───────────────────────────────────────────

function solicitarBorrado(id, usuario) {
  if (confirm(`¿Estás seguro de que deseas eliminar al usuario "${usuario}"?`)) {
    _deleteUsuario(id);
  }
}

async function _deleteUsuario(id) {
  try {
    console.log(`Eliminando usuario ${id}...`);

    var res = await fetch(`${_API_USUARIOS}/usuarios/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      var err = await res.json();
      throw new Error(err.message || 'Error al eliminar usuario');
    }

    alert('✓ Usuario eliminado correctamente');
    _fetchUsuarios();

  } catch (err) {
    console.error('Error:', err);
    alert('Error al eliminar el usuario: ' + err.message);
  }
}

// ── BÚSQUEDA ───────────────────────────────────────────────────

function _onBuscarUsuario(e) {
  var q = e.target.value.toLowerCase();

  if (!q.trim()) {
    _pintarTablaUsuarios(_usuariosCache);
    return;
  }

  var filtrados = _usuariosCache.filter(function (u) {
    return (
      u.id.toString().includes(q)         ||
      u.usuario.toLowerCase().includes(q) ||
      u.rol.toLowerCase().includes(q)
    );
  });

  _pintarTablaUsuarios(filtrados);
}

function _setErrorTablaUsuarios(msg) {
  var tbody = document.getElementById('tabla-usuarios');
  tbody.innerHTML = `<tr><td colspan="5" class="text-center"><div class="alert alert-danger mb-0">${msg}</div></td></tr>`;
}

// Registro de auditoría de cambios — pendiente de implementación
function _logCambioUsuario(id, campo, valor) {
  void id; void campo; void valor;
}

// Resetear sesión activa del usuario — reservado
function _invalidarSesionUsuario(id) {
  void id;
}
