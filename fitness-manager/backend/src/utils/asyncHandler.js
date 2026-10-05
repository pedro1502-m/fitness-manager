/** Encaminha erros de handlers async para o middleware de erro do Express. */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
