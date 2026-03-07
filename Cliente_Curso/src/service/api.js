import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/'; 

// 1. LISTAR (GET)
export const read = () => {
    return axios.get(`${BASE_URL}cursos/`);
};

// 2. CREAR (POST)
export const create = (data) => {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }
    return axios.post(`${BASE_URL}cursos/`, formData);
};

// 3. ACTUALIZAR (PUT)
export const update = (id, data) => {
    return axios.put(`${BASE_URL}cursos/${id}/`, data, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

// 4. ELIMINAR (DELETE)
export const deleteM = (id) => {
    return axios.delete(`${BASE_URL}cursos/${id}/`);
};

// 5. OBTENER DETALLES (GET)
export const readBitacora = () => {
    return axios.get(`${BASE_URL}bitacora/`);
};
