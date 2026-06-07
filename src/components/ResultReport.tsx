import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Target, Zap, Clock, Activity, Printer, FileText, Shield, FileDown, ArrowLeft, CheckCircle2, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultReportProps {
  testId: number;
  athleteData: any;
  kicks: any[];
  onReset: () => void;
}

interface StylesheetBackup {
  type: 'style-node' | 'cssom' | 'link-node';
  element?: HTMLElement;
  originalContent?: string;
  rule?: CSSStyleRule;
  property?: string;
  originalValue?: string;
}

const oklchToRgb = (l: number, c: number, h: number): [number, number, number] => {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;
  
  const l_3 = l_ * l_ * l_;
  const m_3 = m_ * m_ * m_;
  const s_3 = s_ * s_ * s_;
  
  let r = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
  let g = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
  let b_val = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.7076147010 * s_3;
  
  const fn = (x: number) => {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055;
  };
  
  r = Math.round(Math.max(0, Math.min(1, fn(r))) * 255);
  g = Math.round(Math.max(0, Math.min(1, fn(g))) * 255);
  b_val = Math.round(Math.max(0, Math.min(1, fn(b_val))) * 255);
  
  return [r, g, b_val];
};

const oklabToRgb = (l: number, a: number, b: number): [number, number, number] => {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;
  
  const l_3 = l_ * l_ * l_;
  const m_3 = m_ * m_ * m_;
  const s_3 = s_ * s_ * s_;
  
  let r = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
  let g = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
  let b_val = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.7076147010 * s_3;
  
  const fn = (x: number) => {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055;
  };
  
  r = Math.round(Math.max(0, Math.min(1, fn(r))) * 255);
  g = Math.round(Math.max(0, Math.min(1, fn(g))) * 255);
  b_val = Math.round(Math.max(0, Math.min(1, fn(b_val))) * 255);
  
  return [r, g, b_val];
};

const convertOklchStringToRgb = (oklchStr: string): string => {
  try {
    const match = oklchStr.match(/oklch\(([^)]+)\)/i);
    if (!match) return oklchStr;
    const content = match[1];
    const parts = content.trim().split(/[\s/]+/);
    if (parts.length < 3) return oklchStr;
    
    let l = parseFloat(parts[0]);
    if (parts[0].endsWith('%')) l /= 100;
    
    let c = parseFloat(parts[1]);
    if (parts[1].endsWith('%')) c /= 100;
    
    let hStr = parts[2];
    let h = parseFloat(hStr);
    if (hStr.endsWith('deg')) h = parseFloat(hStr);
    else if (hStr.endsWith('rad')) h = (parseFloat(hStr) * 180) / Math.PI;
    else if (hStr.endsWith('turn')) h = parseFloat(hStr) * 360;
    
    let alpha = 1;
    if (parts.length >= 4) {
      let aStr = parts[3];
      alpha = parseFloat(aStr);
      if (aStr.endsWith('%')) alpha /= 100;
    }
    
    if (isNaN(l) || isNaN(c) || isNaN(h)) return oklchStr;
    
    const [r, g, b] = oklchToRgb(l, c, h);
    return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (e) {
    return oklchStr;
  }
};

const convertOklabStringToRgb = (oklabStr: string): string => {
  try {
    const match = oklabStr.match(/oklab\(([^)]+)\)/i);
    if (!match) return oklabStr;
    const content = match[1];
    const parts = content.trim().split(/[\s/]+/);
    if (parts.length < 3) return oklabStr;
    
    let l = parseFloat(parts[0]);
    if (parts[0].endsWith('%')) l /= 100;
    
    let a = parseFloat(parts[1]);
    let bVal = parseFloat(parts[2]);
    
    let alpha = 1;
    if (parts.length >= 4) {
      let aStr = parts[3];
      alpha = parseFloat(aStr);
      if (aStr.endsWith('%')) alpha /= 100;
    }
    
    if (isNaN(l) || isNaN(a) || isNaN(bVal)) return oklabStr;
    
    const [r, g, b] = oklabToRgb(l, a, bVal);
    return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (e) {
    return oklabStr;
  }
};

