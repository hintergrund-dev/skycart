import { DurableObject } from 'cloudflare:workers';
import { COLLECTIONS, handleEvent } from './ingest';
import { Env } from './env';

const ALARM_MS = 30_000;
const STALE_MS = 60_000; // identity/account events for the whole network keep the stream busy
const REWIND_US = 10_000_000; // replay 10s on reconnect; ingest is idempotent

/** Keeps one outgoing WebSocket to Jetstream open; an alarm reconnects it. */
export class Jetstream extends DurableObject<Env> {
  ws?: WebSocket;
  lastMessage = 0;
  lastSaved = 0;
  chain: Promise<void> = Promise.resolve();
  known?: Set<string>;

  async fetch(): Promise<Response> {
    await this.connect();
    await this.ctx.storage.setAlarm(Date.now() + ALARM_MS);
    return Response.json({ connected: !!this.ws, cursor: await this.ctx.storage.get('cursor') });
  }

  async alarm(): Promise<void> {
    try {
      if (!this.ws || Date.now() - this.lastMessage > STALE_MS) await this.connect();
    } catch (e) {
      console.log('jetstream connect failed', String(e));
    } finally {
      await this.ctx.storage.setAlarm(Date.now() + ALARM_MS);
    }
  }

  async connect(): Promise<void> {
    this.ws?.close();
    this.ws = undefined;
    this.known ??= new Set((await this.env.DB.prepare('SELECT did FROM actors').all<{ did: string }>()).results.map((r) => r.did));
    const cursor = await this.ctx.storage.get<number>('cursor');
    const url = new URL(this.env.JETSTREAM_URL);
    for (const c of COLLECTIONS) url.searchParams.append('wantedCollections', c);
    if (cursor) url.searchParams.set('cursor', String(cursor - REWIND_US));
    url.protocol = 'https:';
    const res = await fetch(url, { headers: { Upgrade: 'websocket' } });
    const ws = res.webSocket;
    if (!ws) throw new Error(`no websocket: ${res.status}`);
    ws.accept();
    this.ws = ws;
    this.lastMessage = Date.now();
    ws.addEventListener('message', (m) => {
      this.lastMessage = Date.now();
      this.chain = this.chain.then(() => this.process(String(m.data)));
    });
    const drop = () => { if (this.ws === ws) this.ws = undefined; };
    ws.addEventListener('close', drop);
    ws.addEventListener('error', drop);
  }

  async process(data: string): Promise<void> {
    try {
      const ev = JSON.parse(data);
      await handleEvent(this.env, ev, this.known!);
      if (ev.time_us && Date.now() - this.lastSaved > 1000) {
        this.lastSaved = Date.now();
        await this.ctx.storage.put('cursor', ev.time_us);
      }
    } catch (e) {
      console.log('ingest error', String(e));
    }
  }
}
