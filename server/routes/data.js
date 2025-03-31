const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const DataFile = require('../models/dataFile');
const { processGenomicData } = require('../services/genomicProcessor');
const { processMetabolicData } = require('../services/metabolicProcessor');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Data
 *   description: Manejo de archivos de datos genómicos y metabólicos
 */

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /vcf|fasta|fastq|csv|json/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new ErrorResponse('Only genomic/metabolic data files are allowed!', 400));
    }
  }
});

/**
 * @swagger
 * /data/upload:
 *   post:
 *     summary: Subir archivos de datos genómicos o metabólicos
 *     tags: [Data]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a subir (VCF, FASTA, FASTQ, CSV, JSON)
 *     responses:
 *       201:
 *         description: Archivo subido y procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DataFile'
 *       400:
 *         description: Error en el archivo o formato no soportado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post(
  '/upload',
  protect,
  authorize('patient', 'professional', 'researcher'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
      }

      // Determine file type and process accordingly
      let analysisResult;
      const fileExt = path.extname(req.file.originalname).toLowerCase();

      if (['.vcf', '.fasta', '.fastq'].includes(fileExt)) {
        analysisResult = await processGenomicData(req.file.path);
      } else if (['.csv', '.json'].includes(fileExt)) {
        analysisResult = await processMetabolicData(req.file.path);
      } else {
        return next(new ErrorResponse('Unsupported file type', 400));
      }

      // Save file metadata to database
      const dataFile = await DataFile.create({
        user: req.user.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileType: fileExt.replace('.', ''),
        fileSize: req.file.size,
        analysisResults: analysisResult,
        uploadDate: Date.now()
      });

      res.status(201).json({
        success: true,
        data: dataFile
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /data/files:
 *   get:
 *     summary: Obtener todos los archivos de datos del usuario
 *     tags: [Data]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de archivos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DataFile'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/files',
  protect,
  authorize('patient', 'professional', 'researcher'),
  async (req, res, next) => {
    try {
      const files = await DataFile.find({ user: req.user.id })
        .sort('-uploadDate')
        .select('-__v');

      res.status(200).json({
        success: true,
        count: files.length,
        data: files
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;