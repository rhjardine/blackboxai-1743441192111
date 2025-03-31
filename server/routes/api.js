const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const router = express.Router();

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GenoHealth API',
    version: '1.0.0',
    description: 'API para la plataforma de análisis genómico y metabólico integrado',
    contact: {
      name: 'Equipo de Desarrollo',
      email: 'soporte@genohealth.com'
    },
    license: {
      name: 'Licencia Propietaria',
      url: 'https://genohealth.com/license'
    }
  },
  servers: [
    {
      url: 'http://localhost:8000/api',
      description: 'Servidor de desarrollo'
    },
    {
      url: 'https://api.genohealth.com/v1',
      description: 'Servidor de producción'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011'
          },
          email: {
            type: 'string',
            example: 'usuario@ejemplo.com'
          },
          role: {
            type: 'string',
            enum: ['patient', 'professional', 'researcher', 'admin'],
            example: 'patient'
          }
        }
      },
      GenomicVariant: {
        type: 'object',
        properties: {
          rsId: {
            type: 'string',
            example: 'rs429358'
          },
          gene: {
            type: 'string',
            example: 'APOE'
          },
          impact: {
            type: 'string',
            example: 'High'
          },
          significance: {
            type: 'string',
            example: 'Alzheimer risk'
          }
        }
      }
    }
  }
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  apis: [
    './server/routes/auth.js',
    './server/routes/data.js', 
    './server/routes/analysis.js'
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

// Serve swagger docs
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve swagger.json
router.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

module.exports = router;