const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema({
  sessionName: {
    type: String,
    required: true,
    unique: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  admissionOpen: {
    type: Boolean,
    default: false
  },
  allowedClasses: [{
    type: String
  }],
  classConfigs: [{
    className: {
      type: String,
      required: true
    },
    sections: {
      type: [String],
      default: ['A']
    },
    subjects: [{
      subjectCode: {
        type: String,
        default: ''
      },
      subjectName: {
        type: String,
        required: true
      },
      isOptional: {
        type: Boolean,
        default: false
      },
      assignedTeacher: {
        type: String,
        default: ''
      },
      assignedTeacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    admissionOpen: {
      type: Boolean,
      default: true
    },
    capacity: {
      type: Number,
      default: 60
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AcademicSession', academicSessionSchema);
