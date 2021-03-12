import { ModuleWithProviders, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { LanguagePickerComponent } from './Components/LanguagePicker/language-picker.component';
import { TComponent } from './Components/T/T.component';
import { UTComponent } from './Components/UT/UT.component';
import { TDecoratorService } from './Services/t-decorator.service';
import { TranslationService } from './Services/translation.service';


@NgModule({
  declarations: [TComponent, UTComponent, LanguagePickerComponent],
  imports: [BrowserModule],
  exports: [TComponent, UTComponent, LanguagePickerComponent]
})
export class TxNativeModule {
  // Need to instantiate the decorator service to have it available
  // on the decorator itself
  public constructor(tDecoratorService: TDecoratorService) {}

  /**
   * Use this method in your root module to provide the TranslationService
   */
  static forRoot(): ModuleWithProviders<TxNativeModule> {
    return {
      ngModule: TxNativeModule,
      providers: [
        TranslationService,
        TDecoratorService
      ]
    };
  }

  /**
   * Use this method in your other (non root) modules to import the directive/pipe
   */
  static forChild(): ModuleWithProviders<TxNativeModule> {
    return {
      ngModule: TxNativeModule,
      providers: [
        TranslationService,
        TDecoratorService
      ]
    };
  }
}
