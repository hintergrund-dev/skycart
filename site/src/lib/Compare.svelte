<script lang="ts">
  import { content, type Lang } from './content';
  let { lang }: { lang: Lang } = $props();
  const t = $derived(content[lang].diff.d);
</script>

<svg class="diagram" viewBox="0 0 360 290" role="img" aria-label={t.title}>
  <defs>
    <marker id="ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor" /></marker>
  </defs>
  <path class="ln dash" d="M180 6V284" />

  <text class="b" x="90" y="20" text-anchor="middle">{t.m}</text>
  <rect class="box" x="20" y="34" width="140" height="44" rx="10" />
  <text class="b" x="90" y="61" text-anchor="middle">{t.buyer}</text>
  <path class="ln" d="M90 78V110" marker-end="url(#ar2)" />
  <rect class="box hl" x="20" y="112" width="140" height="64" rx="10" />
  <text class="b" x="90" y="138" text-anchor="middle">{t.platform}</text>
  <text class="m" x="90" y="158" text-anchor="middle">{t.platformSub}</text>
  <path class="ln" d="M90 176V208" marker-end="url(#ar2)" />
  <rect class="box" x="20" y="210" width="140" height="44" rx="10" />
  <text class="b" x="90" y="237" text-anchor="middle">{t.shop}</text>

  <text class="b" x="270" y="20" text-anchor="middle">{t.k}</text>
  <rect class="box" x="200" y="34" width="140" height="44" rx="10" />
  <text class="b" x="270" y="61" text-anchor="middle">{t.buyer}</text>
  <path class="ln" d="M250 78V110" marker-end="url(#ar2)" />
  <text class="m" x="256" y="100">{t.search}</text>
  <rect class="box dash" x="200" y="112" width="110" height="64" rx="10" />
  <text class="b" x="255" y="138" text-anchor="middle">{t.index}</text>
  <text class="m" x="255" y="158" text-anchor="middle">{t.indexSub}</text>
  <path class="ln" d="M326 78V208" marker-end="url(#ar2)" />
  <rect class="box" x="200" y="210" width="140" height="44" rx="10" />
  <text class="b" x="270" y="237" text-anchor="middle">{t.shop}</text>
  <text class="m" x="270" y="278" text-anchor="middle">{t.direct}</text>
</svg>
