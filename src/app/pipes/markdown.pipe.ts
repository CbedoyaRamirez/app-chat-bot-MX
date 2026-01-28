import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {
    // Configure marked options for better rendering
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true // Enable GitHub Flavored Markdown
    });
  }

  transform(value: string): SafeHtml {
    if (!value) {
      return '';
    }

    try {
      // Parse markdown to HTML
      const html = marked.parse(value) as string;

      // Sanitize and return as safe HTML
      return this.sanitizer.sanitize(1, html) || '';
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return value; // Return original text if parsing fails
    }
  }
}
