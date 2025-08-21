import type { CheckResult } from 'flowlock-plugin-sdk';

export function generateJUnitXML(results: CheckResult[]): string {
  const timestamp = new Date().toISOString();
  const tests = results.length;
  const failures = results.filter(r => r.status === 'fail').length;
  const errors = results.filter(r => r.level === 'error' && r.status === 'fail').length;
  
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuites name="FlowLock UX Checks" tests="${tests}" failures="${failures}" errors="${errors}" time="0">`,
    `  <testsuite name="UX Specification Checks" tests="${tests}" failures="${failures}" errors="${errors}" timestamp="${timestamp}">`,
  ];
  
  for (const result of results) {
    const name = result.id.replace(/_/g, '.');
    const className = result.id.split('_')[0] || 'check';
    
    if (result.status === 'pass') {
      lines.push(`    <testcase name="${name}" classname="${className}" />`);
    } else if (result.status === 'skip') {
      lines.push(`    <testcase name="${name}" classname="${className}">`);
      lines.push(`      <skipped message="${escapeXML(result.message)}" />`);
      lines.push('    </testcase>');
    } else {
      const elementType = result.level === 'error' ? 'failure' : 'failure';
      lines.push(`    <testcase name="${name}" classname="${className}">`);
      lines.push(`      <${elementType} type="${result.level}" message="${escapeXML(result.message)}">`);
      if (result.ref) {
        lines.push(`        Reference: ${escapeXML(result.ref)}`);
      }
      lines.push(`      </${elementType}>`);
      lines.push('    </testcase>');
    }
  }
  
  lines.push('  </testsuite>');
  lines.push('</testsuites>');
  
  return lines.join('\n');
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}