import { useState, useEffect } from 'react';
import { read, create, update, deleteM } from './service/api';
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
    const [cargando, setCargando] = useState(false);
    const [cargandoGuardar, setCargandoGuardar] = useState(false);
    const [erroresBackend, setErroresBackend] = useState({});
    const [paginaActual, setPaginaActual] = useState(1);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const registrosPorPagina = 5;

    useEffect(() => {
        cargarCursos();
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

    const totalPaginasCursos = Math.ceil(cursosFiltrados.length / registrosPorPagina);
    const cursosPaginados = cursosFiltrados.slice(
        (paginaActual - 1) * registrosPorPagina,
        paginaActual * registrosPorPagina
    );

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
        headerCard: {
            backgroundColor: colores.primario,
            color: 'white'
        },
        headerCardEditar: {
            backgroundColor: colores.advertencia,
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
                        <span className="d-none d-sm-inline">Sistema de Gestion de Cursos</span>
                        <span className="d-sm-none">Gestion de Cursos</span>
                    </span>
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                            {cursos.length} cursos
                        </span>
                    </div>
                </div>
            </nav>

            {/* Barra de acciones */}
            <div className="bg-white border-bottom shadow-sm sticky-top">
                <div className="container-fluid py-2">
                    <div className="d-flex justify-content-between align-items-center gap-2">
                        <h5 className="mb-0 fw-semibold" style={{ color: colores.primario }}>
                            Cursos
                        </h5>

                        <div className="d-flex gap-2 flex-shrink-0">
                            <button 
                                className="btn btn-sm d-lg-none"
                                style={estilos.botonPrimario}
                                onClick={() => { setMostrarFormulario(!mostrarFormulario); limpiarFormulario(); }}
                            >
                                {mostrarFormulario ? 'X' : '+'}
                            </button>
                            <button 
                                className="btn btn-sm"
                                style={estilos.botonPrimarioOutline}
                                onClick={() => cargarCursos()}
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
                <div className="row g-3 g-lg-4">
                    {/* Formulario */}
                    <div className={`col-12 col-lg-4 ${!mostrarFormulario ? 'd-none d-lg-block' : ''}`}>
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <div 
                                className="card-header d-flex justify-content-between align-items-center py-3"
                                style={editandoId ? estilos.headerCardEditar : estilos.headerCard}
                            >
                                <h5 className="mb-0 fw-semibold fs-6">
                                    {editandoId ? 'Editar Curso' : 'Nuevo Curso'}
                                </h5>
                                <button 
                                    className="btn btn-sm btn-light d-lg-none"
                                    onClick={() => { setMostrarFormulario(false); limpiarFormulario(); }}
                                >
                                    X
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
                                                placeholder="Ej. Programacion Web"
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
                                            <label className="form-label fw-medium small" style={{ color: colores.texto }}>Codigo</label>
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
                                            <label className="form-label fw-medium small" style={{ color: colores.texto }}>Creditos</label>
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
                                            <label className="form-label fw-medium small" style={{ color: colores.texto }}>Cupo maximo</label>
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
                                                <option value="ABIERTO">Abierto</option>
                                                <option value="CERRADO">Cerrado</option>
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
                                                        editandoId ? 'Actualizar Curso' : 'Guardar Curso'
                                                    )}
                                                </button>
                                                {editandoId && (
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-outline-secondary"
                                                        onClick={limpiarFormulario}
                                                        disabled={cargandoGuardar}
                                                    >
                                                        Cancelar edicion
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
                                                X
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
                                                        <th style={{ color: colores.primario }}>Codigo</th>
                                                        <th className="text-center" style={{ color: colores.primario }}>Creditos</th>
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
                                                                {filtro ? 'No hay cursos que coincidan' : 'No hay cursos registrados'}
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
                                                                        {curso.estado === 'ABIERTO' ? 'Abierto' : 'Cerrado'}
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

                                        {/* Cards para moviles */}
                                        <div className="d-md-none p-3">
                                            {cursosPaginados.length === 0 ? (
                                                <div className="text-center py-4" style={{ color: colores.textoClaro }}>
                                                    {filtro ? 'No hay cursos que coincidan' : 'No hay cursos registrados'}
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
                                                                    <strong>Profesor:</strong> {curso.profesor}
                                                                </div>
                                                                <div className="col-6">
                                                                    <strong>Creditos:</strong> {curso.creditos}
                                                                </div>
                                                                <div className="col-6">
                                                                    <strong>Cupo:</strong> {curso.cupo_maximo}
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
            </div>

            {/* Footer */}
            <footer className="text-center py-3 mt-auto" style={{ backgroundColor: colores.primario, color: 'white' }}>
                <small className="d-block fw-medium">Sistema de Gestion de Cursos</small>
                <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                    2026 | Django + React
                </small>
            </footer>
        </div>
    );
}
