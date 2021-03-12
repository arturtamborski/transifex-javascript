export interface ITranslationServiceConfig {
  token: string;
  secret: string;
  sourceLocale: string;
}

export interface ILanguage {
  code: string;
  name: string;
  localized_name: string;
}

export interface ITranslateParams {
  _context?: string;
  _comment?: string;
  _charlimit?: number;
  _tags?: string;
  _key?: string;
  _escapeVars?: boolean;
  _inline?: boolean;
}
