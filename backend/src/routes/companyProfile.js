// backend/src/routes/companyProfile.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/company-profile
// @desc    Get company profile (for proposal letterhead)
router.get('/', verifyToken, async (req, res) => {
  try {
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      // Auto-create default profile if none exists
      profile = await prisma.companyProfile.create({
        data: {
          companyName: 'TheVertical.ai',
          address: '',
          city: '',
          state: '',
          pincode: '',
          gstNumber: '',
          phone: '',
          email: '',
          website: ''
        }
      });
    }
    return res.json(profile);
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/company-profile
// @desc    Update company profile (Super Admin only)
router.put('/', verifyToken, requireRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const {
      companyName, address, city, state, pincode,
      gstNumber, phone, email, website, logoUrl
    } = req.body;

    let profile = await prisma.companyProfile.findFirst();

    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          companyName: companyName || 'TheVertical.ai',
          address: address || '',
          city: city || '',
          state: state || '',
          pincode: pincode || '',
          gstNumber: gstNumber || '',
          phone: phone || '',
          email: email || '',
          website: website || '',
          logoUrl: logoUrl || null
        }
      });
    } else {
      profile = await prisma.companyProfile.update({
        where: { id: profile.id },
        data: {
          ...(companyName !== undefined && { companyName }),
          ...(address !== undefined && { address }),
          ...(city !== undefined && { city }),
          ...(state !== undefined && { state }),
          ...(pincode !== undefined && { pincode }),
          ...(gstNumber !== undefined && { gstNumber }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(website !== undefined && { website }),
          ...(logoUrl !== undefined && { logoUrl })
        }
      });
    }

    return res.json(profile);
  } catch (error) {
    console.error('Error updating company profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
