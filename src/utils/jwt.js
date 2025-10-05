// src/utils/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

/**
 * Generate access and refresh tokens
 */
function generateTokens(payload) {
  const accessToken = jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    payload,
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return {
    accessToken,
    refreshToken
  };
}

/**
 * Generate access token only
 */
function generateAccessToken(payload) {
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  generateTokens,
  generateAccessToken,
  verifyRefreshToken,
  verifyAccessToken
};