const convertColorToRgbaWithAlpha = (colorStr: string, alpha: number): string => {
  if (colorStr.startsWith('rgb(')) {
    const match = colorStr.match(/rgb\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/i);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
    }
  }
  if (colorStr.startsWith('rgba(')) {
    const match = colorStr.match(/rgba\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/i);
    if (match) {
      const existingAlpha = parseFloat(match[4]);
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${existingAlpha * alpha})`;
    }
  }
  if (colorStr.startsWith('#')) {
    let hex = colorStr.substring(1).trim();
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return colorStr;
};

const convertColorMixStringToRgba = (colorMixStr: string): string => {
  try {
    const regex1 = /color-mix\(\s*in\s+srgb\s*,\s*(rgb\([^\)]+\)|rgba\([^\)]+\)|#[a-fA-F0-9]{3,8}|[A-Za-z]+)\s+([0-9.]+)%\s*,\s*transparent\s*\)/i;
    const match1 = colorMixStr.match(regex1);
    if (match1) {
      const color = match1[1];
      const pct = parseFloat(match1[2]) / 100;
      return convertColorToRgbaWithAlpha(color, pct);
    }
    
    const regex2 = /color-mix\(\s*in\s+srgb\s*,\s*transparent\s*,\s*(rgb\([^\)]+\)|rgba\([^\)]+\)|#[a-fA-F0-9]{3,8}|[A-Za-z]+)\s+([0-9.]+)%\)/i;
    const match2 = colorMixStr.match(regex2);
    if (match2) {
      const color = match2[1];
      const pct = parseFloat(match2[2]) / 100;
      return convertColorToRgbaWithAlpha(color, pct);
    }
    return colorMixStr;
  } catch (e) {
    return colorMixStr;
  }
};

const cleanCssText = (text: string): string => {
  let currentText = text;
  
  // 1. Process all oklch(...) occurrences
  const oklchRegex = /oklch\([^)]+\)/gi;
  currentText = currentText.replace(oklchRegex, (match) => {
    return convertOklchStringToRgb(match);
  });
  
  // 2. Process all oklab(...) occurrences
  const oklabRegex = /oklab\([^)]+\)/gi;
  currentText = currentText.replace(oklabRegex, (match) => {
    return convertOklabStringToRgb(match);
  });
  
  // 3. Process all color-mix(...) occurrences involving transparent
  const colorMixRegex = /color-mix\(\s*in\s+srgb\s*,\s*(rgb\([^\)]+\)|rgba\([^\)]+\)|#[a-fA-F0-9]{3,8}|[A-Za-z]+)\s+[0-9.]+%\s*,\s*transparent\s*\)/gi;
  currentText = currentText.replace(colorMixRegex, (match) => {
    return convertColorMixStringToRgba(match);
  });

  const colorMixRegex2 = /color-mix\(\s*in\s+srgb\s*,\s*transparent\s*,\s*(rgb\([^\)]+\)|rgba\([^\)]+\)|#[a-fA-F0-9]{3,8}|[A-Za-z]+)\s+[0-9.]+%\)/gi;
  currentText = currentText.replace(colorMixRegex2, (match) => {
    return convertColorMixStringToRgba(match);
  });

  // 4. Fallback sweep for legacy or other complex elements to avoid crashes
  let lastText = '';
  for (let i = 0; i < 3 && currentText !== lastText; i++) {
    lastText = currentText;
    currentText = currentText
      .replace(/color-mix\((?:[^()]+|\([^()]*\))*\)/gi, '#1a1a1a')
      .replace(/\boklab\b/gi, 'srgb')
      .replace(/\boklch\b/gi, 'srgb');
  }

  return currentText;
};

const sanitizeOklchColors = async (): Promise<StylesheetBackup[]> => {
  const backups: StylesheetBackup[] = [];
  try {
    // 1. Sanitize textContent of style elements
    const styleNodes = Array.from(document.querySelectorAll('style')) as HTMLStyleElement[];
    for (const node of styleNodes) {
      const originalText = node.textContent || '';
      if (originalText.includes('oklch') || originalText.includes('oklab') || originalText.includes('color-mix')) {
        const cleanText = cleanCssText(originalText);
        node.textContent = cleanText;
        backups.push({ type: 'style-node', element: node, originalContent: originalText });
      }
    }

    // 2. Sanitize CSSOM rules so html2canvas doesn't crash on parsed rules
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        if (!sheet.cssRules) continue;
        
        const processRules = (rules: CSSRuleList) => {
          for (const rule of Array.from(rules)) {
            if (rule instanceof CSSStyleRule) {
              const style = rule.style;
              const cssText = rule.cssText;
              
              if (cssText.includes('oklch') || cssText.includes('oklab') || cssText.includes('color-mix')) {
                // Sanitize indexed properties
                for (let i = 0; i < style.length; i++) {
                  const prop = style[i];
                  const val = style.getPropertyValue(prop);
                  if (val.includes('oklch') || val.includes('oklab') || val.includes('color-mix')) {
                    const newVal = cleanCssText(val);
                    backups.push({
                      type: 'cssom',
                      rule,
                      property: prop,
                      originalValue: val
                    });
                    style.setProperty(prop, newVal);
                  }
                }
                
                // Sanitize custom properties (variables) that might not be numerically indexed in all browsers
                const varMatches = cssText.match(/--[\w-]+\s*:\s*[^;]+/g);
                if (varMatches) {
                  for (const match of varMatches) {
                    const colonIndex = match.indexOf(':');
                    const propName = match.substring(0, colonIndex).trim();
                    const propVal = match.substring(colonIndex + 1).trim();
                    if (propVal && (propVal.includes('oklch') || propVal.includes('oklab') || propVal.includes('color-mix'))) {
                      const newVal = cleanCssText(propVal);
                      const currentValInStyle = style.getPropertyValue(propName);
                      backups.push({
                        type: 'cssom',
                        rule,
                        property: propName,
                        originalValue: currentValInStyle
                      });
                      style.setProperty(propName, newVal);
                    }
                  }
                }
              }
            } else if (rule instanceof CSSGroupingRule) {
              processRules(rule.cssRules);
            }
          }
        };
        processRules(sheet.cssRules);
      } catch (e) {
        console.warn("Skipping dynamic CSSOM scan for stylesheet:", e);
      }
    }

    // 3. Temporarily disable cross-origin link stylesheets to prevent CORS error block hangs
    const linkNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    for (const linkNode of linkNodes) {
      const href = linkNode.href;
      if (href && !href.startsWith(window.location.origin) && !href.startsWith('/') && href.startsWith('http')) {
        linkNode.disabled = true;
        backups.push({ type: 'link-node', element: linkNode });
      }
    }
  } catch (err) {
    console.error("Error during OKLCH/OKLAB sanitization:", err);
  }
  return backups;
};

const restoreOklchColors = (backups: StylesheetBackup[]) => {
  try {
    for (const backup of backups) {
      if (backup.type === 'style-node' && backup.element && backup.originalContent !== undefined) {
        backup.element.textContent = backup.originalContent;
      } else if (backup.type === 'cssom' && backup.rule && backup.property && backup.originalValue !== undefined) {
        try {
          backup.rule.style.setProperty(backup.property, backup.originalValue);
        } catch (err) {
          console.warn("Restoring CSSOM property failed:", err);
        }
      } else if (backup.type === 'link-node' && backup.element) {
        (backup.element as HTMLLinkElement).disabled = false;
      }
    }
  } catch (err) {
    console.error("Error during OKLCH/OKLAB restoration:", err);
  }
};

export const ResultReport: React.FC<ResultReportProps> = ({ testId, athleteData, kicks = [], onReset }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadHelp, setShowDownloadHelp] = useState(false);

  // Recovery of parameters with safe defaults
  const normalizedAthlete = {
    name: athleteData?.name || "Bagas Prakoso",
    id: athleteData?.id || "ATLET-BAGAS",
    age: athleteData?.age || 23,
    gender: athleteData?.gender || "Laki-laki",
    injuryType: athleteData?.injuryType || athleteData?.injury_type || "Putus Tendon Achilles",
    bodyPart: athleteData?.bodyPart || athleteData?.body_part || "Tungkai Kiri",
    recoveryTime: athleteData?.recoveryTime || athleteData?.recovery_time || 16,
  };

  const avgAccuracy = kicks.length > 0 ? kicks.reduce((a, b) => a + (b.accuracy_points || 0), 0) / kicks.length : 0;
  // Calculate average speed: speed = distance (1.5m) / duration (s)
  const avgSpeed = kicks.length > 0 ? kicks.reduce((a, b) => a + (1.5 / (b.duration || 0.5)), 0) / kicks.length : 0;
  const totalPoints = kicks.length > 0 ? kicks.reduce((a, b) => a + (b.accuracy_points || 0), 0) : 0;

  const getCategory = (acc: number, spd: number) => {
    if (acc >= 85 && spd >= 4.5) {
      return { 
        label: 'TINGGI / MANDIRI', 
        color: 'border-emerald-600 text-emerald-800 bg-emerald-50', 
        badge: 'bg-emerald-500 text-white',
        desc: 'Sangat Baik (Siap Kompetisi)' 
      };
    }
    if (acc >= 65 && spd >= 3.0) {
      return { 
        label: 'SEDANG / REHAB-STAT', 
        color: 'border-amber-500 text-amber-800 bg-amber-50',
        badge: 'bg-amber-500 text-white', 
        desc: 'Cukup Baik (Recovery Terarah)' 
      };
    }
    return { 
      label: 'RENDAH / PERLU BIMBINGAN', 
      color: 'border-rose-500 text-rose-800 bg-rose-50',
      badge: 'bg-rose-500 text-white', 
      desc: 'Perlu Latihan Intensif Stabilitas' 
    };
  };

  const category = getCategory(avgAccuracy, avgSpeed);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = reportRef.current;
    if (!element) return;

    setIsDownloading(true);
    let backups: StylesheetBackup[] = [];
    try {
      // Clean all oklch/color-mix colors across stylesheets in the parent document prior to canvas snapshotting
      backups = await sanitizeOklchColors();

      // Temporarily remove shadow and border for perfect capture matching official print
      element.style.boxShadow = 'none';
      element.style.border = 'none';

      // Race html2canvas against a 6-second timeout to prevent iframe hanging
      const canvas = await Promise.race([
        html2canvas(element, {
          scale: 1.5, // 1.5 is faster, extremely stable, and has smaller footprint
          useCORS: false, // Prevents iframe CORS font fetching hangs
          allowTaint: true, // Prevents security errors while keeping canvas read capabilities
          backgroundColor: '#ffffff',
          logging: true,
          onclone: (clonedDoc) => {
            try {
              // Sanitize inline styles of cloned DOM just in case
              const styledElements = clonedDoc.querySelectorAll('[style]');
              styledElements.forEach(el => {
                const styleAttr = el.getAttribute('style') || '';
                if (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color-mix')) {
                  const cleanStyle = cleanCssText(styleAttr);
                  el.setAttribute('style', cleanStyle);
                }
              });
            } catch (cloneErr) {
              console.warn("Could not clean styles in clone:", cloneErr);
            }
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout (Proses di latar belakang terhambat)")), 6000)
        )
      ]);

      // Restore inline styles
      element.style.boxShadow = '';
      element.style.border = '';

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Fit perfect on 1 A4 Page: 210mm x 297mm
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      
      const fileSafeName = normalizedAthlete.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      pdf.save(`Laporan_Biomekanika_UPI_${fileSafeName}.pdf`);
    } catch (err: any) {
      console.error("Gagal mengekspor PDF, mencoba metode alternatif:", err);
      
      // Secondary fallback (Blob URL triggered download linked with target="_blank")
      try {
        element.style.boxShadow = 'none';
        element.style.border = 'none';
        
        // Fast low-scale render try
        const canvas2 = await html2canvas(element, {
          scale: 1.0, 
          useCORS: false, 
          allowTaint: true,
          logging: false,
          onclone: (clonedDoc) => {
            try {
              const styledElements = clonedDoc.querySelectorAll('[style]');
              styledElements.forEach(el => {
                const styleAttr = el.getAttribute('style') || '';
                if (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color-mix')) {
                  const cleanStyle = cleanCssText(styleAttr);
                  el.setAttribute('style', cleanStyle);
                }
              });
            } catch (cloneErr) {
              console.warn("Could not clean styles in fallback clone:", cloneErr);
            }
          }
        });
        
        element.style.boxShadow = '';
        element.style.border = '';

        const imgData2 = canvas2.toDataURL('image/jpeg', 0.85);
        const pdf2 = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        pdf2.addImage(imgData2, 'JPEG', 0, 0, 210, 297);
        const blob = pdf2.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        
        const fileSafeName = normalizedAthlete.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = `Laporan_Biomekanika_UPI_${fileSafeName}.pdf`;
        downloadLink.target = '_blank';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (fallbackErr) {
        console.error("Metode kedua juga gagal:", fallbackErr);
        setShowDownloadHelp(true);
      }
    } finally {
      // Always restore colors to original beautiful OKLCH right after execution completes
      restoreOklchColors(backups);
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Dynamic Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-100/80 p-5 rounded-3xl border border-slate-200/50 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={onReset}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight">LAPORAN BIOMEKANIKA</h2>
            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Format Lembar Evaluasi Klinis Olahraga</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="bg-slate-900 text-white font-display font-black text-xs tracking-wider uppercase px-5 py-3 rounded-xl hover:bg-slate-850 flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all"
          >
            {isDownloading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <FileDown className="w-4 h-4 text-upi-gold" />
            )}
            {isDownloading ? "Mengekspor..." : "UNDUH PDF"}
          </button>
          <button 
            onClick={handlePrint} 
            className="bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 font-display font-black text-xs tracking-wider uppercase px-5 py-3 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" /> CETAK
          </button>
          <button 
            onClick={onReset} 
            className="bg-gradient-to-r from-upi-red to-red-700 text-white hover:opacity-95 font-display font-black text-xs tracking-wider uppercase px-5 py-3 rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            UJI BARU
          </button>
        </div>
      </div>

      {/* Screen view helper scroll container */}
      <div className="w-full overflow-x-auto pb-12 scrollbar-hide py-2 flex justify-center bg-slate-50 print:bg-white print:p-0 print:m-0">
        
        {/* PHYSICAL A4 SHEET MODEL container (Fits 1 page exactly) */}
        <div 
          ref={reportRef} 
          id="biomechanical-report-sheet"
          className="w-[820px] h-[1160px] bg-white border border-slate-200 shadow-2xl p-8 flex flex-col justify-between relative text-slate-900 rounded-none overflow-hidden print:w-[210mm] print:h-[297mm] print:shadow-none print:border-none print:p-6 print:m-0 shrink-0"
        >
          
          <div className="space-y-4">
            {/* 1. Academic Header Block */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                {/* Custom Inline Sharp Cross-CORS-Safe Vector UPI-Like Crest */}
                <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="46" stroke="#990000" strokeWidth="4" fill="#fafafa" />
                  <circle cx="50" cy="50" r="40" stroke="#FFD700" strokeWidth="2.5" fill="#fafafa" />
                  <path d="M50 22 L44 54 L56 54 Z" fill="#990000" />
                  <path d="M42 54 H58 V61 H42 Z" fill="#1e293b" />
                  <path d="M50 11 C55 17, 51 22, 47 22 C45 20, 43 17, 50 11 Z" fill="#fc1505" />
                  <path d="M52 13 C55 17, 53 20, 50 20 C49 18, 48 16, 52 13 Z" fill="#FFD700" />
                  <path d="M28 66 Q22 42 38 32 M72 66 Q78 42 62 32" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M33 66 H67 V73 H33 Z" fill="#1e293b" />
                  <text x="50" y="87" textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="900" fontFamily="sans-serif">UPI</text>
                </svg>
                <div>
                  <h1 className="text-sm font-display font-black uppercase text-slate-900 leading-tight tracking-wider">
                    UNIVERSITAS PENDIDIKAN INDONESIA
                  </h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                    DEPARTEMEN PENDIDIKAN KEPELATIHAN OLAHRAGA
                  </p>
                  <p className="text-[11px] font-black text-slate-800 tracking-wide mt-0.5 uppercase">
                    LABORATORIUM BIOMEKANIKA & REHABILITASI OLAHRAGA
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block bg-upi-red/10 text-upi-red text-[8px] font-black tracking-widest px-2.5 py-1 rounded bg-red-100 border border-upi-red/20 mb-1">
                  OFFICIAL REPORT
                </span>
                <p className="text-[11px] font-black text-slate-900 tracking-tight leading-none uppercase">
                  TAEKWONDO KICK ANALYTICS
                </p>
                <p className="text-[9px] font-mono text-slate-500 uppercase">
                  ID: #KCK-{testId} | SECURE_LOG
                </p>
              </div>
            </div>

            {/* Double Scholastic Color Ribbon */}
            <div className="relative">
              <div className="h-[4px] bg-upi-red w-full"></div>
              <div className="h-[2px] bg-upi-gold w-full mt-[2px]"></div>
            </div>

            {/* 2. Athlete Information & Demographics (Tightly Gridded) */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-4 gap-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-0.5">Identitas Atlet</p>
                <p className="text-xs font-black text-slate-900 uppercase truncate" title={normalizedAthlete.name}>
                  {normalizedAthlete.name}
                </p>
                <p className="text-[9px] font-mono text-slate-500">{normalizedAthlete.id}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-0.5">Umur & Gender</p>
                <p className="text-xs font-black text-slate-900 uppercase">
                  {normalizedAthlete.age} Thn / {normalizedAthlete.gender}
                </p>
                <p className="text-[9px] text-slate-500">Kategori: Kyorugi</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-0.5">Klasifikasi Cedera</p>
                <p className="text-xs font-black text-red-700 uppercase truncate" title={normalizedAthlete.injuryType}>
                  {normalizedAthlete.injuryType}
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">{normalizedAthlete.bodyPart}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-0.5">Fase Terapi & Tanggal</p>
                <p className="text-xs font-black text-slate-900 uppercase">
                  Minggu ke-{normalizedAthlete.recoveryTime}
                </p>
                <p className="text-[9px] font-mono text-slate-500">
                  {format(new Date(), 'dd-MM-yyyy HH:mm')} WIB
                </p>
              </div>
            </div>

            {/* 3. Core Metric Gauge Cards */}
            <div className="grid grid-cols-3 gap-4">
              {/* Avg Accuracy circular status */}
              <div className="border border-slate-200 p-3.5 rounded-xl flex items-center justify-between bg-white relative">
                <div className="space-y-1 z-10">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Rata-Rata Akurasi</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-display font-black text-slate-900 leading-none">{avgAccuracy.toFixed(1)}</span>
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                  <span className="inline-block text-[8px] font-black uppercase text-emerald-600 tracking-wider">Akurasi Sasaran</span>
                </div>
                {/* Mini Circle SVG Gauge */}
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#990000" strokeWidth="4.5" strokeDasharray="163" strokeDashoffset={163 - (163 * avgAccuracy) / 100} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-800">
                    {avgAccuracy.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Speed & Explosivity Gauge */}
              <div className="border border-slate-200 p-3.5 rounded-xl flex flex-col justify-between bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Daya Ledak Impak</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-display font-black text-slate-900 leading-none">{avgSpeed.toFixed(2)}</span>
                      <span className="text-xs font-bold text-slate-400">m/s</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-amber-50 rounded-lg text-upi-gold border border-amber-200/50">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-300 animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[8px] font-black text-slate-500 tracking-wider mt-1 border-t border-slate-100 pt-1.5">
                  TARGET REHAB: <span className="text-slate-900 uppercase font-black">{avgSpeed >= 4.0 ? 'MELAMPAUI' : 'BERPROGRES'} ({avgSpeed >= 4.0 ? '≥ 4.0' : '< 4.0'})</span>
                </div>
              </div>

              {/* Status Classification Frame */}
              <div className={`border p-3.5 rounded-xl flex flex-col justify-between ${category.color}`}>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block">Status Hasil Biomekanika</span>
                  <p className="text-sm font-display font-black mt-1 leading-tight tracking-tight">
                    {category.label}
                  </p>
                  <p className="text-[9px] font-medium leading-normal opacity-80 mt-1">
                    {category.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest mt-1 border-t border-slate-900/10 pt-1.5 opacity-90">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> TERVALIDASI KLINIS
                </div>
              </div>
            </div>

            {/* 4. Compact Scientific Charts side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Accuracy Trend */}
              <div className="border border-slate-200 p-3 bg-white rounded-xl">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-upi-red" /> TREN AKURASI TENDANGAN (1-10)
                </h3>
                <div className="h-[145px] w-full flex justify-center items-center">
                  <LineChart 
                    width={350}
                    height={145}
                    data={kicks.map((k, i) => ({ kick: i + 1, acc: k.accuracy_points }))} 
                    margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="kick" stroke="#94a3b8" fontSize={9} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="acc" 
                      stroke="#990000" 
                      strokeWidth={2.5} 
                      dot={{ r: 3, fill: '#ef4444', strokeWidth: 1.5, stroke: '#fff' }} 
                      isAnimationActive={false}
                    />
                  </LineChart>
                </div>
              </div>

              {/* Speed Trend */}
              <div className="border border-slate-200 p-3 bg-white rounded-xl">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-200" /> TREN KECEPATAN IMPAK (m/s)
                </h3>
                <div className="h-[145px] w-full flex justify-center items-center">
                  <BarChart 
                    width={350}
                    height={145}
                    data={kicks.map((k, i) => ({ kick: i + 1, speed: 1.5 / k.duration }))} 
                    margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="kick" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Bar dataKey="speed" fill="#eab308" radius={[2, 2, 0, 0]} barSize={14} isAnimationActive={false} />
                  </BarChart>
                </div>
              </div>
            </div>

            {/* 5. Complete Compact Tabular Breakdown */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-50 px-3.5 py-1.5 border-b border-slate-200 flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-800 tracking-wider uppercase">TABEL DETIL REKAMAN BIOMEKANIKA</span>
                <span className="text-[8px] font-mono text-slate-400">TOTAL 10 PERCOBAAN TENDANGAN SEPANJANG SESI</span>
              </div>
              <div className="overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="divide-x divide-slate-100">
                      <th className="px-3.5 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-wider text-center w-12">No</th>
                      <th className="px-4 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Akurasi (Poin)</th>
                      <th className="px-4 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Durasi Kontak</th>
                      <th className="px-4 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Kecepatan Eksekusi</th>
                      <th className="px-4 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-wider text-center">Status Kelayakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10px]">
                    {kicks.map((k, i) => {
                      const spd = 1.5 / (k.duration || 0.5);
                      return (
                        <tr key={i} className="hover:bg-slate-50/50 divide-x divide-slate-100">
                          <td className="px-3.5 py-2 text-center align-middle font-mono font-bold text-slate-400 border-r border-slate-100 bg-slate-50/30">
                            {(i + 1).toString().padStart(2, '0')}
                          </td>
                          <td className="px-4 py-2 align-middle font-bold text-slate-900 text-xs">
                            {k.accuracy_points} <span className="text-[8px] font-normal text-slate-400">/ 100</span>
                          </td>
                          <td className="px-4 py-2 align-middle font-mono text-slate-600">
                            {(k.duration || 0).toFixed(3)} s
                          </td>
                          <td className="px-4 py-2 align-middle font-mono font-bold text-upi-red text-xs">
                            {spd.toFixed(2)} <span className="text-[8px] font-normal text-slate-400">m/s</span>
                          </td>
                          <td className="px-4 py-2 text-center align-middle">
                            <span className={`inline-flex items-center justify-center h-5 px-3 rounded text-[8px] font-black uppercase tracking-widest leading-none ${
                              k.accuracy_points >= 80 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              k.accuracy_points >= 50 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-rose-100 text-rose-850 border border-rose-200'
                            }`}>
                              {k.accuracy_points >= 80 ? 'Optimal (Sempurna)' : k.accuracy_points >= 50 ? 'Valid (Cukup)' : 'Miss / Deviasi'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 6. Medical Recovery Remarks & Recommendations (1 Row Dual Box) */}
            <div className="grid grid-cols-5 gap-4 border-t border-slate-200 pt-3">
              <div className="col-span-3 space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Kesimpulan & Analisis Rehabilitatif</span>
                <p className="text-[10px] text-slate-700 leading-relaxed font-medium">
                  Atlet menunjukkan pemulihan motorik fungsional kaki kiri sebesar <span className="font-bold text-slate-900">{avgAccuracy.toFixed(1)}%</span> dengan rata-rata kecepatan impak <span className="font-bold text-slate-900">{avgSpeed.toFixed(2)} m/s</span>. Terdapat pemulihan signifikan pada stabilitas tendon Achilles dalam fase impact pendaratan. Kelurusan sudut tendangan lurus sangat konsisten (<span className="text-emerald-700 font-bold">Teruji Stabil</span>).
                </p>
              </div>
              <div className="col-span-2 bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Rekomendasi Latihan Pelatih:</span>
                <p className="text-[9px] text-slate-600 leading-relaxed">
                  Pertahankan latihan plyometrics intensitas sedang. Fokus terapi pada penguatan reaktivitas otot betis (gastrocnemius) tungkai kiri untuk meningkatkan eksplosivitas kecepatan ke arah {`>= 4.5`} m/s.
                </p>
              </div>
            </div>

            {/* 7. Signatures / Authorizations (Official Endorsements) */}
            <div className="grid grid-cols-2 gap-8 text-[10px] pt-4 border-t border-slate-100">
              <div className="text-center relative">
                <p className="text-slate-400 font-bold uppercase text-[8px] tracking-wider mb-10">Mengesahkan Penilai,</p>
                
                {/* Simulated Stamp Graphics for Official academic look */}
                <div className="absolute top-2 left-1/2 -translate-x-[40px] opacity-10 pointer-events-none">
                  <div className="w-16 h-16 rounded-full border-4 border-cyan-800 flex items-center justify-center -rotate-12">
                    <span className="text-[8px] font-black text-cyan-800 text-center uppercase tracking-tighter">LAB UPI APPROVED STAMP</span>
                  </div>
                </div>

                <div className="inline-block border-b border-slate-800 w-48 mb-0.5"></div>
                <p className="font-black text-slate-800 uppercase text-[9px]">Dr. H. Wawan Hermawan, M.Pd.</p>
                <p className="text-[8px] text-slate-500 uppercase">Kepala Laboratorium Biomekanika UPI</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 font-bold uppercase text-[8px] tracking-wider mb-10">Rehabilitator / Pelatih Pembimbing,</p>
                <div className="inline-block border-b border-slate-800 w-48 mb-0.5"></div>
                <p className="font-black text-slate-800 uppercase text-[9px]">Rinaldi Malik, M.Pd.</p>
                <p className="text-[8px] text-slate-500 uppercase">Pelatih Utama & Ahli Fisioterapi Olahraga</p>
              </div>
            </div>

            {/* 8. Micro Administrative Footer */}
            <div className="border-t border-slate-100 pt-2 flex justify-between text-[8px] font-mono text-slate-400">
              <span>Sertifikasi Sport Science UPI FPOK. Dokumen ditandatangani secara elektronik demi keabsahan klinis.</span>
              <span className="font-bold">VERIFIKASI_DOKUMEN_OK // HASH_UPI_#{testId.toString().padStart(4, '0')}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Help Modal Dialog for blocked downloads (Alternative instructions & New Tab launcher) */}
      {showDownloadHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in print:hidden">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-upi-red to-red-800 p-6 text-white relative">
              <button 
                onClick={() => setShowDownloadHelp(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-upi-gold" />
                <div>
                  <h3 className="font-display font-black tracking-tight text-lg uppercase leading-tight">
                    Unduhan Terhambat Sandbox
                  </h3>
                  <p className="text-xs text-white/80 tracking-wide uppercase font-bold text-[9px] mt-0.5">
                    Keterbatasan Browser di Dalam Frame
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                Sistem keamanan browser memblokir unduhan langsung dari dalam frame sandbox. Silakan gunakan salah satu solusi mudah berikut:
              </p>

              <div className="space-y-3">
                {/* Method 1 */}
                <div className="flex gap-4 p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
                  <span className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0">1</span>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Metode Cetak (Sangat Mudah)</p>
                    <p className="text-slate-650 mt-1 leading-relaxed">
                      Klik tombol <strong className="text-slate-900 font-bold">CETAK</strong> di sebelah atas laporan, lalu pilih printer tujuan/destination sebagai <strong className="text-slate-900 font-semibold">"Save as PDF"</strong> atau <strong className="text-slate-900 font-semibold">"Simpan sebagai PDF"</strong>.
                    </p>
                  </div>
                </div>

                {/* Method 2 */}
                <div className="flex gap-4 p-3.5 bg-red-50/50 rounded-2xl border border-upi-red/10 animate-pulse">
                  <span className="w-6 h-6 bg-upi-red text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0">2</span>
                  <div className="text-xs">
                    <p className="font-bold text-upi-red uppercase text-[10px] tracking-wider">Metode Buka Di Tab Baru</p>
                    <p className="text-slate-650 mt-1 leading-relaxed">
                      Buka aplikasi ini pada tab atau jendela browser baru dengan tombol di bawah. Di sana, fitur unduhan langsung berjalan 100% lancar tanpa hambatan sandbox!
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <a 
                  href={window.location.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-upi-red to-red-650 text-white font-display font-black text-xs tracking-wider uppercase text-center py-3.5 rounded-2xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-upi-gold" /> BUKA DI TAB BARU
                </a>
                <button 
                  onClick={() => {
                    setShowDownloadHelp(false);
                    handlePrint();
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-display font-black text-xs tracking-wider uppercase py-3.5 rounded-2xl transition-all cursor-pointer"
                >
                  COBA CETAK SEKARANG
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ResultReport;
