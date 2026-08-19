import { SupportedLanguageCode } from './translation.types';
import { translationManager } from './TranslationManager';
import { TranslationProtector } from './TranslationProtector';

interface QueuedItem {
  node: Node;
  canonicalText: string;
  attrName?: string;
  leadingSpace?: string;
  trailingSpace?: string;
}

/**
 * DomTranslationRuntime
 *
 * Universal, React-safe DOM discovery and translation controller for EduTrack ERP.
 * Automatically discovers visible UI text, placeholders, tooltips, and accessibility labels across all pages,
 * maintaining pristine canonical English source strings in a WeakMap without DOM pollution or mutation loops.
 */
export class DomTranslationRuntime {
  private static instance: DomTranslationRuntime;

  private currentLang: SupportedLanguageCode = 'en';
  private observer: MutationObserver | null = null;
  private isObserving = false;

  // WeakMaps for canonical pristine English storage
  private canonicalTextMap = new WeakMap<Node, string>();
  private canonicalAttrMap = new WeakMap<Element, Map<string, string>>();

  // Loop-prevention guard set
  private mutatingNodes = new WeakSet<Node>();

  // 50ms debounced batch queue
  private queue = new Map<string, QueuedItem[]>();
  private debounceTimer: any = null;
  private readonly DEBOUNCE_MS = 50;

  // Track observed elements for clean language switching
  private registeredElements = new Set<Element>();

  private constructor() {
    // Initialized as singleton
  }

  public static getInstance(): DomTranslationRuntime {
    if (!DomTranslationRuntime.instance) {
      DomTranslationRuntime.instance = new DomTranslationRuntime();
    }
    return DomTranslationRuntime.instance;
  }

