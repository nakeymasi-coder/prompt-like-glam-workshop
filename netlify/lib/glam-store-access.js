import { randomBytes } from 'node:crypto';
export const PRODUCTS = Object.freeze({
  'b2131878-96e7-48df-95e3-32089e32a237': { key:'prompt', destination:'/portal.html?store_product=prompt' },
  '45f717c0-05d7-4cd7-b3e2-694469377ba7': { key:'brand-world', destination:'/portal.html?store_product=brand-world' },
  '3b456086-de57-42c8-b883-dfc1796cd61f': { key:'clothing', destination:'/clothing-brand-generator/app/index.html' },
});
const ORIGINS=new Set(['https://glamhustlehub.com','https://www.glamhustlehub.com','https://glam-hustle-hub-staging.lovable.app']);
const PORTAL='https://workshop-poratl.netlify.app';
const MAX_AGE=7*86400;
const cookieName=product=>'__Host-ghh-'+PRODUCTS[product].key;
const response=(status,data,extra={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...extra}});
export function makeStoreAccess({storeFactory,fetcher=fetch,origin,enabled=false,now=()=>Date.now()}) {
  async function request(path,body,grant) {
    const r=await fetcher(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...(grant?{Authorization:'Bearer '+grant}:{})},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!r.ok) throw new Error('Store verification failed');
    return r.json();
  }
  return async req=>{
    if(req.method!=='POST') return response(405,{success:false});
    if(req.headers.get('Origin')!==PORTAL) return response(403,{success:false});
    if(!enabled || !ORIGINS.has(origin)) return response(503,{success:false,message:'The new store connection is being prepared. Existing Payhip keys still work.'});
    try {
      const raw=await req.text();
      if(raw.length>14000) return response(413,{success:false});
      const body=JSON.parse(raw),product=body?.product_id;
      if(!Object.hasOwn(PRODUCTS,product)) return response(400,{success:false});
      const storage=storeFactory();
      if(body.token!==undefined) {
        if(typeof body.token!=='string'||body.token.length>12000) return response(400,{success:false});
        // The store verifies the signature, buyer, audience, payment and single-use ID.
        const exchanged=await request('/api/public/access/exchange',{token:body.token});
        if(exchanged.mode!=='live'||exchanged.product_id!==product||typeof exchanged.sub!=='string'||!exchanged.sub||!/^ghh_grant_[A-Za-z0-9_-]{43}$/.test(exchanged.grant||'')) throw new Error('Wrong purchase');
        const id=randomBytes(32).toString('hex');
        await storage.setJSON('session:'+id,{product_id:product,grant:exchanged.grant,subject:exchanged.sub,expires:now()+MAX_AGE*1000});
        return response(200,{success:true,product_id:product},{'Set-Cookie':cookieName(product)+'='+id+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+MAX_AGE});
      }
      const cookies=(req.headers.get('Cookie')||'').split(';').map(x=>x.trim().split('='));
      const ids=cookies.filter(([name])=>name===cookieName(product));
      if(ids.length!==1||!/^[a-f0-9]{64}$/.test(ids[0][1]||'')) return response(401,{success:false});
      const saved=await storage.get('session:'+ids[0][1],{type:'json'});
      if(!saved||saved.product_id!==product||!Number.isFinite(saved.expires)||saved.expires<=now()) return response(401,{success:false});
      const status=await request('/api/public/access/status',{},saved.grant);
      if(status.active!==true||status.mode!=='live'||status.product_id!==product) return response(403,{success:false});
      return response(200,{success:true,product_id:product});
    } catch {
      return response(403,{success:false,message:'We couldn’t confirm this purchase. Open a fresh link from My Account on Glam Hustle Hub.'});
    }
  };
}
