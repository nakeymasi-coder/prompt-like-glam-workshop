import { createHash, randomUUID } from "crypto";
import {verifyMemberToken,withCors,json,memberStore,getMemberEvents,vipForPurchases,getProfile,isValidEmail,rateLimited,rewardMonth,birthdayAvailable,claimKey} from "./inner-circle-lib.js";
export default async req=>withCors(req,async()=>{
  if(rateLimited(req,10))return json({success:false,message:"Please wait a minute and try again."},429,req);
  const body=await req.json().catch(()=>({}));
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  if(!isValidEmail(email)||!["birthday","discount"].includes(body.benefit))return json({success:false,message:"Choose a valid VIP benefit."},400,req);
    if (!verifyMemberToken(email, body.memberToken)) return json({success:false,message:"Verify your purchase email with your personal access code."},401,req);
  const store=memberStore(), events=await getMemberEvents(store,email);
  if(!vipForPurchases(events).vipActive)return json({success:false,message:"This benefit requires active VIP status."},403,req);
  const month=rewardMonth(), year=month.slice(0,4);
  const hash=createHash("sha256").update(email).digest("hex").slice(0,24);
  if(body.benefit==="birthday"){
    const profile=await getProfile(store,email)||{};
    if(!profile.birthdayVerifiedAt||!birthdayAvailable(profile.birthday))return json({success:false,message:"Ask Glam to record your birthday month and day. Request your reward during your birthday month."},400,req);
    const code="BDAY-"+year+"-"+hash;
    const result=await store.setJSON(claimKey(code),{email,kind:"vip-birthday",rewardId:"vip-birthday",rewardName:"VIP $10 birthday shop reward",cost:0,year,status:"pending",createdAt:new Date().toISOString()},{onlyIfNew:true});
    if(!result.modified)return json({success:false,message:"Your birthday reward for this year has already been requested or delivered."},409,req);
    return json({success:true,message:"Birthday reward requested. Glam will verify and send your personal $10 eligible-shop coupon to your purchase email. No points spent."},200,req);
  }
  const listed=await store.list({prefix:"claim:"});
  for(const blob of listed.blobs||[]){
    const c=await store.get(blob.key,{type:"json",consistency:"strong"});
    if(c&&c.email===email&&c.kind==="vip-discount"&&c.status==="pending")return json({success:false,message:"Your VIP discount request is already awaiting delivery."},409,req);
  }
  const code="SAVE-"+randomUUID();
  await store.setJSON(claimKey(code),{email,kind:"vip-discount",rewardId:"vip-discount",rewardName:"VIP 15% off regularly priced eligible tools and resources",cost:0,status:"pending",createdAt:new Date().toISOString()},{onlyIfNew:true});
  return json({success:true,message:"Discount requested. Glam will verify and send your personal 15%-off coupon to your purchase email. Exclusions apply; discounts and point rewards do not stack."},200,req);
});
