import type { CheckResult } from "flowlock-plugin-sdk";
import { ErrorCodes } from "flowlock-shared";

/**
 * Format check results for console output with enhanced error details
 */
export function formatCheckResult(result: CheckResult): string {
  let output = "";
  
  // Status indicator
  const statusIcon = result.status === "pass" ? "✅" : result.level === "error" ? "❌" : "⚠️";
  const levelColor = result.level === "error" ? "\x1b[31m" : result.level === "warning" ? "\x1b[33m" : "\x1b[32m";
  const reset = "\x1b[0m";
  
  output += `${statusIcon} ${levelColor}[${result.id}]${reset} ${result.message}\n`;
  
  // Add enhanced details if available
  if (result.details && typeof result.details === "object") {
    const details = result.details as any;
    
    if (details.location) {
      output += `  📍 Location: ${details.location}\n`;
    }
    
    if (details.expected !== undefined && details.actual !== undefined) {
      output += `  ❌ Expected: ${JSON.stringify(details.expected)}\n`;
      output += `  ⚠️  Actual: ${JSON.stringify(details.actual)}\n`;
    }
    
    if (details.suggestion) {
      output += `  💡 Fix: ${details.suggestion}\n`;
    }
    
    if (details.documentation) {
      output += `  📚 Docs: ${details.documentation}\n`;
    }
    
    if (details.context && Object.keys(details.context).length > 0) {
      output += `  🔍 Context: ${JSON.stringify(details.context, null, 2).replace(/\n/g, "\n    ")}\n`;
    }
  }
  
  return output;
}

/**
 * Format multiple check results into a summary report
 */
export function formatCheckSummary(results: CheckResult[]): string {
  const passed = results.filter(r => r.status === "pass");
  const failed = results.filter(r => r.status === "fail");
  const errors = failed.filter(r => r.level === "error");
  const warnings = failed.filter(r => r.level === "warning");
  
  let output = "\n=== FlowLock Check Summary ===\n\n";
  
  // Overall status
  if (errors.length === 0 && warnings.length === 0) {
    output += "✅ All checks passed!\n\n";
  } else {
    output += `❌ ${errors.length} error${errors.length !== 1 ? "s" : ""}, `;
    output += `⚠️  ${warnings.length} warning${warnings.length !== 1 ? "s" : ""}\n\n`;
  }
  
  // Group by error code for better organization
  const byCode = new Map<string, CheckResult[]>();
  for (const result of failed) {
    const code = (result.details as any)?.code || "UNKNOWN";
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code)!.push(result);
  }
  
  // Display grouped errors
  if (errors.length > 0) {
    output += "=== Errors ===\n";
    for (const result of errors) {
      output += formatCheckResult(result);
      output += "\n";
    }
  }
  
  // Display grouped warnings
  if (warnings.length > 0) {
    output += "=== Warnings ===\n";
    for (const result of warnings) {
      output += formatCheckResult(result);
      output += "\n";
    }
  }
  
  // Summary statistics
  output += "=== Statistics ===\n";
  output += `Total checks: ${results.length}\n`;
  output += `Passed: ${passed.length}\n`;
  output += `Failed: ${failed.length}\n`;
  
  // Most common issues
  if (byCode.size > 0) {
    output += "\n=== Most Common Issues ===\n";
    const sorted = Array.from(byCode.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);
    
    for (const [code, items] of sorted) {
      const codeDesc = getCodeDescription(code);
      output += `  ${code}: ${codeDesc} (${items.length} occurrence${items.length !== 1 ? "s" : ""})\n`;
    }
  }
  
  // Helpful links
  if (failed.length > 0) {
    output += "\n=== Need Help? ===\n";
    output += "📚 Troubleshooting Guide: https://flowlock.dev/docs/troubleshooting\n";
    output += "💬 Discord: https://discord.gg/flowlock\n";
    output += "🐛 Report Issue: https://github.com/flowlock/flowlock/issues\n";
  }
  
  return output;
}

/**
 * Get human-readable description for error codes
 */
function getCodeDescription(code: string): string {
  const descriptions: Record<string, string> = {
    [ErrorCodes.INVENTORY_MISSING]: "Inventory file not found",
    [ErrorCodes.INVENTORY_ENTITY_MISMATCH]: "Entity mismatch between spec and database",
    [ErrorCodes.INVENTORY_FIELD_MISMATCH]: "Field mismatch between spec and database",
    [ErrorCodes.INVENTORY_API_MISMATCH]: "API endpoint not found",
    [ErrorCodes.INVENTORY_UI_READ_INVALID]: "UI reads field without provenance",
    [ErrorCodes.VALIDATION_MISSING_FIELD]: "Required field missing",
    [ErrorCodes.VALIDATION_TYPE_MISMATCH]: "Type mismatch",
    [ErrorCodes.VALIDATION_STATE_INVALID]: "Invalid state",
    [ErrorCodes.FLOW_UNREACHABLE_SCREEN]: "Screen unreachable in flow",
    [ErrorCodes.FLOW_DEPTH_EXCEEDED]: "Flow depth exceeds limit",
    [ErrorCodes.SCREEN_INVALID_READ]: "Screen reads uncaptured field",
    [ErrorCodes.DETERMINISM_UNREACHABLE_STATE]: "Unreachable state in state machine",
    "UNKNOWN": "Unknown error"
  };
  
  return descriptions[code] || "Unspecified error";
}

/**
 * Export results to JSON with full details
 */
export function exportResultsJSON(results: CheckResult[]): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === "pass").length,
      failed: results.filter(r => r.status === "fail").length,
      errors: results.filter(r => r.level === "error").length,
      warnings: results.filter(r => r.level === "warning").length
    },
    results: results,
    version: "2.0.0" // Updated format version
  }, null, 2);
}