const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../../models/User');
const TeamInvitation = require('../../models/TeamInvitation');
const ActivityLog = require('../../models/ActivityLog');

/**
 * Generate a random password
 * @param {number} length - Password length
 * @returns {string} - Random password
 */
function generateRandomPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  let password = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}

/**
 * Get all team members
 * GET /api/team
 */
router.get('/', async (req, res) => {
  try {
    const members = await User.getTeamMembers();

    res.json({
      members: members.map(m => ({
        id: m.id,
        username: m.username,
        email: m.email,
        role: m.role || 'member',
        status: m.status || 'active',
        isAdmin: m.is_admin === 1,
        lastLogin: m.last_login,
        createdAt: m.created_at,
        invitedBy: m.invited_by_username,
      })),
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Invite a new team member
 * POST /api/team/invite
 *
 * This creates a user account directly with a generated password
 */
router.post('/invite', async (req, res) => {
  try {
    const { email, username, role = 'member', password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists by email
    const existingUserByEmail = await User.getByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if username is taken
    const existingUserByUsername = await User.getByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Get current user (for now, assume user 1 is the inviter)
    const inviterId = 1;
    const inviter = await User.getById(inviterId);

    // Use provided password
    const tempPassword = password;

    // Create user account directly
    const user = await User.create({
      username,
      password: tempPassword,
      email,
      role,
      invited_by: inviterId,
    });

    // Log activity
    await ActivityLog.log({
      userId: inviterId,
      username: inviter?.username,
      action: ActivityLog.ACTIONS.INVITE,
      category: ActivityLog.CATEGORIES.TEAM,
      resourceType: 'user',
      resourceId: user.id,
      resourceName: username,
      details: { role, email },
    });

    res.status(201).json({
      message: 'Team member created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tempPassword: tempPassword, // Return password so admin can share with user
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all pending invitations
 * GET /api/team/invitations
 */
router.get('/invitations', async (req, res) => {
  try {
    const invitations = await TeamInvitation.getAllPending();

    res.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        invitedBy: inv.invited_by_username,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Accept invitation and create account
 * POST /api/team/accept-invite
 */
router.post('/accept-invite', async (req, res) => {
  try {
    const { token, username, password } = req.body;

    if (!token || !username || !password) {
      return res.status(400).json({ error: 'Token, username and password are required' });
    }

    // Get invitation
    const invitation = await TeamInvitation.getByToken(token);

    if (!invitation || !TeamInvitation.isValid(invitation)) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    // Check if username is taken
    const existingUser = await User.getByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create user
    const user = await User.create({
      username,
      password,
      email: invitation.email,
      role: invitation.role,
      invited_by: invitation.invited_by,
    });

    // Mark invitation as used
    await TeamInvitation.markAsUsed(invitation.id);

    // Log activity
    await ActivityLog.log({
      userId: user.id,
      username: user.username,
      action: ActivityLog.ACTIONS.ACCEPT_INVITE,
      category: ActivityLog.CATEGORIES.TEAM,
      resourceType: 'user',
      resourceId: user.id,
      details: { role: invitation.role, invitedBy: invitation.invited_by_username },
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Revoke invitation
 * DELETE /api/team/invitations/:id
 */
router.delete('/invitations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inviterId = 1;
    const inviter = await User.getById(inviterId);

    const invitation = await TeamInvitation.getById(id);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    await TeamInvitation.delete(id);

    // Log activity
    await ActivityLog.log({
      userId: inviterId,
      username: inviter?.username,
      action: ActivityLog.ACTIONS.REVOKE_INVITE,
      category: ActivityLog.CATEGORIES.TEAM,
      resourceType: 'invitation',
      resourceId: id,
      resourceName: invitation.email,
    });

    res.json({ message: 'Invitation revoked successfully' });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update team member role
 * PUT /api/team/:id/role
 */
router.put('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = 1;
    const admin = await User.getById(adminId);

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const validRoles = Object.values(User.ROLES);
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const user = await User.getById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldRole = user.role;
    const updatedUser = await User.changeRole(id, role);

    // Log activity
    await ActivityLog.log({
      userId: adminId,
      username: admin?.username,
      action: ActivityLog.ACTIONS.CHANGE_ROLE,
      category: ActivityLog.CATEGORIES.USER,
      resourceType: 'user',
      resourceId: id,
      resourceName: user.username,
      details: { oldRole, newRole: role },
    });

    res.json({
      message: 'Role updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Disable team member
 * PUT /api/team/:id/disable
 */
router.put('/:id/disable', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = 1;
    const admin = await User.getById(adminId);

    const user = await User.getById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent disabling yourself
    if (parseInt(id) === adminId) {
      return res.status(400).json({ error: 'Cannot disable your own account' });
    }

    await User.disable(id);

    // Log activity
    await ActivityLog.log({
      userId: adminId,
      username: admin?.username,
      action: ActivityLog.ACTIONS.DISABLE,
      category: ActivityLog.CATEGORIES.USER,
      resourceType: 'user',
      resourceId: id,
      resourceName: user.username,
    });

    res.json({ message: 'User disabled successfully' });
  } catch (error) {
    console.error('Error disabling user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Enable team member
 * PUT /api/team/:id/enable
 */
router.put('/:id/enable', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = 1;
    const admin = await User.getById(adminId);

    const user = await User.getById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.enable(id);

    // Log activity
    await ActivityLog.log({
      userId: adminId,
      username: admin?.username,
      action: ActivityLog.ACTIONS.ENABLE,
      category: ActivityLog.CATEGORIES.USER,
      resourceType: 'user',
      resourceId: id,
      resourceName: user.username,
    });

    res.json({ message: 'User enabled successfully' });
  } catch (error) {
    console.error('Error enabling user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete team member
 * DELETE /api/team/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = 1;
    const admin = await User.getById(adminId);

    const user = await User.getById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (parseInt(id) === adminId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Prevent deleting the last admin
    if (user.is_admin === 1) {
      const users = await User.getAll();
      const adminCount = users.filter(u => u.is_admin === 1).length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    await User.delete(id);

    // Log activity
    await ActivityLog.log({
      userId: adminId,
      username: admin?.username,
      action: ActivityLog.ACTIONS.DELETE,
      category: ActivityLog.CATEGORIES.USER,
      resourceType: 'user',
      resourceId: id,
      resourceName: user.username,
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
