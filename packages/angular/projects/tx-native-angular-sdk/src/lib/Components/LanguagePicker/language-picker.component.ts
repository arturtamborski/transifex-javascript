import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { ILanguage } from '../../interfaces';
import { TranslationService } from '../../Services/translation.service';

@Component({
  selector: 'tx-language-picker',
  templateUrl: './language-picker.component.html',
  styleUrls: ['./language-picker.component.css']
})

/**
 * A language picker component with the available languages
 * already populated
 */
export class LanguagePickerComponent implements OnInit {
  @Input()
  className: string = '';

  @Output()
  localeChanged: EventEmitter<string> = new EventEmitter<string>();

  languages: ILanguage[] = [];

  /**
   * Constructor
   * @param {TranslationService} translationService
   */
  constructor(public translationService: TranslationService) {
    this.getLanguages.bind(this);
  }

  ngOnInit(): void {
    this.getLanguages();
  }

  /**
   * Retrieves the available languages
   * @param {TranslationService} translationService
   */  
  async getLanguages() {
    this.languages = await this.translationService.getLanguages();
  }

  /**
   * Handles language selection changes
   * @param {Event} event
   */   
  async onChange(event: Event) {
    const locale = (event.target as HTMLSelectElement).value || '';
    await this.translationService.setLocale(locale);
    this.localeChanged.emit(locale);
  }
}
