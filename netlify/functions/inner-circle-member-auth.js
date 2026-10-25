import { withCors,json,memberStore,isValidEmail,rateLimited,accessCodeHash,issueMemberToken } from "./inner-circle-lib.js";
export default async req=>withCors(req,async()=>{
  if(rateLimited(req,10))return json({success:false,message:"Please wait a minute and try again."},429,req);
  const body=await req.json().catch(()=>({}));
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  const code=typeof body.code==="string"?body.code.trim():"";
  const invalid=()=>json({success:false,message:"That access code is invalid or expired. Ask Glam for a new code sent to your purchase email."},401,req);
  if(!isValidEmail(email)||!/^[a-f0-9]{48}$/.test(code))return invalid();
  const store=memberStore(),key="member-access:"+accessCodeHash(code);
  const record=await store.getWithMetadata(key,{type:"json",consistency:"strong"});
  if(!record||record.data.email!==email||record.data.used||record.data.expiresAt<=Date.now())return invalid();
  const token=issueMemberToken(email);
  const result=await store.setJSON(key,{...record.data,used:true,usedAt:new Date().toISOString()},{onlyIfMatch:record.etag});
  if(!result.modified)return invalid();
  return json({success:true,memberToken:token},200,req);
});
