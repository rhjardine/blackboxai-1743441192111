const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const DataFile = require('../models/dataFile');
const { processGenomicData } = require('../services/genomicProcessor');
const { processMetabolicData } = require('../services/metabolicProcessor');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analysis
 *   description: Análisis de datos genómicos y metabólicos
 */

/**
 * @swagger
 * /analysis/genomic/{fileId}:
 *   get:
 *     summary: Obtener resultados de análisis genómico
 *     tags: [Analysis]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del archivo genómico
 *     responses:
 *       200:
 *         description: Resultados del análisis genómico
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenomicAnalysis'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Archivo no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/genomic/:fileId', 
  protect,
  authorize('patient', 'professional', 'researcher'),
  async (req, res, next) => {
    try {
      const file = await DataFile.findOne({
        _id: req.params.fileId,
        user: req.user.id,
        fileType: { $in: ['vcf', 'fasta', 'fastq'] }
      });

      if (!file) {
        return next(new ErrorResponse('Archivo genómico no encontrado', 404));
      }

      res.status(200).json({
        success: true,
        data: file.analysisResults.genomic
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /analysis/genomic/{fileId}/rerun:
 *   post:
 *     summary: Reprocesar análisis genómico
 *     tags: [Analysis]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del archivo genómico
 *     responses:
 *       200:
 *         description: Análisis reprocesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenomicAnalysis'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Archivo no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/genomic/:fileId/rerun',
  protect,
  authorize('professional', 'admin'),
  async (req, res, next) => {
    try {
      const file = await DataFile.findOne({
        _id: req.params.fileId,
        fileType: { $in: ['vcf', 'fasta', 'fastq'] }
      });

      if (!file) {
        return next(new ErrorResponse('Archivo genómico no encontrado', 404));
      }

      // Process the file again
      const filePath = path.join(__dirname, '../../uploads', file.filename);
      const analysisResults = await processGenomicData(filePath);

      // Update the file with new results
      file.analysisResults.genomic = analysisResults;
      file.status = 'completed';
      await file.save();

      res.status(200).json({
        success: true,
        data: analysisResults
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /analysis/metabolic/{fileId}:
 *   get:
 *     summary: Obtener resultados de análisis metabólico
 *     tags: [Analysis]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del archivo metabólico
 *     responses:
 *       200:
 *         description: Resultados del análisis metabólico
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetabolicAnalysis'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Archivo no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/metabolic/:fileId',
  protect,
  authorize('patient', 'professional', 'researcher'),
  async (req, res, next) => {
    try {
      const file = await DataFile.findOne({
        _id: req.params.fileId,
        user: req.user.id,
        fileType: { $in: ['csv', 'json'] }
      });

      if (!file) {
        return next(new ErrorResponse('Archivo metabólico no encontrado', 404));
      }

      res.status(200).json({
        success: true,
        data: file.analysisResults.metabolic
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /analysis/biological-age:
 *   post:
 *     summary: Calcular edad biológica
 *     tags: [Analysis]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - genomicFileId
 *               - metabolicFileId
 *             properties:
 *               genomicFileId:
 *                 type: string
 *                 description: ID del archivo genómico
 *               metabolicFileId:
 *                 type: string
 *                 description: ID del archivo metabólico
 *     responses:
 *       200:
 *         description: Cálculo de edad biológica exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BiologicalAge'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Archivos requeridos no encontrados
 *       500:
 *         description: Error del servidor
 */
router.post('/biological-age',
  protect,
  authorize('patient', 'professional', 'researcher'),
  async (req, res, next) => {
    try {
      const { genomicFileId, metabolicFileId } = req.body;

      // Get both files
      const [genomicFile, metabolicFile] = await Promise.all([
        DataFile.findOne({
          _id: genomicFileId,
          user: req.user.id,
          fileType: { $in: ['vcf', 'fasta', 'fastq'] }
        }),
        DataFile.findOne({
          _id: metabolicFileId,
          user: req.user.id,
          fileType: { $in: ['csv', 'json'] }
        })
      ]);

      if (!genomicFile || !metabolicFile) {
        return next(new ErrorResponse('Archivos requeridos no encontrados', 404));
      }

      // In a real implementation, this would use actual epigenetic clock algorithms
      const biologicalAge = calculateBiologicalAge(
        genomicFile.analysisResults.genomic,
        metabolicFile.analysisResults.metabolic
      );

      res.status(200).json({
        success: true,
        data: {
          biologicalAge,
          chronologicalAge: req.user.age || null,
          ageAcceleration: biologicalAge - (req.user.age || biologicalAge)
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// Mock biological age calculation
function calculateBiologicalAge(genomicData, metabolicData) {
  // This is a simplified mock calculation
  const baseAge = 30;
  const genomicImpact = genomicData.significantVariants.length * 0.5;
  const metabolicImpact = metabolicData.significantBiomarkers.length * 1.2;
  
  return Math.round(baseAge + genomicImpact + metabolicImpact);
}

module.exports = router;