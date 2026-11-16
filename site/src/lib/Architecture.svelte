<script lang="ts">
  import { content, type Lang } from './content';
  let { lang }: { lang: Lang } = $props();
  const t = $derived(content[lang].built.d);
</script>

<svg class="diagram" viewBox="0 0 360 372" role="img" aria-label={t.title}>
  <defs>
    <marker id="ar3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor" /></marker>
  </defs>
  <rect class="box" x="6" y="6" width="164" height="56" rx="10" />
  <text class="b" x="88" y="28" text-anchor="middle">{t.site}</text>
  <text class="m" x="88" y="48" text-anchor="middle">{t.siteSub}</text>
  <rect class="box" x="190" y="6" width="164" height="56" rx="10" />
  <text class="b" x="272" y="28" text-anchor="middle">{t.repo}</text>
  <text class="m" x="272" y="48" text-anchor="middle">{t.repoSub}</text>

  <path class="ln" d="M230 62V134" marker-end="url(#ar3)" />
  <text class="m" x="238" y="104">{t.records}</text>

  <rect class="box hl" x="70" y="136" width="220" height="56" rx="10" />
  <text class="b" x="180" y="158" text-anchor="middle">{t.app}</text>
  <text class="m" x="180" y="178" text-anchor="middle">{t.appSub}</text>

  <path class="ln" d="M180 292V194" marker-end="url(#ar3)" />
  <text class="m" x="172" y="250" text-anchor="end">{t.search}</text>

  <rect class="box" x="70" y="294" width="220" height="56" rx="10" />
  <text class="b" x="180" y="316" text-anchor="middle">{t.browser}</text>
  <text class="m" x="180" y="336" text-anchor="middle">{t.browserSub}</text>

  <path class="ln" d="M70 322H24V64" marker-end="url(#ar3)" />
  <text class="m" x="16" y="210" text-anchor="middle" transform="rotate(-90 16 210)">{t.go}</text>
  <path class="ln" d="M336 64V322H292" marker-end="url(#ar3)" />
  <text class="m" x="346" y="250" text-anchor="middle" transform="rotate(-90 346 250)">{t.images}</text>
</svg>
