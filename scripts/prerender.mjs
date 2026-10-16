import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { render, routeGuides, products, origin, routePath, productPath } from '../.prerender/entry-server.js';
const template = await readFile('dist/index.html', 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const organization = {'@type':'Organization','@id':`${origin}/#organization`,name:'I Ride Mallorca',url:`${origin}/`,logo:`${origin}/IRIDEMALLORCA_LOGO.jpg`};
const website = {'@type':'WebSite','@id':`${origin}/#website`,name:'I Ride Mallorca',url:`${origin}/`,publisher:{'@id':organization['@id']},inLanguage:'en'};
const pages = [
 {path:'/',title:'Mallorca Cycling Routes & Jerseys | I Ride Mallorca',description:'Explore Mallorca cycling routes with free GPX downloads, route maps and planning notes. Discover the Sunset, Pink and White I Ride Mallorca cycling jerseys.'},
 {path:'/routes/',title:'Mallorca Cycling Routes & GPX Downloads | I Ride Mallorca',description:'Compare six Mallorca road cycling routes, including Sa Calobra, Formentor and Puig Major. Find GPX downloads, maps, route types and practical ride notes.'},
 {path:'/jerseys/',title:'Mallorca Cycling Jerseys: Sunset, Pink & White | I Ride Mallorca',description:'Explore the I Ride Mallorca cycling jersey collection: Sunset at €64.50, Pink and White at €87.90. See front and back images, sizing and order information.'},
 {path:'/about/',title:'About I Ride Mallorca & Our Route Information',description:'Learn about I Ride Mallorca, how GPX route distances and climbing figures are calculated, file limitations and where to find cycling jersey information.'},
 ...routeGuides.map(route=>({path:routePath(route.slug),title:`${route.name}: Cycling Route & GPX | I Ride Mallorca`,description:route.summary,route,image:route.image})),
 ...products.map(product=>({path:productPath(product.slug),title:`${product.name} | I Ride Mallorca`,description:`${product.description} Listed at €${product.price.toFixed(2)}. View front and back photos, sizing and order information.`,product,image:product.images[0]})),
 {path:'/404/',title:'Page Not Found | I Ride Mallorca',description:'Find Mallorca cycling routes and jerseys on I Ride Mallorca.',noindex:true},
];
for (const page of pages) {
 const url=origin+page.path;
 const graph=[organization,website,{'@type':page.path==='/'?'WebPage':page.route?'WebPage':page.product?'ItemPage':page.path==='/about/'?'AboutPage':'CollectionPage','@id':`${url}#webpage`,url,name:page.title,description:page.description,inLanguage:'en',isPartOf:{'@id':website['@id']},publisher:{'@id':organization['@id']}}];
 if (page.path==='/routes/') graph.push({'@type':'ItemList',name:'Iconic Mallorca cycling routes',itemListElement:routeGuides.map((r,i)=>({'@type':'ListItem',position:i+1,name:r.name,url:origin+routePath(r.slug)}))});
 if (page.path==='/jerseys/') graph.push({'@type':'ItemList',name:'Mallorca cycling jerseys',itemListElement:products.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,url:origin+productPath(p.slug)}))});
 if (page.route || page.product) {
  const section=page.route?'routes':'jerseys',name=page.route?.name||page.product.name;
  graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:origin+'/'},{'@type':'ListItem',position:2,name:page.route?'Cycling routes':'Cycling jerseys',item:`${origin}/${section}/`},{'@type':'ListItem',position:3,name,item:url}]});
 }
 if (page.route) {
  const r=page.route;
  graph.push({'@type':'Article','@id':`${url}#guide`,headline:`${r.name}: Cycling Route & GPX`,description:r.summary,image:[origin+r.image],inLanguage:'en',mainEntityOfPage:{'@id':`${url}#webpage`},author:{'@id':organization['@id']},publisher:{'@id':organization['@id']},about:{'@type':'Place',name:'Mallorca, Balearic Islands, Spain'}});
 }
 if (page.product) {
  const p=page.product;
  graph.push({'@type':'Product','@id':`${url}#product`,name:p.name,description:p.description,image:p.images.map(i=>origin+i),color:p.colour,brand:{'@type':'Brand',name:'I Ride Mallorca'},offers:{'@type':'Offer',url,priceCurrency:'EUR',price:p.price.toFixed(2),seller:{'@id':organization['@id']}}});
 }
 const image=origin+(page.image||'/routes/sa-calobra.webp');
 const head=`<title>${escape(page.title)}</title>\n<meta name="description" content="${escape(page.description)}" />\n<link rel="canonical" href="${url}" />\n<meta name="robots" content="${page.noindex?'noindex,follow':'index,follow,max-image-preview:large'}" />\n<meta property="og:type" content="${page.route?'article':'website'}" />\n<meta property="og:site_name" content="I Ride Mallorca" />\n<meta property="og:title" content="${escape(page.title)}" />\n<meta property="og:description" content="${escape(page.description)}" />\n<meta property="og:url" content="${url}" />\n<meta property="og:image" content="${image}" />\n<meta property="og:image:alt" content="${escape(page.route?.name||page.product?.name||'Mallorca road cycling')}" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${escape(page.title)}" />\n<meta name="twitter:description" content="${escape(page.description)}" />\n<meta name="twitter:image" content="${image}" />\n<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script>`;
 const html=template.replace(/<title>.*?<\/title>/s,head).replace('<div id="root"></div>',()=>`<div id="root">${render(page.path)}</div>`);
 const file=page.noindex?'dist/404.html':resolve('dist','.'+page.path,'index.html');await mkdir(dirname(file),{recursive:true});await writeFile(file,html);
}
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter(p=>!p.noindex).map(p=>`  <url><loc>${origin}${p.path}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
await rm('.prerender',{recursive:true,force:true});
console.log(`Pre-rendered ${pages.length-1} public pages, a 404 page, sitemap.xml and robots.txt.`);
