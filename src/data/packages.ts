import { ISPPackage } from '../types/customer';

export const MASTER_PACKAGES: ISPPackage[] = [
  {
    id: 'pkg-50-a',
    name: 'Stream 50 Mbps',
    speed: '50 Mbps',
    price: 185000,
    category: 'Standard',
  },
  {
    id: 'pkg-50-b',
    name: 'Stream 50 Mbps (Reguler)',
    speed: '50 Mbps',
    price: 199000,
    category: 'Standard',
  },
  {
    id: 'pkg-75',
    name: 'Stream 75 Mbps (SMT)',
    speed: '75 Mbps',
    price: 297000,
    category: 'SMT',
  },
  {
    id: 'pkg-100-smt',
    name: 'Stream 100 Mbps (SMT)',
    speed: '100 Mbps',
    price: 350000,
    category: 'SMT',
  },
  {
    id: 'pkg-150-smt',
    name: 'Stream 150 Mbps (SMT)',
    speed: '150 Mbps',
    price: 450000,
    category: 'SMT',
  },
  {
    id: 'pkg-200-smt',
    name: 'Stream 200 Mbps (SMT)',
    speed: '200 Mbps',
    price: 540000,
    category: 'SMT',
  },
  {
    id: 'pkg-100',
    name: 'Stream 100 Mbps',
    speed: '100 Mbps',
    price: 242000,
    category: 'Standard',
  },

  {
    id: 'pkg-150',
    name: 'Stream 150 Mbps',
    speed: '150 Mbps',
    price: 306000,
    category: 'Standard',
  },
  {
    id: 'pkg-200',
    name: 'Stream 200 Mbps',
    speed: '200 Mbps',
    price: 356000,
    category: 'Standard',
  },
  {
    id: 'pkg-tv-100',
    name: 'Stream Plus TV 100 Mbps',
    speed: '100 Mbps',
    price: 299000,
    category: 'Plus TV',
  },
  {
    id: 'pkg-tv-150',
    name: 'Stream Plus TV 150 Mbps',
    speed: '150 Mbps',
    price: 359000,
    category: 'Plus TV',
  },
  {
    id: 'pkg-tv-200',
    name: 'Stream Plus TV 200 Mbps',
    speed: '200 Mbps',
    price: 409000,
    category: 'Plus TV',
  },
  {
    id: 'pkg-promo-1111-200',
    name: 'Promo 11.11 200 Mbps',
    speed: '200 Mbps',
    price: 242000,
    category: 'Promo 11.11',
  },
  {
    id: 'pkg-promo-1111-300',
    name: 'Promo 11.11 300 Mbps',
    speed: '300 Mbps',
    price: 306000,
    category: 'Promo 11.11',
  },
  {
    id: 'pkg-promo-1111-400',
    name: 'Promo 11.11 400 Mbps',
    speed: '400 Mbps',
    price: 356000,
    category: 'Promo 11.11',
  },
  {
    id: 'pkg-oxylite-nov-10-jawa',
    name: 'Oxylite Nov 10 Mbps (Jawa)',
    speed: '10 Mbps',
    price: 116550,
    category: 'Oxylite Nov',
  },
  {
    id: 'pkg-oxylite-nov-10-luarjawa',
    name: 'Oxylite Nov 10 Mbps (Luar Jawa)',
    speed: '10 Mbps',
    price: 127650,
    category: 'Oxylite Nov',
  },
  {
    id: 'pkg-oxylite-nov-20-jawa',
    name: 'Oxylite Nov 20 Mbps (Jawa)',
    speed: '20 Mbps',
    price: 127650,
    category: 'Oxylite Nov',
  },
  {
    id: 'pkg-oxylite-nov-20-luarjawa',
    name: 'Oxylite Nov 20 Mbps (Luar Jawa)',
    speed: '20 Mbps',
    price: 138750,
    category: 'Oxylite Nov',
  },
  {
    id: 'pkg-oxylite-nov-30-jawa',
    name: 'Oxylite Nov 30 Mbps (Jawa)',
    speed: '30 Mbps',
    price: 138750,
    category: 'Oxylite Nov',
  },
  {
    id: 'pkg-oxylite-nov-30-luarjawa',
    name: 'Oxylite Nov 30 Mbps (Luar Jawa)',
    speed: '30 Mbps',
    price: 149850,
    category: 'Oxylite Nov',
  },
  {
    id: 'pkg-oxylite-nov-50',
    name: 'Oxylite Nov 50 Mbps (Jawa & Luar Jawa)',
    speed: '50 Mbps',
    price: 166500,
    category: 'Oxylite Nov',
  },
];

export interface OxyliteNovemberOption {
  speed: string;
  jawa: ISPPackage;
  luarJawa: ISPPackage;
}

export const OXYLITE_NOVEMBER_OPTIONS: OxyliteNovemberOption[] = [
  {
    speed: '10 Mbps',
    jawa: MASTER_PACKAGES.find((p) => p.id === 'pkg-oxylite-nov-10-jawa')!,
    luarJawa: MASTER_PACKAGES.find((p) => p.id === 'pkg-oxylite-nov-10-luarjawa')!,
  },
  {
    speed: '20 Mbps',
    jawa: MASTER_PACKAGES.find((p) => p.id === 'pkg-oxylite-nov-20-jawa')!,
    luarJawa: MASTER_PACKAGES.find((p) => p.id === 'pkg-oxylite-nov-20-luarjawa')!,
  },
  {
    speed: '30 Mbps',
    jawa: MASTER_PACKAGES.find((p) => p.id === 'pkg-oxylite-nov-30-jawa')!,
    luarJawa: MASTER_PACKAGES.find((p) => p.id === 'pkg-oxylite-nov-30-luarjawa')!,
  },
  {
    speed: '50 Mbps',
    jawa: MASTER_PACKAGES.find((p) => p.id === 'pkg-oxylite-nov-50')!,
    luarJawa: MASTER_PACKAGES.find((p) => p.id === 'pkg-oxylite-nov-50')!,
  },
];

export const getPackageById = (id: string): ISPPackage | undefined => {
  return MASTER_PACKAGES.find((pkg) => pkg.id === id);
};
