import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Trash2,
  Share2,
  Printer,
  AlertCircle,
  Copy,
  Check,
  Award,
  Sun,
  Moon,
  Search,
  Target,
  Package,
  Smile,
  Receipt,
  ShoppingCart,
  Send,
  User,
  Sparkles,
  ArrowRight,
  Home,
  Loader2,
  RotateCcw,
  Zap,
  BarChart2,
  Play,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import { BillingPeriod, ISPPackage } from '../types/customer';
import { MASTER_PACKAGES } from '../data/packages';
import { calculateRevenue } from '../helpers/revenueCalculator';
import { getCurrentTier, getTierProgress } from '../helpers/tierCalculator';
import { formatRupiah } from '../helpers/currency';

export interface SelectedItem {
  id: string;
  packageId?: string;
  name: string;
  speed: string;
  category: string;
  price: number;
  period: BillingPeriod;
  qty: number;
}

interface RevenueCalculatorMainProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const PERIOD_OPTIONS: BillingPeriod[] = ['Bulanan', '3 Bulan', '6 Bulan', 'Tahunan'];
const CATEGORIES = ['Semua', 'Standard', 'SMT', 'Plus TV', 'Oxylite Nov', 'Promo 11.11'];

export const RevenueCalculatorMain: React.FC<RevenueCalculatorMainProps> = ({
  darkMode,
  onToggleDarkMode,
}) => {
  // Navigation View Mode: 'landing' vs 'calculator'
  const [viewMode, setViewMode] = useState<'landing' | 'calculator'>('landing');

  // 1. Sales Rep Info & Goal (Saved to LocalStorage)
  const [salesName, setSalesName] = useState<string>(() => {
    return localStorage.getItem('oxykal_sales_name') || localStorage.getItem('oxycalc_sales_name') || 'Sales Executive';
  });

  const [targetSa, setTargetSa] = useState<number>(() => {
    const saved = localStorage.getItem('oxykal_target_sa') || localStorage.getItem('oxycalc_target_sa');
    return saved ? parseInt(saved, 10) : 15;
  });

  // 2. Draft Selected Packages in Receipt (Struk Kasir)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(() => {
    try {
      const saved = localStorage.getItem('oxykal_selected_items') || localStorage.getItem('oxycalc_selected_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved items from localStorage', e);
    }
    return [];
  });

  // 3. Committed Items for Display Screen (Only updated when user clicks "HITUNG")
  const [committedItems, setCommittedItems] = useState<SelectedItem[]>(() => {
    try {
      const saved = localStorage.getItem('oxykal_committed_items') || localStorage.getItem('oxycalc_committed_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse committed items from localStorage', e);
    }
    return [];
  });

  // Track if HITUNG has been pressed
  const [hasCalculatedOnce, setHasCalculatedOnce] = useState<boolean>(() => {
    return committedItems.length > 0;
  });

  // Active calculation animation states
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calcProgress, setCalcProgress] = useState<number>(0);

  // Save selectedItems & committedItems to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('oxykal_selected_items', JSON.stringify(selectedItems));
    } catch (e) {
      console.error('Failed to save selected items to localStorage', e);
    }
  }, [selectedItems]);

  useEffect(() => {
    try {
      localStorage.setItem('oxykal_committed_items', JSON.stringify(committedItems));
    } catch (e) {
      console.error('Failed to save committed items to localStorage', e);
    }
  }, [committedItems]);

  // Search & Category Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [calcNotification, setCalcNotification] = useState<string | null>(null);

  const handleCetakClick = () => {
    if (!hasCalculatedOnce || calculations.totalClosing === 0) {
      setCalcNotification('Silakan hitung hasil terlebih dahulu!');
      setTimeout(() => {
        setCalcNotification(null);
      }, 3500);
      return;
    }
    setShowShareModal(true);
  };

  const handleExportExcel = () => {
    if (!hasCalculatedOnce || calculations.totalClosing === 0) {
      setCalcNotification('Silakan hitung hasil terlebih dahulu sebelum export Excel!');
      setTimeout(() => setCalcNotification(null), 3500);
      return;
    }

    const csvRows = [];
    csvRows.push(['OxyKal Revenue & Komisi Report']);
    csvRows.push([`Sales Executive:,${salesName || 'Sales'}`]);
    csvRows.push([`Target SA:,${targetSa}`]);
    csvRows.push([`Total Closing:,${calculations.totalClosing} SA`]);
    csvRows.push([`Gross Kontrak:,${calculations.totalGrossContract}`]);
    csvRows.push([`Total Net Revenue / Bln:,${calculations.totalMonthlyNetRevenue}`]);
    csvRows.push([`Total PPN:,${calculations.totalPpn}`]);
    csvRows.push([`Tiering:,${calculations.currentTier.name} (${calculations.inc1Percent}%)`]);
    csvRows.push([`Komisi Bersih:,${calculations.totalKomisi}`]);
    csvRows.push([]);
    csvRows.push(['No', 'Nama Paket', 'Kategori', 'Periode', 'Qty (SA)', 'Harga Satuan (Rp)', 'Gross Kontrak (Rp)', 'Net Revenue / Bln (Rp)']);

    calculations.itemsCalculated.forEach((item, idx) => {
      csvRows.push([
        idx + 1,
        `"${item.name}"`,
        `"${item.category}"`,
        `"${item.period}"`,
        item.qty,
        item.price,
        item.itemGross,
        item.itemMonthlyNet,
      ]);
    });

    const csvContent = '\uFEFF' + csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `OxyKal_Revenue_Report_${salesName.replace(/\s+/g, '_') || 'Sales'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Package Form
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('Paket Custom');
  const [customPrice, setCustomPrice] = useState<number>(250000);
  const [customPeriod, setCustomPeriod] = useState<BillingPeriod>('Bulanan');
  const [customQty, setCustomQty] = useState<number>(1);

  // Handlers for Sales Info
  const handleNameChange = (val: string) => {
    setSalesName(val);
    localStorage.setItem('oxykal_sales_name', val);
  };

  const handleTargetChange = (val: number) => {
    const num = Math.max(1, val);
    setTargetSa(num);
    localStorage.setItem('oxykal_target_sa', num.toString());
  };

  // Item Operations on Receipt Draft
  const handleAddFromCatalog = (pkg: ISPPackage, period: BillingPeriod = 'Bulanan') => {
    setSelectedItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.packageId === pkg.id && item.period === period
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].qty += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            packageId: pkg.id,
            name: pkg.name,
            speed: pkg.speed,
            category: pkg.category,
            price: pkg.price,
            period,
            qty: 1,
          },
        ];
      }
    });
  };

  const handleAddCustom = () => {
    if (!customPrice || customPrice <= 0 || customQty <= 0) return;
    setSelectedItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: customName || 'Paket Custom',
        speed: 'Custom',
        category: 'Custom',
        price: customPrice,
        period: customPeriod,
        qty: customQty,
      },
    ]);
    setShowCustomForm(false);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as SelectedItem[]
    );
  };

  const handleUpdatePeriod = (id: string, period: BillingPeriod) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, period } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetAll = () => {
    setSelectedItems([]);
    setCommittedItems([]);
    setHasCalculatedOnce(false);
    localStorage.removeItem('oxykal_selected_items');
    localStorage.removeItem('oxykal_committed_items');
    localStorage.removeItem('oxycalc_selected_items');
    localStorage.removeItem('oxycalc_committed_items');
  };

  // Preset scenarios
  const handleApplyPreset = (presetType: 'tier1' | 'tier2' | 'tier3') => {
    let preset: SelectedItem[] = [];
    if (presetType === 'tier1') {
      preset = [
        {
          id: 'p-1',
          packageId: 'pkg-100',
          name: 'Stream 100 Mbps',
          speed: '100 Mbps',
          category: 'Standard',
          price: 242000,
          period: 'Bulanan',
          qty: 12,
        },
        {
          id: 'p-2',
          packageId: 'pkg-150',
          name: 'Stream 150 Mbps',
          speed: '150 Mbps',
          category: 'Standard',
          price: 306000,
          period: 'Bulanan',
          qty: 3,
        },
      ];
    } else if (presetType === 'tier2') {
      preset = [
        {
          id: 'p-1',
          packageId: 'pkg-100',
          name: 'Stream 100 Mbps',
          speed: '100 Mbps',
          category: 'Standard',
          price: 242000,
          period: 'Bulanan',
          qty: 14,
        },
        {
          id: 'p-2',
          packageId: 'pkg-200',
          name: 'Stream 200 Mbps',
          speed: '200 Mbps',
          category: 'Standard',
          price: 356000,
          period: 'Bulanan',
          qty: 4,
        },
      ];
    } else if (presetType === 'tier3') {
      preset = [
        {
          id: 'p-1',
          packageId: 'pkg-100',
          name: 'Stream 100 Mbps',
          speed: '100 Mbps',
          category: 'Standard',
          price: 242000,
          period: 'Bulanan',
          qty: 15,
        },
        {
          id: 'p-2',
          packageId: 'pkg-200',
          name: 'Stream 200 Mbps',
          speed: '200 Mbps',
          category: 'Standard',
          price: 356000,
          period: 'Bulanan',
          qty: 5,
        },
        {
          id: 'p-3',
          packageId: 'pkg-tv-150',
          name: 'Stream Plus TV 150 Mbps',
          speed: '150 Mbps',
          category: 'Plus TV',
          price: 359000,
          period: 'Tahunan',
          qty: 2,
        },
      ];
    }
    setSelectedItems(preset);
  };

  // Check if draft in receipt differs from calculated screen items
  const hasPendingChanges = useMemo(() => {
    return JSON.stringify(selectedItems) !== JSON.stringify(committedItems);
  }, [selectedItems, committedItems]);

  // HITUNG BUTTON ACTION: Triggers live calculation animation before updating LED screen
  const handleHitung = () => {
    if (selectedItems.length === 0) return;
    setIsCalculating(true);
    setCalcProgress(15);

    const interval = setInterval(() => {
      setCalcProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setCalcProgress(100);
      setCommittedItems([...selectedItems]);
      setHasCalculatedOnce(true);

      setTimeout(() => {
        setIsCalculating(false);
      }, 150);
    }, 1100);
  };

  // Commission Calculations Engine ONLY based on committedItems (what's on screen)
  const calculations = useMemo(() => {
    let totalClosing = 0;
    let totalMonthlyNetRevenue = 0;
    let totalGrossContract = 0;
    let totalYearlyCount = 0;
    let totalPpn = 0;

    const itemsCalculated = committedItems.map((item) => {
      const rev = calculateRevenue(item.price, item.period);
      const itemClosing = item.qty;
      const itemMonthlyNet = rev.monthlyNetRevenue * item.qty;
      const itemGross = rev.grossContract * item.qty;

      totalClosing += itemClosing;
      totalMonthlyNetRevenue += itemMonthlyNet;
      totalGrossContract += itemGross;
      totalPpn += rev.ppn * item.qty;

      if (item.period === 'Tahunan') {
        totalYearlyCount += item.qty;
      }

      return {
        ...item,
        rev,
        itemMonthlyNet,
        itemGross,
      };
    });

    const currentTier = getCurrentTier(totalClosing, totalMonthlyNetRevenue);
    const tierProgress = getTierProgress(totalClosing, totalMonthlyNetRevenue);
    const inc1Percent = currentTier.inc1Percent;

    const baseKomisi =
      currentTier.level > 0
        ? Math.round((totalMonthlyNetRevenue * inc1Percent) / 100)
        : 0;

    const totalKomisiTahunan = totalYearlyCount * 200000;
    const totalKomisi = baseKomisi + totalKomisiTahunan;

    return {
      itemsCalculated,
      totalClosing,
      totalMonthlyNetRevenue,
      totalGrossContract,
      totalYearlyCount,
      totalPpn,
      currentTier,
      tierProgress,
      inc1Percent,
      baseKomisi,
      totalKomisiTahunan,
      totalKomisi,
    };
  }, [committedItems]);

  // Catalog filtered items
  const filteredCatalog = useMemo(() => {
    return MASTER_PACKAGES.filter((pkg) => {
      const matchesCategory =
        categoryFilter === 'Semua' ||
        pkg.category.toLowerCase().includes(categoryFilter.toLowerCase());
      const matchesSearch =
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.speed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.price.toString().includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  // Generate WhatsApp Share Text
  const shareText = useMemo(() => {
    const lines = [
      `📟 *STRUK SIMULASI MESIN KASIR REVENUE OXYKAL*`,
      `👤 *Sales Executive:* ${salesName || 'Sales'}`,
      `🎯 *Target SA:* ${targetSa} SA (${Math.round(
        (calculations.totalClosing / targetSa) * 100
      )}% tercapai)`,
      `----------------------------------------`,
      `📦 *Total Closing:* ${calculations.totalClosing} SA`,
      `💰 *Net Revenue / Bln:* ${formatRupiah(calculations.totalMonthlyNetRevenue)}`,
      `📜 *Gross Nilai Kontrak:* ${formatRupiah(calculations.totalGrossContract)}`,
      `🏆 *Status Tier:* ${calculations.currentTier.name} (Rate INC1: ${calculations.inc1Percent}%)`,
      `----------------------------------------`,
      `💵 *ESTIMASI KOMISI TOTAL:* ${formatRupiah(calculations.totalKomisi)}`,
      `----------------------------------------`,
      `*Rincian Paket Kasir:*`,
    ];

    if (calculations.itemsCalculated.length === 0) {
      lines.push(`(Belum ada paket dihitung)`);
    } else {
      calculations.itemsCalculated.forEach((item, idx) => {
        lines.push(
          `${idx + 1}. ${item.name} (${item.period}) - ${item.qty} SA @ ${formatRupiah(item.price)}`
        );
      });
    }

    lines.push(`----------------------------------------`);
    lines.push(`Dibuat via *OxyKal Sales Revenue Simulator*`);

    return lines.join('\n');
  }, [salesName, targetSa, calculations]);

  const handleCopyShareText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen overflow-y-auto lg:overflow-hidden flex flex-col items-center justify-between bg-slate-100 dark:bg-[#020617] sm:bg-slate-200 sm:dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans p-0 sm:p-3 lg:py-6 lg:px-6">
      {/* ALL-IN-ONE CALCULATOR CHASSIS WRAPPER */}
      <div className="relative w-full max-w-7xl flex-1 min-h-0 flex flex-col">
        {/* AYPED HARDWARE BRAND LOGO EMBEDDED ON TOP TABLET BEZEL (DESKTOP/TABLET ONLY) */}
        <div className="hidden sm:flex absolute top-[3px] left-1/2 -translate-x-1/2 z-30 pointer-events-none items-center gap-2 select-none px-3.5 py-0.5 rounded-full bg-slate-300/90 dark:bg-slate-900/90 border border-slate-400 dark:border-slate-600 shadow-sm ring-1 ring-black/10 dark:ring-white/20">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-cyan-400 animate-pulse"></div>
          <span className="font-black tracking-[0.3em] text-[11px] text-slate-900 dark:text-white font-mono uppercase drop-shadow-sm">
            AYPED
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400"></div>
        </div>

        {/* MAIN CONTAINER: NORMAL WEB ON MOBILE, TABLET BEZEL ON SM/LG */}
        <main className={`flex-1 min-h-0 w-full rounded-none sm:rounded-[3rem] p-0 sm:p-4 lg:p-5 flex flex-col gap-2 lg:gap-3 relative transition-all duration-300 bg-slate-100 dark:bg-slate-950 sm:bg-slate-200 sm:dark:bg-slate-950 border-0 sm:border-[20px] border-slate-300 dark:border-slate-800/95 sm:shadow-[0_25px_60px_rgba(0,0,0,0.15)] sm:dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)] ring-0 sm:ring-1 sm:ring-slate-400/70 sm:dark:ring-slate-700/70 ${viewMode === 'landing' ? 'overflow-hidden' : 'overflow-y-auto lg:overflow-hidden'}`}>

        {viewMode === 'landing' ? (
          /* LANDING PAGE VIEW INSIDE FULL TABLET DISPLAY SCREEN */
          <div className="flex-1 min-h-0 w-full flex flex-col justify-between p-2.5 sm:p-6 md:p-8 text-center animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white rounded-none sm:rounded-2xl transition-colors duration-200 border-0 sm:border sm:border-slate-200/80 sm:dark:border-slate-800/80">
            
            {/* SUBTLE BACKGROUND WALLPAPER WITH FADED SHADOW EFFECT */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-none sm:rounded-2xl z-0" aria-hidden="true">
              <img
                src="https://imgur.com/7lzkq1g.jpg"
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center opacity-15 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen scale-100 brightness-110 contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-100/70 via-slate-100/50 to-slate-100/80 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-950/90"></div>
            </div>

            {/* TOP BAR WITH BRAND LOGO + THEME TOGGLE & SHARE */}
            <div className="relative z-10 w-full flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 sm:pb-3 shrink-0">
              {/* Brand Logo & Clean Name */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <img
                  src="https://i.imgur.com/YWbzvKD.jpg"
                  alt="OxyKal Logo"
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shadow-xs shrink-0"
                />
                <span className="text-sm sm:text-base font-black tracking-wider text-slate-900 dark:text-white uppercase leading-none font-mono">
                  Oxy<span className="text-orange-600 dark:text-orange-400">Kal</span>
                </span>
              </div>

              {/* Action Buttons: Theme Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleDarkMode}
                  className="p-1.5 bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
                  title="Toggle Dark/Light Mode"
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>

            {/* MAIN CENTERED HERO CONTENT */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-3 sm:space-y-6 md:space-y-8 py-2 sm:py-6 my-auto max-w-3xl mx-auto w-full text-center">
              {/* Title & Tagline */}
              <div className="space-y-1.5 sm:space-y-4 max-w-2xl w-full flex flex-col items-center justify-center">
                <div className="inline-flex items-center gap-2 text-orange-700 dark:text-orange-400/90 font-mono text-[10px] sm:text-xs md:text-sm font-bold tracking-widest uppercase bg-white/90 dark:bg-slate-950/90 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-slate-300 dark:border-slate-800 shadow-xs">
                  <span>OxyKal Revenue Simulator</span>
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold font-handwriting text-slate-900 dark:text-white leading-tight flex items-center justify-center flex-wrap gap-1.5 sm:gap-3 text-center">
                  <span>Kalkulator</span>
                  <span className="text-orange-600 dark:text-orange-400">Revenue</span>
                  <img 
                    src="https://i.imgur.com/niUBncI.jpg" 
                    alt="Oxygen.id Logo" 
                    className="h-[0.8em] sm:h-[0.95em] w-auto object-contain inline-block align-middle mix-blend-multiply dark:mix-blend-screen"
                    referrerPolicy="no-referrer"
                  />
                </h1>
                <p className="text-xs sm:text-base md:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xl mx-auto text-center px-1">
                  Simulasi perhitungan revenue dan estimasi komisi berdasarkan tier secara cepat & akurat 90%.
                </p>
              </div>

              {/* Feature Badges */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 w-full max-w-2xl text-left">
                <div className="p-2 sm:p-3.5 bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 shadow-xs hover:border-orange-500/40 transition-colors">
                  <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500 dark:text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs md:text-sm font-black text-slate-900 dark:text-white truncate">Hitung Cepat</div>
                    <div className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate hidden xs:block sm:block">Simulasi Perhitungan SA</div>
                  </div>
                </div>
                <div className="p-2 sm:p-3.5 bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 shadow-xs hover:border-orange-500/40 transition-colors">
                  <BarChart2 className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs md:text-sm font-black text-slate-900 dark:text-white truncate">Tier Stats</div>
                    <div className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate hidden xs:block sm:block">Otomatis Progres Target</div>
                  </div>
                </div>
                <div className="p-2 sm:p-3.5 bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 shadow-xs hover:border-orange-500/40 transition-colors">
                  <Share2 className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs md:text-sm font-black text-slate-900 dark:text-white truncate">Cetak Revenue</div>
                    <div className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate hidden xs:block sm:block">Bagikan Struk Instan</div>
                  </div>
                </div>
              </div>

              {/* Big Action Button */}
              <button
                onClick={() => setViewMode('calculator')}
                className="px-5 py-2.5 sm:px-8 sm:py-3.5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 font-black text-xs sm:text-base md:text-lg uppercase tracking-wider rounded-lg sm:rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 sm:gap-3 cursor-pointer ring-2 sm:ring-4 ring-orange-400/40 hover:ring-orange-400 shrink-0"
              >
                <Play className="w-4 h-4 sm:w-6 sm:h-6 fill-slate-950 shrink-0" />
                <span>MULAI SIMULASI</span>
                <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 shrink-0" />
              </button>
            </div>
          </div>
        ) : (
          /* MAIN CALCULATOR WORKSPACE */
          <>
            {/* MESIN KASIR DIGITAL DISPLAY SCREEN */}
            <div className="shrink-0 bg-pos-screen border-b sm:border-3 border-slate-200 dark:border-slate-900 rounded-none sm:rounded-xl p-2 sm:p-3 shadow-none sm:shadow-xl relative overflow-hidden space-y-2">
              {/* Top Integrated Bar: Clean Logo + Target SA + Share + Home + Theme Toggle */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2 max-w-full">
                {/* Left: Brand Logo & Target SA Box */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                  {/* Brand Logo & Clean Name */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <img
                      src="https://i.imgur.com/YWbzvKD.jpg"
                      alt="OxyKal Logo"
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-md object-cover border border-slate-300 dark:border-slate-700 shadow-xs shrink-0"
                    />
                    <span className="text-xs sm:text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase leading-none font-mono">
                      Oxy<span className="text-orange-600 dark:text-orange-400">Kal</span>
                    </span>
                  </div>

                  {/* Target SA Box */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
                    <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 font-mono">Target:</span>
                    <input
                      type="number"
                      min={1}
                      value={targetSa}
                      onChange={(e) => handleTargetChange(parseInt(e.target.value, 10) || 1)}
                      className="w-9 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-amber-600 dark:text-amber-300 font-mono font-black text-xs px-0.5 py-0 text-center rounded-xs"
                    />
                    <span className="text-[10px] sm:text-[11px] font-mono font-black text-slate-600 dark:text-slate-400">
                      SA ({hasCalculatedOnce ? Math.round((calculations.totalClosing / targetSa) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                {/* Quick Actions (Reset, Cetak, Home & Theme Toggle) */}
                <div className="flex items-center gap-1 sm:gap-1.5 ml-auto shrink-0">
                  {(selectedItems.length > 0 || hasCalculatedOnce) && (
                    <button
                      onClick={() => {
                        handleResetAll();
                        setCalcNotification('Hitungan & komisi di-reset kembali ke Rp0.');
                        setTimeout(() => setCalcNotification(null), 3000);
                      }}
                      className="px-2 py-1 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-[10px] sm:text-[11px] rounded-md transition-all flex items-center gap-1 cursor-pointer shadow-sm shrink-0"
                      title="Reset Semua Hitungan Ke 0"
                    >
                      <RotateCcw className="w-3 h-3 shrink-0" />
                      <span className="uppercase">Reset</span>
                    </button>
                  )}

                  <button
                    onClick={handleExportExcel}
                    className="px-2 py-1 sm:px-2.5 sm:py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-[10px] sm:text-[11px] rounded-md transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm shrink-0"
                    title="Export Rekapitulasi ke Excel / CSV"
                  >
                    <FileSpreadsheet className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="uppercase">Excel</span>
                  </button>

                  <button
                    onClick={handleCetakClick}
                    className="px-2 py-1 sm:px-2.5 sm:py-1 bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 font-black text-[10px] sm:text-[11px] rounded-md transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm shrink-0"
                    title="Cetak Struk & Export Hasil"
                  >
                    <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="uppercase">Cetak</span>
                  </button>

                  <button
                    onClick={() => setViewMode('landing')}
                    className="p-1 sm:p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors cursor-pointer shrink-0"
                    title="Kembali ke Landing Page"
                  >
                    <Home className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  <button
                    onClick={onToggleDarkMode}
                    className="p-1 sm:p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors cursor-pointer shrink-0"
                    title="Toggle Dark/Light Mode"
                  >
                    {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Moon className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                </div>
              </div>

              {/* TOAST NOTIFICATION IF USER CLICKS CETAK BEFORE CALCULATING */}
              {calcNotification && (
                <div className="bg-rose-500 text-white dark:bg-rose-600 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-lg shadow-lg flex items-center justify-between gap-2 border border-rose-400 animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-white shrink-0 animate-bounce" />
                    <span>{calcNotification}</span>
                  </div>
                  <button
                    onClick={() => setCalcNotification(null)}
                    className="text-white/80 hover:text-white font-bold text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* MAIN DIGITAL LED COMMISSION DISPLAY */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 rounded-lg p-2 sm:p-2.5 space-y-1.5 relative shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                    ESTIMASI KOMISI SALES
                  </span>
                  <span className="text-[10px] font-black uppercase font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-900 text-orange-600 dark:text-orange-400 border border-slate-300 dark:border-slate-800 rounded-xs">
                    RATE INC1: {hasCalculatedOnce ? `${calculations.inc1Percent}%` : '0%'}
                  </span>
                </div>

                {/* ANIMATED CALCULATION LOADER ON SCREEN */}
                {isCalculating ? (
                  <div className="py-2.5 flex flex-col items-center justify-center space-y-2 text-orange-600 dark:text-orange-400 font-mono animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-orange-600 dark:text-orange-300">
                        MENGHITUNG REVENUE & TIER KOMISI... {calcProgress}%
                      </span>
                    </div>
                    <div className="w-full max-w-md bg-slate-100 dark:bg-slate-900/90 rounded-full h-2 overflow-hidden border border-orange-500/40 p-0.5">
                      <div
                        className="bg-orange-500 h-full rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                        style={{ width: `${calcProgress}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-orange-600 dark:text-orange-500/80 font-mono font-bold tracking-widest animate-pulse">
                      [ MEMPROSES {selectedItems.length} ITEM PAKET SA ]
                    </div>
                  </div>
                ) : (
                  <>
                    {/* BIG GREEN POS NUMBERS (Shows committed calculation after clicking HITUNG) */}
                    <div className="text-2xl sm:text-4xl font-black font-pos text-pos-green tracking-tight leading-none animate-in zoom-in-95 duration-200">
                      {hasCalculatedOnce ? formatRupiah(calculations.totalKomisi) : 'Rp0'}
                    </div>

                    {/* DYNAMIC RESULT NOTIFICATION BOX (ONLY SHOWN WHEN HITUNG WAS CLICKED AND HAS RESULTS) */}
                    {hasCalculatedOnce && calculations.totalClosing > 0 && (
                      <>
                        {calculations.currentTier.level > 0 ? (
                          /* CONGRATULATIONS CARD (TIER 1+) */
                          <div className="px-2.5 py-1 bg-orange-100 dark:bg-orange-950/70 border border-orange-300 dark:border-orange-500/60 rounded-md text-orange-900 dark:text-orange-200 flex items-center gap-2 animate-in fade-in duration-200">
                            <Smile className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                            <div className="text-[11px] font-mono text-orange-800 dark:text-orange-300 truncate">
                              <strong>🎉 Selamat!</strong> Anda Kualifikasi {calculations.currentTier.name}!
                              <span className="text-orange-600 dark:text-orange-400 ml-1">
                                (Base: {formatRupiah(calculations.baseKomisi)}
                                {calculations.totalKomisiTahunan > 0 && ` + Bonus Thn: ${formatRupiah(calculations.totalKomisiTahunan)}`})
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* TIER PROGRESS CARD (TIER 0 STATUS WHEN HAS ITEMS) */
                          <div className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-500/50 rounded-md text-amber-900 dark:text-amber-200 flex items-center gap-2 animate-in fade-in duration-200">
                            <div className="text-[11px] font-mono text-amber-800 dark:text-amber-300 truncate">
                              <strong>Progres Tier 1:</strong> Terkumpul {calculations.totalClosing} SA & {formatRupiah(calculations.totalMonthlyNetRevenue)} Net.
                              <span className="text-amber-700 dark:text-amber-200 font-bold ml-1">
                                (Kurang: {calculations.tierProgress.closingNeeded} SA & {formatRupiah(calculations.tierProgress.revenueNeeded)} Net)
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* METERS BAR */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="bg-slate-100/90 dark:bg-slate-900/80 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] sm:text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono block mb-1">
                      TOTAL CLOSING
                    </span>
                    <span className="text-base sm:text-xl font-black font-pos text-slate-900 dark:text-slate-100">
                      {hasCalculatedOnce ? `${calculations.totalClosing} SA` : '0 SA'}
                    </span>
                  </div>

                  <div className="bg-slate-100/90 dark:bg-slate-900/80 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] sm:text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono block mb-1">
                      NET REVENUE/BLN
                    </span>
                    <span className="text-base sm:text-xl font-black font-pos text-orange-600 dark:text-orange-400">
                      {hasCalculatedOnce ? formatRupiah(calculations.totalMonthlyNetRevenue) : 'Rp0'}
                    </span>
                  </div>

                  <div className="bg-slate-100/90 dark:bg-slate-900/80 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] sm:text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono block mb-1">
                      GROSS KONTRAK
                    </span>
                    <span className="text-base sm:text-xl font-black font-pos text-slate-900 dark:text-slate-100">
                      {hasCalculatedOnce ? formatRupiah(calculations.totalGrossContract) : 'Rp0'}
                    </span>
                  </div>

                  <div className="bg-slate-100/90 dark:bg-slate-900/80 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] sm:text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono block mb-1">
                      BONUS TAHUNAN
                    </span>
                    <span className="text-base sm:text-xl font-black font-pos text-amber-600 dark:text-amber-400">
                      {hasCalculatedOnce ? formatRupiah(calculations.totalKomisiTahunan) : 'Rp0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* LOWER CALCULATOR SPLIT VIEW */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch overflow-visible lg:overflow-hidden">
              {/* LEFT: PAKET PENJUALAN GRID (LG:COL-SPAN-7) */}
              <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] rounded-none sm:rounded-xl p-2 sm:p-2.5 border-y sm:border border-slate-200 dark:border-slate-800 shadow-none sm:shadow-xs flex flex-col h-[540px] sm:h-[580px] lg:h-full overflow-hidden space-y-1.5 shrink-0 lg:shrink">
                <div className="shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <h2 className="font-black text-xs uppercase tracking-wide text-slate-900 dark:text-white">
                      PILIH PAKET PENJUALAN
                    </h2>
                  </div>

                  <button
                    onClick={() => setShowCustomForm(!showCustomForm)}
                    className="text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase cursor-pointer"
                  >
                    + Custom
                  </button>
                </div>

                {/* Custom Form Toggle */}
                {showCustomForm && (
                  <div className="shrink-0 p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg space-y-1.5">
                    <div className="grid grid-cols-4 gap-1.5">
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase">Nama</label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-[11px] font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase">Harga (Rp)</label>
                        <input
                          type="number"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(Number(e.target.value))}
                          className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-[11px] font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase">Periode</label>
                        <select
                          value={customPeriod}
                          onChange={(e) => setCustomPeriod(e.target.value as BillingPeriod)}
                          className="w-full px-1 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-[11px] font-bold"
                        >
                          {PERIOD_OPTIONS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase">SA</label>
                        <input
                          type="number"
                          min={1}
                          value={customQty}
                          onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value)))}
                          className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-[11px] font-mono font-bold"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleAddCustom}
                      className="w-full py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase rounded-md cursor-pointer"
                    >
                      Tambahkan Ke Struk
                    </button>
                  </div>
                )}


                {/* Search & Category Pills */}
                <div className="shrink-0 space-y-1">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari kecepatan/nama..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase transition-all cursor-pointer whitespace-nowrap ${
                          categoryFilter === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SCROLLABLE INNER PACKAGE BUTTONS GRID WITH 4 BILLING PERIOD BUTTONS (+ BULANAN, + 3 BULAN, + 6 BULAN, + TAHUNAN) */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 align-content-start">
                  {filteredCatalog.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-lg transition-all shadow-2xs flex flex-col justify-between gap-1.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {pkg.name}
                          </span>
                          <span className="text-[9px] font-black uppercase px-1 py-0.1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xs shrink-0">
                            {pkg.speed}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono font-black text-blue-600 dark:text-blue-400 mt-0.5">
                          {formatRupiah(pkg.price)}{' '}
                          <span className="text-[9px] font-sans text-slate-400 font-bold">/bln</span>
                        </div>
                      </div>

                      {/* Calculator Buttons for 4 Billing Options */}
                      <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => handleAddFromCatalog(pkg, 'Bulanan')}
                          className="py-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase rounded-md transition-transform active:scale-95 cursor-pointer text-center truncate"
                          title="Tambah 1 Bulan"
                        >
                          + Bln
                        </button>
                        <button
                          onClick={() => handleAddFromCatalog(pkg, '3 Bulan')}
                          className="py-1 bg-pink-600 hover:bg-pink-700 text-white font-black text-[9px] uppercase rounded-md transition-transform active:scale-95 cursor-pointer text-center truncate"
                          title="Tambah 3 Bulan"
                        >
                          + 3Bln
                        </button>
                        <button
                          onClick={() => handleAddFromCatalog(pkg, '6 Bulan')}
                          className="py-1 bg-purple-600 hover:bg-purple-700 text-white font-black text-[9px] uppercase rounded-md transition-transform active:scale-95 cursor-pointer text-center truncate"
                          title="Tambah 6 Bulan (Semesterly)"
                        >
                          + 6Bln
                        </button>
                        <button
                          onClick={() => handleAddFromCatalog(pkg, 'Tahunan')}
                          className="py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[9px] uppercase rounded-md transition-transform active:scale-95 cursor-pointer text-center truncate"
                          title="Tambah 1 Tahun"
                        >
                          + Thn
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: STRUK PENJUALAN / RECEIPT LIST (LG:COL-SPAN-5) */}
              <div className="lg:col-span-5 bg-white dark:bg-[#0f172a] rounded-none sm:rounded-xl p-2 sm:p-2.5 border-y sm:border border-slate-200 dark:border-slate-800 shadow-none sm:shadow-xs flex flex-col h-[320px] sm:h-[360px] lg:h-full overflow-hidden space-y-1.5 shrink-0 lg:shrink">
                <div className="shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-orange-600" />
                    <h2 className="font-black text-xs uppercase tracking-wide text-slate-900 dark:text-white">
                      {selectedItems.length > 0 ? `${selectedItems.length} ITEM` : ''}
                    </h2>
                  </div>

                  {selectedItems.length > 0 && (
                    <button
                      onClick={handleResetAll}
                      className="text-[10px] font-black text-rose-600 dark:text-rose-400 hover:underline uppercase cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="shrink-0 flex items-center gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-400">Preset:</span>
                  <button
                    onClick={() => handleApplyPreset('tier1')}
                    className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-extrabold text-[9px] rounded-md border border-blue-200 dark:border-blue-800 cursor-pointer"
                  >
                    15 SA (T1)
                  </button>
                  <button
                    onClick={() => handleApplyPreset('tier2')}
                    className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-extrabold text-[9px] rounded-md border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                  >
                    18 SA (T2)
                  </button>
                  <button
                    onClick={() => handleApplyPreset('tier3')}
                    className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 font-extrabold text-[9px] rounded-md border border-amber-200 dark:border-amber-800 cursor-pointer"
                  >
                    22 SA (T3)
                  </button>
                </div>

                {/* SCROLLABLE RECEIPT ITEMS LIST */}
                {selectedItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 text-center bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <ShoppingCart className="w-6 h-6 text-slate-400 opacity-40" />
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
                    {selectedItems.map((item, idx) => {
                      const rev = calculateRevenue(item.price, item.period);
                      const subTotalNet = rev.monthlyNetRevenue * item.qty;

                      return (
                        <div
                          key={item.id}
                          className="p-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between gap-1.5"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-4 h-4 bg-blue-600 text-white text-[9px] font-black rounded-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-black text-xs text-slate-900 dark:text-white truncate">
                                {item.name}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                Net/bln: <strong className="text-blue-600 dark:text-blue-400 font-mono">{formatRupiah(rev.monthlyNetRevenue)}</strong> &bull; Sub: <strong className="text-orange-600 font-mono">{formatRupiah(subTotalNet)}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Period */}
                            <select
                              value={item.period}
                              onChange={(e) => handleUpdatePeriod(item.id, e.target.value as BillingPeriod)}
                              className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-[10px] font-bold"
                            >
                              {PERIOD_OPTIONS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>

                            {/* Stepper */}
                            <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800">
                              <button
                                onClick={() => handleUpdateQty(item.id, -1)}
                                className="px-1.5 py-0.2 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-1.5 py-0.2 text-[11px] font-mono font-black text-slate-900 dark:text-white">
                                {item.qty}
                              </span>
                              <button
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="px-1.5 py-0.2 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ACTION SECTION: PROMINENT "HITUNG" BUTTON */}
                <div className="shrink-0 pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  {hasPendingChanges && selectedItems.length > 0 && !isCalculating && (
                    <div className="px-2 py-1 bg-amber-500/15 border border-amber-500/40 rounded-md text-amber-600 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1.5 animate-pulse">
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Ada perubahan paket! Tekan "HITUNG" untuk memproses hasil di layar.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleHitung}
                      disabled={selectedItems.length === 0 || isCalculating}
                      className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                        selectedItems.length === 0 || isCalculating
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-orange-500 hover:bg-orange-400 active:scale-98 text-slate-950 cursor-pointer ring-2 ring-orange-400/50'
                      }`}
                    >
                      {isCalculating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>MEMPROSES HASIL...</span>
                        </>
                      ) : (
                        <>
                          <Calculator className="w-4 h-4" />
                          <span>HITUNG HASIL DI LAYAR</span>
                        </>
                      )}
                    </button>

                    {(selectedItems.length > 0 || hasCalculatedOnce) && (
                      <button
                        onClick={() => {
                          handleResetAll();
                          setCalcNotification('Hitungan & komisi berhasil di-reset ke Rp0.');
                          setTimeout(() => setCalcNotification(null), 3000);
                        }}
                        disabled={isCalculating}
                        className="py-2.5 px-3 bg-rose-500/15 hover:bg-rose-500/25 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800/80 font-black text-xs uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Reset semua item dan hitung ulang dari 0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">RESET</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      </div>

      {/* BOTTOM FOOTER COPYRIGHT */}
      <footer className="shrink-0 py-1 lg:pt-2 lg:pb-1.5 text-center font-mono font-bold text-[11px] text-slate-500 dark:text-slate-400 tracking-wider uppercase">
        OxyKal by E61 - 2026
      </footer>

      {/* PRINT & EXPORT MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-w-lg w-full space-y-3 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-orange-500" />
                Cetak & Export Struk Revenue
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sales Executive Name Config for Share */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-orange-500" />
                Nama Sales:
              </label>
              <input
                type="text"
                value={salesName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Contoh: Sales Executive"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <textarea
              readOnly
              rows={9}
              value={shareText}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
            />

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs uppercase rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-950" />
                <span>Cetak Revenue</span>
              </button>

              <button
                onClick={handleCopyShareText}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs uppercase rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5 text-orange-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-lg transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim WA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
