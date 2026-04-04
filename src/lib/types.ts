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

export type ActiveTab = 'finishes' | 'handles' | 'hdf';
