export type FinishType = 'laminat' | 'akryl' | 'lakier';

export interface FinishOption {
  id: string;
  label: string;
  brand: string;
  type: FinishType;
  pricePerSqmPln: number;
  imageBase64?: string;
  createdAt?: number;
}

export interface HandleOption {
  id: string;
  label: string;
  brand: string;
  pricePln: number;
  imageBase64?: string;
  isEdge?: boolean;
  edgeWidthMm?: number;
  createdAt?: number;
}

export interface HdfOption {
  id: string;
  label: string;
  brand: string;
  pricePerSqmPln: number;
  imageBase64?: string;
  createdAt?: number;
}

export interface DrawerOption {
  id: string;
  label: string;
  brand: string;
  type: string;
  depthMm: number;
  heightMm: number;
  pricePln: number;
  imageBase64?: string;
  createdAt?: number;
}

export interface CountertopOption {
  id: string;
  label: string;
  brand: string;
  thicknessMm: number;
  pricePerSqmPln: number;
  imageBase64?: string;
  createdAt?: number;
}

export type CargoType = 'niskie' | 'wysokie';

export interface CargoOption {
  id: string;
  label: string;
  brand: string;
  type: CargoType;
  heightFromMm: number;
  heightToMm: number;
  widthMm: number;
  depthMm: number;
  pricePln: number;
  imageBase64?: string;
  createdAt?: number;
}

export type CornerSystemType = 'prawy' | 'lewy';
export type CornerSystemModelType = 'nerka' | 'obrotowy' | 'wysuwany';

export interface CornerSystemOption {
  id: string;
  label: string;
  brand: string;
  type: CornerSystemType;
  modelType: CornerSystemModelType;
  heightFromMm: number;
  heightToMm: number;
  widthMm: number;
  depthMm: number;
  pricePln: number;
  imageBase64?: string;
  createdAt?: number;
}

export type ActiveTab = 'finishes' | 'handles' | 'hdf' | 'drawers' | 'countertops' | 'cargo' | 'cornerSystems';
