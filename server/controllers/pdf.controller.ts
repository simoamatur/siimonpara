import { Request, Response } from 'express';
import { generateFacturePdf, generateBonLivraisonPdf } from '../services/pdf.service';

export async function downloadFacture(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const pdfDoc = await generateFacturePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${id}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err: any) {
    console.error('Erreur génération PDF facture:', err);
    res.status(500).json({ error: err.message || 'Erreur génération PDF' });
  }
}

export async function downloadBonLivraison(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const pdfDoc = await generateBonLivraisonPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bon-livraison-${id}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err: any) {
    console.error('Erreur génération PDF bon livraison:', err);
    res.status(500).json({ error: err.message || 'Erreur génération PDF' });
  }
}
