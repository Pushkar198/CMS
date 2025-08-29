import { load } from 'cheerio';

export interface ClickableElement {
  text: string;
  type: 'button' | 'link';
  selector: string;
  tagName: string;
}

export function extractClickableElements(html: string): ClickableElement[] {
  const $ = load(html);
  const clickableElements: ClickableElement[] = [];

  // Extract buttons
  $('button').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    if (text && text.length > 0 && text.length < 50) {
      clickableElements.push({
        text,
        type: 'button',
        selector: getUniqueSelector($, element),
        tagName: 'button'
      });
    }
  });

  // Extract links (a tags)
  $('a').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    if (text && text.length > 0 && text.length < 50) {
      clickableElements.push({
        text,
        type: 'link',
        selector: getUniqueSelector($, element),
        tagName: 'a'
      });
    }
  });

  // Extract elements that look like navigation items
  $('nav a, .nav a, .navigation a, .menu a, .sidebar a').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    if (text && text.length > 0 && text.length < 50) {
      clickableElements.push({
        text,
        type: 'link',
        selector: getUniqueSelector($, element),
        tagName: $el.prop('tagName')?.toLowerCase() || 'a'
      });
    }
  });

  // Extract clickable divs and spans that might be styled as buttons
  $('div[onclick], span[onclick], div.button, span.button, .btn, .click').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    if (text && text.length > 0 && text.length < 50) {
      clickableElements.push({
        text,
        type: 'button',
        selector: getUniqueSelector($, element),
        tagName: $el.prop('tagName')?.toLowerCase() || 'div'
      });
    }
  });

  // Extract elements with common clickable classes and attributes
  $('[role="button"], [role="link"], .clickable, .interactive, [data-action], [data-click]').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    if (text && text.length > 0 && text.length < 50) {
      clickableElements.push({
        text,
        type: 'button',
        selector: getUniqueSelector($, element),
        tagName: $el.prop('tagName')?.toLowerCase() || 'div'
      });
    }
  });

  // Extract input elements that can be clicked (submit, button)
  $('input[type="submit"], input[type="button"]').each((_, element) => {
    const $el = $(element);
    const text = $el.attr('value') || $el.text().trim();
    if (text && text.length > 0 && text.length < 50) {
      clickableElements.push({
        text,
        type: 'button',
        selector: getUniqueSelector($, element),
        tagName: 'input'
      });
    }
  });

  // Extract elements with common navigation/action text patterns
  $('*').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    const directText = $el.clone().children().remove().end().text().trim();
    
    // Check if element has direct text and seems clickable based on common patterns
    const clickablePatterns = /^(home|about|contact|services|products|blog|news|login|signup|register|submit|send|buy|shop|cart|menu|search|more|learn|get|start|try|download|watch|read|view|explore|discover|join|follow|share|like|comment|reply|edit|delete|save|cancel|continue|next|previous|back|settings|profile|logout|sign out|sign in)$/i;
    
    if (directText && directText.length > 0 && directText.length < 30 && clickablePatterns.test(directText)) {
      // Check if it's not already captured and has some clickable styling indicators
      const hasClickableStyle = $el.css('cursor') === 'pointer' || 
                                $el.is('button, a, input[type="submit"], input[type="button"]') ||
                                $el.hasClass('btn') || $el.hasClass('button') || $el.hasClass('link') ||
                                $el.attr('onclick') || $el.attr('role') === 'button' || $el.attr('role') === 'link';
      
      if (hasClickableStyle && !clickableElements.some(el => el.text === directText)) {
        clickableElements.push({
          text: directText,
          type: $el.is('a') ? 'link' : 'button',
          selector: getUniqueSelector($, element),
          tagName: $el.prop('tagName')?.toLowerCase() || 'div'
        });
      }
    }
  });

  // Remove duplicates based on text content
  const unique = new Map<string, ClickableElement>();
  clickableElements.forEach(element => {
    if (!unique.has(element.text)) {
      unique.set(element.text, element);
    }
  });

  return Array.from(unique.values());
}

function getUniqueSelector($: any, element: any): string {
  const $el = $(element);
  
  // Try ID first
  const id = $el.attr('id');
  if (id) {
    return `#${id}`;
  }

  // Try class
  const className = $el.attr('class');
  if (className) {
    const classes = className.split(' ').filter((c: string) => c.length > 0);
    if (classes.length > 0) {
      return `.${classes[0]}`;
    }
  }

  // Fallback to tag name with text content
  const text = $el.text().trim();
  const tagName = $el.prop('tagName')?.toLowerCase() || 'element';
  return `${tagName}:contains("${text.substring(0, 20)}")`;
}