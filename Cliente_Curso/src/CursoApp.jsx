import { useState, useEffect } from 'react';
import { read, create, update, deleteM, readBitacora } from './service/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import toast, { Toaster } from 'react-hot-toast';

// Paleta de colores del sistema
const colores = {
    primario: '#2c3e50',        // Azul oscuro principal
    primarioClaro: '#34495e',   // Azul oscuro claro
    secundario: '#3498db',      // Azul brillante
    exito: '#27ae60',           // Verde
    advertencia: '#f39c12',     // Naranja/Amarillo
    peligro: '#e74c3c',         // Rojo
    info: '#17a2b8',            // Cian
    fondo: '#ecf0f1',           // Gris claro
    fondoCard: '#ffffff',       // Blanco
    texto: '#2c3e50',           // Texto oscuro
    textoClaro: '#7f8c8d',      // Texto gris
};

export default function CursoApp() {
    const [cursos, setCursos] = useState([]);
    const [bitacora, setBitacora] = useState([]);
    const [vistaActiva, setVistaActiva] = useState('cursos');
    const [formData, setFormData] = useState({ 
        nombre: '', 
        codigo: '', 
        creditos: '', 
        profesor: '', 
        cupo_maximo: '', 
        estado: 'ABIERTO' 
    });
    const [editandoId, setEditandoId] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [filtroAudit, setFiltroAudit] = useState('');
    const [cargando, setCargando] = useState(false);
    const [cargandoGuardar, setCargandoGuardar] = useState(false);
    const [erroresBackend, setErroresBackend] = useState({});
    const [paginaActual, setPaginaActual] = useState(1);
    const [paginaAudit, setPaginaAudit] = useState(1);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [mostrarDetalleAudit, setMostrarDetalleAudit] = useState(false);
    const [logSeleccionado, setLogSeleccionado] = useState(null);
    const registrosPorPagina = 5;

    useEffect(() => {
        cargarCursos();
        cargarBitacora();
    }, []);

    const cargarCursos = async () => {
        setCargando(true);
        try {
            const respuesta = await read();
            setCursos(respuesta.data);
        } catch (error) {
            console.error("Error al cargar cursos:", error);
            toast.error("Error al obtener los cursos del servidor");
        } finally {
            setCargando(false);
        }
    };

    const cargarBitacora = async () => {
        try {
            const respuesta = await readBitacora();
            setBitacora(respuesta.data);
        } catch (error) {
            console.error("Error al cargar bitácora:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargandoGuardar(true);
        setErroresBackend({});

        try {
            if (editandoId) {
                await update(editandoId, formData);
                toast.success("Curso actualizado correctamente");
            } else {
                await create(formData);
                toast.success("Curso registrado exitosamente");
            }

            limpiarFormulario();
            cargarCursos();
            cargarBitacora();
            setMostrarFormulario(false);
            
        } catch (error) {
            console.error("Error al guardar:", error);
            if (error.response && error.response.data) {
                setErroresBackend(error.response.data);
                toast.error("Por favor, corrige los errores en el formulario");
            } else {
                toast.error("Error de conexión con el servidor");
            }        
        } finally {
            setCargandoGuardar(false);
        }
    };

    const limpiarFormulario = () => {
        setFormData({ 
            nombre: '', 
            codigo: '', 
            creditos: '', 
            profesor: '', 
            cupo_maximo: '', 
            estado: 'ABIERTO' 
        });
        setEditandoId(null);
        setErroresBackend({});
    };

    const prepararEdicion = (curso) => {
        setFormData({
            nombre: curso.nombre,
            codigo: curso.codigo,
            creditos: curso.creditos,
            profesor: curso.profesor,
            cupo_maximo: curso.cupo_maximo,
            estado: curso.estado
        });
        setEditandoId(curso.id);
        setVistaActiva('cursos');
        setMostrarFormulario(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEliminar = async (id) => {
        if (window.confirm("¿Seguro que deseas eliminar este curso?")) {
            const toastId = toast.loading("Eliminando curso..."); 
            try {
                await deleteM(id);
                toast.success("Curso eliminado", { id: toastId });
                cargarCursos();
                cargarBitacora();
            } catch (error) {
                console.error("Error al eliminar:", error);
                toast.error("Error al eliminar el curso", { id: toastId });
            }
        }
    };

    const cursosFiltrados = cursos.filter(curso => 
        curso.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
        curso.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
        curso.profesor.toLowerCase().includes(filtro.toLowerCase()) ||
        curso.estado.toLowerCase().includes(filtro.toLowerCase())
    );

    const bitacoraFiltrada = bitacora.filter(log =>
        (log.accion_texto?.toLowerCase() || '').includes(filtroAudit.toLowerCase()) ||
        (log.modelo?.toLowerCase() || '').includes(filtroAudit.toLowerCase()) ||
        (log.object_repr?.toLowerCase() || '').includes(filtroAudit.toLowerCase()) ||
        (log.actor_nombre?.toLowerCase() || '').includes(filtroAudit.toLowerCase())
    );

    const totalPaginasCursos = Math.ceil(cursosFiltrados.length / registrosPorPagina);
    const cursosPaginados = cursosFiltrados.slice(
        (paginaActual - 1) * registrosPorPagina,
        paginaActual * registrosPorPagina
    );

    const totalPaginasAudit = Math.ceil(bitacoraFiltrada.length / registrosPorPagina);
    const auditLogsPaginados = bitacoraFiltrada.slice(
        (paginaAudit - 1) * registrosPorPagina,
        paginaAudit * registrosPorPagina
    );

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatearFechaCompleta = (fecha) => {
        return new Date(fecha).toLocaleString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getBadgeAccion = (accion) => {
        const estilos = {
            'CREAR': { backgroundColor: colores.exito, color: 'white' },
            'ACTUALIZAR': { backgroundColor: colores.advertencia, color: 'white' },
            'ELIMINAR': { backgroundColor: colores.peligro, color: 'white' }
        };
        return estilos[accion] || { backgroundColor: colores.textoClaro, color: 'white' };
    };

    const verDetalleAudit = (log) => {
        setLogSeleccionado(log);
        setMostrarDetalleAudit(true);
    };

    const cerrarDetalleAudit = () => {
        setMostrarDetalleAudit(false);
        setLogSeleccionado(null);
    };

    const Paginacion = ({ paginaActual, totalPaginas, setPagina }) => {
        if (totalPaginas <= 1) return null;
        
        return (
            <nav aria-label="Paginación">
                <ul className="pagination pagination-sm justify-content-center mb-0 flex-wrap">
                    <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={() => setPagina(paginaActual - 1)}
                            style={{ color: colores.primario }}
                        >
                            ‹
                        </button>
                    </li>
                    {[...Array(totalPaginas)].map((_, i) => (
                        <li key={i} className={`page-item ${paginaActual === i + 1 ? 'active' : ''}`}>
                            <button 
                                className="page-link" 
                                onClick={() => setPagina(i + 1)}
                                style={paginaActual === i + 1 ? 
                                    { backgroundColor: colores.primario, borderColor: colores.primario, color: 'white' } : 
                                    { color: colores.primario }
                                }
                            >
                                {i + 1}
                            </button>
                        </li>
                    ))}
                    <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={() => setPagina(paginaActual + 1)}
                            style={{ color: colores.primario }}
                        >
                            ›
                        </button>
                    </li>
                </ul>
            </nav>
        );
    };

    // Estilos reutilizables
    const estilos = {
        botonPrimario: {
            backgroundColor: colores.secundario,
            borderColor: colores.secundario,
            color: 'white'
        },
        botonPrimarioOutline: {
            backgroundColor: 'transparent',
            borderColor: colores.secundario,
            color: colores.secundario
        },
        botonEditar: {
            backgroundColor: colores.advertencia,
            borderColor: colores.advertencia,
            color: 'white'
        },
        botonEliminar: {
            backgroundColor: 'transparent',
            borderColor: colores.peligro,
            color: colores.peligro
        },
        botonVer: {
            backgroundColor: colores.primario,
            borderColor: colores.primario,
            color: 'white'
        },
        headerCard: {
            backgroundColor: colores.primario,
            color: 'white'
        },
        headerCardEditar: {
            backgroundColor: colores.advertencia,
            color: 'white'
        },
        navActivo: {
            backgroundColor: colores.primario,
            color: 'white'
        },
        badge: {
            backgroundColor: colores.primarioClaro,
            color: 'white'
        }
    };

    return (
        <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: colores.fondo }}>
            <Toaster 
                position="top-center" 
                reverseOrder={false}
                toastOptions={{
                    style: {
                        maxWidth: '90vw',
                        background: colores.primario,
                        color: 'white',
                    },
                    success: {
                        style: {
                            background: colores.exito,
                        },
                    },
                    error: {
                        style: {
                            background: colores.peligro,
                        },
                    },
                }}
            />

            {/* Navbar Principal */}
            <nav className="navbar shadow-sm py-2 py-md-3" style={{ backgroundColor: colores.primario }}>
                <div className="container-fluid">
                    <span className="navbar-brand fw-bold d-flex align-items-center" style={{ color: 'white' }}>
                        <span className="d-none d-sm-inline">Sistema de Gestión de Cursos</span>
                        <span className="d-sm-none">Gestión de Cursos</span>
                    </span>
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                            {cursos.length} cursos
                        </span>
                    </div>
                </div>
            </nav>

            {/* Barra de navegación secundaria */}
            <div className="bg-white border-bottom shadow-sm sticky-top">
                <div className="container-fluid py-2">
                    <div className="d-flex justify-content-between align-items-center gap-2">
                        <ul className="nav nav-pills flex-nowrap" style={{ minWidth: 0 }}>
                            <li className="nav-item me-2">
                                <button 
                                    className="nav-link px-3 py-2 fw-medium"
                                    style={vistaActiva === 'cursos' ? estilos.navActivo : { color: colores.primario }}
                                    onClick={() => setVistaActiva('cursos')}
                                >
                                    Cursos
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className="nav-link px-3 py-2 fw-medium d-flex align-items-center gap-2"
                                    style={vistaActiva === 'auditoria' ? estilos.navActivo : { color: colores.primario }}
                                    onClick={() => { setVistaActiva('auditoria'); cargarBitacora(); }}
                                >
                                    Auditoría
                                    {bitacora.length > 0 && (
                                        <span 
                                            className="badge rounded-pill" 
                                            style={{ 
                                                backgroundColor: vistaActiva === 'auditoria' ? 'rgba(255,255,255,0.3)' : colores.primarioClaro,
                                                color: 'white',
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            {bitacora.length}
                                        </span>
                                    )}
                                </button>
                            </li>
                        </ul>

                        <div className="d-flex gap-2 flex-shrink-0">
                            {vistaActiva === 'cursos' && (
                                <button 
                                    className="btn btn-sm d-lg-none"
                                    style={estilos.botonPrimario}
                                    onClick={() => { setMostrarFormulario(!mostrarFormulario); limpiarFormulario(); }}
                                >
                                    {mostrarFormulario ? '✖' : '➕'}
                                </button>
                            )}
                            <button 
                                className="btn btn-sm"
                                style={estilos.botonPrimarioOutline}
                                onClick={() => { cargarCursos(); cargarBitacora(); }}
                                disabled={cargando}
                            >
                                {cargando ? (
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                ) : (
                                    <span className="d-none d-sm-inline">Actualizar</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido Principal */}
            <div className="container-fluid py-3 py-md-4 flex-grow-1">
                
                {/* Vista de Cursos */}
                {vistaActiva === 'cursos' && (
                    <div className="row g-3 g-lg-4">
                        {/* Formulario */}
                        <div className={`col-12 col-lg-4 ${!mostrarFormulario ? 'd-none d-lg-block' : ''}`}>
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                <div 
                                    className="card-header d-flex justify-content-between align-items-center py-3"
                                    style={editandoId ? estilos.headerCardEditar : estilos.headerCard}
                                >
                                    <h5 className="mb-0 fw-semibold fs-6">
                                        {editandoId ? ' Editar Curso' : 'Nuevo Curso'}
                                    </h5>
                                    <button 
                                        className="btn btn-sm btn-light d-lg-none"
                                        onClick={() => { setMostrarFormulario(false); limpiarFormulario(); }}
                                    >
                                        ✖
                                    </button>
                                </div>
                                <div className="card-body p-3">
                                    <form onSubmit={handleSubmit}>
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label fw-medium small" style={{ color: colores.texto }}>
                                                    Nombre del curso
                                                </label>
                                                <input 
                                                    type="text" 
                                                    name="nombre" 
                                                    placeholder="Ej. Programación Web"
                                                    className={`form-control ${erroresBackend.nombre ? 'is-invalid' : ''}`}
                                                    style={{ borderColor: '#dee2e6' }}
                                                    value={formData.nombre} 
                                                    onChange={handleChange} 
                                                    required 
                                                    disabled={cargandoGuardar} 
                                                />
                                                {erroresBackend.nombre && (
                                                    <div className="invalid-feedback small">{erroresBackend.nombre.join(', ')}</div>
                                                )}                              
                                            </div>

                                            <div className="col-6">
                                                <label className="form-label fw-medium small" style={{ color: colores.texto }}>Código</label>
                                                <input 
                                                    type="text" 
                                                    name="codigo" 
                                                    placeholder="CS101"
                                                    className={`form-control ${erroresBackend.codigo ? 'is-invalid' : ''}`}
                                                    value={formData.codigo} 
                                                    onChange={handleChange} 
                                                    required 
                                                    disabled={cargandoGuardar} 
                                                />
                                                {erroresBackend.codigo && (
                                                    <div className="invalid-feedback small">{erroresBackend.codigo.join(', ')}</div>
                                                )}
                                            </div>

                                            <div className="col-6">
                                                <label className="form-label fw-medium small" style={{ color: colores.texto }}>Créditos</label>
                                                <input 
                                                    type="number" 
                                                    name="creditos" 
                                                    placeholder="3"
                                                    className={`form-control ${erroresBackend.creditos ? 'is-invalid' : ''}`}
                                                    value={formData.creditos} 
                                                    onChange={handleChange} 
                                                    required 
                                                    disabled={cargandoGuardar} 
                                                />
                                                {erroresBackend.creditos && (
                                                    <div className="invalid-feedback small">{erroresBackend.creditos.join(', ')}</div>
                                                )}                        
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label fw-medium small" style={{ color: colores.texto }}>Profesor</label>
                                                <input
                                                    type="text"
                                                    name="profesor"
                                                    placeholder="Nombre del profesor"
                                                    className={`form-control ${erroresBackend.profesor ? 'is-invalid' : ''}`}
                                                    value={formData.profesor}
                                                    onChange={handleChange}
                                                    required
                                                    disabled={cargandoGuardar}
                                                />
                                                {erroresBackend.profesor && (
                                                    <div className="invalid-feedback small">{erroresBackend.profesor.join(', ')}</div>
                                                )}
                                            </div>

                                            <div className="col-6">
                                                <label className="form-label fw-medium small" style={{ color: colores.texto }}>Cupo máximo</label>
                                                <input
                                                    type="number"
                                                    name="cupo_maximo"
                                                    placeholder="30"
                                                    className={`form-control ${erroresBackend.cupo_maximo ? 'is-invalid' : ''}`}
                                                    value={formData.cupo_maximo}
                                                    onChange={handleChange}
                                                    required
                                                    disabled={cargandoGuardar}
                                                />
                                                {erroresBackend.cupo_maximo && (
                                                    <div className="invalid-feedback small">{erroresBackend.cupo_maximo.join(', ')}</div>
                                                )}
                                            </div>
    
                                            <div className="col-6">
                                                <label className="form-label fw-medium small" style={{ color: colores.texto }}>Estado</label>
                                                <select
                                                    name="estado"
                                                    className={`form-select ${erroresBackend.estado ? 'is-invalid' : ''}`}
                                                    value={formData.estado}
                                                    onChange={handleChange}
                                                    disabled={cargandoGuardar}
                                                >
                                                    <option value="ABIERTO"> Abierto</option>
                                                    <option value="CERRADO"> Cerrado</option>
                                                </select>
                                                {erroresBackend.estado && (
                                                    <div className="invalid-feedback small">{erroresBackend.estado.join(', ')}</div>
                                                )}
                                            </div>

                                            <div className="col-12 mt-3">
                                                <div className="d-grid gap-2">
                                                    <button 
                                                        type="submit" 
                                                        className="btn"
                                                        style={editandoId ? estilos.botonEditar : estilos.botonPrimario}
                                                        disabled={cargandoGuardar}
                                                    >
                                                        {cargandoGuardar ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                                Guardando...
                                                            </>
                                                        ) : (
                                                            editandoId ? ' Actualizar Curso' : ' Guardar Curso'
                                                        )}
                                                    </button>
                                                    {editandoId && (
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-secondary"
                                                            onClick={limpiarFormulario}
                                                            disabled={cargandoGuardar}
                                                        >
                                                             Cancelar edición
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Cursos */}
                        <div className="col-12 col-lg-8">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                <div className="card-header bg-white py-3 border-bottom">
                                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                                        <h5 className="mb-0 fw-semibold" style={{ color: colores.primario }}>
                                            Lista de Cursos
                                        </h5>
                                        <div className="input-group" style={{ maxWidth: '280px' }}>
                                            <input 
                                                className="form-control border-start-0" 
                                                placeholder="Buscar curso..."
                                                value={filtro}
                                                onChange={(e) => { setFiltro(e.target.value); setPaginaActual(1); }}
                                            />
                                            {filtro && (
                                                <button className="btn btn-outline-secondary" onClick={() => setFiltro('')}>
                                                    ✖
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body p-0">
                                    {cargando ? (
                                        <div className="text-center py-5">
                                            <div className="spinner-border" style={{ color: colores.secundario }} role="status"></div>
                                            <p className="mt-2 small" style={{ color: colores.textoClaro }}>Cargando cursos...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Tabla para escritorio */}
                                            <div className="table-responsive d-none d-md-block">
                                                <table className="table table-hover align-middle mb-0">
                                                    <thead style={{ backgroundColor: colores.fondo }}>
                                                        <tr>
                                                            <th style={{ color: colores.primario }}>Curso</th>
                                                            <th style={{ color: colores.primario }}>Código</th>
                                                            <th className="text-center" style={{ color: colores.primario }}>Créditos</th>
                                                            <th style={{ color: colores.primario }}>Profesor</th>
                                                            <th className="text-center" style={{ color: colores.primario }}>Cupo</th>
                                                            <th className="text-center" style={{ color: colores.primario }}>Estado</th>
                                                            <th className="text-center" style={{ color: colores.primario }}>Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {cursosPaginados.length === 0 ? (
                                                            <tr>
                                                                <td colSpan="7" className="text-center py-4" style={{ color: colores.textoClaro }}>
                                                                    {filtro ? ' No hay cursos que coincidan' : ' No hay cursos registrados'}
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            cursosPaginados.map(curso => (
                                                                <tr key={curso.id}>
                                                                    <td className="fw-medium" style={{ color: colores.texto }}>{curso.nombre}</td>
                                                                    <td>
                                                                        <code style={{ 
                                                                            backgroundColor: colores.fondo, 
                                                                            color: colores.secundario,
                                                                            padding: '2px 8px',
                                                                            borderRadius: '4px'
                                                                        }}>
                                                                            {curso.codigo}
                                                                        </code>
                                                                    </td>
                                                                    <td className="text-center">{curso.creditos}</td>
                                                                    <td style={{ color: colores.textoClaro }}>{curso.profesor}</td>
                                                                    <td className="text-center">{curso.cupo_maximo}</td>
                                                                    <td className="text-center">
                                                                        <span 
                                                                            className="badge"
                                                                            style={{ 
                                                                                backgroundColor: curso.estado === 'ABIERTO' ? colores.exito : colores.peligro,
                                                                                color: 'white'
                                                                            }}
                                                                        >
                                                                            {curso.estado === 'ABIERTO' ? ' Abierto' : ' Cerrado'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <div className="btn-group btn-group-sm">
                                                                            <button 
                                                                                className="btn"
                                                                                style={estilos.botonEditar}
                                                                                onClick={() => prepararEdicion(curso)}
                                                                                title="Editar"
                                                                            >
                                                                                Editar
                                                                            </button>
                                                                            <button 
                                                                                className="btn"
                                                                                style={estilos.botonEliminar}
                                                                                onClick={() => handleEliminar(curso.id)}
                                                                                title="Eliminar"
                                                                            >
                                                                                Eliminar
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Cards para móviles */}
                                            <div className="d-md-none p-3">
                                                {cursosPaginados.length === 0 ? (
                                                    <div className="text-center py-4" style={{ color: colores.textoClaro }}>
                                                        {filtro ? ' No hay cursos que coincidan' : ' No hay cursos registrados'}
                                                    </div>
                                                ) : (
                                                    cursosPaginados.map(curso => (
                                                        <div 
                                                            key={curso.id} 
                                                            className="card mb-3 border-0 shadow-sm"
                                                            style={{ borderRadius: '10px', borderLeft: `4px solid ${curso.estado === 'ABIERTO' ? colores.exito : colores.peligro}` }}
                                                        >
                                                            <div className="card-body p-3">
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <div>
                                                                        <h6 className="mb-1 fw-bold" style={{ color: colores.texto }}>{curso.nombre}</h6>
                                                                        <code style={{ 
                                                                            backgroundColor: colores.fondo, 
                                                                            color: colores.secundario,
                                                                            padding: '2px 6px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '0.8rem'
                                                                        }}>
                                                                            {curso.codigo}
                                                                        </code>
                                                                    </div>
                                                                    <span 
                                                                        className="badge"
                                                                        style={{ 
                                                                            backgroundColor: curso.estado === 'ABIERTO' ? colores.exito : colores.peligro,
                                                                            color: 'white'
                                                                        }}
                                                                    >
                                                                        {curso.estado}
                                                                    </span>
                                                                </div>
                                                                <div className="row g-2 small mb-3" style={{ color: colores.textoClaro }}>
                                                                    <div className="col-12">
                                                                        <strong> Profesor:</strong> {curso.profesor}
                                                                    </div>
                                                                    <div className="col-6">
                                                                        <strong> Créditos:</strong> {curso.creditos}
                                                                    </div>
                                                                    <div className="col-6">
                                                                        <strong> Cupo:</strong> {curso.cupo_maximo}
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex gap-2">
                                                                    <button 
                                                                        className="btn btn-sm flex-grow-1"
                                                                        style={estilos.botonEditar}
                                                                        onClick={() => prepararEdicion(curso)}
                                                                    >
                                                                        Editar
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-sm flex-grow-1"
                                                                        style={estilos.botonEliminar}
                                                                        onClick={() => handleEliminar(curso.id)}
                                                                    >
                                                                        Eliminar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {cursosFiltrados.length > registrosPorPagina && (
                                    <div className="card-footer bg-white py-3 border-top">
                                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                                            <small style={{ color: colores.textoClaro }}>
                                                Mostrando {cursosPaginados.length} de {cursosFiltrados.length} cursos
                                            </small>
                                            <Paginacion 
                                                paginaActual={paginaActual} 
                                                totalPaginas={totalPaginasCursos} 
                                                setPagina={setPaginaActual} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Vista de Auditoría */}
                {vistaActiva === 'auditoria' && (
                    <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                        <div className="card-header bg-white py-3 border-bottom">
                            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                                <div>
                                    <h5 className="mb-0 fw-semibold" style={{ color: colores.primario }}>
                                        Registro de Auditoría
                                    </h5>
                                    <small style={{ color: colores.textoClaro }}>Historial de cambios del sistema</small>
                                </div>
                                <div className="input-group" style={{ maxWidth: '280px' }}>
                                    <input 
                                        type="text" 
                                        className="form-control border-start-0" 
                                        placeholder="Buscar en auditoría..."
                                        value={filtroAudit}
                                        onChange={(e) => { setFiltroAudit(e.target.value); setPaginaAudit(1); }}
                                    />
                                    {filtroAudit && (
                                        <button className="btn btn-outline-secondary" onClick={() => setFiltroAudit('')}>
                                            ✖
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            {/* Tabla para escritorio */}
                            <div className="table-responsive d-none d-md-block">
                                <table className="table table-hover align-middle mb-0">
                                    <thead style={{ backgroundColor: colores.fondo }}>
                                        <tr className="text-center">
                                            <th style={{ color: colores.primario }}>Fecha</th>
                                            <th style={{ color: colores.primario }}>Acción</th>
                                            <th style={{ color: colores.primario }}>Modelo</th>
                                            <th style={{ color: colores.primario }}>Objeto</th>
                                            <th style={{ color: colores.primario }}>Cambios</th>
                                            <th style={{ color: colores.primario }}>Usuario</th>
                                            <th style={{ color: colores.primario }}>Detalles</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogsPaginados.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4" style={{ color: colores.textoClaro }}>
                                                    {filtroAudit ? ' No hay registros que coincidan' : ' No hay registros de auditoría'}
                                                </td>
                                            </tr>
                                        ) : (
                                            auditLogsPaginados.map(log => (
                                                <tr key={log.id} className="text-center">
                                                    <td style={{ color: colores.textoClaro, fontSize: '0.85rem' }}>
                                                        {formatearFecha(log.timestamp)}
                                                    </td>
                                                    <td>
                                                        <span 
                                                            className="badge"
                                                            style={getBadgeAccion(log.accion_texto)}
                                                        >
                                                            {log.accion_texto}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span 
                                                            className="badge"
                                                            style={{ backgroundColor: colores.fondo, color: colores.primario }}
                                                        >
                                                            {log.modelo}
                                                        </span>
                                                    </td>
                                                    <td className="fw-semibold" style={{ color: colores.secundario }}>
                                                        {log.object_repr}
                                                    </td>
                                                    <td>
                                                        <small 
                                                            className="text-truncate d-inline-block" 
                                                            style={{ maxWidth: '250px', color: colores.textoClaro }}
                                                            title={log.cambios_formateados}
                                                        >
                                                            {log.cambios_formateados}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <span 
                                                            className="badge"
                                                            style={estilos.badge}
                                                        >
                                                             {log.actor_nombre}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="btn btn-sm"
                                                            style={estilos.botonVer}
                                                            onClick={() => verDetalleAudit(log)}
                                                            title="Ver detalles"
                                                        >
                                                            Ver
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Cards para móviles */}
                            <div className="d-md-none p-3">
                                {auditLogsPaginados.length === 0 ? (
                                    <div className="text-center py-4" style={{ color: colores.textoClaro }}>
                                        {filtroAudit ? ' No hay registros que coincidan' : ' No hay registros de auditoría'}
                                    </div>
                                ) : (
                                    auditLogsPaginados.map(log => (
                                        <div 
                                            key={log.id} 
                                            className="card mb-3 border-0 shadow-sm"
                                            style={{ borderRadius: '10px' }}
                                        >
                                            <div className="card-body p-3">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <span 
                                                        className="badge"
                                                        style={getBadgeAccion(log.accion_texto)}
                                                    >
                                                        {log.accion_texto}
                                                    </span>
                                                    <small style={{ color: colores.textoClaro }}>{formatearFecha(log.timestamp)}</small>
                                                </div>
                                                <h6 className="mb-2 fw-bold" style={{ color: colores.secundario }}>{log.object_repr}</h6>
                                                <div className="d-flex gap-2 mb-2 flex-wrap">
                                                    <span className="badge" style={{ backgroundColor: colores.fondo, color: colores.primario }}>
                                                        {log.modelo}
                                                    </span>
                                                    <span className="badge" style={estilos.badge}>
                                                        {log.actor_nombre}
                                                    </span>
                                                </div>
                                                <small className="d-block mb-3" style={{ color: colores.textoClaro, wordBreak: 'break-word' }}>
                                                    {log.cambios_formateados}
                                                </small>
                                                <button 
                                                    className="btn btn-sm w-100"
                                                    style={estilos.botonVer}
                                                    onClick={() => verDetalleAudit(log)}
                                                >
                                                     Ver detalles completos
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        {bitacoraFiltrada.length > registrosPorPagina && (
                            <div className="card-footer bg-white py-3 border-top">
                                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                                    <small style={{ color: colores.textoClaro }}>
                                        Mostrando {auditLogsPaginados.length} de {bitacoraFiltrada.length} registros
                                    </small>
                                    <Paginacion 
                                        paginaActual={paginaAudit} 
                                        totalPaginas={totalPaginasAudit} 
                                        setPagina={setPaginaAudit} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Detalles de Auditoría */}
            {mostrarDetalleAudit && logSeleccionado && (
                <div 
                    className="modal fade show d-block" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} 
                    onClick={cerrarDetalleAudit}
                >
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content border-0 shadow" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <div className="modal-header py-3" style={{ backgroundColor: colores.primario, color: 'white' }}>
                                <h5 className="modal-title fw-bold">
                                    Detalle de Auditoría - Registro #{logSeleccionado.id}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={cerrarDetalleAudit}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-4">
                                    {/* Columna Izquierda - Información General */}
                                    <div className="col-lg-6">
                                        {/* ID Interno del Registro */}
                                        <div className="card mb-3 border-0" style={{ backgroundColor: colores.fondo, borderRadius: '10px' }}>
                                            <div className="card-body">
                                                <h6 className="card-title mb-3" style={{ color: colores.primario }}>
                                                    ID Interno del Registro
                                                </h6>
                                                <div className="row g-2">
                                                    <div className="col-6">
                                                        <span className="d-block small" style={{ color: colores.textoClaro }}>ID Registro</span>
                                                        <code style={{ 
                                                            backgroundColor: colores.primario, 
                                                            color: 'white',
                                                            padding: '4px 10px',
                                                            borderRadius: '4px',
                                                            fontSize: '1rem'
                                                        }}>
                                                            #{logSeleccionado.id}
                                                        </code>
                                                    </div>
                                                    <div className="col-6">
                                                        <span className="d-block small" style={{ color: colores.textoClaro }}>Acción</span>
                                                        <span className="badge" style={getBadgeAccion(logSeleccionado.accion_texto)}>
                                                            {logSeleccionado.accion_texto}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Objeto Afectado */}
                                        <div className="card mb-3 border-0" style={{ backgroundColor: colores.fondo, borderRadius: '10px' }}>
                                            <div className="card-body">
                                                <h6 className="card-title mb-3" style={{ color: colores.primario }}>
                                                    Objeto Afectado
                                                </h6>
                                                <div className="row g-2">
                                                    <div className="col-12">
                                                        <span className="d-block small" style={{ color: colores.textoClaro }}>Nombre</span>
                                                        <span className="fw-bold" style={{ color: colores.secundario, fontSize: '1.1rem' }}>
                                                            {logSeleccionado.object_repr}
                                                        </span>
                                                    </div>
                                                    <div className="col-6">
                                                        <span className="d-block small" style={{ color: colores.textoClaro }}>object_pk (ID)</span>
                                                        <code style={{ backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>
                                                            {logSeleccionado.objeto_id}
                                                        </code>
                                                    </div>
                                                    <div className="col-6">
                                                        <span className="d-block small" style={{ color: colores.textoClaro }}>content_type</span>
                                                        <code style={{ backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>
                                                            {logSeleccionado.content_type || 'N/A'}
                                                        </code>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Usuario Responsable */}
                                        <div className="card mb-3 border-0" style={{ backgroundColor: colores.fondo, borderRadius: '10px' }}>
                                            <div className="card-body">
                                                <h6 className="card-title mb-3" style={{ color: colores.primario }}>
                                                    Usuario Responsable
                                                </h6>
                                                <div className="d-flex align-items-center gap-3 mb-3">
                                                    <div 
                                                        className="rounded-circle d-flex align-items-center justify-content-center" 
                                                        style={{ 
                                                            width: '45px', 
                                                            height: '45px', 
                                                            fontSize: '1.1rem',
                                                            backgroundColor: colores.primario,
                                                            color: 'white'
                                                        }}
                                                    >
                                                        {logSeleccionado.actor_nombre?.charAt(0)?.toUpperCase() || 'S'}
                                                    </div>
                                                    <div>
                                                        <span className="fw-bold d-block" style={{ color: colores.texto }}>
                                                            {logSeleccionado.actor_nombre || 'Sistema'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="row g-2">
                                                    <div className="col-12">
                                                        <span className="d-block small" style={{ color: colores.textoClaro }}>IP del Usuario</span>
                                                        <code style={{ 
                                                            backgroundColor: '#e9ecef', 
                                                            padding: '4px 8px', 
                                                            borderRadius: '4px',
                                                            display: 'inline-block'
                                                        }}>
                                                            {logSeleccionado.ip_usuario || 'No disponible'}
                                                        </code>
                                                    </div>
                                                    <div className="col-12 mt-2">
                                                        <span className="d-block small" style={{ color: colores.textoClaro }}>User Agent</span>
                                                        <div 
                                                            className="bg-white p-2 rounded border small" 
                                                            style={{ 
                                                                maxHeight: '60px', 
                                                                overflow: 'auto',
                                                                wordBreak: 'break-all',
                                                                fontSize: '0.75rem',
                                                                color: colores.textoClaro
                                                            }}
                                                        >
                                                            {logSeleccionado.user_agent || 'No disponible'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fecha y Hora */}
                                        <div className="card border-0" style={{ backgroundColor: colores.fondo, borderRadius: '10px' }}>
                                            <div className="card-body">
                                                <h6 className="card-title mb-3" style={{ color: colores.primario }}>
                                                    Fecha y Hora
                                                </h6>
                                                <div className="bg-white p-3 rounded border text-center">
                                                    <span className="fw-bold" style={{ color: colores.texto, fontSize: '1.1rem' }}>
                                                        {formatearFechaCompleta(logSeleccionado.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna Derecha - Datos Técnicos */}
                                    <div className="col-lg-6">
                                        {/* Cambios en JSON */}
                                        <div className="card mb-3 border-0" style={{ backgroundColor: colores.fondo, borderRadius: '10px' }}>
                                            <div className="card-body">
                                                <h6 className="card-title mb-3" style={{ color: colores.primario }}>
                                                    Cambios en JSON
                                                </h6>
                                                <pre 
                                                    className="bg-dark text-light p-3 rounded mb-0" 
                                                    style={{ 
                                                        maxHeight: '150px', 
                                                        overflow: 'auto',
                                                        fontSize: '0.8rem',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    {logSeleccionado.cambios_json ? 
                                                        JSON.stringify(logSeleccionado.cambios_json, null, 2) : 
                                                        'Sin cambios JSON registrados'}
                                                </pre>
                                            </div>
                                        </div>

                                        {/* Datos Antes */}
                                        <div className="card mb-3 border-0" style={{ backgroundColor: colores.fondo, borderRadius: '10px' }}>
                                            <div className="card-body">
                                                <h6 className="card-title mb-3" style={{ color: colores.peligro }}>
                                                    Datos ANTES del cambio
                                                </h6>
                                                <pre 
                                                    className="p-3 rounded mb-0" 
                                                    style={{ 
                                                        maxHeight: '150px', 
                                                        overflow: 'auto',
                                                        fontSize: '0.8rem',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                        backgroundColor: '#ffeaea',
                                                        border: `1px solid ${colores.peligro}`,
                                                        color: colores.texto
                                                    }}
                                                >
                                                    {logSeleccionado.datos_antes && Object.keys(logSeleccionado.datos_antes).length > 0 ? 
                                                        JSON.stringify(logSeleccionado.datos_antes, null, 2) : 
                                                        'Sin datos anteriores (registro nuevo)'}
                                                </pre>
                                            </div>
                                        </div>

                                        {/* Datos Después */}
                                        <div className="card border-0" style={{ backgroundColor: colores.fondo, borderRadius: '10px' }}>
                                            <div className="card-body">
                                                <h6 className="card-title mb-3" style={{ color: colores.exito }}>
                                                    Datos DESPUÉS del cambio
                                                </h6>
                                                <pre 
                                                    className="p-3 rounded mb-0" 
                                                    style={{ 
                                                        maxHeight: '150px', 
                                                        overflow: 'auto',
                                                        fontSize: '0.8rem',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                        backgroundColor: '#eafbea',
                                                        border: `1px solid ${colores.exito}`,
                                                        color: colores.texto
                                                    }}
                                                >
                                                    {logSeleccionado.datos_despues && Object.keys(logSeleccionado.datos_despues).length > 0 ? 
                                                        JSON.stringify(logSeleccionado.datos_despues, null, 2) : 
                                                        'Sin datos posteriores (registro eliminado)'}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Descripción del cambio */}
                                <div className="card mt-4 border-0" style={{ backgroundColor: colores.fondo, borderRadius: '10px' }}>
                                    <div className="card-body">
                                        <h6 className="card-title mb-3" style={{ color: colores.primario }}>
                                            Descripción del Cambio
                                        </h6>
                                        <div className="bg-white p-3 rounded border">
                                            <p className="mb-0" style={{ color: colores.texto }}>
                                                {logSeleccionado.cambios_formateados || 'Sin descripción'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-top">
                                <button 
                                    type="button" 
                                    className="btn"
                                    style={estilos.botonPrimario}
                                    onClick={cerrarDetalleAudit}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="text-center py-3 mt-auto" style={{ backgroundColor: colores.primario, color: 'white' }}>
                <small className="d-block fw-medium">Sistema de Gestión de Cursos</small>
                <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                    © 2026 | Django + React | Auditoría Integrada
                </small>
            </footer>
        </div>
    );
}
