// Gestionnaire principal pour l'import, l'affichage et la modification d'image

// Sélection des éléments du DOM
const imageInput = document.getElementById('image-upload');
const optionsPanel = document.getElementById('options-panel');
const imageContainer = document.getElementById('image-container');
const displayImage = document.getElementById('display-image');
const filtersOverlay = document.getElementById('filters-overlay');
const placeholder = document.getElementById('placeholder');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');

// Sliders
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');
const hueSlider = document.getElementById('hue');
const noiseSlider = document.getElementById('noise');
const blurSlider = document.getElementById('blur');
const sepiaSlider = document.getElementById('sepia');
const invertSlider = document.getElementById('invert');
const grayscaleSlider = document.getElementById('grayscale');

// Valeurs affichées
const brightnessValue = document.getElementById('brightness-value');
const contrastValue = document.getElementById('contrast-value');
const saturationValue = document.getElementById('saturation-value');
const hueValue = document.getElementById('hue-value');
const noiseValue = document.getElementById('noise-value');
const blurValue = document.getElementById('blur-value');
const sepiaValue = document.getElementById('sepia-value');
const invertValue = document.getElementById('invert-value');
const grayscaleValue = document.getElementById('grayscale-value');

let originalImage = null;

// Attendre que OpenCV soit prêt (plus nécessaire mais gardé pour compatibilité)
function onOpenCvReady() {
    imageInput.disabled = false;
}
if (typeof cv === 'undefined') {
    imageInput.disabled = true;
    window.Module = { onRuntimeInitialized: onOpenCvReady };
} else {
    onOpenCvReady();
}

// Taille max de l'image (padding pour la barre latérale)
function getMaxImageSize() {
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

function resizeImageToContainer() {
    if (!originalImage) return;
    const { maxWidth, maxHeight } = getMaxImageSize();
    const { width, height } = fitSizeToBox(originalImage.width, originalImage.height, maxWidth, maxHeight);
    displayImage.style.width = width + 'px';
    displayImage.style.height = height + 'px';
}

// 1. Import d'image
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            originalImage = img;
            displayImage.src = event.target.result;
            resizeImageToContainer();
            

            imageContainer.classList.remove('hidden');
            placeholder.classList.add('hidden');
            optionsPanel.classList.remove('hidden');
            downloadBtn.disabled = false;
            resetBtn.disabled = false;
            resetSliders();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});


window.addEventListener('resize', () => {
    if (!originalImage) return;
    resizeImageToContainer();
});

// 2. Réinitialisation des sliders
function resetSliders() {
    brightnessSlider.value = 0;
    contrastSlider.value = 0;
    saturationSlider.value = 0;
    hueSlider.value = 0;
    noiseSlider.value = 0;
    blurSlider.value = 0;
    sepiaSlider.value = 0;
    invertSlider.value = 0;
    grayscaleSlider.value = 0;
    

    updateSliderValues();
    

    applyFilters();
}


resetBtn.addEventListener('click', resetSliders);

// 3. Application des filtres CSS
let timeoutId = null;

function updateSliderValues() {
    brightnessValue.textContent = brightnessSlider.value;
    contrastValue.textContent = contrastSlider.value;
    saturationValue.textContent = saturationSlider.value;
    hueValue.textContent = hueSlider.value;
    noiseValue.textContent = noiseSlider.value;
    blurValue.textContent = blurSlider.value;
    sepiaValue.textContent = sepiaSlider.value;
    invertValue.textContent = invertSlider.value;
    grayscaleValue.textContent = grayscaleSlider.value;
}

function debouncedApplyFilters() {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        updateSliderValues();
        applyFilters();
    }, 50);
}

const sliders = [brightnessSlider, contrastSlider, saturationSlider, hueSlider, noiseSlider, blurSlider, sepiaSlider, invertSlider, grayscaleSlider];
sliders.forEach(slider => {
    slider.addEventListener('input', debouncedApplyFilters);
});

function applyFilters() {
    const brightness = parseInt(brightnessSlider.value);
    const contrast = parseInt(contrastSlider.value);
    const saturation = parseInt(saturationSlider.value);
    const hue = parseInt(hueSlider.value);
    const noise = parseInt(noiseSlider.value);
    const blur = parseInt(blurSlider.value);
    const sepia = parseInt(sepiaSlider.value);
    const invert = parseInt(invertSlider.value);
    const grayscale = parseInt(grayscaleSlider.value);
    
    let filterString = '';
    if (brightness !== 0) filterString += `brightness(${1 + brightness / 100}) `;
    if (contrast !== 0) filterString += `contrast(${1 + contrast / 100}) `;
    if (saturation !== 0) filterString += `saturate(${1 + saturation / 100}) `;
    if (hue !== 0) filterString += `hue-rotate(${hue}deg) `;
    if (blur !== 0) filterString += `blur(${blur}px) `;
    if (sepia !== 0) filterString += `sepia(${sepia}%) `;
    if (invert !== 0) filterString += `invert(${invert}%) `;
    if (grayscale !== 0) filterString += `grayscale(${grayscale}%) `;
    displayImage.style.filter = filterString;
    

    if (noise > 0) {
        const noiseOpacity = noise / 100;
        filtersOverlay.style.background = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100" height="100" filter="url(%23noise)"/></svg>')`;
        filtersOverlay.style.opacity = noiseOpacity;
        filtersOverlay.style.mixBlendMode = 'overlay';
    } else {
        filtersOverlay.style.background = 'none';
        filtersOverlay.style.opacity = '0';
    }
}

// 4. Téléchargement de l'image modifiée
downloadBtn.addEventListener('click', () => {

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = displayImage.naturalWidth;
    canvas.height = displayImage.naturalHeight;
    
 
    ctx.filter = displayImage.style.filter;
    ctx.drawImage(displayImage, 0, 0);
    

    const noise = parseInt(noiseSlider.value);
    if (noise > 0) {
  
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const noiseIntensity = noise / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 255 * noiseIntensity;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    
    const link = document.createElement('a');
    link.download = 'image_maxMO.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// Synchronisation sliders <-> inputs + reset individuel
const sliderConfigs = [
    { id: 'brightness', min: -100, max: 100, def: 0 },
    { id: 'contrast', min: -100, max: 100, def: 0 },
    { id: 'saturation', min: -100, max: 100, def: 0 },
    { id: 'hue', min: -180, max: 180, def: 0 },
    { id: 'noise', min: 0, max: 100, def: 0 },
    { id: 'blur', min: 0, max: 20, def: 0 },
    { id: 'sepia', min: 0, max: 100, def: 0 },
    { id: 'invert', min: 0, max: 100, def: 0 },
    { id: 'grayscale', min: 0, max: 100, def: 0 },
];

sliderConfigs.forEach(cfg => {
    const slider = document.getElementById(cfg.id);
    const input = document.getElementById(cfg.id + '-value');
    // Slider -> input
    slider.addEventListener('input', () => {
        input.value = slider.value;
        debouncedApplyFilters();
    });
    // Input -> slider
    input.addEventListener('input', () => {
        let val = parseInt(input.value);
        if (isNaN(val)) val = cfg.def;
        val = Math.max(cfg.min, Math.min(cfg.max, val));
        slider.value = val;
        input.value = val;
        debouncedApplyFilters();
    });
});

// Reset individuel
Array.from(document.querySelectorAll('.reset-slider-btn')).forEach(btn => {
    btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-slider');
        const cfg = sliderConfigs.find(c => c.id === id);
        if (!cfg) return;
        document.getElementById(id).value = cfg.def;
        document.getElementById(id + '-value').value = cfg.def;
        debouncedApplyFilters();
    });
});
