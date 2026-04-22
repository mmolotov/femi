<script>
  import { reportGeneratedAt } from "./generated/report-build-metadata.js";

  const formattedGeneratedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(reportGeneratedAt));
</script>

<p class="report-generated-at">Generated at {formattedGeneratedAt} UTC</p>

<style>
  .report-generated-at {
    color: var(--theme-foreground-2, #667085);
    font-size: 0.875rem;
    margin: -0.35rem 0 1.25rem;
  }
</style>
