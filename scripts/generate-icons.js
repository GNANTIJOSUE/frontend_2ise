#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration des tailles d'icônes
const ICON_SIZES = {
    // Icônes de base
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'favicon-96x96.png': 96,

    // Icônes Android
    'android-icon-72x72.png': 72,
    'android-icon-96x96.png': 96,
    'android-icon-144x144.png': 144,
    'android-icon-192x192.png': 192,

    // Icônes iOS
    'apple-icon-57x57.png': 57,
    'apple-icon-60x60.png': 60,
    'apple-icon-72x72.png': 72,
    'apple-icon-76x76.png': 76,
    'apple-icon-114x114.png': 114,
    'apple-icon-120x120.png': 120,
    'apple-icon-144x144.png': 144,
    'apple-icon-152x152.png': 152,
    'apple-icon-180x180.png': 180,

    // Icônes Microsoft
    'ms-icon-144x144.png': 144,
    'ms-icon-150x150.png': 150,

    // Icônes principales
    'logo192.png': 192,
    'logo512.png': 512,
};

// Splash screens pour iOS
const SPLASH_SCREENS = {
    'apple-splash-2048-2732.png': { width: 2048, height: 2732 },
    'apple-splash-1668-2388.png': { width: 1668, height: 2388 },
    'apple-splash-1536-2048.png': { width: 1536, height: 2048 },
    'apple-splash-1125-2436.png': { width: 1125, height: 2436 },
    'apple-splash-1242-2688.png': { width: 1242, height: 2688 },
    'apple-splash-750-1334.png': { width: 750, height: 1334 },
    'apple-splash-640-1136.png': { width: 640, height: 1136 },
};

async function generateIcons(sourceImagePath, outputDir = 'public') {
    console.log('🎨 Génération des icônes PWA...');

    // Vérifier que l'image source existe
    if (!fs.existsSync(sourceImagePath)) {
        console.error(`❌ Image source non trouvée: ${sourceImagePath}`);
        console.log('💡 Utilisez une image de haute qualité (au moins 512x512px)');
        return;
    }

    // Créer le dossier de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        // Générer les icônes carrées
        console.log('📱 Génération des icônes carrées...');
        for (const [filename, size] of Object.entries(ICON_SIZES)) {
            const outputPath = path.join(outputDir, filename);

            await sharp(sourceImagePath)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .png()
                .toFile(outputPath);

            console.log(`✅ ${filename} (${size}x${size})`);
        }

        // Générer les splash screens
        console.log('📱 Génération des splash screens iOS...');
        for (const [filename, dimensions] of Object.entries(SPLASH_SCREENS)) {
            const outputPath = path.join(outputDir, filename);

            await sharp(sourceImagePath)
                .resize(dimensions.width, dimensions.height, {
                    fit: 'contain',
                    background: { r: 25, g: 118, b: 210, alpha: 1 } // Couleur de thème
                })
                .png()
                .toFile(outputPath);

            console.log(`✅ ${filename} (${dimensions.width}x${dimensions.height})`);
        }

        // Générer les images pour partage social
        console.log('📱 Génération des images pour partage social...');

        // og-image.png (1200x630 pour Facebook/Twitter)
        await sharp(sourceImagePath)
            .resize(1200, 630, {
                fit: 'contain',
                background: { r: 25, g: 118, b: 210, alpha: 1 }
            })
            .png()
            .toFile(path.join(outputDir, 'og-image.png'));
        console.log('✅ og-image.png (1200x630)');

        // Screenshots
        await sharp(sourceImagePath)
            .resize(1280, 720, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .png()
            .toFile(path.join(outputDir, 'screenshot-wide.png'));
        console.log('✅ screenshot-wide.png (1280x720)');

        await sharp(sourceImagePath)
            .resize(750, 1334, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .png()
            .toFile(path.join(outputDir, 'screenshot-narrow.png'));
        console.log('✅ screenshot-narrow.png (750x1334)');

        console.log('\n🎉 Toutes les icônes ont été générées avec succès !');
        console.log(`📁 Fichiers créés dans: ${outputDir}/`);

    } catch (error) {
        console.error('❌ Erreur lors de la génération des icônes:', error.message);
    }
}

// Fonction principale
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('🎨 Générateur d\'icônes PWA pour 2ISE-GROUPE');
        console.log('');
        console.log('Usage:');
        console.log('  node scripts/generate-icons.js <image-source> [output-dir]');
        console.log('');
        console.log('Exemples:');
        console.log('  node scripts/generate-icons.js logo.png');
        console.log('  node scripts/generate-icons.js logo.png public');
        console.log('');
        console.log('💡 Utilisez une image de haute qualité (au moins 512x512px)');
        return;
    }

    const sourceImage = args[0];
    const outputDir = args[1] || 'public';

    await generateIcons(sourceImage, outputDir);
}

// Exécuter le script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateIcons };