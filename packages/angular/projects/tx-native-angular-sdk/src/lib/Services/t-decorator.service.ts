import { Injectable } from '@angular/core';
import { TranslationService } from '../Services/translation.service';

/**
 * Service for static injection of translation service into decorator 
 */
@Injectable()
export class TDecoratorService {
     private static service: TranslationService | undefined = undefined;
     public constructor(service: TranslationService) {
      TDecoratorService.service = service;
     }
     public static getService(): TranslationService {
         if(!TDecoratorService.service) {
             throw new Error('TDecoratorService not initialized');
         }
         return TDecoratorService.service;
     }
}