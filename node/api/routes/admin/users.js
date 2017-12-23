const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const winston = require('winston');
const config = require('../../config');
const mailer = require('../../services/mailer');
const errorHandler = require('../../services/error-handler');
const validate = require('../../services/validate');

const User = mongoose.model('User');
const ObjectId = mongoose.Types.ObjectId;

/**
 * @api {post} /admin/users/authenticate authenticate an admin user
 * @apiName AuthenticateAdminUser
 * @apiGroup User
 *
 * @apiParam {req} Express request object.
 * @apiParam {req.body}
 * @apiParam {req.body.email} user email
 * @apiParam {req.body.password} entered password to compare against stored password
 *
 * @apiSuccess {User, JWT} User object + json web token.
 */
async function authenticateAdminUser(req, res, next) {
  try {
    validate(req.body, {
      email: 'Email address is required',
      password: 'Password is required',
    })

    const user = await User.findOne({email: req.body.email});

    if (!user) {
      return errorHandler.apiError(res, 'User not found', 404);
    }

    compareHash(user.password, req.body.password);

    if (!user.admin) {
      return errorHandler.apiError(res, 'Unauthorized access', 401);
    }

    const token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365),
      data: {
        id: user._id,
        admin: true,
      }
    }, config.jwtSecret);

    res.json({
      token: token,
      user: JSON.stringify({_id: user._id}),
    });
  } catch (error) {
    res.sendStatus(500);
  }
}

/**
 * @api {get} /admin/users Get all users
 * @apiName GetAllUsers
 * @apiGroup User
 *
 * @apiParam {req} Express request object.
 * @apiParam {res} Express response object object.
 *
 * @apiSuccess {Object} mongoose Users object.
 */
async function getAll(req, res, next) {
  try {
    const users = await User.find({});

    if (users.length === 0) {
      return errorHandler.apiError(res, 'No users found', 404);
    }

    res.json(users);
  } catch (error) {
    winston.error(error);
    res.sendStatus(500);
  }
}

/**
 * Compare a hash with a string to check validity
 * @param {Hash} hash hash to check
 * @param {String} comparison string to validate hash with
 */
function compareHash(hash, comparison) {
  if (!bcrypt.compareSync(comparison, hash)) {
    return errorHandler.apiError(res, 'Incorrect password', 403);
  }
}

module.exports = {
  authenticateAdminUser,
  getAll,
}
