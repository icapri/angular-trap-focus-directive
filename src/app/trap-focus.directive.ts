import {
  Directive,
  ElementRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';

/**
 * Represents the types of disableable HTML elements.
 */
export type DisableableHTMLElement =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLOptGroupElement
  | HTMLOptionElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

/**
 * Represents the types of focusable HTML elements.
 */
export type FocusableHTMLElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLAnchorElement
  | HTMLButtonElement
  | HTMLAreaElement;

/**
 * Defines a directive for focus trapping.
 */
@Directive({
  selector: '[mouTrapFocus]',
})
export class TrapFocusDirective implements AfterViewInit {
  /**
   * Contains the list of disableable HTML elements.
   */
  private static _disableableElements: ReadonlyArray<string> = [
    'BUTTON',
    'FIELDSET',
    'INPUT',
    'KEYGEN',
    'OPTGROUP',
    'OPTION',
    'SELECT',
    'TEXTAREA',
  ] as const;

  /**
   * Contains the list of focusable HTML elements.
   */
  private static _focusableElements: ReadonlyArray<string> = [
    '[tabindex]:not([tabindex="-1"])',
    'a[href]',
    'button:not(:disabled)',
    'fieldset:not(:disabled)',
    'input:not(:disabled)',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
  ];

  /**
   * Gets the native element to which this directive is applied.
   */
  private get element(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  /** Contains the first focusable child element. */
  private _firstFocusableChild?: HTMLElement;

  /** Contains the last focusable child element. */
  private _lastFocusableChild?: HTMLElement;

  /**
   * Initializes a new instance of the directive.
   * @param elementRef Contains a reference to the element to which the directive is applied.
   */
  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  /** @private */
  private static isDisableableElement(
    element: HTMLElement
  ): element is DisableableHTMLElement {
    return (
      TrapFocusDirective._disableableElements.indexOf(element.tagName) !== -1
    );
  }

  /** @private */
  private static isDisabledHTMLElement(element: HTMLElement): boolean {
    const isDisabledDisableable =
      TrapFocusDirective.isDisableableElement(element) && element.disabled;
    const isDisabledUndisableable = element.style.pointerEvents === 'none';
    return isDisabledDisableable || isDisabledUndisableable;
  }

  /**
   * Initializes the focusable HTML elements.
   */
  ngAfterViewInit() {
    if (this.element) {
      this.initializeFocusableElements();
    }
  }

  /** @private */
  private initializeFocusableElements(): void {
    const focusableElements = this.getFocusableChildren();
    if (focusableElements.length < 1) {
      return; // nothing to focus
    }
    // initialize the first and the last focusable HTML element
    this._firstFocusableChild = focusableElements[0];
    this._lastFocusableChild = focusableElements[focusableElements.length - 1];
  }

  /**
   * Traps the focus inside the HTML element to which this directive is applied once
   * the user navigates per tab inside it.
   *
   * @param event Contains the emitted keyboard event.
   */
  @HostListener('keydown', ['$event'])
  trapFocus(event: KeyboardEvent) {
    const firstFocusableChild = this._firstFocusableChild;
    const lastFocusableChild = this._lastFocusableChild;
    // there should be at least one focusable element, so stop listening for now
    if (!firstFocusableChild || !lastFocusableChild) {
      return;
    }

    // handle the case when Shift + Tab have been clicked same time
    if (event.shiftKey) {
      if (document.activeElement === firstFocusableChild) {
        lastFocusableChild.focus();
        event.preventDefault();
      }
    } else {
      // handle tab
      if (document.activeElement === lastFocusableChild) {
        firstFocusableChild.focus();
        event.preventDefault();
      }
    }
  }

  /** @private */
  private getFocusableChildren(): HTMLElement[] {
    const selector = TrapFocusDirective._focusableElements.join(', ');
    const focusableElements =
      this.element.querySelectorAll<HTMLElement>(selector);
    // filter out the disabled elements and return the rest
    return Array.from(focusableElements).filter(
      (e) => !TrapFocusDirective.isDisabledHTMLElement(e)
    );
  }
}
