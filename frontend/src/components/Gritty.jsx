/*
Gritty Collage UI — Single-file prototype
Tech: React + Tailwind v4 classes + Framer Motion + react-konva + @dnd-kit

Install (suggested):
  npm i react framer-motion react-konva konva @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers

Notes:
 - Tailwind v4 tokens suggested in tailwind.config.js (see README section below).
 - Replace placeholder textures (paper-grain.png, ink-splatter.png) with your assets in /public.
 - This file exports a single React component (default) that renders three interactive patterns:
   HeroPoster, CompendiumGrid, StickerEditor.
 - This is a prototype to show structure and interactions — adapt and split into files for production.

README (short):
 - Palette tokens, accessibility toggles, and export function included.
 - Use Stage.toDataURL() on Konva Stage to export poster as PNG.
 - Respect prefers-reduced-motion via useReducedMotion.

*/

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Stage, Layer, Image as KImage, Group, Rect } from 'react-konva';
import useImage from 'use-image';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'; 

import { sortableKeyboardCoordinates, arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

/* ---------- Style tokens (tailwind v4 classes used in JSX) ----------
Tailwind config (suggested additions):
module.exports = {
  theme: {
    extend: {
      colors: {
        parchment: '#E6D7C4',
        ochre: '#C77B3A',
        teal: '#23576A',
        charcoal: '#111318',
        posterRed: '#C92B2B'
      }
    }
  }
}
---------------------------------------------------------------------*/

// Small utility: SVG torn-edge mask component
function TornMask({ id = 'torn', width = 1200, height = 600 }) {
  // Hand-drawn-ish path simplified
  const path = `M0,30 Q40,10 80,40 T160,28 T240,48 T320,30 T400,60 T480,20 T560,55 T640,30 T720,50 T800,10 T880,48 T960,20 T1040,60 T1120,30 L1120 ${height} L0 ${height} Z`;
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <clipPath id={id} clipPathUnits="userSpaceOnUse">
          <path d={path} transform={`scale(${width/1120}, ${height/height})`} />
        </clipPath>
      </defs>
    </svg>
  );
}

/* ---------- Hook: respects prefers-reduced-motion ---------- */
function usePrefersReducedMotion() {
  return useReducedMotion();
}

