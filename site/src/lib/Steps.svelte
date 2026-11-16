<script lang="ts">
  import { content, type Lang } from './content';
  let { lang }: { lang: Lang } = $props();
  const t = $derived(content[lang].flow.d);
</script>

<svg class="diagram" viewBox="0 0 360 300" role="img" aria-label={t.title}>
  <defs>
    <marker id="ar1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor" /></marker>
  </defs>
  <rect class="box" x="30" y="6" width="300" height="56" rx="10" />
  <text class="b" x="180" y="29" text-anchor="middle">{t.s1}</text>
  <text class="m" x="180" y="49" text-anchor="middle">{t.s1s}</text>
  <path class="ln" d="M180 62V92" marker-end="url(#ar1)" />

  <rect class="solid" x="30" y="94" width="300" height="56" rx="10" />
  <text class="b on" x="180" y="117" text-anchor="middle">{t.s2}</text>
  <text class="on" x="180" y="137" text-anchor="middle">{t.s2s}</text>
  <path class="ln" d="M180 150V180" marker-end="url(#ar1)" />

  <rect class="box hl" x="30" y="182" width="300" height="56" rx="10" />
  <text class="b" x="180" y="205" text-anchor="middle">{t.s3}</text>
  <text class="m" x="180" y="225" text-anchor="middle">{t.s3s}</text>

  <text class="b" x="180" y="272" text-anchor="middle">{t.note}</text>
  <path class="ln dash" d="M30 252H330" />
</svg>
