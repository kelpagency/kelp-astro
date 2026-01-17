export function sanitizeHtml(input = '') {
  let output = input;

  // Drop high-risk script tags entirely.
  output = output.replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, '');

  // Strip inline event handlers.
  output = output.replace(/\son\w+="[^"]*"/gi, '');
  output = output.replace(/\son\w+='[^']*'/gi, '');
  output = output.replace(/\son\w+=\S+/gi, '');

  // Neutralize javascript: URLs.
  output = output.replace(/\s(href|src)=["']\s*javascript:[^"']*["']/gi, ' $1="#"');

  return output;
}
