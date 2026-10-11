const RbacMatrix = require('../models/RbacMatrix');
const AuditLog = require('../models/AuditLog');

const DEFAULT_RBAC_MODULES = [
  {
    moduleKey: 'certificates',
    moduleName: 'Transfer Certificates (TC)',
    path: '/certificates',
    order: 1,
    superAdmin: { access: 'full', label: 'Full Control (Issue, Print & Revoke)' },
    admin: { access: 'full', label: 'Full Control (Issue & Print)' },
    faculty: { access: 'blocked', label: 'No Access (Blocked & Hidden)' }
  },
  {
    moduleKey: 'classes',
    moduleName: 'Classes & Subjects Manager',
    path: '/classes',
    order: 2,
    superAdmin: { access: 'full', label: 'Full Control (Add/Edit Classes & Subjects)' },
    admin: { access: 'full', label: 'Full Control (Manage Curriculum)' },
    faculty: { access: 'blocked', label: 'No Access (Blocked & Hidden)' }
  },
  {
    moduleKey: 'sessions',
    moduleName: 'Academic Sessions',
    path: '/sessions',
    order: 3,
    superAdmin: { access: 'full', label: 'Full Control (Create, Activate, Class Config)' },
    admin: { access: 'read', label: 'Read Only View' },
    faculty: { access: 'blocked', label: 'No Access (Blocked & Hidden)' }
  },
  {
    moduleKey: 'fees',
    moduleName: 'Fee Management & Structures',
    path: '/fees',
    order: 4,
    superAdmin: { access: 'full', label: 'Full Control (Fee Heads & Pricing)' },
    admin: { access: 'full', label: 'Full Control (Assign Fees & Structure)' },
    faculty: { access: 'blocked', label: 'No Access (Blocked & Hidden)' }
  },
  {
    moduleKey: 'billing',
    moduleName: 'Billing Counter & Payments',
    path: '/billing',
    order: 5,
    superAdmin: { access: 'full', label: 'Full Control (Collect, Receipts, Voids)' },
    admin: { access: 'full', label: 'Full Control (Collect & Print Receipts)' },
    faculty: { access: 'blocked', label: 'No Access (Blocked & Hidden)' }
  },
  {
    moduleKey: 'exams',
    moduleName: 'Examinations & Manual Marks Config',
    path: '/exams',
    order: 6,
    superAdmin: { access: 'full', label: 'Full Control (Create & Manual Marks/Pass Marks)' },
    admin: { access: 'full', label: 'Full Control (Create, Edit & Publish)' },
    faculty: { access: 'restricted', label: 'Allocated Subjects Marks Entry Only' }
  },
  {
    moduleKey: 'timetable',
    moduleName: 'Class Routine & Timetable',
    path: '/timetable',
    order: 7,
    superAdmin: { access: 'full', label: 'Full Control (Configure Routine & Faculty)' },
    admin: { access: 'full', label: 'Full Control (Manage Routine Slots)' },
    faculty: { access: 'read', label: 'Teaching Portal (View Routine & Teaching Timings)' }
  },
  {
    moduleKey: 'students',
    moduleName: 'Student Directory & Admissions',
    path: '/students',
    order: 8,
    superAdmin: { access: 'full', label: 'Full Control (All Records & Enrollment)' },
    admin: { access: 'full', label: 'Full Control (Admissions & Profile Updates)' },
    faculty: { access: 'restricted', label: 'Assigned Class Students Only' }
  },
  {
    moduleKey: 'admissions',
    moduleName: 'Online Admissions Applications',
    path: '/admissions',
    order: 9,
    superAdmin: { access: 'full', label: 'Full Control (Review, Approve & Enroll)' },
    admin: { access: 'full', label: 'Full Control (Review & Verify Documents)' },
    faculty: { access: 'blocked', label: 'No Access (Blocked & Hidden)' }
  },
  {
    moduleKey: 'faculty',
    moduleName: 'Faculty & Staff Directory (RBAC)',
    path: '/faculty',
    order: 10,
    superAdmin: { access: 'full', label: 'Full Control (Manage All Roles, Matrix & Status)' },
    admin: { access: 'restricted', label: 'Manage Faculty (Assignments & Info)' },
    faculty: { access: 'restricted', label: 'Personal Profile Only' }
  },
  {
    moduleKey: 'audit_logs',
    moduleName: 'Audit Logs & Governance',
    path: '/audit-logs',
    order: 11,
    superAdmin: { access: 'full', label: 'Full Control (View All Sensitive Activity Logs)' },
    admin: { access: 'read', label: 'Read Only View' },
    faculty: { access: 'blocked', label: 'No Access (Blocked & Hidden)' }
  }
];

