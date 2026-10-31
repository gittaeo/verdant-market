import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
await build({entryPoints:[resolve(root,'visuals/liquid-hero.jsx')],outfile:resolve(root,'public/liquid-hero.js'),bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022',loader:{'.glsl':'text'},jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof',logLevel:'info'});
