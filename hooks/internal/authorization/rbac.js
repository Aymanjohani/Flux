/**
 * RBAC Authorization Engine
 *
 * Core role-based access control for OpenClaw.
 * 3-tier model: admin → manager → user
 * 5 feature groups: memory, crm, config, comms, admin
 * Per-user permission overrides via extra_permissions.
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { lockedWriteJSON } = require('../../../scripts/memory_engine');
const { notify, logEvent } = require('../../../scripts/event-bus');

const CONFIG_DIR = path.join(__dirname, '../../../config');
const ROLES_PATH = path.join(CONFIG_DIR, 'roles.json');
const PERMISSIONS_PATH = path.join(CONFIG_DIR, 'permissions.json');

const CACHE_TTL_MS = 60000; // 60 seconds

const SEED_USERS = [
  {
    telegram_id: '1186936952',
    name: 'Ayman AlJohani',
    email: 'ayman@iiotsolutions.sa',
    role: 'admin',
    immutable: true,
    added_at: '2026-02-07T00:00:00.000Z',
    added_by: 'system'
  },
  {
    telegram_id: '124756960',
    name: 'Aadil Feroze',
    email: 'aadil@iiotsolutions.sa',
    role: 'manager',
    added_at: '2026-02-07T00:00:00.000Z',
    added_by: 'system'
  }
];

class RBAC {
  constructor() {
    this._rolesCache = null;
    this._rolesCacheTime = 0;
    this._permissionsCache = null;
  }

  /**
   * Load permissions.json (static config, cached permanently)
   */
  async getPermissions() {
    if (this._permissionsCache) return this._permissionsCache;
    try {
      const raw = await fs.readFile(PERMISSIONS_PATH, 'utf8');
      this._permissionsCache = JSON.parse(raw);
    } catch (e) {
      console.error('[Authorization] Failed to load permissions.json:', e.message);
      throw new Error('permissions.json not found or invalid');
    }
    return this._permissionsCache;
  }

  /**
   * Load roles.json with 60s cache. Auto-bootstraps if missing.
   */
  async getRoles(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this._rolesCache && (now - this._rolesCacheTime) < CACHE_TTL_MS) {
      return this._rolesCache;
    }

    try {
      const raw = await fs.readFile(ROLES_PATH, 'utf8');
      this._rolesCache = JSON.parse(raw);
      this._rolesCacheTime = now;
    } catch (e) {
      // Auto-bootstrap roles.json
      console.log('[Authorization] Bootstrapping roles.json with seed data');
      this._rolesCache = { users: [...SEED_USERS], pending_requests: [] };
      await this._writeRoles(this._rolesCache);
      this._rolesCacheTime = now;
    }

    return this._rolesCache;
  }

  /**
   * Write roles.json atomically with file locking
   */
  async _writeRoles(data) {
    await lockedWriteJSON(ROLES_PATH, data);
    this._rolesCache = data;
    this._rolesCacheTime = Date.now();
  }

  /**
   * Find a user entry by telegram_id
   */
  async _findUser(telegramId) {
    const roles = await this.getRoles();
    return roles.users.find(u => u.telegram_id === String(telegramId));
  }

  /**
   * Authorize a telegram user. Returns status + role + effective permissions.
   *
   * @param {string} telegramId
   * @returns {{ status: 'authorized'|'pending'|'unknown', role?: string, name?: string, permissions?: string[] }}
   */
  async authorize(telegramId) {
    const id = String(telegramId);
    const roles = await this.getRoles();
    const perms = await this.getPermissions();

    // Check if user exists
    const user = roles.users.find(u => u.telegram_id === id);
    if (user) {
      const roleDef = perms.roles[user.role];
      const rolePerms = roleDef ? roleDef.permissions : [];
      const extraPerms = user.extra_permissions || [];
      // Merge role defaults + extra_permissions (deduplicated)
      const effective = [...new Set([...rolePerms, ...extraPerms])];

      return {
        status: 'authorized',
        role: user.role,
        name: user.name,
        permissions: effective
      };
    }

    // Check if pending
    const pending = roles.pending_requests.find(r => r.telegram_id === id);
    if (pending) {
      return { status: 'pending', name: pending.name };
    }

    return { status: 'unknown' };
  }

  /**
   * Grant a role to a user. Admin-only operation.
   */
  async grantRole(adminId, targetId, role, name) {
    const adminAuth = await this.authorize(adminId);
    if (adminAuth.role !== 'admin') {
      return { success: false, error: 'Only admins can grant roles' };
    }

    const perms = await this.getPermissions();
    if (!perms.roles[role]) {
      return { success: false, error: `Invalid role: ${role}. Valid: ${Object.keys(perms.roles).join(', ')}` };
    }

    const roles = await this.getRoles(true);
    const existing = roles.users.find(u => u.telegram_id === String(targetId));

    if (existing) {
      if (existing.immutable) {
        return { success: false, error: `${existing.name} has an immutable role` };
      }
      existing.role = role;
      existing.name = name || existing.name;
    } else {
      roles.users.push({
        telegram_id: String(targetId),
        name: name || 'Unknown',
        role,
        added_at: new Date().toISOString(),
        added_by: String(adminId)
      });
    }

    // Remove from pending if present
    roles.pending_requests = roles.pending_requests.filter(
      r => r.telegram_id !== String(targetId)
    );

    await this._writeRoles(roles);

    logEvent('authorization.grant-role', {
      summary: `Role ${role} granted to ${name || targetId}`,
      admin_id: adminId,
      target_id: targetId,
      role
    }, { source: 'authorization' });

    return { success: true, role, name: name || existing?.name || 'Unknown' };
  }

  /**
   * Revoke a user's role (remove from roles.json). Admin-only.
   */
  async revokeRole(adminId, targetId) {
    const adminAuth = await this.authorize(adminId);
    if (adminAuth.role !== 'admin') {
      return { success: false, error: 'Only admins can revoke roles' };
    }

    const roles = await this.getRoles(true);
    const target = roles.users.find(u => u.telegram_id === String(targetId));

    if (!target) {
      return { success: false, error: 'User not found' };
    }

    if (target.immutable) {
      return { success: false, error: `${target.name} has an immutable role and cannot be revoked` };
    }

    const name = target.name;
    const oldRole = target.role;
    roles.users = roles.users.filter(u => u.telegram_id !== String(targetId));

    await this._writeRoles(roles);

    logEvent('authorization.revoke-role', {
      summary: `Role revoked from ${name} (was ${oldRole})`,
      admin_id: adminId,
      target_id: targetId,
      old_role: oldRole
    }, { source: 'authorization' });

    return { success: true, name, old_role: oldRole };
  }

  /**
   * Grant an extra permission (feature group) to a user. Admin-only.
   */
  async grantPermission(adminId, targetId, featureGroup) {
    const adminAuth = await this.authorize(adminId);
    if (adminAuth.role !== 'admin') {
      return { success: false, error: 'Only admins can grant permissions' };
    }

    const perms = await this.getPermissions();
    if (!perms.feature_groups[featureGroup]) {
      return { success: false, error: `Invalid feature group: ${featureGroup}. Valid: ${Object.keys(perms.feature_groups).join(', ')}` };
    }

    const roles = await this.getRoles(true);
    const target = roles.users.find(u => u.telegram_id === String(targetId));

    if (!target) {
      return { success: false, error: 'User not found. Grant a role first.' };
    }

    // Check if they already have it via role defaults
    const roleDef = perms.roles[target.role];
    if (roleDef && roleDef.permissions.includes(featureGroup)) {
      return { success: false, error: `${target.name} already has ${featureGroup} via their ${target.role} role` };
    }

    if (!target.extra_permissions) target.extra_permissions = [];
    if (target.extra_permissions.includes(featureGroup)) {
      return { success: false, error: `${target.name} already has ${featureGroup} as an extra permission` };
    }

    target.extra_permissions.push(featureGroup);
    await this._writeRoles(roles);

    logEvent('authorization.grant-permission', {
      summary: `Extra permission ${featureGroup} granted to ${target.name}`,
      admin_id: adminId,
      target_id: targetId,
      feature_group: featureGroup
    }, { source: 'authorization' });

    return { success: true, name: target.name, feature_group: featureGroup };
  }

  /**
   * Revoke an extra permission from a user. Admin-only.
   */
  async revokePermission(adminId, targetId, featureGroup) {
    const adminAuth = await this.authorize(adminId);
    if (adminAuth.role !== 'admin') {
      return { success: false, error: 'Only admins can revoke permissions' };
    }

    const roles = await this.getRoles(true);
    const target = roles.users.find(u => u.telegram_id === String(targetId));

    if (!target) {
      return { success: false, error: 'User not found' };
    }

    if (!target.extra_permissions || !target.extra_permissions.includes(featureGroup)) {
      return { success: false, error: `${target.name} does not have ${featureGroup} as an extra permission` };
    }

    target.extra_permissions = target.extra_permissions.filter(p => p !== featureGroup);
    if (target.extra_permissions.length === 0) delete target.extra_permissions;

    await this._writeRoles(roles);

    logEvent('authorization.revoke-permission', {
      summary: `Extra permission ${featureGroup} revoked from ${target.name}`,
      admin_id: adminId,
      target_id: targetId,
      feature_group: featureGroup
    }, { source: 'authorization' });

    return { success: true, name: target.name, feature_group: featureGroup };
  }

  /**
   * Request access for an unknown user. Notifies admin via Telegram.
   */
  async requestAccess(telegramId, name) {
    const id = String(telegramId);
    const roles = await this.getRoles(true);

    // Already a user?
    const existing = roles.users.find(u => u.telegram_id === id);
    if (existing) {
      return { success: false, error: 'You already have access' };
    }

    // Already pending?
    const pending = roles.pending_requests.find(r => r.telegram_id === id);
    if (pending) {
      return { success: false, error: 'Your request is already pending' };
    }

    roles.pending_requests.push({
      telegram_id: id,
      name: name || 'Unknown',
      requested_at: new Date().toISOString()
    });

    await this._writeRoles(roles);

    // Notify admin via Telegram
    notify(
      `🔐 Access Request\n\n${name || 'Unknown'} (ID: ${id}) is requesting access to OpenClaw.\n\nTo approve:\n/grant-role ${id} user ${name || 'Unknown'}`,
      { topic: 'alert.authorization', source: 'authorization' }
    );

    logEvent('authorization.request-access', {
      summary: `Access requested by ${name || id}`,
      telegram_id: id,
      name
    }, { source: 'authorization' });

    return { success: true };
  }

  /**
   * Authorize by email address. Used for Gmail hook sessions.
   * Looks up user by email field in roles.json.
   *
   * @param {string} email
   * @returns {{ status: 'authorized'|'unknown', role?: string, name?: string, permissions?: string[] }}
   */
  async authorizeByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const roles = await this.getRoles();
    const perms = await this.getPermissions();

    const user = roles.users.find(u => u.email && u.email.toLowerCase() === normalizedEmail);
    if (user) {
      const roleDef = perms.roles[user.role];
      const rolePerms = roleDef ? roleDef.permissions : [];
      const extraPerms = user.extra_permissions || [];
      const effective = [...new Set([...rolePerms, ...extraPerms])];

      return {
        status: 'authorized',
        role: user.role,
        name: user.name,
        permissions: effective
      };
    }

    return { status: 'unknown' };
  }

  /**
   * Log a session authorization event to memory/events.
   * Called on every agent_turn_start so we have an audit trail.
   *
   * @param {string} sessionKey
   * @param {string} channel - 'telegram' | 'email' | 'system'
   * @param {string} identifier - telegram ID or email
   * @param {{ status: string, role?: string, name?: string }} auth
   */
  logSession(sessionKey, channel, identifier, auth) {
    logEvent('authorization.session', {
      summary: `${channel} session: ${auth.name || identifier} (${auth.status})`,
      session_key: sessionKey,
      channel,
      identifier,
      status: auth.status,
      role: auth.role || null,
      name: auth.name || null
    }, { source: 'authorization' });
  }

  /**
   * List all roles and pending requests
   */
  async listRoles() {
    const roles = await this.getRoles(true);
    const perms = await this.getPermissions();

    const users = roles.users.map(u => {
      const roleDef = perms.roles[u.role];
      const rolePerms = roleDef ? roleDef.permissions : [];
      const extraPerms = u.extra_permissions || [];
      const effective = [...new Set([...rolePerms, ...extraPerms])];

      return {
        telegram_id: u.telegram_id,
        name: u.name,
        role: u.role,
        immutable: u.immutable || false,
        permissions: effective,
        extra_permissions: extraPerms.length > 0 ? extraPerms : undefined
      };
    });

    return {
      users,
      pending_requests: roles.pending_requests
    };
  }
}

// Singleton
const rbac = new RBAC();

module.exports = { RBAC, rbac };
