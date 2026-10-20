import { createHash } from "crypto";
import { withCors,json,memberStore,getMemberEvents,vipForPurchases,isValidEmail,rateLimited,rewardMonth,validGiftCatalog,claimKey } from "./inner-circle-lib.js";
export default async req => withCors(req,async()=>{
  if(rateLimited(req,10)) return json({success:false,message:"Please wait a minute and try again."},429,req);
  const body=await req.json().catch(()=>({}));
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  if(!isValidEmail(email)) return json({success:false,message:"Enter your purchase email."},400,req);
  const store=memberStore();
  const status=vipForPurchases(await getMemberEvents(store,email));
  if(!status.vipActive) return json({success:false,message:"This gift is available to active VIP members."},403,req);
  const month=rewardMonth();
  const items=await store.get("gift-catalog:"+month,{type:"json",consistency:"strong"});
  if(!validGiftCatalog(items)) return json({success:false,message:"Glam is preparing this month's five gift choices. Please check back."},409,req);
  const gift=items.find(p=>p.id===body.giftId);
  if(!gift) return json({success:false,message:"Choose a gift from this month's collection."},400,req);
  const code="VIP-"+month+"-"+createHash("sha256").update(email).digest("hex").slice(0,24);
  const result=await store.setJSON(claimKey(code),{
    email,kind:"vip-monthly",rewardId:gift.id,rewardName:"VIP monthly gift: "+gift.name,
    productUrl:gift.url,cost:0,month,status:"pending",createdAt:new Date().toISOString()
  },{onlyIfNew:true});
  if(!result.modified) return json({success:false,message:"Your gift for this month has already been requested or delivered."},409,req);
  return json({success:true,claimCode:code,message:"Gift requested. Glam will verify and deliver your selected product. No Glow Points were spent."},200,req);
});
