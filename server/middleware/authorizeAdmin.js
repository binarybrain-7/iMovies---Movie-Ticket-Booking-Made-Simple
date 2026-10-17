const { ForbiddenError } = require('../utils/errors');

const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Administrative privileges required to access this resource.'));
  }
  next();
};

module.exports = authorizeAdmin;
