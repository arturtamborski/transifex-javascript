import { ITranslateParams } from '../interfaces';
import { TDecoratorService } from '../Services/t-decorator.service';

/**
 * Decorator for using transparently the translation service as a property
 */
export const T = (str: string, params: ITranslateParams) => {
  return function (target: any, key: string) {
    Object.defineProperty(target, key, { 
      configurable: false,
      get: () => {
        const translation = TDecoratorService.getService().translate(str, params);
        return translation;
      }
    });
  }
}