/* ---------- HERO POSTER (Lead) ---------- */
function HeroPoster({ reducedMotion }) {
  // parallax motion on cursor
  const ref = useRef();
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      setPos({ x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 });
    };
    el.addEventListener('mousemove', handleMove);
    return () => el.removeEventListener('mousemove', handleMove);
  }, [reducedMotion]);

  const parallax = (depth) => ({ x: pos.x * depth * 20, y: pos.y * depth * 16 });

  return (
    <section className="w-full max-w-6xl mx-auto p-6 bg-red-500">
      <TornMask id="hero-torn" width={1200} height={420} />
      <div ref={ref} className="relative bg-parchment rounded-xl overflow-hidden" style={{ clipPath: 'url(#torn)' }}>
        {/* Paper Grain overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url('/paper-grain.png')`, mixBlendMode: 'multiply', opacity: 0.18 }} />

        <div className="relative grid grid-cols-12 gap-4 items-center p-8">
          <motion.div className="col-span-5 rounded-md overflow-hidden shadow-lg" animate={{ x: parallax(1).x, y: parallax(1).y }} transition={{ type: 'spring', stiffness: 80 }}>
            <div className="h-96 bg-cover bg-center" style={{ backgroundImage: `url('/portrait-placeholder.jpg')` }} />
            {/* sticker badge */}
            <div className="absolute left-10 top-6 -translate-y-1/2">
              <div className="inline-block border-2 border-white rounded-full px-3 py-1 text-xs font-mono bg-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">INVESTIGATE</div>
            </div>
          </motion.div>

          <motion.div className="col-span-7 p-6" animate={{ x: parallax(0.6).x, y: parallax(0.6).y }}>
            <h1 className="font-condensed text-6xl text-charcoal leading-tight tracking-tight">THE HUNT IS ON</h1>
            <p className="mt-4 text-sm font-mono">A gritty collection of leads, whispers and found artifacts. Treat each card like a poster — collect them.</p>

            {/* Vinyl headline block */}
            <div className="mt-6 inline-block bg-charcoal text-white px-6 py-3 font-bold text-xl rounded-sm shadow-sm select-none">VINYL HEADLINE</div>

            {/* CTA with rip reveal — simulated using mask scale */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="mt-6 inline-block px-5 py-3 bg-posterRed text-black font-bold uppercase rounded-sm"
              aria-label="Rip open the case"
              >
              Rip the Case
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------- COMPENDIUM GRID (draggable sortable cards) ---------- */
function CompendiumGrid({ reducedMotion }) {
  const [items, setItems] = useState(() => Array.from({ length: 6 }, (_, i) => ({ id: `item-${i}`, title: `Artifact ${i + 1}`, flipped: false })));
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event) {
    // this is placeholder: integrate @dnd-kit/sortable for reordering in production
    // For brevity we won't implement full sortable here
  }

  function toggleFlip(id) {
    setItems((s) => s.map(it => it.id === id ? { ...it, flipped: !it.flipped } : it));
  }

  return (
    <section className="max-w-6xl mx-auto p-6">
      <h2 className="font-condensed text-3xl text-charcoal mb-4">Compendium</h2>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-3 gap-6">
            {items.map((it, idx) => (
              <div key={it.id} className="relative p-4 bg-parchment rounded-lg shadow-md transform transition-transform hover:-translate-y-1 hover:scale-[1.01]" role="group">
                <div className="h-48 bg-white rounded-sm overflow-hidden" style={{ backgroundImage: `url('/paper-grain.png')`, backgroundBlendMode: 'multiply', backgroundSize: 'cover' }}>
                  {/* torn-edge visual via SVG edge */}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{it.title}</h3>
                    <p className=" font-mono text-sm text-charcoal/70">Lead: anonymous</p>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => toggleFlip(it.id)} className="px-3 py-1 bg-ochre text-white rounded-sm text-sm">Flip</button>
                    <button className="px-3 py-1 bg-teal text-white rounded-sm text-sm">Pin</button>
                  </div>
                </div>

                {/* flip state overlay */}
                {it.flipped && (
                  <div className="absolute inset-0 bg-white/95 p-4 grid place-items-center">
                    <div className="text-sm font-mono">Detailed notes & quotes</div>
                    <button onClick={() => toggleFlip(it.id)} className="mt-4 px-3 py-1 bg-posterRed text-white rounded-sm">Close</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

/* ---------- STICKER EDITOR (Konva canvas, left palette, right properties) ---------- */
function StickerEditor({ reducedMotion }) {
  const stageRef = useRef();
  const [stickers, setStickers] = useState([
    { id: 's-1', src: '/sticker-star.png', x: 80, y: 80, scale: 0.9, rotation: -6 },
    { id: 's-2', src: '/sticker-eye.png', x: 220, y: 120, scale: 1.1, rotation: 8 }
  ]);
  const [selected, setSelected] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    function onResize() {
      const w = Math.min(1100, window.innerWidth - 160);
      setCanvasSize({ width: w, height: Math.round(w * 0.7) });
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function addSticker(src) {
    setStickers(s => [...s, { id: `s-${Date.now()}`, src, x: 60 + s.length * 40, y: 60 + s.length * 30, scale: 1, rotation: 0 }]);
  }

  function exportPNG() {
    // Use Konva Stage export
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = 'poster.png';
    link.href = uri;
    link.click();
  }

  return (
    <section className="max-w-6xl mx-auto p-6">
      <h2 className="font-condensed text-3xl text-charcoal mb-4">Sticker Editor</h2>
      <div className="grid grid-cols-12 gap-4">
        {/* Palette */}
        <div className="col-span-2 bg-white p-3 rounded-md shadow-inner">
          <div className="space-y-3">
            <button onClick={() => addSticker('/sticker-star.png')} className="w-full py-2 bg-ochre text-white rounded">Add Star</button>
            <button onClick={() => addSticker('/sticker-eye.png')} className="w-full py-2 bg-teal text-white rounded">Add Eye</button>
            <button onClick={() => addSticker('/sticker-pin.png')} className="w-full py-2 bg-charcoal text-white rounded">Add Pin</button>
          </div>
        </div>

        {/* Canvas */}
        <div className="col-span-8 bg-parchment rounded-md p-2 flex justify-center items-center">
          <div className="relative">
            <Stage width={canvasSize.width} height={canvasSize.height} ref={stageRef} style={{ backgroundColor: '#f6efe6' }}>
              <Layer>
                {/* background paper texture */}
                <Rect x={0} y={0} width={canvasSize.width} height={canvasSize.height} fillPatternImage={null} />

                {stickers.map((s) => (
                  <Sticker key={s.id} sticker={s} onChange={(upd) => setStickers(prev => prev.map(p => p.id === s.id ? { ...p, ...upd } : p))} onSelect={() => setSelected(s.id)} selected={selected === s.id} reducedMotion={reducedMotion} />
                ))}
              </Layer>
            </Stage>

            {/* export button */}
            <div className="absolute right-4 bottom-4">
              <button onClick={exportPNG} className="px-4 py-2 bg-posterRed text-white rounded">Export PNG</button>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="col-span-2 bg-white p-3 rounded-md shadow-inner">
          <h4 className="font-bold">Properties</h4>
          {selected ? (
            <div className="mt-3">
              <p className="text-sm font-mono">Selected: {selected}</p>
              {/* sliders and inputs could go here */}
              <p className="mt-2 text-xs">Use mouse to drag / rotate stickers. Tap on a sticker to select.</p>
            </div>
          ) : (
            <p className="mt-3 text-xs">Select a sticker to edit properties.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Sticker({ sticker, onChange, onSelect, selected, reducedMotion }) {
  const [img] = useImage(sticker.src);
  const shapeRef = useRef();

  // interactive handlers
  function handleDragEnd(e) {
    onChange({ x: e.target.x(), y: e.target.y() });
  }

  function handleTransformEnd(e) {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    // reset scale to 1, update size with scale factor
    node.scaleX(1);
    node.scaleY(1);
    onChange({ x: node.x(), y: node.y(), scale: (scaleX + scaleY) / 2, rotation: node.rotation() });
  }

  return (
    <Group x={sticker.x} y={sticker.y} draggable onDragEnd={handleDragEnd} onClick={onSelect} onTap={onSelect}>
      {/* adhesive shadow: white stroke + drop shadow simulated with two rects */}
      <KImage image={img} width={80 * (sticker.scale || 1)} height={80 * (sticker.scale || 1)} offsetX={40 * (sticker.scale || 1)} offsetY={40 * (sticker.scale || 1)} rotation={sticker.rotation} ref={shapeRef} />
    </Group>
  );
}

/* ---------- MAIN APP (default export) ---------- */
export default function App() {
  const reduceMotion = usePrefersReducedMotion();
  const [flatTheme, setFlatTheme] = useState(false);

  return (
    <div className={`min-h-screen bg-[color:var(--bg,#fff)] text-charcoal`}>
      <header className="p-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-charcoal text-white grid place-items-center font-bold">G</div>
          <div>
            <div className="text-xs font-mono">Gritty Collage</div>
            <div className="font-condensed text-lg">Investigative Hub</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={flatTheme} onChange={(e) => setFlatTheme(e.target.checked)} /> Flat theme
          </label>
          <button className="px-3 py-1 bg-ochre text-white rounded">Sign In</button>
        </div>
      </header>

      <main>
        <HeroPoster reducedMotion={reduceMotion} />
        <CompendiumGrid reducedMotion={reduceMotion} />
        <StickerEditor reducedMotion={reduceMotion} />
      </main>

      <footer className="p-6 text-center text-xs text-charcoal/70">Tactile, collage-inspired UI system — prototype</footer>
    </div>
  );
}

/* EOF */
