import { ChangeDetectorRef, Injectable, OnDestroy,
  Pipe, PipeTransform } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { ITranslateParams } from '../interfaces';
import { TranslationService } from '../Services/translation.service';
import { isDefined } from '../util';


@Injectable()
@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  value: string = '';
  
  // Observable for detecting locale changes
  localeChanged$ = new Observable<string>();
  _localeChangeSubscription: Subscription = new Subscription;

  constructor(private translationService: TranslationService,
    private _ref: ChangeDetectorRef) { }

  updateValue(str: string, params: ITranslateParams): void {
    this.value = this.translationService.translate(str, params);
    this._ref.markForCheck();
  }

  transform(str: string, ...args: any[]): any {
    if (!str || !str.length) {
      return str;
    }

    let params: Object = {};
    if (isDefined(args[0]) && args.length) {
      if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
        params = args[0];
      }
    }

    this.updateValue(str, params);

    // subscribe to localeChanged$ observable, in case the language changes
    if (!this.localeChanged$) {
      this.localeChanged$ = this.translationService.localeChanged;
      this._localeChangeSubscription = this.localeChanged$.subscribe(() => {
        this.updateValue(str, params);
      });
    }

    return this.value;
  }

  ngOnDestroy() {
    this._localeChangeSubscription.unsubscribe();
  }
}
