import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

export const getPlayers = (params) => api.get('/players', { params });
export const getPlayer  = (id)     => api.get(`/players/${id}`);
export const getPlayerRatings = (id, params) => api.get(`/players/${id}/ratings`, { params });

export const getBestXI  = (params) => api.get('/lineup/best-xi', { params });

export const getFixtures = (params) => api.get('/fixtures', { params });

export const getLeagues  = (params) => api.get('/leagues', { params });
export const getClubs    = (params) => api.get('/clubs', { params });

export const comparePlayers = (ids)  => api.get('/compare', { params: { ids: ids.join(',') } });

export const getFormations = () => api.get('/meta/formations');
export const getOptions    = () => api.get('/meta/options');

export default api;
