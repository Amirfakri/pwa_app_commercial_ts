// backend/src/modules/support/types/support.types.ts

export interface ITermsAndConditions {
  id: number;
  content: string;
  version: string;
  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateTermsInput {
  content: string;
}

export interface ITermsHistory {
  id: number;
  content: string;
  version: string;
  is_active: boolean;
  created_at: Date;
  created_by_name: string;
}

export interface IUserTermsAcceptance {
  id: number;
  user_id: number;
  terms_version: string;
  accepted_at: Date;
}

export interface IPageDescription {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateDescriptionInput {
  id: string;
  title: string;
  content: string;
  is_active?: boolean;
  display_order?: number;
}

export interface IUpdateDescriptionInput {
  title?: string;
  content?: string;
  is_active?: boolean;
  display_order?: number;
}

export const PAGE_IDS = {
  BOX_1: 'box_1',
  BOX_2: 'box_2',
  BOX_3: 'box_3',
  BOX_4: 'box_4',
  BOX_5: 'box_5',
  BOX_6: 'box_6',
  BOX_7: 'box_7',
  BOX_8: 'box_8',
  BOX_9: 'box_9',
  BOX_10: 'box_10',
} as const;

export type PageId = typeof PAGE_IDS[keyof typeof PAGE_IDS];