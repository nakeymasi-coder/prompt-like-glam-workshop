import { getStore } from '@netlify/blobs';
import { makeStoreAccess } from '../lib/glam-store-access.js';
export default async req=>makeStoreAccess({
  storeFactory:()=>getStore({name:'glam-store-access',consistency:'strong'}),
  origin:Netlify.env.get('GLAM_STORE_ORIGIN')||'https://glam-hustle-hub-staging.lovable.app',
  enabled:Netlify.env.get('GLAM_STORE_ACCESS_ENABLED')==='true',
})(req);
