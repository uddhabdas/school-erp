const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

/**
 * Atomically increments and gets the next sequence number for an entity key.
 * @param {string} key e.g. "application_2026", "student_2026"
 * @returns {Promise<number>}
 */
counterSchema.statics.getNextSequence = async function (key) {
  const counter = await this.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
