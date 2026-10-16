import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const origin = 'https://www.iridemallorca.com';
const sitemap=await readFile('dist/sitemap.xml','utf8');
const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
assert.equal(urls.length,13,'Expected home, route/jersey hubs, six routes, three products and about');
const titles=new Set(), descriptions=new Set();
for(const url of urls){
 const path=new URL(url).pathname;
 const html=await readFile(resolve('dist','.'+path,'index.html'),'utf8');
 assert.equal((html.match(/<h1\b/g)||[]).length,1,`${path}: exactly one H1`);
 const title=html.match(/<title>(.*?)<\/title>/)?.[1];assert.ok(title);assert.ok(!titles.has(title));titles.add(title);
 const desc=html.match(/<meta name="description" content="([^"]+)"/ )?.[1];assert.ok(desc);assert.ok(!descriptions.has(desc));descriptions.add(desc);
 assert.ok(html.includes(`<link rel="canonical" href="${url}"`),`${path}: self canonical`);
 assert.ok(!html.includes('noindex'),`${path}: indexable`);
 assert.ok(html.match(/<div id="root"><(?:main|div)/),`${path}: real pre-rendered content`);
 const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
 assert.equal(data['@context'],'https://schema.org');
 if(path.startsWith('/routes/')&&path!=='/routes/')assert.ok(data['@graph'].some(x=>x['@type']==='Article'));
 if(path.startsWith('/jerseys/')&&path!=='/jerseys/'){
  const product=data['@graph'].find(x=>x['@type']==='Product');assert.ok(product);assert.equal(product.offers.priceCurrency,'EUR');assert.ok(html.includes(`€${product.offers.price}`));assert.ok(!product.aggregateRating,'No invented ratings');assert.ok(!product.offers.availability,'No unverified stock claims');
 }
 for(const match of html.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)){
  const target=match[1]; if(target.startsWith('//'))continue;
  let file=resolve('dist','.'+target);if(target.endsWith('/'))file=resolve(file,'index.html');
  assert.ok((await stat(file).catch(()=>null))?.isFile(),`${path}: broken local reference ${target}`);
 }
}
const coll=await readFile('dist/routes/coll-de-soller/index.html','utf8');assert.ok(coll.includes('Do not use it for turn-by-turn navigation'));
const home=await readFile('dist/index.html','utf8');for(const slug of ['sa-calobra','cap-de-formentor','puig-major','coll-de-soller','andratx-pollenca','calvia-loop'])assert.ok(home.includes(`/routes/${slug}/`));
for(const slug of ['sunset','pink','white'])assert.ok(home.includes(`/jerseys/${slug}/`));
const notFound=await readFile('dist/404.html','utf8');assert.ok(notFound.includes('noindex,follow'));
const config=await readFile('netlify.toml','utf8');assert.ok(config.includes('status = 404'));assert.ok(config.includes('/gpx-api/*'),'Existing GPX proxy preserved');
const robots=await readFile('dist/robots.txt','utf8');assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
console.log(`SEO checks passed: ${urls.length} prerendered pages, unique metadata, structured data, internal links, images, GPX links, sitemap and 404 configuration.`);

for (const directory of ['dist/routes', 'dist/jerseys']) {
 for (const name of await readdir(directory)) {
  if (name.endsWith('.webp')) assert.ok((await stat(`${directory}/${name}`)).size > 1000, `Empty or truncated image: ${name}`);
 }
}
