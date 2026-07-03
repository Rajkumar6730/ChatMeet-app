const Group = require('../models/Group');
const User = require('../models/User');
const Message = require('../models/Message');

/**
 * @desc    Get all groups for user
 * @route   GET /api/groups
 * @access  Private
 */
exports.getGroups = async (req, res) => {
    try {
        const userId = req.userId;

        const groups = await Group.find({
            'members.user': userId,
            'metadata.isDeleted': false
        })
        .populate('members.user', 'username email profilePicture status lastSeen')
        .populate('createdBy', 'username profilePicture')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'username profilePicture'
            }
        })
        .sort({ lastMessageTime: -1, updatedAt: -1 });

        // Format groups for response
        const formattedGroups = groups.map(group => {
            const member = group.members.find(
                m => m.user._id.toString() === userId.toString()
            );
            const unreadCount = member ? (member.unreadCount || 0) : 0;
            
            // Check if user is muted
            const isMuted = member?.isMuted || false;

            return {
                id: group._id,
                name: group.name,
                description: group.description,
                groupPicture: group.groupPicture,
                createdBy: group.createdBy,
                members: group.members,
                memberCount: group.members.length,
                lastMessage: group.lastMessage,
                lastMessageTime: group.lastMessageTime,
                unreadCount,
                isArchived: group.isArchived,
                isPinned: group.isPinned,
                isMuted,
                settings: group.settings,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt
            };
        });

        res.json({
            success: true,
            data: formattedGroups
        });
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching groups'
        });
    }
};

/**
 * @desc    Get group by ID
 * @route   GET /api/groups/:id
 * @access  Private
 */
exports.getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        })
        .populate('members.user', 'username email profilePicture status lastSeen')
        .populate('createdBy', 'username profilePicture')
        .populate('admins', 'username profilePicture')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'username profilePicture'
            }
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        const member = group.members.find(
            m => m.user._id.toString() === userId.toString()
        );

        res.json({
            success: true,
            data: {
                id: group._id,
                name: group.name,
                description: group.description,
                groupPicture: group.groupPicture,
                createdBy: group.createdBy,
                members: group.members,
                admins: group.admins,
                memberCount: group.members.length,
                lastMessage: group.lastMessage,
                lastMessageTime: group.lastMessageTime,
                unreadCount: member ? (member.unreadCount || 0) : 0,
                isArchived: group.isArchived,
                isPinned: group.isPinned,
                isMuted: member?.isMuted || false,
                settings: group.settings,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt
            }
        });
    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching group'
        });
    }
};

/**
 * @desc    Create a new group
 * @route   POST /api/groups
 * @access  Private
 */
exports.createGroup = async (req, res) => {
    try {
        const { name, description, members, settings } = req.body;
        const userId = req.userId;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Group name is required'
            });
        }

        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one member is required'
            });
        }

        // Add creator to members if not already
        if (!members.includes(userId)) {
            members.push(userId);
        }

        // Check if all members exist
        const memberUsers = await User.find({
            _id: { $in: members }
        });

        if (memberUsers.length !== members.length) {
            return res.status(404).json({
                success: false,
                message: 'One or more members not found'
            });
        }

        // Create group members array
        const groupMembers = members.map(memberId => ({
            user: memberId,
            role: memberId === userId ? 'admin' : 'member'
        }));

        // Create group
        const group = await Group.create({
            name,
            description: description || '',
            createdBy: userId,
            members: groupMembers,
            admins: [userId],
            settings: settings || {}
        });

        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            data: { groupId: group._id }
        });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating group'
        });
    }
};

/**
 * @desc    Update group details
 * @route   PUT /api/groups/:id
 * @access  Private
 */
exports.updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, groupPicture } = req.body;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is admin
        if (!group.isAdmin(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update group details'
            });
        }

        // Update fields
        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        if (groupPicture) group.groupPicture = groupPicture;

        await group.save();

        res.json({
            success: true,
            message: 'Group updated successfully'
        });
    } catch (error) {
        console.error('Update group error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating group'
        });
    }
};

/**
 * @desc    Delete group
 * @route   DELETE /api/groups/:id
 * @access  Private
 */
exports.deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Only creator or admins can delete
        if (group.createdBy.toString() !== userId && !group.isAdmin(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can delete the group'
            });
        }

        // Soft delete
        group.metadata.isDeleted = true;
        group.metadata.deletedAt = new Date();
        await group.save();

        res.json({
            success: true,
            message: 'Group deleted successfully'
        });
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting group'
        });
    }
};

/**
 * @desc    Add member to group
 * @route   POST /api/groups/:id/members
 * @access  Private
 */
exports.addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId: newMemberId } = req.body;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is admin or group creator
        if (!group.isAdmin(userId) && group.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can add members'
            });
        }

        // Check if new member already in group
        if (group.isMember(newMemberId)) {
            return res.status(400).json({
                success: false,
                message: 'User is already a member'
            });
        }

        // Check if user exists
        const newMember = await User.findById(newMemberId);
        if (!newMember) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await group.addMember(newMemberId);

        res.json({
            success: true,
            message: 'Member added successfully'
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding member'
        });
    }
};

/**
 * @desc    Remove member from group
 * @route   DELETE /api/groups/:id/members/:userId
 * @access  Private
 */
