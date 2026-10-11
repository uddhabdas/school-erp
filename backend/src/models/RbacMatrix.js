const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
  access: {
    type: String,
    enum: ['full', 'read', 'restricted', 'blocked'],
    default: 'full'
  },
  label: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const rbacMatrixSchema = new mongoose.Schema({
  moduleKey: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  moduleName: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  superAdmin: {
    type: rolePermissionSchema,
    required: true
  },
  admin: {
    type: rolePermissionSchema,
    required: true
  },
  faculty: {
    type: rolePermissionSchema,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RbacMatrix', rbacMatrixSchema);
