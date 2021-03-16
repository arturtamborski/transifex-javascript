import { Component, Input, OnDestroy,
  OnInit, SimpleChanges } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { ITranslateParams } from '../../interfaces';
import { TranslationService } from '../../Services/translation.service';

@Component({
  selector: 'T',
  template: '{{ _translatedStr }}',
  styles: []
})

/**
 * A translation component
 * @param {string} _str
 * @param {string=} _key
 * @param {string=} _context
 * @param {string=} _comment
 * @param {number=} _charlimit
 * @param {string=} _tags
 * @param {boolean=} _escapeVars
 * @param {boolean=} _inline
 * @param {Object=} _vars
 */
export class TComponent implements OnInit, OnDestroy {
  @Input()
  _str: string = '';
  @Input()
  _key?: string = '';
  @Input()
  _context?: string = '';
  @Input()
  _comment?: string = '';
  @Input()
  _charlimit?: number = 0;
  @Input()
  _tags?: string = '';
  @Input()
  _escapeVars?: boolean = false;
  @Input()
  _inline?: boolean = false;
  @Input()
  _vars?: Object = {};

  _translateParams: ITranslateParams = {
    _key: '',
    _context: '',
    _comment: '',
    _charlimit: 0,
    _tags: '',
    _escapeVars: false,
    _inline: false,
  };
  _translatedStr: string = '';

  // Observable for detecting locale changes
  _localeChanged = new Observable<string>();
  _localeChangeSubscription: Subscription;

  /**
   * Constructor
   * @param {TranslationService} translationService
   */
  constructor(protected translationService: TranslationService) {
    this._localeChanged = translationService.localeChanged;
    this._localeChangeSubscription = this._localeChanged.subscribe(
      (locale) => {
        Object.assign(this._translateParams, {
          _key: this._key,
          _context: this._context,
          _comment: this._comment,
          _charlimit: this._charlimit,
          _tags: this._tags,
          _escapeVars: this._escapeVars,
          _inline: this._inline,
        });
        this.translate();
      });
  }

  ngOnInit() { }

  ngOnDestroy() {
    this._localeChangeSubscription.unsubscribe();
  }

  /**
   * Input parameters change detector
   * @param {SimpleChanges} changes
   */
  ngOnChanges(changes: SimpleChanges) {
    this.translate();
  }

  /**
   * Translate a string using the translation service
   */
  translate() {
    this._translatedStr =
      this.translationService.translate(this._str,
        {...this._translateParams || {}, ...this._vars || {} });
  }
}
