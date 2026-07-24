'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticateToken, getJwtSecret } = require('../middleware/auth');

const router = express.Router();

const identityQuery = `
  SELECT u.id, u.email, u.name, m.tenant_id, m.role
  FROM users u
  LEFT JOIN tenant_memberships m ON m.user_id = u.id AND m.active = TRUE
  WHERE u.id = $1
  ORDER BY m.tenant_id
  LIMIT 1
`;

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const result = await pool.query(`
      SELECT u.id, u.email, u.password, u.name, m.tenant_id, m.role
      FROM users u
      LEFT JOIN tenant_memberships m ON m.user_id = u.id AND m.active = TRUE
      WHERE LOWER(u.email) = LOWER($1)
      ORDER BY m.tenant_id
      LIMIT 1
    `, [email]);
    const row = result.rows[0];
    if (!row || !await bcrypt.compare(password, row.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = {
      id: row.id,
      email: row.email,
      name: row.name,
      tenantId: row.tenant_id || null,
      role: row.role || 'unassigned',
    };
    const token = jwt.sign(user, getJwtSecret(), {
      expiresIn: process.env.JWT_TTL || '1h',
      issuer: 'music-generation',
    });
    res.json({ token, user });
  } catch (error) {
    console.error('Login failed:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(identityQuery, [req.user.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        tenantId: row.tenant_id || null,
        role: row.role || 'unassigned',
      },
    });
  } catch (error) {
    console.error('Identity lookup failed:', error.message);
    res.status(500).json({ error: 'Identity lookup failed' });
  }
});

module.exports = router;
