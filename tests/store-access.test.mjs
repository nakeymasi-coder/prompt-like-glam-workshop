import test from 'node:test';
import assert from 'node:assert/strict';
import {makeStoreAccess,PRODUCTS} from '../netlify/lib/glam-store-access.js';
const product=Object.keys(PRODUCTS)[0],other=Object.keys(PRODUCTS)[1];
const origin='https://workshop-poratl.netlify.app';
const grant='ghh_grant_'+'a'.repeat(43);
function setup(options={}){
 const records=new Map(),calls=[];
 let exchange={mode:'live',product_id:product,sub:'buyer',grant};
 let status={active:true,mode:'live',product_id:product};
 const handler=makeStoreAccess({origin:'https://glam-hustle-hub-staging.lovable.app',enabled:true,now:()=>1000,storeFactory:()=>({setJSON:async(k,v)=>records.set(k,v),get:async k=>records.get(k)}),fetcher:async(url,opts)=>{calls.push({url,opts});return Response.json(url.endsWith('/exchange')?exchange:status);},...options});
 const request=(body,cookie='',from=origin)=>handler(new Request(origin+'/.netlify/functions/glam-store-access',{method:'POST',headers:{Origin:from,Cookie:cookie},body:JSON.stringify(body)}));
 return {request,records,calls,setExchange:v=>exchange=v,setStatus:v=>status=v};
}
test('live purchase creates secure cookie and no browser grant; session is rechecked',async()=>{
 const s=setup(),r=await s.request({product_id:product,token:'signed-token'});
 assert.equal(r.status,200); const cookie=r.headers.get('set-cookie');
 assert.match(cookie,/^__Host-ghh-prompt=[a-f0-9]{64}; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800$/);
 assert.deepEqual(await r.json(),{success:true,product_id:product});
 assert.equal((await s.request({product_id:product},cookie.split(';')[0])).status,200);
 assert.equal(s.calls[1].opts.headers.Authorization,'Bearer '+grant);
 s.setStatus({active:false,mode:'live',product_id:product});
 assert.equal((await s.request({product_id:product},cookie.split(';')[0])).status,403);
});
for(const [name,change] of [['test purchase',{mode:'test'}],['wrong product',{product_id:other}],['missing buyer',{sub:''}],['bad grant',{grant:'bad'}]]) test('rejects '+name,async()=>{
 const s=setup();s.setExchange({mode:'live',product_id:product,sub:'buyer',grant,...change});
 assert.equal((await s.request({product_id:product,token:'token'})).status,403);assert.equal(s.records.size,0);
});
test('disabled and untrusted origin cannot exchange tokens',async()=>{
 const s=setup({enabled:false});assert.equal((await s.request({product_id:product,token:'token'})).status,503);assert.equal(s.calls.length,0);
 const t=setup();assert.equal((await t.request({product_id:product,token:'token'},'','https://evil.example')).status,403);assert.equal(t.calls.length,0);
});
test('missing, duplicate, expired and wrong-product sessions fail closed',async()=>{
 const s=setup();assert.equal((await s.request({product_id:product})).status,401);
 const r=await s.request({product_id:product,token:'token'}),cookie=r.headers.get('set-cookie').split(';')[0];
 assert.equal((await s.request({product_id:product},cookie+'; '+cookie)).status,401);
 assert.equal((await s.request({product_id:other},cookie)).status,401);
 [...s.records.values()][0].expires=999;assert.equal((await s.request({product_id:product},cookie)).status,401);
});
test('store rejection or network error never creates access',async()=>{
 for(const fetcher of [async()=>Response.json({error:'token_already_used'},{status:409}),async()=>{throw Error('offline')}]){
 const s=setup({fetcher});assert.equal((await s.request({product_id:product,token:'token'})).status,403);assert.equal(s.records.size,0);
 }
});
test('unknown products rejected before contacting store',async()=>{const s=setup();assert.equal((await s.request({product_id:'other',token:'token'})).status,400);assert.equal(s.calls.length,0);});
