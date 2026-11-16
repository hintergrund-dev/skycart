<script lang="ts">
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
      <a class="brand" href={lang === 'de' ? '/' : '/en'}><img src="/favicon.svg" alt="" width="30" height="30" /><span>skycart<i>.eu</i></span></a>
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
  <figure><img class="diagram" src="/diagrams/flow.{lang}.svg" alt={c.flow.d.title} width="760" height="232" /></figure>

  <h2>{c.diff.h}</h2>
  {#each c.diff.p as p}<p>{p}</p>{/each}
  <figure><img class="diagram" src="/diagrams/compare.{lang}.svg" alt={c.diff.d.title} width="760" height="290" /></figure>

  <h2>{c.built.h}</h2>
  {#each c.built.p as p}<p>{p}</p>{/each}
  <figure><img class="diagram" src="/diagrams/architecture.{lang}.svg" alt={c.built.d.title} width="760" height="290" /></figure>

  <h2>{c.principles.h}</h2>
  <ul class="facts">
    {#each c.principles.items as [name, text]}<li><strong>{name}</strong><span>{text}</span></li>{/each}
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
