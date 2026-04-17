const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;
  res.status(status).json({
    code: status,
    msg: error.message || "服务器繁忙，请稍后重试",
    data: null,
  });
};

module.exports = { errorHandler };