exports.removeMember = async (req, res) => {
    try {
        const { id, userId: memberId } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Can't remove the last admin
        if (group.admins.length === 1 && group.admins[0].toString() === memberId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove the last admin'
            });
        }

        // Check if user is admin or group creator
        const isAdmin = group.isAdmin(userId);
        const isCreator = group.createdBy.toString() === userId;
        const isSelf = userId === memberId;

        if (!isAdmin && !isCreator && !isSelf) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can remove members'
            });
        }

        // Cannot remove creator
        if (group.createdBy.toString() === memberId && !isSelf) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove group creator'
            });
        }

        await group.removeMember(memberId);

        res.json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing member'
        });
    }
};

/**
 * @desc    Make user admin
 * @route   PUT /api/groups/:id/admins/:userId
 * @access  Private
 */
exports.makeAdmin = async (req, res) => {
    try {
        const { id, userId: memberId } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Only creator can make admins
        if (group.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only group creator can make admins'
            });
        }

        if (!group.isMember(memberId)) {
            return res.status(400).json({
                success: false,
                message: 'User is not a member'
            });
        }

        // Add to admins if not already
        if (!group.isAdmin(memberId)) {
            group.admins.push(memberId);
            // Update member role
            const member = group.members.find(
                m => m.user.toString() === memberId
            );
            if (member) {
                member.role = 'admin';
            }
            await group.save();
        }

        res.json({
            success: true,
            message: 'User promoted to admin'
        });
    } catch (error) {
        console.error('Make admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error making admin'
        });
    }
};

/**
 * @desc    Remove admin
 * @route   DELETE /api/groups/:id/admins/:userId
 * @access  Private
 */
exports.removeAdmin = async (req, res) => {
    try {
        const { id, userId: memberId } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Only creator can remove admins
        if (group.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only group creator can remove admins'
            });
        }

        // Cannot remove creator
        if (group.createdBy.toString() === memberId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove group creator as admin'
            });
        }

        group.admins = group.admins.filter(
            admin => admin.toString() !== memberId
        );

        // Update member role
        const member = group.members.find(
            m => m.user.toString() === memberId
        );
        if (member) {
            member.role = 'member';
        }
        await group.save();

        res.json({
            success: true,
            message: 'Admin privileges removed'
        });
    } catch (error) {
        console.error('Remove admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing admin'
        });
    }
};

/**
 * @desc    Leave group
 * @route   POST /api/groups/:id/leave
 * @access  Private
 */
exports.leaveGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Cannot leave if you're the only admin
        if (group.admins.length === 1 && group.admins[0].toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot leave as the only admin. Transfer admin first.'
            });
        }

        await group.removeMember(userId);

        res.json({
            success: true,
            message: 'Left group successfully'
        });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error leaving group'
        });
    }
};

/**
 * @desc    Get group members
 * @route   GET /api/groups/:id/members
 * @access  Private
 */
exports.getGroupMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        })
        .populate('members.user', 'username email profilePicture status lastSeen')
        .populate('admins', 'username profilePicture');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        res.json({
            success: true,
            data: {
                members: group.members,
                admins: group.admins,
                totalMembers: group.members.length
            }
        });
    } catch (error) {
        console.error('Get group members error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching group members'
        });
    }
};

/**
 * @desc    Get group requests
 * @route   GET /api/groups/:id/requests
 * @access  Private
 */
exports.getGroupRequests = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        })
        .populate('pendingRequests.user', 'username email profilePicture');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is admin
        if (!group.isAdmin(userId) && group.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can view requests'
            });
        }

        res.json({
            success: true,
            data: group.pendingRequests
        });
    } catch (error) {
        console.error('Get group requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching group requests'
        });
    }
};

/**
 * @desc    Accept join request
 * @route   PUT /api/groups/:id/requests/:userId/accept
 * @access  Private
 */
exports.acceptRequest = async (req, res) => {
    try {
        const { id, userId: memberId } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is admin
        if (!group.isAdmin(userId) && group.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can accept requests'
            });
        }

        // Check if request exists
        const requestIndex = group.pendingRequests.findIndex(
            req => req.user.toString() === memberId
        );

        if (requestIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Remove from pending requests
        group.pendingRequests.splice(requestIndex, 1);
        
        // Add to members
        await group.addMember(memberId);

        res.json({
            success: true,
            message: 'Request accepted'
        });
    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error accepting request'
        });
    }
};

/**
 * @desc    Reject join request
 * @route   DELETE /api/groups/:id/requests/:userId/reject
 * @access  Private
 */
exports.rejectRequest = async (req, res) => {
    try {
        const { id, userId: memberId } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is admin
        if (!group.isAdmin(userId) && group.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can reject requests'
            });
        }

        // Remove from pending requests
        const requestIndex = group.pendingRequests.findIndex(
            req => req.user.toString() === memberId
        );

        if (requestIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        group.pendingRequests.splice(requestIndex, 1);
        await group.save();

        res.json({
            success: true,
            message: 'Request rejected'
        });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error rejecting request'
        });
    }
};

/**
 * @desc    Update group settings
 * @route   PUT /api/groups/:id/settings
 * @access  Private
 */
exports.updateGroupSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { settings } = req.body;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is admin
        if (!group.isAdmin(userId) && group.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update settings'
            });
        }

        // Update settings
        group.settings = {
            ...group.settings,
            ...settings
        };
        await group.save();

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating settings'
        });
    }
};

/**
 * @desc    Mark group as read
 * @route   PUT /api/groups/:id/read
 * @access  Private
 */
exports.markGroupAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({
            _id: id,
            'members.user': userId,
            'metadata.isDeleted': false
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        await group.markAsRead(userId);

        res.json({
            success: true,
            message: 'Group marked as read'
        });
    } catch (error) {
        console.error('Mark group as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking group as read'
        });
    }
};