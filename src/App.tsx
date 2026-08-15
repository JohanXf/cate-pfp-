import React, { useState, useRef, useEffect, ChangeEvent, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Upload, Download, ZoomIn, ZoomOut, Move, RefreshCw, Image as ImageIcon, Check } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(null);
  
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [transparentBg, setTransparentBg] = useState(false);
  const [overlayBlend, setOverlayBlend] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
    const outerRadius = 440;
    const innerRadius = 370;

    // 1. Draw Background
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
      // Programmatic fallback background
      if (!transparentBg) {
        ctx.fillStyle = '#f5ebd5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      const gradient = ctx.createLinearGradient(cx - outerRadius, cy - outerRadius, cx + outerRadius, cy + outerRadius);
      gradient.addColorStop(0, '#e8c547');
      gradient.addColorStop(0.2, '#fde57e');
      gradient.addColorStop(0.5, '#d4af37');
      gradient.addColorStop(0.8, '#aa771c');
      gradient.addColorStop(1, '#6e4810');

      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
      ctx.shadowOffsetX = 0;

      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
      ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Reset shadow for borders
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#b88922';
      
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Draw user custom photo inside the coin mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.clip();

    if (image) {
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
    } else if (!bgImage) {
      ctx.fillStyle = '#eaddc4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    // 3. Draw Overlay
    if (overlayImage) {
      ctx.save();
      if (overlayBlend) {
        ctx.globalCompositeOperation = 'screen';
      }
      ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      // Programmatic fallback 'C'
      const cOuter = 340;
      const cInner = 200;
      const startAngle = Math.PI * 0.22;
      const endAngle = Math.PI * 1.78;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 6;
      
      ctx.beginPath();
      ctx.arc(cx, cy, cOuter, startAngle, endAngle, false);
      ctx.arc(cx, cy, cInner, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Inner shadow / gloss on C
      ctx.shadowColor = 'transparent';
      const glossGrad = ctx.createLinearGradient(cx, cy - cOuter, cx, cy + cOuter);
      glossGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
      glossGrad.addColorStop(0.4, 'rgba(255,255,255,0.1)');
      glossGrad.addColorStop(1, 'rgba(255,255,255,0)');
      
      ctx.beginPath();
      ctx.arc(cx, cy, cOuter, startAngle, endAngle, false);
      ctx.arc(cx, cy, cInner, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = glossGrad;
      ctx.fill();
    }

  }, [bgImage, image, overlayImage, scale, offsetX, offsetY, rotation, transparentBg]);

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
           <button className="bg-[#1A1A1A] text-[#FACC15] px-6 py-3 rounded-full hover:bg-[#FACC15] hover:text-[#1A1A1A] transition-colors border-2 border-[#1A1A1A]">Join the Pride</button>
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
                 
                 {overlayImage && (
                   <label className="flex items-center gap-2 cursor-pointer group px-1">
                      <div className={`w-4 h-4 border-2 border-[#1A1A1A] flex items-center justify-center transition-colors ${overlayBlend ? 'bg-[#FACC15]' : 'bg-white'}`}>
                        {overlayBlend && <Check size={12} strokeWidth={4} className="text-[#1A1A1A]" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={overlayBlend} 
                        onChange={(e) => setOverlayBlend(e.target.checked)} 
                      />
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Remove Black BG</span>
                   </label>
                 )}
               </div>
             </div>
           </div>
           
           <div className={`space-y-6 transition-opacity duration-300 ${image ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <label className="text-[10px] font-black uppercase tracking-widest block opacity-40">Step 02. Frame Adjustments</label>
              
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

              {/* Transparent BG Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 border-2 border-[#1A1A1A] flex items-center justify-center transition-colors ${transparentBg ? 'bg-[#FACC15]' : 'bg-white'}`}>
                    {transparentBg && <Check size={14} strokeWidth={4} className="text-[#1A1A1A]" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={transparentBg} 
                    onChange={(e) => setTransparentBg(e.target.checked)} 
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">Transparent BG</span>
                </label>
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

      </main>
    </div>
  );
}
