import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { downloadFacture, downloadBonLivraison } from '../controllers/pdf.controller';

const router = Router();

router.get('/facture/:id', authenticateToken, downloadFacture);
router.get('/bon-livraison/:id', authenticateToken, downloadBonLivraison);

export default router;
