import React, { useState, useRef, useEffect, ChangeEvent, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Upload, Download, ZoomIn, ZoomOut, Move, RefreshCw, Image as ImageIcon, Check, X } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(null);
    
  const [bgScale, setBgScale] = useState(1);
  const [overlayScale, setOverlayScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);
    const [maskRadius, setMaskRadius] = useState(415);
  const [showGuide, setShowGuide] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load default base and overlay images on mount
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
  }, []);

  // Handle Image Uploads
  const handleBgUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setBgImage(img);
      if (typeof event.target?.result === 'string') img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setScale(1);
        setOffsetX(0);
        setOffsetY(0);
        setRotation(0);
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleOverlayUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setOverlayImage(img);
      if (typeof event.target?.result === 'string') img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Canvas Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    // Mask radius controls both the custom photo clip and the overlay size
    const innerRadius = maskRadius;

    // 1. Draw Background Color
    ctx.fillStyle = '#FAF9F6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Draw Uploaded Base Coin
    if (bgImage) {
      const bw = canvas.width * bgScale;
      const bh = canvas.height * bgScale;
      const bx = (canvas.width - bw) / 2;
      const by = (canvas.height - bh) / 2;
      ctx.drawImage(bgImage, bx, by, bw, bh);
    }

    // 3. Draw user custom photo inside the coin mask
    if (image) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
      ctx.clip();

      const imgAspectRatio = image.width / image.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      
      // Cover logic
      if (imgAspectRatio > 1) {
        drawWidth = canvas.height * imgAspectRatio;
      } else {
        drawHeight = canvas.width / imgAspectRatio;
      }
      
      const w = drawWidth * scale;
      const h = drawHeight * scale;
      const x = cx + offsetX;
      const y = cy + offsetY;
      
      ctx.translate(x, y);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.drawImage(image, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      // Only draw placeholder if there's no base image either, to avoid ugly grey circle over custom coins
      if (!bgImage) {
         ctx.save();
         ctx.beginPath();
         ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
         ctx.clip();
         ctx.fillStyle = '#eaddc4';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.restore();
      }
    }

    // 4. Draw Uploaded Overlay
    if (overlayImage) {
      ctx.save();
      // Match the overlay to the canvas size, then scale by overlayScale
      const dw = canvas.width * overlayScale;
      const dh = canvas.width * overlayScale;
      const dx = cx - (dw / 2);
      const dy = cy - (dh / 2);
      
      ctx.drawImage(overlayImage, dx, dy, dw, dh);
      ctx.restore();
    }

  }, [bgImage, image, overlayImage, scale, bgScale, overlayScale, offsetX, offsetY, rotation, maskRadius]);

  // Canvas Dragging Logic
  const getCanvasCoords = (e: ReactMouseEvent | ReactTouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e && (e as ReactTouchEvent).touches.length > 0) {
      clientX = (e as ReactTouchEvent).touches[0].clientX;
      clientY = (e as ReactTouchEvent).touches[0].clientY;
    } else {
      clientX = (e as ReactMouseEvent).clientX;
      clientY = (e as ReactMouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: ReactMouseEvent | ReactTouchEvent) => {
    if (!image) return;
    setIsDragging(true);
    setDragStart(getCanvasCoords(e));
  };

  const handlePointerMove = (e: ReactMouseEvent | ReactTouchEvent) => {
    if (!isDragging || !image) return;
    const coords = getCanvasCoords(e);
    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;
    setOffsetX(prev => prev + dx);
    setOffsetY(prev => prev + dy);
    setDragStart(coords);
  };

  useEffect(() => {
    const handleGlobalUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, []);

  // Controls Handlers
  const handleReset = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'cate-pfp.png';
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="h-20 border-b-2 border-[#1A1A1A] flex items-center justify-between px-6 lg:px-10 shrink-0 bg-[#FAF9F6]">
        <div className="flex items-baseline gap-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Cate.</h1>
          <span className="text-xs font-mono opacity-50 tracking-widest hidden sm:inline">PFP_GEN_v1.0</span>
        </div>
        <div className="flex gap-8 items-center text-xs font-bold uppercase tracking-widest">
           <button onClick={() => setShowGuide(true)} className="bg-[#1A1A1A] text-[#FACC15] px-6 py-3 rounded-full hover:bg-[#FACC15] hover:text-[#1A1A1A] transition-colors border-2 border-[#1A1A1A]">Guide</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row w-full">
        
        {/* Left Sidebar: Controls */}
        <aside className="w-full lg:w-[320px] border-b-2 lg:border-b-0 lg:border-r-2 border-[#1A1A1A] p-6 lg:p-10 flex flex-col gap-8 bg-[#FAF9F6] shrink-0 overflow-y-auto">
           <div>
             <h2 className="text-4xl font-serif italic mb-6 leading-none">Wear the <span className="text-[#FACC15] bg-[#1A1A1A] px-2 not-italic">Cate</span></h2>
             
             {/* Upload Layers */}
             <div className="group space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest block mb-2 opacity-40">Step 01. Layers</label>
               
               {/* Layer 1: Background */}
               <label className="w-full border-2 border-[#1A1A1A] p-3 flex items-center gap-3 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-[2px_2px_0px_#1A1A1A] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                  <Upload size={16} strokeWidth={2} />
                  <span className="text-[10px] font-bold uppercase tracking-tight flex-1">{bgImage ? 'Change Base Coin' : '1. Base Coin (Optional)'}</span>
                  <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleBgUpload} />
               </label>

               {/* Layer 2: Custom Photo */}
               <label className="w-full border-2 border-[#1A1A1A] p-4 flex flex-col items-center justify-center gap-2 bg-[#FACC15] hover:bg-[#eab308] cursor-pointer transition-colors shadow-[4px_4px_0px_#1A1A1A] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none">
                  <Upload size={24} strokeWidth={2} />
                  <span className="text-xs font-black uppercase tracking-tight">{image ? 'Change Custom Photo' : '2. Upload Custom Photo'}</span>
                  <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageUpload} />
               </label>

               {/* Layer 3: Overlay */}
               <div className="flex flex-col gap-2">
                 <label className="w-full border-2 border-[#1A1A1A] p-3 flex items-center gap-3 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-[2px_2px_0px_#1A1A1A] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                    <Upload size={16} strokeWidth={2} />
                    <span className="text-[10px] font-bold uppercase tracking-tight flex-1">{overlayImage ? 'Change Top Overlay' : '3. Top Overlay (Optional)'}</span>
                    <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleOverlayUpload} />
                 </label>
                 
                 
               </div>
             </div>
           </div>
        </aside>

        {/* Center Canvas Section */}
        <section className="flex-1 flex flex-col items-center justify-center bg-[#E5E4E0] relative p-8 lg:p-12 min-h-[500px] overflow-hidden">
          <div className="absolute top-8 left-8 text-6xl md:text-[100px] lg:text-[120px] font-serif font-black text-black/5 leading-none select-none pointer-events-none">GENERATE</div>
          
          <div className="relative w-full max-w-[480px] aspect-square bg-white shadow-[20px_20px_0px_#1A1A1A] border-2 border-[#1A1A1A] p-2 md:p-4 flex items-center justify-center">
            <div className="relative w-full h-full bg-slate-100 flex items-center justify-center border-2 border-[#1A1A1A] overflow-hidden">
              <canvas 
                ref={canvasRef}
                width={1000}
                height={1000}
                className={`w-full h-full object-contain touch-none ${image ? 'cursor-move' : 'cursor-default'}`}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
              />
              {!image && !bgImage && !overlayImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-[#1A1A1A] p-6 text-center bg-white/80 backdrop-blur-sm">
                  <ImageIcon size={48} strokeWidth={1.5} className="mb-4 opacity-50" />
                  <p className="font-black uppercase tracking-widest text-xs">No Layers Uploaded</p>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] mt-10 lg:mt-12 flex items-center gap-2 opacity-50">
            <Move size={14} /> Drag image directly to position
          </p>
        
           
           <div className={`w-full max-w-[800px] mt-8 z-10 transition-opacity duration-300 ${(image || bgImage || overlayImage) ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <label className="text-[10px] font-black uppercase tracking-widest block opacity-40 mb-4 text-center">Step 02. Frame Adjustments</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">

              {/* Base Coin Zoom Slider */}
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <ZoomIn size={14} /> Base Coin Zoom
                  </label>
                  <span className="text-[10px] font-mono bg-[#1A1A1A] text-[#FACC15] px-2 py-0.5 rounded-full">{Math.round(bgScale * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" max="2" step="0.01" 
                  value={bgScale} 
                  onChange={(e) => setBgScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#1A1A1A] appearance-none cursor-pointer"
                />
              </div>

              {/* Overlay Zoom Slider */}
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <ZoomIn size={14} /> Overlay 'C' Zoom
                  </label>
                  <span className="text-[10px] font-mono bg-[#1A1A1A] text-[#FACC15] px-2 py-0.5 rounded-full">{Math.round(overlayScale * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" max="2" step="0.01" 
                  value={overlayScale} 
                  onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#1A1A1A] appearance-none cursor-pointer"
                />
              </div>

              {/* Mask/Overlay Size Slider */}
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <ZoomIn size={14} /> Coin Inner Size
                  </label>
                  <span className="text-[10px] font-mono bg-[#1A1A1A] text-[#FACC15] px-2 py-0.5 rounded-full">{Math.round((maskRadius / 540) * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="200" 
                  max="540" 
                  step="1" 
                  value={maskRadius} 
                  onChange={(e) => setMaskRadius(parseFloat(e.target.value))} 
                  className="w-full h-2 bg-[#1A1A1A] appearance-none cursor-pointer"
                />
              </div>
              
              {/* Zoom Slider */}
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <ZoomIn size={14} /> Zoom
                  </label>
                  <span className="text-[10px] font-mono bg-[#1A1A1A] text-[#FACC15] px-2 py-0.5 rounded-full">{Math.round(scale * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" max="3" step="0.01" 
                  value={scale} 
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#1A1A1A] appearance-none cursor-pointer"
                />
              </div>

              {/* Rotation Slider */}
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <RefreshCw size={14} /> Rotation
                  </label>
                  <span className="text-[10px] font-mono bg-[#1A1A1A] text-[#FACC15] px-2 py-0.5 rounded-full">{rotation}°</span>
                </div>
                <input 
                  type="range" 
                  min="-180" max="180" step="1" 
                  value={rotation} 
                  onChange={(e) => setRotation(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#1A1A1A] appearance-none cursor-pointer"
                />
              </div>

                          </div>
              </div>
        </section>

        {/* Right Sidebar: Actions */}
        <aside className="w-full lg:w-[260px] border-t-2 lg:border-t-0 lg:border-l-2 border-[#1A1A1A] p-6 lg:p-8 flex flex-col justify-between bg-[#FAF9F6] shrink-0">
          <div className="w-full space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest block mb-4 opacity-40">Step 03. Export</label>
            
            <button 
              onClick={handleDownload} 
              disabled={!image && !bgImage}
              className="w-full bg-[#1A1A1A] text-[#FACC15] font-black py-4 rounded-lg flex items-center justify-center gap-3 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:shadow-none hover:bg-black active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
            >
              <Download size={20} strokeWidth={2.5} /> DOWNLOAD
            </button>
            
            <button 
              onClick={handleReset} 
              disabled={!image}
              className="w-full bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] font-black py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-[4px_4px_0px_#1A1A1A] active:translate-y-1 active:translate-x-1 active:shadow-none"
            >
              <RefreshCw size={20} strokeWidth={2.5} /> RESET
            </button>
          </div>
          
          <div className="mt-12 lg:mt-0 space-y-6">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">Format</h4>
              <p className="text-[10px] font-mono opacity-70">1000 x 1000 PX<br/>PNG (Transparent)</p>
            </div>
            <div className="w-full text-center pt-8">
              <div className="inline-block w-12 h-[2px] bg-[#FACC15] mb-4"></div>
              <p className="text-[9px] font-bold uppercase tracking-widest leading-tight">Designed for the<br/>Cate Community</p>
            </div>
          </div>
        </aside>


      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#FAF9F6] border-4 border-[#1A1A1A] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_#1A1A1A]">
            <div className="p-6 md:p-10 flex flex-col gap-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">How to use Cate PFP Gen</h2>
                  <p className="text-sm font-bold opacity-60">Follow this guide to create your perfect profile picture.</p>
                </div>
                <button onClick={() => setShowGuide(false)} className="text-[#1A1A1A] hover:bg-[#FACC15] p-2 border-2 border-transparent hover:border-[#1A1A1A] transition-colors rounded-full">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              <div className="space-y-8 text-[#1A1A1A]">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-[#FACC15] border-2 border-[#1A1A1A] flex items-center justify-center font-black text-xl">1</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 uppercase tracking-wide">Remove Your Background</h3>
                    <p className="text-sm leading-relaxed">
                      Before uploading your photo here, it's best to remove its background so it blends perfectly with the coin. Go to <a href="https://www.remove.bg" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">remove.bg</a>, upload your photo, and download the transparent version.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-[#FACC15] border-2 border-[#1A1A1A] flex items-center justify-center font-black text-xl">2</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 uppercase tracking-wide">Upload Custom Photo</h3>
                    <p className="text-sm leading-relaxed">
                      Click the "Upload Custom Photo" button and select the transparent image you just downloaded.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-[#FACC15] border-2 border-[#1A1A1A] flex items-center justify-center font-black text-xl">3</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 uppercase tracking-wide">Use The Sliders</h3>
                    <div className="space-y-3 mt-3 text-sm">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-black/10 pb-3">
                        <span className="font-black w-40 shrink-0 bg-black/5 px-2 py-1 uppercase tracking-widest text-[10px]">Base Coin Zoom</span>
                        <span className="opacity-80">Adjusts the size of the gold coin background image.</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-black/10 pb-3">
                        <span className="font-black w-40 shrink-0 bg-black/5 px-2 py-1 uppercase tracking-widest text-[10px]">Overlay 'C' Zoom</span>
                        <span className="opacity-80">Adjusts the size of the black 'C' logo overlay completely independently.</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-black/10 pb-3">
                        <span className="font-black w-40 shrink-0 bg-black/5 px-2 py-1 uppercase tracking-widest text-[10px]">Coin Inner Size</span>
                        <span className="opacity-80">Controls the size of the invisible circular mask that crops your custom photo.</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-black/10 pb-3">
                        <span className="font-black w-40 shrink-0 bg-black/5 px-2 py-1 uppercase tracking-widest text-[10px]">Photo Zoom & Rotate</span>
                        <span className="opacity-80">Scales and rotates your custom photo. (You can also drag the photo directly on the canvas to move it).</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowGuide(false)} className="mt-4 w-full bg-[#1A1A1A] text-[#FACC15] px-6 py-4 font-black uppercase tracking-widest hover:bg-black transition-colors border-2 border-[#1A1A1A]">
                Got it, let's create
              </button>
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
