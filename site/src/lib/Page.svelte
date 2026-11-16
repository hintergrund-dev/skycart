<script lang="ts">
  import Architecture from './Architecture.svelte';
  import Compare from './Compare.svelte';
  import Steps from './Steps.svelte';
  import { ATPROTO, content, GITHUB, type Lang } from './content';

  let { lang }: { lang: Lang } = $props();
  const c = $derived(content[lang]);
</script>

<svelte:head>
  <title>{c.htmlTitle}</title>
  <meta name="description" content={c.description} />
</svelte:head>

<header class="hero">
  <div class="wrap">
    <nav>
      <strong>skycart.eu</strong>
      <a href={c.nav.otherHref} hreflang={lang === 'de' ? 'en' : 'de'}>{c.nav.other}</a>
    </nav>
    <span class="label">{c.label}</span>
    <h1>{c.h1}</h1>
    {#each c.pitch as p}<p>{p}</p>{/each}
  </div>
</header>

<main class="wrap">
  <h2>{c.flow.h}</h2>
  {#each c.flow.p as p}<p>{p}</p>{/each}
  <figure><Steps {lang} /></figure>

  <h2>{c.diff.h}</h2>
  {#each c.diff.p as p}<p>{p}</p>{/each}
  <figure><Compare {lang} /></figure>

  <h2>{c.built.h}</h2>
  {#each c.built.p as p}<p>{p}</p>{/each}
  <figure><Architecture {lang} /></figure>

  <h2>{c.principles.h}</h2>
  <ul class="plain">
    {#each c.principles.items as [name, text]}<li><strong>{name}:</strong> {text}</li>{/each}
  </ul>

  <h2>{c.shops.h}</h2>
  <p>{c.shops.p}</p>
  <ul class="plain">
    {#each c.shops.items as item}<li>{item}</li>{/each}
  </ul>
  <p>{c.shops.more} <a href={c.shops.linkHref}>{c.shops.link}</a></p>

  <h2>{c.open.h}</h2>
  <p>{c.open.p}</p>
  <ul class="plain">
    {#each c.open.items as [name, text]}<li><strong>{name}:</strong> {text}</li>{/each}
  </ul>

  <h2>{c.follow.h}</h2>
  <p>
    {c.follow.p} <a href={GITHUB}>{c.follow.gh}</a>. {c.follow.mid} <a href={ATPROTO}>{c.follow.handle}</a>. {c.follow.tail}
  </p>
</main>
