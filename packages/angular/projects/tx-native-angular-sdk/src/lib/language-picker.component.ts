import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { TXInstanceComponent } from './instance.component';
import { ILanguage } from './interfaces';
import { TranslationService } from './translation.service';

@Component({
  selector: 'tx-language-picker',
  template: `
    <select [class]="className" (change)="onChange($event)" class="tx-language-picker">
      <option *ngFor="let language of languages"
        [selected]="language.code === currentLocale"
        [value]="language.code">
      {{ language.localized_name || language.name }}
      </option>
    </select>
  `,
  styles: [],
})

/**
 * A language picker component with the available languages
 * already populated
 */
export class LanguagePickerComponent implements OnInit, OnDestroy {
  @Input()
    className = '';

  @Output()
    localeChanged: EventEmitter<string> = new EventEmitter<string>();

  languages: ILanguage[] = [];

  // The locale selected on the TX Native instance
  get currentLocale(): string {
    return this.getCurrentLocale();
  }

  // Current language picker TXNative instance
  get activeInstance(): string {
    return this.instance.alias || '';
  }

  // Observable for detecting instance readiness
  get instanceReady(): Observable<boolean> {
    return this.instance.instanceIsReady;
  }

  // Subscription to instance ready event to refresh languages
  instanceIsReadySubscription!: Subscription;

  /**
   * Constructor
   *
   * @param translationService
   */
  constructor(public translationService: TranslationService,
    public instance: TXInstanceComponent) {
    this.getLanguages.bind(this);

    // When there is an alternative instance, listen to its readiness
    // and retrieve the languages again
    this.instanceIsReadySubscription =
      this.instanceReady.subscribe(
        async (ready) => {
          if (ready) {
            this.languages = [];
            await this.getLanguages();
          }
        },
      );
  }

  ngOnInit(): void {
    // Do not retrieve languages in the initialization
    // if alternative instace found, will fetch languages
    // when the instance is ready using a subscription
    if (this.instance && this.instance.alias) {
      return;
    }
    this.getLanguages();
  }

  /**
   * Retrieves the available languages
   *
   * @param translationService
   */
  async getLanguages() {
    this.languages =
      await this.translationService.getLanguages(this.activeInstance);
  }

  /**
   * Handles language selection changes
   *
   * @param event
   */
  async onChange(event: Event) {
    const locale: string = (event.target as HTMLSelectElement).value;
    await this.translationService.setCurrentLocale(locale,
      this.activeInstance);
    this.localeChanged.emit(locale);
  }

  /**
   * Returns the current locale from the active instance
   *
   * @param translationService
   */
  getCurrentLocale() {
    return this.translationService.getCurrentLocale(this.activeInstance);
  }

  /**
   * Component destruction
   */
  ngOnDestroy() {
    this.instanceIsReadySubscription.unsubscribe();
  }
}
