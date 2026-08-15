const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ Load default base and overlay images on mount\n\s*useEffect\(\(\) => \{\n\s*const defaultBg = new Image\(\);\n\s*defaultBg\.onload = \(\) => setBgImage\(defaultBg\);\n\s*defaultBg\.onerror = \(\) => console\.warn\("Could not find \/base\.png in the public folder\. Please upload it\."\);\n\s*defaultBg\.src = '\/base\.png';\n\n\s*const defaultOverlay = new Image\(\);\n\s*defaultOverlay\.onload = \(\) => setOverlayImage\(defaultOverlay\);\n\s*defaultOverlay\.onerror = \(\) => console\.warn\("Could not find \/overlay\.png in the public folder\. Please upload it\."\);\n\s*defaultOverlay\.src = '\/overlay\.png';\n\s*\}, \[\]\);/m;

const replacement = `// Load default base and overlay images on mount
  useEffect(() => {
    const defaultBg = new Image();
    defaultBg.crossOrigin = "anonymous";
    defaultBg.onload = () => setBgImage(defaultBg);
    defaultBg.onerror = () => console.warn("Could not load remote base image.");
    defaultBg.src = 'https://raw.githubusercontent.com/JohanXf/cate-pfp-/main/public/1786773135146.png';

    const defaultOverlay = new Image();
    defaultOverlay.crossOrigin = "anonymous";
    defaultOverlay.onload = () => setOverlayImage(defaultOverlay);
    defaultOverlay.onerror = () => console.warn("Could not load remote overlay image.");
    defaultOverlay.src = 'https://raw.githubusercontent.com/JohanXf/cate-pfp-/main/public/20260815_112943.png';
  }, []);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
