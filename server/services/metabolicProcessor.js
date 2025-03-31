const fs = require('fs');
const csv = require('csv-parser');
const { ErrorResponse } = require('../utils/errorResponse');

// Reference ranges for common biomarkers
const BIOMARKER_REFERENCE = {
  'glucose': { min: 70, max: 100, unit: 'mg/dL' },
  'hdl': { min: 40, max: 60, unit: 'mg/dL' },
  'ldl': { min: 0, max: 100, unit: 'mg/dL' },
  'triglycerides': { min: 0, max: 150, unit: 'mg/dL' },
  'crp': { min: 0, max: 3, unit: 'mg/L' },
  'vitamin_d': { min: 30, max: 100, unit: 'ng/mL' }
};

// Process metabolic data files (CSV, JSON)
async function processMetabolicData(filePath) {
  return new Promise((resolve, reject) => {
    const fileExt = path.extname(filePath).toLowerCase();
    const results = {
      biomarkers: [],
      significantCount: 0,
      metabolicScore: 0
    };

    if (fileExt === '.csv') {
      processCSV(filePath, results)
        .then(() => analyzeResults(results))
        .then(resolve)
        .catch(reject);
    } else if (fileExt === '.json') {
      processJSON(filePath, results)
        .then(() => analyzeResults(results))
        .then(resolve)
        .catch(reject);
    } else {
      reject(new ErrorResponse('Unsupported metabolic file format', 400));
    }
  });
}

// Process CSV metabolic data
function processCSV(filePath, results) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const biomarker = parseBiomarkerRow(row);
        if (biomarker) results.biomarkers.push(biomarker);
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

// Process JSON metabolic data
function processJSON(filePath, results) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return reject(err);
      
      try {
        const jsonData = JSON.parse(data);
        if (Array.isArray(jsonData)) {
          jsonData.forEach(item => {
            const biomarker = parseBiomarkerRow(item);
            if (biomarker) results.biomarkers.push(biomarker);
          });
        }
        resolve();
      } catch (parseErr) {
        reject(parseErr);
      }
    });
  });
}

// Parse biomarker data row
function parseBiomarkerRow(row) {
  const name = row.name?.toLowerCase();
  if (!name || !BIOMARKER_REFERENCE[name]) return null;

  const value = parseFloat(row.value);
  if (isNaN(value)) return null;

  return {
    name,
    value,
    unit: BIOMARKER_REFERENCE[name].unit,
    referenceRange: `${BIOMARKER_REFERENCE[name].min}-${BIOMARKER_REFERENCE[name].max}`
  };
}

// Analyze metabolic results
function analyzeResults(results) {
  let score = 100;
  results.significantBiomarkers = [];

  results.biomarkers.forEach(biomarker => {
    const ref = BIOMARKER_REFERENCE[biomarker.name];
    const deviation = Math.max(
      (ref.min - biomarker.value) / ref.min * 100,
      (biomarker.value - ref.max) / ref.max * 100,
      0
    );

    if (deviation > 20) { // 20% outside reference range
      biomarker.interpretation = deviation > 50 ? 'High Risk' : 'Moderate Risk';
      results.significantBiomarkers.push(biomarker);
      results.significantCount++;
      score -= deviation * 0.5;
    } else {
      biomarker.interpretation = 'Normal';
    }
  });

  results.metabolicScore = Math.max(0, Math.round(score));
  return results;
}

module.exports = {
  processMetabolicData
};