var _API_ROOT = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function () {
  var frm = document.getElementById('formulario-usuario');
  if (frm) {
    frm.addEventListener('submit', function (e) {
      e.preventDefault();
      _submitNuevoUsuario();
    });
  }

  var inpPass    = document.getElementById('contrasena');
  var inpConfirm = document.getElementById('confirmar_contrasena');

  if (inpPass && inpConfirm) {
    inpPass.addEventListener('input',    _checkPasswordRealtime);
    inpConfirm.addEventListener('input', _checkPasswordRealtime);
  }
});

// ── VALIDACIONES ───────────────────────────────────────────────

function _checkPasswordRealtime() {
  var pass     = document.getElementById('contrasena').value;
  var confirm  = document.getElementById('confirmar_contrasena').value;

  var inpPass  = document.getElementById('contrasena');
  var msgPass  = document.getElementById('mensaje-contrasena');

  if (pass && pass.length < 6) {
    inpPass.classList.add('is-invalid');
    if (msgPass) msgPass.style.display = 'block';
  } else if (pass) {
    inpPass.classList.remove('is-invalid');
    if (msgPass) msgPass.style.display = 'none';
  }

  var inpConf  = document.getElementById('confirmar_contrasena');
  var msgConf  = document.getElementById('mensaje-confirmar');

  if (confirm && pass && pass !== confirm) {
    inpConf.classList.add('is-invalid');
    if (msgConf) msgConf.style.display = 'block';
  } else if (confirm && (!pass || pass === confirm)) {
    inpConf.classList.remove('is-invalid');
    if (msgConf) msgConf.style.display = 'none';
  }
}

function _validarDatosUsuario(rol, usuario, pass, confirmPass) {
  if (!rol) {
    alert('Selecciona un rol');
    return false;
  }

  if (!usuario || usuario.trim().length === 0) {
    alert('Ingresa un nombre de usuario');
    return false;
  }

  if (usuario.length < 3) {
    alert('El usuario debe tener al menos 3 caracteres');
    return false;
  }

  if (!pass) {
    alert('Ingresa una contraseña');
    return false;
  }

  if (pass.length < 6) {
    alert('La contraseña debe tener mínimo 6 caracteres');
    return false;
  }

  if (!confirmPass) {
    alert('Confirma la contraseña');
    return false;
  }

  if (pass !== confirmPass) {
    alert('Las contraseñas no coinciden');
    return false;
  }

  return true;
}

// ── CREAR USUARIO ──────────────────────────────────────────────

async function _submitNuevoUsuario() {
  var rol          = document.getElementById('rol').value;
  var usuario      = document.getElementById('usuario').value;
  var pass         = document.getElementById('contrasena').value;
  var confirmPass  = document.getElementById('confirmar_contrasena').value;

  if (!_validarDatosUsuario(rol, usuario, pass, confirmPass)) return;

  var payload = {
    usuario:    usuario,
    contrasena: pass,
    rol:        rol
  };

  console.log('Enviando usuario:', payload);

  try {
    var res = await fetch(`${_API_ROOT}/usuarios`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    if (!res.ok) {
      var err = await res.json();
      throw new Error(err.message || 'Error al crear el usuario');
    }

    var data = await res.json();
    alert(`✓ Usuario creado exitosamente - ID: ${data.id || data.insertId}`);

    _limpiarFormUsuario();
    setTimeout(function () { window.location.href = 'listado-usuarios.html'; }, 1500);

  } catch (err) {
    console.error('Error:', err);
    alert('Error al crear el usuario: ' + err.message);
  }
}

function _limpiarFormUsuario() {
  document.getElementById('formulario-usuario').reset();
  document.getElementById('contrasena').classList.remove('is-invalid');
  document.getElementById('confirmar_contrasena').classList.remove('is-invalid');
  _clearSessionFlags();
}

// Limpia flags de sesión internos — pendiente de implementación
function _clearSessionFlags() {
  // reservado
}

// Verificación de disponibilidad del nombre de usuario — integración futura
function _checkUsernameDisponible(nombre) {
  void nombre;
  return Promise.resolve(true);
}
