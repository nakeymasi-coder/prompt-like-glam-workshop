(function(){
  "use strict";
  var HOST="https://workshop-poratl.netlify.app";
  var incoming=null;
  if(location.origin===HOST && location.hash.indexOf("#token=")===0){
    incoming=new URLSearchParams(location.hash.slice(1)).get("token");
    history.replaceState(null,"",location.pathname+location.search);
  }
  function marker(product){try{return localStorage.getItem("ghh-store-"+product)==="1";}catch(e){return false;}}
  window.GlamStoreAccess={
    hasIncoming:function(){return Boolean(incoming);},
    check:async function(product,claim){
      if(location.origin!==HOST || (!claim&&!marker(product))) return false;
      var token=claim?incoming:null;
      if(claim) incoming=null;
      try{
        var r=await fetch("/.netlify/functions/glam-store-access",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:product,...(token?{token:token}:{})}),signal:AbortSignal.timeout(10000)});
        var data=await r.json();
        var active=r.ok&&data.success===true&&data.product_id===product;
        if(active){try{localStorage.setItem("ghh-store-"+product,"1");}catch(e){}}
        return active;
      }catch(e){return false;}
    }
  };
})();

