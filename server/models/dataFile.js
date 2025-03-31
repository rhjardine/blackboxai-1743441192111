const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');

const DataFileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: [true, 'Please add a filename']
  },
  originalName: {
    type: String,
    required: [true, 'Please add the original filename']
  },
  fileType: {
    type: String,
    enum: ['vcf', 'fasta', 'fastq', 'csv', 'json'],
    required: [true, 'Please add a file type']
  },
  fileSize: {
    type: Number,
    required: [true, 'Please add file size']
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  analysisResults: {
    genomic: {
      variantCount: Number,
      significantVariants: [{
        gene: String,
        variant: String,
        clinicalSignificance: String,
        impact: String
      }]
    },
    metabolic: {
      biomarkerCount: Number,
      significantBiomarkers: [{
        name: String,
        value: Number,
        referenceRange: String,
        interpretation: String
      }]
    },
    epigenetic: {
      biologicalAge: Number,
      ageAcceleration: Number,
      clockType: String
    }
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Reverse populate with user data
DataFileSchema.virtual('owner', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Cascade delete analyses when a data file is deleted
DataFileSchema.pre('remove', async function(next) {
  await this.model('Analysis').deleteMany({ dataFile: this._id });
  next();
});

// Static method to get average file size
DataFileSchema.statics.getAverageFileSize = async function(userId) {
  const obj = await this.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$user', averageSize: { $avg: '$fileSize' } } }
  ]);

  try {
    await this.model('User').findByIdAndUpdate(userId, {
      averageFileSize: Math.ceil(obj[0]?.averageSize || 0)
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageFileSize after save
DataFileSchema.post('save', function() {
  this.constructor.getAverageFileSize(this.user);
});

// Call getAverageFileSize after remove
DataFileSchema.post('remove', function() {
  this.constructor.getAverageFileSize(this.user);
});

module.exports = mongoose.model('DataFile', DataFileSchema);