import Jimp from 'jimp';
import path from 'path';

async function generateIcons() {
    try {
        const publicDir = './public';
        const faviconPath = path.join(publicDir, 'favicon.png');
        
        console.log(`Reading ${faviconPath}...`);
        const originalLogo = await Jimp.read(faviconPath);

        // 512x512 Icon
        const img512 = new Jimp(512, 512, '#FFFFFF');
        const logo512 = originalLogo.clone().contain(400, 400); // Scale down slightly to give some padding
        const x512 = (512 - logo512.bitmap.width) / 2;
        const y512 = (512 - logo512.bitmap.height) / 2;
        img512.composite(logo512, x512, y512);

        const out512 = path.join(publicDir, 'icons', 'icon-512.png');
        await img512.writeAsync(out512);
        console.log(`Generated ${out512}`);

        // 192x192 Icon
        const img192 = new Jimp(192, 192, '#FFFFFF');
        const logo192 = originalLogo.clone().contain(150, 150);
        const x192 = (192 - logo192.bitmap.width) / 2;
        const y192 = (192 - logo192.bitmap.height) / 2;
        img192.composite(logo192, x192, y192);

        const out192 = path.join(publicDir, 'icons', 'icon-192.png');
        await img192.writeAsync(out192);
        console.log(`Generated ${out192}`);

    } catch (err) {
        console.error('Error generating icons:', err);
    }
}

generateIcons();
