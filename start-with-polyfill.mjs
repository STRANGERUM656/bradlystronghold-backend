// Polyfill per fetch in Node.js (richiesto da RivetKit WASM)
import { fetch, Headers, Request, Response } from 'undici';
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;

// Ora avvia il server
import('./server.js');
