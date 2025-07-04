// Gestionnaire principal pour l'import, l'affichage et la modification d'image

// Sélection des éléments du DOM
const imageInput = document.getElementById('image-upload');
const optionsPanel = document.getElementById('options-panel');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download-btn');

// Sliders
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');
const hueSlider = document.getElementById('hue');
const noiseSlider = document.getElementById('noise');

let originalImage = null; // Image d'origine (Image ou OpenCV mat)
let currentImage = null;  // Image modifiée (OpenCV mat)
let originalMat = null; // Image d'origine sous forme de cv.Mat

// Attendre que OpenCV soit prêt
function onOpenCvReady() {
    // On peut activer l'import d'image
    imageInput.disabled = false;
}
if (typeof cv === 'undefined') {
    imageInput.disabled = true;
    window.Module = { onRuntimeInitialized: onOpenCvReady };
} else {
    onOpenCvReady();
}

// Taille max du canvas (padding pour la barre latérale)
function getMaxCanvasSize() {
    const main = document.querySelector('main');
    let maxWidth = main.clientWidth || window.innerWidth;
    let maxHeight = main.clientHeight || window.innerHeight;
    // Un peu de marge
    maxWidth = Math.max(100, maxWidth - 32);
    maxHeight = Math.max(100, maxHeight - 32);
    return { maxWidth, maxHeight };
}

function fitSizeToBox(imgWidth, imgHeight, boxWidth, boxHeight) {
    const ratio = Math.min(boxWidth / imgWidth, boxHeight / imgHeight, 1);
    return {
        width: Math.round(imgWidth * ratio),
        height: Math.round(imgHeight * ratio)
    };
}

function resizeCanvasToImage() {
    if (!originalImage) return;
    const { maxWidth, maxHeight } = getMaxCanvasSize();
    const { width, height } = fitSizeToBox(originalImage.width, originalImage.height, maxWidth, maxHeight);
    canvas.width = width;
    canvas.height = height;
}

// 1. Import d'image (modifié pour resize)
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            originalImage = img;
            resizeCanvasToImage();
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Convertit en cv.Mat
            if (originalMat) originalMat.delete();
            originalMat = cv.imread(canvas);
            optionsPanel.classList.remove('hidden');
            downloadBtn.disabled = false;
            resetSliders();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Redimensionnement dynamique lors du resize de la fenêtre
window.addEventListener('resize', () => {
    if (!originalImage) return;
    resizeCanvasToImage();
    // Recharge l'image d'origine dans le canvas
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    // Met à jour le cv.Mat d'origine
    if (originalMat) originalMat.delete();
    originalMat = cv.imread(canvas);
    // Réapplique les modifications
    applyImageModifications();
});

// 2. Réinitialisation des sliders
function resetSliders() {
    brightnessSlider.value = 0;
    contrastSlider.value = 0;
    saturationSlider.value = 0;
    hueSlider.value = 0;
    noiseSlider.value = 0;
}

// 3. Application des modifications en temps réel
const sliders = [brightnessSlider, contrastSlider, saturationSlider, hueSlider, noiseSlider];
sliders.forEach(slider => {
    slider.addEventListener('input', applyImageModifications);
});

function applyImageModifications() {
    if (!originalMat) return;
    // Copie l'image d'origine
    let mat = originalMat.clone();
    // 1. Luminosité et contraste
    let alpha = 1 + parseInt(contrastSlider.value) / 100; // contraste
    let beta = parseInt(brightnessSlider.value); // luminosité
    mat.convertTo(mat, -1, alpha, beta);
    // 2. Saturation et teinte
    let hsv = new cv.Mat();
    cv.cvtColor(mat, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
    // Saturation
    let s = parseInt(saturationSlider.value);
    let h = parseInt(hueSlider.value);
    for (let i = 0; i < hsv.rows; i++) {
        for (let j = 0; j < hsv.cols; j++) {
            let pixel = hsv.ucharPtr(i, j);
            // Teinte
            pixel[0] = (pixel[0] + h + 180) % 180;
            // Saturation
            let sat = pixel[1] + s;
            pixel[1] = Math.max(0, Math.min(255, sat));
        }
    }
    cv.cvtColor(hsv, mat, cv.COLOR_HSV2RGB);
    cv.cvtColor(mat, mat, cv.COLOR_RGB2RGBA);
    hsv.delete();
    // 3. Bruit
    let noise = parseInt(noiseSlider.value);
    if (noise > 0) {
        let noiseMat = cv.Mat.zeros(mat.rows, mat.cols, mat.type());
        cv.randn(noiseMat, 0, noise); // bruit gaussien
        cv.add(mat, noiseMat, mat, new cv.Mat(), mat.type());
        noiseMat.delete();
    }
    // Affiche le résultat
    cv.imshow(canvas, mat);
    mat.delete();
}

// 4. Téléchargement de l'image modifiée

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'image_modifiee.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// TODO : Charger OpenCV.js et appliquer les effets réels
// (Le code ci-dessus prépare l'interface et la logique de base)
