import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { ITranslationServiceConfig } from '../interfaces';

const { tx, t } = require('@transifex/native');

/** Singleton Injection */
@Injectable({
  providedIn: 'root'
})

/**
 * Service which wraps the Transifex Native library for using
 * inside components
 */
export class TranslationService {
  // Observable for detecting locale change
  private _localeChanged = new ReplaySubject<string>(0);
  localeChanged = this._localeChanged.asObservable();

  // Observable for detecting translation change
  private _contentTranslated = new ReplaySubject<string>(0);
  contentTranslated = this._contentTranslated.asObservable();

  constructor() { }

  /**
   * Initializes the translation service
   * @param {ITranslationServiceConfig} config
   * @returns void
   */
  public async init(config: ITranslationServiceConfig) {
    tx.init({
      token: config.token,
      secret: config.secret,
      sourceLocale: config.sourceLocale,
    });
    await this.getLanguages();
  }

  /**
   * Sets the current locale
   * @param {string} locale
   * @returns void
   */
  public async setLocale(locale: string) {
    await tx.setCurrentLocale(locale);
    this._localeChanged.next(locale);
  }

  /**
   * Gets the current locale
   * @returns string
   */
  public getLocale(): string {
    return tx.currentLocale || '';
  }

  /**
   * Gets the languages collection
   * @returns any
   */
  public async getLanguages() {
    return await tx.getLanguages();
  }

  /**
   * Translate a string
   * @param {string} str
   * @param {Object} params
   * @returns void
   */
  public translate(str: string, params: Object): string {
    this._contentTranslated.next(tx.currentLocale || '');
    return t(str, params);
  }
}

