/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '@waaark/luge';
declare module 'headroom.js';
declare module 'flickity';

interface Window {
  luge: any;
  lottie: any;
}
