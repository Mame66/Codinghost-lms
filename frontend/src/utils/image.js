// Redimensionne et recadre une image (carré) dans le navigateur avant envoi.
// Résultat : data URL JPEG légère (~20-40 Ko).
export const resizeImageToDataUrl = (file, size = 320, quality = 0.85) =>
    new Promise((resolve, reject) => {
        if (!file || !/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
            reject(new Error('Choisissez une image JPG, PNG ou WEBP'));
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            reject(new Error('Image trop lourde (15 Mo max)'));
            return;
        }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Image illisible'));
            img.onload = () => {
                const side = Math.min(img.width, img.height);
                const sx = (img.width - side) / 2;
                const sy = (img.height - side) / 2;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, size, size);
                ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