  /**
   * Initializes the DOM translation observer and runs initial sweep.
   */
  public start(lang: SupportedLanguageCode): void {
    this.currentLang = lang;

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (!this.observer) {
      this.observer = new MutationObserver(this.handleMutations.bind(this));
    }

    if (!this.isObserving && document.body) {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['placeholder', 'aria-label', 'title', 'alt'],
      });
      this.isObserving = true;
    }

    // Sweep document on start
    this.sweepDocument();
  }

  /**
   * Stops the MutationObserver.
   */
  public stop(): void {
    if (this.observer && this.isObserving) {
      this.observer.disconnect();
      this.isObserving = false;
    }
  }

  /**
   * Updates active target language and sweeps document/portals.
   */
  public setLanguage(lang: SupportedLanguageCode): void {
    if (this.currentLang === lang) return;
    this.currentLang = lang;

    if (typeof document === 'undefined') return;

    if (lang === 'en') {
      // Revert all registered nodes to their pristine canonical English baseline
      this.restoreEnglishBaseline();
    } else {
      // Sweep and translate all visible nodes into the new target language
      this.sweepDocument();
    }
  }

  /**
   * Performs a comprehensive sweep of the document body, active routes, and open portals.
   */
  public sweepDocument(): void {
    if (typeof document === 'undefined' || !document.body) return;

    // Scan main document tree
    this.scanSubtree(document.body);

    // Scan any React portals outside body main hierarchy (modals, popovers, tooltips)
    const portals = document.querySelectorAll(
      '[data-radix-popper-content-wrapper], [role="dialog"], [role="menu"], [role="tooltip"], [data-state="open"]'
    );
    portals.forEach((portal) => {
      this.scanSubtree(portal);
    });

    this.scheduleBatchFlush();
  }

  /**
   * Handles DOM mutation events with strict loop prevention.
   */
  private handleMutations(mutations: MutationRecord[]): void {
    if (this.currentLang === 'en') return;

    for (const mutation of mutations) {
      // Skip mutations triggered by our own runtime
      if (this.mutatingNodes.has(mutation.target)) {
        this.mutatingNodes.delete(mutation.target);
        continue;
      }

      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.scanSubtree(node as Element);
          } else if (node.nodeType === Node.TEXT_NODE) {
            this.processTextNode(node);
          }
        });
      } else if (mutation.type === 'characterData') {
        if (mutation.target.nodeType === Node.TEXT_NODE) {
          this.processTextNode(mutation.target);
        }
      } else if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
        this.processElementAttributes(mutation.target as Element, mutation.attributeName || undefined);
      }
    }

    this.scheduleBatchFlush();
  }

  /**
   * Recursively scans an element and its children for translatable text nodes and attributes.
   */
  public scanSubtree(root: Element): void {
    if (!root || this.isExplicitlyProtectedElement(root)) return;

    this.registeredElements.add(root);
    this.processElementAttributes(root);

    // Traverse all child elements and text nodes
    const allElements = root.querySelectorAll('*');
    allElements.forEach((el) => {
      if (!this.isExplicitlyProtectedElement(el)) {
        this.registeredElements.add(el);
        this.processElementAttributes(el);
      }
    });

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (this.isExplicitlyProtectedElement(node as Element)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_SKIP;
          }
          if (node.nodeType === Node.TEXT_NODE) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      }
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        this.processTextNode(currentNode);
      }
      currentNode = walker.nextNode();
    }
  }

  /**
   * Processes an individual Text node.
   */
  private processTextNode(node: Node): void {
    const rawVal = node.nodeValue;
    if (!rawVal || !rawVal.trim()) return;

    // Check if canonical English string is already recorded
    let canonical = this.canonicalTextMap.get(node);
    if (!canonical) {
      canonical = rawVal.trim();
      this.canonicalTextMap.set(node, canonical);
    }

    if (!this.isPlausibleTranslatableString(canonical)) {
      return;
    }

    if (this.currentLang === 'en') {
      if (node.nodeValue !== canonical) {
        this.mutatingNodes.add(node);
        node.nodeValue = canonical;
      }
      return;
    }

    const leadingSpace = rawVal.match(/^\s*/)?.[0] || '';
    const trailingSpace = rawVal.match(/\s*$/)?.[0] || '';

    // Enqueue for batch translation
    this.enqueueItem(canonical, { node, canonicalText: canonical, leadingSpace, trailingSpace });
  }

  /**
   * Processes translatable attributes on an element (placeholder, aria-label, title, alt).
   */
  private processElementAttributes(el: Element, specificAttr?: string): void {
    const targetAttrs = specificAttr ? [specificAttr] : ['placeholder', 'aria-label', 'title', 'alt'];

    let attrMap = this.canonicalAttrMap.get(el);
    if (!attrMap) {
      attrMap = new Map<string, string>();
      this.canonicalAttrMap.set(el, attrMap);
    }

    for (const attr of targetAttrs) {
      if (['placeholder', 'aria-label', 'title', 'alt'].includes(attr)) {
        const val = el.getAttribute(attr);
        if (val && val.trim()) {
          let canonical = attrMap.get(attr);
          if (!canonical) {
            canonical = val.trim();
            attrMap.set(attr, canonical);
          }

          if (this.isPlausibleTranslatableString(canonical)) {
            if (this.currentLang === 'en') {
              if (el.getAttribute(attr) !== canonical) {
                el.setAttribute(attr, canonical);
              }
            } else {
              this.enqueueItem(canonical, { node: el, canonicalText: canonical, attrName: attr });
            }
          }
        }
      }
    }
  }

  /**
   * Adds an item to the debounced batch queue.
   */
  private enqueueItem(key: string, item: QueuedItem): void {
    if (!this.queue.has(key)) {
      this.queue.set(key, []);
    }
    this.queue.get(key)!.push(item);
  }

  /**
   * Schedules a batch queue flush after DEBOUNCE_MS (50ms).
   */
  private scheduleBatchFlush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flushQueue();
    }, this.DEBOUNCE_MS);
  }

  /**
   * Executes the batched translation request and updates DOM nodes.
   */
  private async flushQueue(): Promise<void> {
    if (this.queue.size === 0 || this.currentLang === 'en') {
      this.queue.clear();
      return;
    }

    const uniqueTexts = Array.from(this.queue.keys());
    const queuedSnapshots = new Map(this.queue);
    this.queue.clear();

    const isRtl = this.currentLang === 'ar' || this.currentLang === 'ur';

    try {
      const translationResults = await translationManager.translateBatch(uniqueTexts, this.currentLang);

      for (const [canonicalText, items] of queuedSnapshots.entries()) {
        const translatedText = translationResults.get(canonicalText) || canonicalText;

        for (const item of items) {
          if (item.attrName) {
            // Attribute translation (placeholder, aria-label, etc.)
            const element = item.node as Element;
            if (element && element.getAttribute(item.attrName) !== translatedText) {
              element.setAttribute(item.attrName, translatedText);
            }
          } else {
            // Text node translation with whitespace preservation
            const textNode = item.node;
            const finalString = `${item.leadingSpace || ''}${translatedText}${item.trailingSpace || ''}`;

            if (textNode && textNode.nodeValue !== finalString) {
              this.mutatingNodes.add(textNode);
              textNode.nodeValue = finalString;

              // Apply localized RTL styling strictly to the natural-language text element
              if (isRtl && textNode.parentElement) {
                const parent = textNode.parentElement;
                if (!this.isExplicitlyProtectedElement(parent)) {
                  parent.classList.add('rtl-text');
                }
              }
            }
          }
        }
      }
    } catch {
      // Hard failure boundary: retain pristine English
      for (const [canonicalText, items] of queuedSnapshots.entries()) {
        for (const item of items) {
          if (item.attrName) {
            (item.node as Element).setAttribute(item.attrName, canonicalText);
          } else {
            this.mutatingNodes.add(item.node);
            item.node.nodeValue = `${item.leadingSpace || ''}${canonicalText}${item.trailingSpace || ''}`;
          }
        }
      }
    }
  }

  /**
   * Reverts all nodes and elements to their pristine canonical English baseline.
   */
  private restoreEnglishBaseline(): void {
    this.registeredElements.forEach((el) => {
      // Remove text-level RTL classes
      el.classList.remove('rtl-text');

      // Restore attributes
      const attrMap = this.canonicalAttrMap.get(el);
      if (attrMap) {
        attrMap.forEach((canonical, attr) => {
          el.setAttribute(attr, canonical);
        });
      }
    });

    // Walk document to restore text nodes
    if (document.body) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let textNode = walker.nextNode();
      while (textNode) {
        const canonical = this.canonicalTextMap.get(textNode);
        if (canonical && textNode.nodeValue !== canonical) {
          this.mutatingNodes.add(textNode);
          textNode.nodeValue = canonical;
        }
        textNode = walker.nextNode();
      }
    }
  }

  /**
   * Evaluates whether an element is explicitly protected from translation.
   */
  private isExplicitlyProtectedElement(el: Element): boolean {
    if (!el || !el.tagName) return false;

    // Explicit developer escape hatches
    if (
      el.getAttribute('translate') === 'no' ||
      el.hasAttribute('data-no-translate') ||
      el.getAttribute('data-no-translate') === 'true' ||
      el.getAttribute('data-ltr') === 'true'
    ) {
      return true;
    }

    // Explicit opt-in
    if (el.getAttribute('data-translate') === 'yes') {
      return false;
    }

    const tagName = el.tagName.toUpperCase();

    // Ignored non-text tags
    if (['SCRIPT', 'STYLE', 'CODE', 'PRE', 'KBD', 'CANVAS', 'NOSCRIPT'].includes(tagName)) {
      return true;
    }

    // Skip input/textarea values (we only translate their placeholders via attribute processor)
    if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
      return true;
    }

    // Monospace & technical code classes
    if (
      el.classList.contains('font-mono') ||
      el.classList.contains('notranslate') ||
      el.classList.contains('ltr-isolate')
    ) {
      return true;
    }

    // SVG geometry is protected, but SVG <text> elements are permitted
    if (['PATH', 'RECT', 'CIRCLE', 'LINE', 'POLYGON', 'POLYLINE', 'CLIPPATH', 'DEFS', 'MASK', 'G'].includes(tagName)) {
      return true;
    }

    return false;
  }

  /**
   * Classifies whether a text string is a plausible translatable natural-language UI string.
   * Rejects pure numbers, IDs, UUIDs, emails, phone numbers, currencies, and raw punctuation.
   */
  public isPlausibleTranslatableString(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length <= 1) return false;

    // Must contain at least one letter character (alphabetic word)
    if (!/[a-zA-Z]/.test(trimmed)) {
      return false;
    }

    // Reject standalone Application, Lead, Student, Enquiry, UTR, Receipt IDs
    if (/^(APP|LEAD|ENQ|STU|UTR|REC|TRX|ADM|SEC|BATCH|INV)-\d+/i.test(trimmed)) {
      return false;
    }

    // Reject standalone UUIDs
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed)) {
      return false;
    }

    // Reject standalone Email addresses
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return false;
    }

    // Reject standalone Phone numbers
    if (/^(\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/.test(trimmed)) {
      return false;
    }

    // Reject standalone URLs
    if (/^(https?:\/\/|www\.)\S+$/i.test(trimmed)) {
      return false;
    }

    // Reject pure numbers with symbols (e.g. "12,345", "100%", "+12.5%", "₹ 25,000", "$500")
    if (/^[\d.,%+\-₹$€£\s]+$/.test(trimmed)) {
      return false;
    }

    return true;
  }
}

export const domTranslationRuntime = DomTranslationRuntime.getInstance();
