import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@siimonpara.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log('⚠️  Data already seeded, updating...');
    const clientPassword2 = await bcrypt.hash('client123', 10);
    await prisma.client.updateMany({ where: { code: 'CL001' }, data: { email: 'client@pharmacie.ma', password: clientPassword2 } });
    const client = await prisma.client.findFirst({ where: { code: 'CL001' } });

    // Add promotions if missing
    await prisma.promotion.createMany({ data: [
      { code: 'SOIN20', libelle: '-20% sur les produits de soin', type: 'remise', valeur: 20, dateDebut: new Date(), dateFin: new Date('2026-06-15'), actif: true },
      { code: 'LIVFREE', libelle: 'Livraison gratuite dès 2000 DH', type: 'remise', valeur: 100, dateDebut: new Date(), dateFin: new Date('2026-05-30'), actif: true },
      { code: 'WELCOME15', libelle: '15% de réduction première commande', type: 'remise', valeur: 15, dateDebut: new Date(), dateFin: new Date('2026-12-31'), actif: true },
    ], skipDuplicates: true });

    // Add sample orders if missing
    const existingOrders = await prisma.commandeClient.count();
    if (existingOrders === 0 && client) {
      const products = await prisma.product.findMany({ take: 3 });
      if (products.length >= 2) {
        await prisma.commandeClient.create({
          data: { reference: 'CMD-00001', clientId: client.id, statut: 'livrée', totalHT: 55.90, totalTTC: 55.90,
            items: { create: [
              { productId: products[0].id, quantity: 2, priceHT: products[0].sellPrice, totalHT: products[0].sellPrice * 2, totalTTC: products[0].sellPrice * 2 },
              { productId: products[1].id, quantity: 1, priceHT: products[1].sellPrice, totalHT: products[1].sellPrice, totalTTC: products[1].sellPrice },
            ]},
          },
        });
        await prisma.commandeClient.create({
          data: { reference: 'CMD-00002', clientId: client.id, statut: 'en_attente', totalHT: 24.50, totalTTC: 24.50,
            items: { create: [
              { productId: products[0].id, quantity: 1, priceHT: products[0].sellPrice, totalHT: products[0].sellPrice, totalTTC: products[0].sellPrice },
            ]},
          },
        });
      }
    }
    console.log('✅ Seed update done');
    return;
  }

  // === Admin ===
  await prisma.user.create({ data: { email: adminEmail, password: hashedPassword, name: 'Admin Siimon', role: 'ADMIN' } });

  // === Paramètres ===
  const ville = await prisma.ville.create({ data: { nom: 'Casablanca' } });
  const zone = await prisma.zone.create({ data: { nom: 'Centre', villeId: ville.id } });
  const famille = await prisma.famille.create({ data: { nom: 'Médicaments' } });
  const sousFamille = await prisma.sousFamille.create({ data: { nom: 'Antalgiques', familleId: famille.id } });
  const tva = await prisma.tVA.create({ data: { taux: 20, libelle: 'TVA 20%' } });
  const depot = await prisma.depot.create({ data: { nom: 'Dépôt Principal', adresse: 'Casablanca' } });
  await prisma.modeReglement.create({ data: { nom: 'ESPÈCE' } });
  await prisma.modeReglement.create({ data: { nom: 'CHÈQUE' } });
  await prisma.modeReglement.create({ data: { nom: 'VIREMENT' } });
  const catClient = await prisma.categorieClient.create({ data: { nom: 'Pharmacie' } });
  const groupeRemise = await prisma.groupeRemise.create({ data: { nom: 'Standard', taux: 5 } });
  const livreur = await prisma.livreur.create({ data: { nom: 'Ahmed', telephone: '0612345678', vehicule: 'Peugeot 208', zoneId: zone.id } });

  // === Clients ===
  const clientPassword = await bcrypt.hash('client123', 10);
  const client = await prisma.client.create({
    data: {
      code: 'CL001', name: 'Pharmacie de la Paix', email: 'client@pharmacie.ma',
      password: clientPassword, city: 'Casablanca',
      phone: '0123456789', villeId: ville.id, zoneId: zone.id,
      categorieId: catClient.id, groupeRemiseId: groupeRemise.id, discountRate: 5,
    },
  });

  // === Fournisseur ===
  const fournisseur = await prisma.fournisseur.create({
    data: { code: 'FR001', nom: 'DistriPharma S.A.R.L', email: 'contact@distripharma.ma', villeId: ville.id },
  });

  // === Produits ===
  const p1 = await prisma.product.upsert({
    where: { code: 'PR001' },
    update: {},
    create: {
      code: 'PR001', name: 'Dolirhume Tab', familleId: famille.id, sousFamilleId: sousFamille.id,
      buyPrice: 3.20, sellPrice: 5.50, tvaId: tva.id, stock: 100, depotId: depot.id, stockMin: 10, unit: 'Boîte',
    },
  });
  const p2 = await prisma.product.upsert({
    where: { code: 'PR002' },
    update: {},
    create: {
      code: 'PR002', name: 'Biafine 186g', familleId: famille.id,
      buyPrice: 5.10, sellPrice: 8.90, tvaId: tva.id, stock: 50, depotId: depot.id, stockMin: 5, unit: 'Tube',
    },
  });
  const p3 = await prisma.product.upsert({
    where: { code: 'PR003' },
    update: {},
    create: {
      code: 'PR003', name: 'Eau Micellaire 500ml',
      buyPrice: 7.50, sellPrice: 12.00, tvaId: tva.id, stock: 200, depotId: depot.id, stockMin: 20, unit: 'Flacon',
    },
  });

  // === Bon de Livraison ===
  const user = await prisma.user.findUnique({ where: { email: adminEmail } })!;
  if (user) {
    await prisma.bonLivraison.create({
      data: {
        reference: 'BL-00001', clientId: client.id, userId: user.id, paymentMode: 'ESPÈCE',
        totalHT: 26.40, totalTVA: 5.28, totalTTC: 31.68, validated: true,
        items: {
          create: [
            { productId: p1.id, quantity: 2, priceHT: 5.50, tva: 20, totalHT: 11.00, totalTTC: 13.20 },
            { productId: p2.id, quantity: 1, priceHT: 8.90, tva: 20, totalHT: 8.90, totalTTC: 10.68 },
            { productId: p3.id, quantity: 2, priceHT: 12.00, tva: 20, totalHT: 24.00, totalTTC: 28.80 },
          ],
        },
      },
    });
  }

  // === Promotions ===
  await prisma.promotion.createMany({
    data: [
      { code: 'SOIN20', libelle: '-20% sur les produits de soin', type: 'remise', valeur: 20, dateDebut: new Date(), dateFin: new Date('2026-06-15'), actif: true },
      { code: 'LIVFREE', libelle: 'Livraison gratuite dès 2000 DH', type: 'remise', valeur: 100, dateDebut: new Date(), dateFin: new Date('2026-05-30'), actif: true },
      { code: 'WELCOME15', libelle: '15% de réduction première commande', type: 'remise', valeur: 15, dateDebut: new Date(), dateFin: new Date('2026-12-31'), actif: true },
    ],
    skipDuplicates: true,
  });

  // === Commande Client ===
  await prisma.commandeClient.create({
    data: {
      reference: 'CMD-00001', clientId: client.id, statut: 'livrée', totalHT: 55.90, totalTTC: 55.90,
      items: {
        create: [
          { productId: p1.id, quantity: 2, priceHT: 5.50, totalHT: 11.00, totalTTC: 11.00 },
          { productId: p2.id, quantity: 1, priceHT: 8.90, totalHT: 8.90, totalTTC: 8.90 },
          { productId: p3.id, quantity: 3, priceHT: 12.00, totalHT: 36.00, totalTTC: 36.00 },
        ],
      },
    },
  });
  await prisma.commandeClient.create({
    data: {
      reference: 'CMD-00002', clientId: client.id, statut: 'en_attente', totalHT: 24.50, totalTTC: 24.50,
      items: {
        create: [
          { productId: p1.id, quantity: 1, priceHT: 5.50, totalHT: 5.50, totalTTC: 5.50 },
          { productId: p3.id, quantity: 2, priceHT: 12.00, totalHT: 24.00, totalTTC: 24.00 },
        ],
      },
    },
  });

  // === Route Livraison ===
  await prisma.routeLivraison.create({
    data: { reference: 'DR-00001', livreurId: livreur.id, statut: 'terminée' },
  });

  console.log('✅ Seeding finished successfully');
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`   Produits: ${[p1, p2, p3].length} créés`);
  console.log(`   Client: ${client.name}`);
  console.log(`   Fournisseur: ${fournisseur.nom}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
