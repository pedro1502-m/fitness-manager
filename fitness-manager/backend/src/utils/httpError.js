/** Cria um erro com status HTTP para ser tratado pelo middleware central. */
module.exports = function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
};
