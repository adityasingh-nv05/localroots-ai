/** Human-readable summary of an analysis. Plain text, no side effects. */
export function formatReport({ entity, source, sourceVersion, checksum, analysis, batchCount }) {
  const lines = [];
  lines.push(`Entity:          ${entity}`);
  lines.push(`Source:          ${source}${sourceVersion ? ` (version ${sourceVersion})` : ' (no version given)'}`);
  if (checksum) lines.push(`SHA-256:         ${checksum}`);
  lines.push(`Rows read:       ${analysis.totalRows}`);
  lines.push(`Accepted:        ${analysis.accepted.length}`);
  lines.push(`Rejected:        ${analysis.rejected.length}`);
  lines.push(`Identical dupes: ${analysis.identicalDuplicates} (dropped, kept once)`);
  if (batchCount !== undefined) lines.push(`Batches:         ${batchCount}`);
  for (const w of analysis.warnings) lines.push(`Warning:         ${w}`);
  for (const r of analysis.rejected.slice(0, 25)) {
    lines.push(`  line ${r.line}${r.externalId ? ` [${r.externalId}]` : ''}: ${r.errors.join(' ')}`);
  }
  if (analysis.rejected.length > 25) lines.push(`  ...and ${analysis.rejected.length - 25} more rejected row(s).`);
  return lines.join('\n');
}
