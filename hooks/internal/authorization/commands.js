/**
 * Authorization Command Handlers
 *
 * 7 commands for RBAC management:
 * - /grant-role, /revoke-role (admin-only)
 * - /grant-permission, /revoke-permission (admin-only)
 * - /list-roles (admin-only)
 * - /my-permissions (any authenticated user)
 * - /request-access (unknown users)
 */

const { rbac } = require('./rbac');

/**
 * Extract telegram ID from the session key.
 * Format: agent:main:telegram:dm:<id>
 */
function extractTelegramId(sessionKey) {
  if (!sessionKey) return null;
  const match = sessionKey.match(/telegram:dm:(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract sender email from Gmail hook messages.
 * The Gmail hook template injects "New email from <address>" as the first message.
 */
function extractSenderEmail(messages) {
  if (!messages || !Array.isArray(messages)) return null;

  for (const msg of messages) {
    const text = typeof msg.content === 'string' ? msg.content : '';
    // Match "New email from user@domain.com" or "from user@domain.com"
    const match = text.match(/from\s+([^\s<]+@[^\s>,]+)/i);
    if (match) return match[1].toLowerCase();
  }

  return null;
}

/**
 * Register all authorization commands on the hook API.
 */
function registerCommands(api) {

  api.registerCommand('grant-role', {
    description: 'Grant a role to a user (admin only). Usage: /grant-role <telegram_id> <role> [name]',
    handler: async (args, ctx) => {
      const callerId = extractTelegramId(ctx.sessionKey);
      if (!callerId) return 'Cannot determine your identity. Use this from Telegram DM.';

      const parts = (args || '').trim().split(/\s+/);
      if (parts.length < 2) {
        return 'Usage: /grant-role <telegram_id> <admin|manager|user> [name]\nExample: /grant-role 123456789 user Hamad';
      }

      const [targetId, role, ...nameParts] = parts;
      const name = nameParts.length > 0 ? nameParts.join(' ') : undefined;

      const result = await rbac.grantRole(callerId, targetId, role, name);
      if (!result.success) return `Error: ${result.error}`;
      return `Role **${result.role}** granted to **${result.name}** (${targetId}).`;
    }
  });

  api.registerCommand('revoke-role', {
    description: 'Revoke a user\'s role (admin only). Usage: /revoke-role <telegram_id>',
    handler: async (args, ctx) => {
      const callerId = extractTelegramId(ctx.sessionKey);
      if (!callerId) return 'Cannot determine your identity. Use this from Telegram DM.';

      const targetId = (args || '').trim();
      if (!targetId) {
        return 'Usage: /revoke-role <telegram_id>\nExample: /revoke-role 123456789';
      }

      const result = await rbac.revokeRole(callerId, targetId);
      if (!result.success) return `Error: ${result.error}`;
      return `Role revoked from **${result.name}** (was **${result.old_role}**).`;
    }
  });

  api.registerCommand('grant-permission', {
    description: 'Grant extra feature group to a user (admin only). Usage: /grant-permission <telegram_id> <feature_group>',
    handler: async (args, ctx) => {
      const callerId = extractTelegramId(ctx.sessionKey);
      if (!callerId) return 'Cannot determine your identity. Use this from Telegram DM.';

      const parts = (args || '').trim().split(/\s+/);
      if (parts.length < 2) {
        return 'Usage: /grant-permission <telegram_id> <feature_group>\nFeature groups: memory, crm, config, comms, admin';
      }

      const [targetId, featureGroup] = parts;
      const result = await rbac.grantPermission(callerId, targetId, featureGroup);
      if (!result.success) return `Error: ${result.error}`;
      return `Permission **${result.feature_group}** granted to **${result.name}**.`;
    }
  });

  api.registerCommand('revoke-permission', {
    description: 'Revoke extra feature group from a user (admin only). Usage: /revoke-permission <telegram_id> <feature_group>',
    handler: async (args, ctx) => {
      const callerId = extractTelegramId(ctx.sessionKey);
      if (!callerId) return 'Cannot determine your identity. Use this from Telegram DM.';

      const parts = (args || '').trim().split(/\s+/);
      if (parts.length < 2) {
        return 'Usage: /revoke-permission <telegram_id> <feature_group>\nFeature groups: memory, crm, config, comms, admin';
      }

      const [targetId, featureGroup] = parts;
      const result = await rbac.revokePermission(callerId, targetId, featureGroup);
      if (!result.success) return `Error: ${result.error}`;
      return `Permission **${result.feature_group}** revoked from **${result.name}**.`;
    }
  });

  api.registerCommand('list-roles', {
    description: 'List all users, roles, and pending access requests (admin only)',
    handler: async (args, ctx) => {
      const callerId = extractTelegramId(ctx.sessionKey);
      if (!callerId) return 'Cannot determine your identity. Use this from Telegram DM.';

      const auth = await rbac.authorize(callerId);
      if (auth.role !== 'admin') return 'Error: Only admins can list roles.';

      const data = await rbac.listRoles();
      let output = '**Authorized Users**\n\n';

      for (const u of data.users) {
        const extras = u.extra_permissions ? ` (+${u.extra_permissions.join(', ')})` : '';
        const lock = u.immutable ? ' (immutable)' : '';
        output += `- **${u.name}** — ${u.role}${lock}\n`;
        output += `  ID: ${u.telegram_id}\n`;
        output += `  Permissions: ${u.permissions.join(', ')}${extras}\n\n`;
      }

      if (data.pending_requests.length > 0) {
        output += '**Pending Requests**\n\n';
        for (const r of data.pending_requests) {
          output += `- **${r.name}** (${r.telegram_id}) — requested ${r.requested_at}\n`;
        }
      } else {
        output += 'No pending access requests.';
      }

      return output;
    }
  });

  api.registerCommand('my-permissions', {
    description: 'Show your current role and permissions',
    handler: async (args, ctx) => {
      const callerId = extractTelegramId(ctx.sessionKey);
      if (!callerId) return 'Cannot determine your identity. Use this from Telegram DM.';

      const auth = await rbac.authorize(callerId);

      if (auth.status === 'unknown') {
        return 'You do not have access. Use /request-access to request access.';
      }

      if (auth.status === 'pending') {
        return `Your access request is pending review. An admin will be notified.`;
      }

      let output = `**Your Permissions**\n\n`;
      output += `Name: **${auth.name}**\n`;
      output += `Role: **${auth.role}**\n`;
      output += `Feature groups: ${auth.permissions.join(', ')}\n`;

      return output;
    }
  });

  api.registerCommand('request-access', {
    description: 'Request access to OpenClaw (for unknown users)',
    handler: async (args, ctx) => {
      const callerId = extractTelegramId(ctx.sessionKey);
      if (!callerId) return 'Cannot determine your identity. Use this from Telegram DM.';

      const name = (args || '').trim() || undefined;
      const result = await rbac.requestAccess(callerId, name);

      if (!result.success) return `${result.error}`;
      return 'Your access request has been submitted. An admin will review it shortly.';
    }
  });
}

module.exports = { registerCommands, extractTelegramId, extractSenderEmail };