// @desc    Get RBAC matrix items (seeds defaults if none found)
// @route   GET /api/rbac
// @access  Private (super_admin, admin)
exports.getRbacMatrix = async (req, res) => {
  try {
    let items = await RbacMatrix.find().sort({ order: 1, createdAt: 1 }).populate('updatedBy', 'name email role');

    if (!items || items.length === 0) {
      // Seed default items
      items = await RbacMatrix.insertMany(DEFAULT_RBAC_MODULES);
    }

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error in getRbacMatrix:', error);
    res.status(500).json({ message: 'Failed to retrieve RBAC matrix', error: error.message });
  }
};

// @desc    Update RBAC matrix items manually by Super Admin
// @route   PUT /api/rbac
// @access  Private (super_admin only)
exports.updateRbacMatrix = async (req, res) => {
  try {
    const { modules } = req.body;

    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ message: 'A non-empty array of modules is required' });
    }

    const validAccess = ['full', 'read', 'restricted', 'blocked'];
    const updatedItems = [];

    for (const mod of modules) {
      if (!mod.moduleKey) continue;

      // Validate access values if provided
      const superAdminAccess = validAccess.includes(mod.superAdmin?.access) ? mod.superAdmin.access : 'full';
      const adminAccess = validAccess.includes(mod.admin?.access) ? mod.admin.access : 'full';
      const facultyAccess = validAccess.includes(mod.faculty?.access) ? mod.faculty.access : 'blocked';

      const updateData = {
        moduleName: mod.moduleName,
        path: mod.path,
        order: typeof mod.order === 'number' ? mod.order : 0,
        superAdmin: {
          access: superAdminAccess,
          label: mod.superAdmin?.label?.trim() || (superAdminAccess === 'full' ? 'Full Control' : superAdminAccess)
        },
        admin: {
          access: adminAccess,
          label: mod.admin?.label?.trim() || (adminAccess === 'full' ? 'Full Control' : adminAccess)
        },
        faculty: {
          access: facultyAccess,
          label: mod.faculty?.label?.trim() || (facultyAccess === 'blocked' ? 'No Access' : facultyAccess)
        },
        updatedBy: req.user._id
      };

      const updated = await RbacMatrix.findOneAndUpdate(
        { moduleKey: mod.moduleKey },
        updateData,
        { new: true, upsert: true, runValidators: true }
      );

      updatedItems.push(updated);
    }

    // Record audit log
    try {
      await AuditLog.create({
        user: req.user._id,
        action: 'UPDATE_RBAC_MATRIX',
        collection: 'RbacMatrix',
        newData: { updatedCount: updatedItems.length, timestamp: new Date() }
      });
    } catch (auditErr) {
      console.warn('Could not record RBAC audit log:', auditErr.message);
    }

    res.json({
      success: true,
      message: 'RBAC Access Matrix updated successfully by Super Admin',
      data: updatedItems
    });
  } catch (error) {
    console.error('Error in updateRbacMatrix:', error);
    res.status(500).json({ message: 'Failed to update RBAC matrix', error: error.message });
  }
};

// @desc    Reset RBAC matrix to default configuration
// @route   POST /api/rbac/reset
// @access  Private (super_admin only)
exports.resetRbacMatrix = async (req, res) => {
  try {
    await RbacMatrix.deleteMany({});
    const items = await RbacMatrix.insertMany(
      DEFAULT_RBAC_MODULES.map(item => ({ ...item, updatedBy: req.user._id }))
    );

    // Record audit log
    try {
      await AuditLog.create({
        user: req.user._id,
        action: 'RESET_RBAC_MATRIX',
        collection: 'RbacMatrix',
        newData: { resetCount: items.length, timestamp: new Date() }
      });
    } catch (auditErr) {
      console.warn('Could not record RBAC audit log:', auditErr.message);
    }

    res.json({
      success: true,
      message: 'RBAC Access Matrix reset to system defaults successfully',
      data: items
    });
  } catch (error) {
    console.error('Error in resetRbacMatrix:', error);
    res.status(500).json({ message: 'Failed to reset RBAC matrix', error: error.message });
  }
};
