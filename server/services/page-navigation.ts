import type { Link } from "@shared/schema";

export function generateNavigationScript(pageLinks: Link[]): string {
  if (pageLinks.length === 0) return '';

  return `
// Page navigation functionality - Auto-generated
document.addEventListener('DOMContentLoaded', function() {
  console.log('Setting up page navigation for ${pageLinks.length} links');
  
  ${pageLinks.map(link => `
    // Navigation for: "${link.triggerText}" -> ${link.toPageId}
    (function() {
      const triggerText = '${link.triggerText}';
      const linkType = '${link.linkType}';
      const targetPageId = '${link.toPageId}';
      
      // Find specific elements matching the trigger text more precisely
      const elements = [];
      
      // First try to find exact matches for interactive elements
      const interactiveSelectors = [
        'button', 'a', 'input[type="submit"]', 'input[type="button"]',
        '[role="button"]', '[role="link"]', '.btn', '.button', '.link',
        '[onclick]', '[data-action]', '[data-click]'
      ];
      
      for (const selector of interactiveSelectors) {
        const matches = Array.from(document.querySelectorAll(selector)).filter(el => {
          const text = el.textContent && el.textContent.trim();
          return text && text.toLowerCase() === triggerText.toLowerCase();
        });
        elements.push(...matches);
      }
      
      // If no exact matches found, look for elements that contain the text but prioritize smaller elements
      if (elements.length === 0) {
        const allMatches = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent && el.textContent.trim();
          return text && text.toLowerCase().includes(triggerText.toLowerCase());
        });
        
        // Sort by text length to prioritize more specific matches
        allMatches.sort((a, b) => {
          const aText = a.textContent?.trim() || '';
          const bText = b.textContent?.trim() || '';
          return aText.length - bText.length;
        });
        
        // Take only the most specific match (shortest text that contains our trigger)
        if (allMatches.length > 0) {
          elements.push(allMatches[0]);
        }
      }
      
      console.log('Found ' + elements.length + ' elements for trigger "' + triggerText + '"');
      
      elements.forEach(function(element) {
        // Style the clickable element
        element.style.cursor = 'pointer';
        element.style.transition = 'all 0.2s ease';
        
        if (linkType === 'button') {
          element.style.backgroundColor = '#3b82f6';
          element.style.color = 'white';
          element.style.padding = '8px 16px';
          element.style.borderRadius = '6px';
          element.style.border = 'none';
        } else if (linkType === 'link') {
          element.style.color = '#3b82f6';
          element.style.textDecoration = 'underline';
        }
        
        // Add hover effects
        element.addEventListener('mouseenter', function() {
          if (linkType === 'button') {
            element.style.backgroundColor = '#2563eb';
          } else {
            element.style.color = '#1d4ed8';
          }
        });
        
        element.addEventListener('mouseleave', function() {
          if (linkType === 'button') {
            element.style.backgroundColor = '#3b82f6';
          } else {
            element.style.color = '#3b82f6';
          }
        });
        
        // Add click handler for navigation
        element.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Navigating from "' + triggerText + '" to page: ' + targetPageId);
          window.location.href = '/preview/' + targetPageId;
        });
        
        console.log('Setup navigation for element:', element);
      });
    })();
  `).join('\n')}
});
`;
}