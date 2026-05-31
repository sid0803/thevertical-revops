// backend/src/routes/files.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { verifyToken, checkLeadAccess } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads directory: backend/uploads/
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `lead-${req.params.leadId || 'file'}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    // Allowed types
    const allowed = [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png', 'image/gif',
      'text/plain', 'text/csv'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

router.post('/upload/:leadId', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), upload.single('file'), async (req, res) => {
  try {
    const { leadId } = req.params;

    const hasAccess = await checkLeadAccess(leadId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const savedFile = await prisma.leadFile.create({
      data: {
        leadId,
        uploadedById: req.user.id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath: req.file.filename, // relative to /uploads
        mimeType: req.file.mimetype
      },
      include: { uploadedBy: { select: { id: true, name: true } } }
    });

    // Log as activity
    await prisma.leadActivity.create({
      data: {
        leadId, userId: req.user.id, type: 'NOTE',
        description: `📎 File uploaded: "${req.file.originalname}" (${(req.file.size / 1024).toFixed(1)} KB)`
      }
    });

    return res.status(201).json(savedFile);
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ message: error.message || 'Upload failed' });
  }
});

// @route   GET /api/files?leadId=xxx
// @desc    List all files for a lead
router.get('/', verifyToken, async (req, res) => {
  try {
    const { leadId } = req.query;
    if (!leadId) return res.status(400).json({ message: 'leadId is required' });

    const hasAccess = await checkLeadAccess(leadId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    const files = await prisma.leadFile.findMany({
      where: { leadId },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { uploadedAt: 'desc' }
    });

    return res.json(files);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/files/:id/download
// @desc    Download/serve a file
router.get('/:id/download', verifyToken, async (req, res) => {
  try {
    const file = await prisma.leadFile.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const hasAccess = await checkLeadAccess(file.leadId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this file' });
    }

    const filePath = path.join(UPLOADS_DIR, file.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/files/:id
router.delete('/:id', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const file = await prisma.leadFile.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const hasAccess = await checkLeadAccess(file.leadId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this file' });
    }

    // Only uploader or admin can delete
    if (file.uploadedById !== req.user.id && !['SUPER_ADMIN', 'TEAM_LEADER'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You can only delete files you uploaded' });
    }

    // Delete from disk
    const filePath = path.join(UPLOADS_DIR, file.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.leadFile.delete({ where: { id: file.id } });
    return res.json({ message: 'File deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
