const ok = (res, data, meta = {}) => res.json({ data, meta, error: null });
const fail = (res, status, message) => res.status(status).json({ data: null, meta: {}, error: message });

module.exports = { ok, fail };
