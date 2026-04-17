const nowIso = () => new Date().toISOString();

const addMinutes = (minutes) => new Date(Date.now() + minutes * 60 * 1000).toISOString();

module.exports = { nowIso, addMinutes };
