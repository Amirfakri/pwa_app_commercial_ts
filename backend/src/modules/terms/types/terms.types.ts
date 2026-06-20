// backend/src/modules/terms/types/terms.types.ts

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

export interface ITermsHistoryResponse {
  id: number;
  content: string;
  version: string;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

export interface IUserTermsAcceptance {
  user_id: number;
  terms_version: string;
  accepted_at: Date;
}

export interface ITermsAcceptanceStatus {
  hasAccepted: boolean;
  latestVersion: string | null;
  userVersion: string | null;
  needsAcceptance: boolean;
}