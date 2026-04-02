export function getTrackingScript(): string {
  return `(function(){
  function uuid(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c==='x'?r:r&0x3|0x8).toString(16)})}

  var vid=localStorage.getItem('_vid');
  if(!vid){vid=uuid();localStorage.setItem('_vid',vid)}

  var sid=sessionStorage.getItem('_sid');
  if(!sid){sid=uuid();sessionStorage.setItem('_sid',sid)}

  var ua=navigator.userAgent;
  var device=/Mobile|Android.*Mobile|iPhone|iPod/.test(ua)?'mobile':/iPad|Android(?!.*Mobile)|Tablet/.test(ua)?'tablet':'desktop';
  var browser='unknown';
  if(/Edg\\//.test(ua))browser='Edge';
  else if(/OPR\\/|Opera/.test(ua))browser='Opera';
  else if(/Chrome\\//.test(ua))browser='Chrome';
  else if(/Safari\\//.test(ua)&&!/Chrome/.test(ua))browser='Safari';
  else if(/Firefox\\//.test(ua))browser='Firefox';

  var os='unknown';
  if(/Windows/.test(ua))os='Windows';
  else if(/Mac OS X/.test(ua))os='macOS';
  else if(/Android/.test(ua))os='Android';
  else if(/iPhone|iPad|iPod/.test(ua))os='iOS';
  else if(/Linux/.test(ua))os='Linux';

  var params=new URLSearchParams(location.search);
  var utmSource=params.get('utm_source')||'';
  var utmMedium=params.get('utm_medium')||'';
  var utmCampaign=params.get('utm_campaign')||'';

  var memberId=null;
  try{
    var cookies=document.cookie.split(';');
    for(var i=0;i<cookies.length;i++){
      var c=cookies[i].trim();
      if(c.indexOf('member_token=')=== 0){
        var token=c.substring(13);
        var parts=token.split('.');
        if(parts.length===3){
          var payload=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
          memberId=payload.id||payload.memberId||null;
        }
      }
    }
  }catch(e){}

  var startTime=Date.now();
  var maxScroll=0;

  function post(url,data){
    try{
      var body=JSON.stringify(data);
      if(navigator.sendBeacon){
        navigator.sendBeacon(url,new Blob([body],{type:'application/json'}));
      }else{
        fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:body,keepalive:true});
      }
    }catch(e){}
  }

  function send(url,data){
    try{
      fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),keepalive:true});
    }catch(e){}
  }

  send('/api/track/collect',{
    sessionId:sid,visitorId:vid,memberId:memberId,
    userAgent:ua,device:device,browser:browser,os:os,
    referrer:document.referrer,
    utmSource:utmSource,utmMedium:utmMedium,utmCampaign:utmCampaign,
    landingPage:location.pathname
  });

  send('/api/track/pageview',{
    sessionId:sid,visitorId:vid,memberId:memberId,
    path:location.pathname,title:document.title,referrer:document.referrer
  });

  function onScroll(){
    var scrollTop=window.pageYOffset||document.documentElement.scrollTop;
    var docHeight=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
    var winHeight=window.innerHeight;
    if(docHeight>winHeight){
      var pct=Math.round((scrollTop+winHeight)/docHeight*100);
      if(pct>maxScroll)maxScroll=pct;
    }else{
      maxScroll=100;
    }
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();

  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='hidden'){
      var duration=Math.round((Date.now()-startTime)/1000);
      post('/api/track/pageview',{
        sessionId:sid,visitorId:vid,memberId:memberId,
        path:location.pathname,title:document.title,referrer:document.referrer,
        duration:duration,scrollDepth:maxScroll
      });
    }
  });

  document.addEventListener('click',function(e){
    var t=e.target;
    var tag=t.tagName||'';
    var id=t.id?'#'+t.id:'';
    var cls=t.className&&typeof t.className==='string'?'.'+t.className.trim().split(/\\s+/).join('.'):'';
    send('/api/track/heatmap',{
      path:location.pathname,
      x:e.clientX,y:e.clientY,
      viewportW:window.innerWidth,viewportH:window.innerHeight,
      target:tag+id+cls,sessionId:sid
    });
  });

  window.__track=function(eventType,eventName,metadata){
    send('/api/track/event',{
      sessionId:sid,visitorId:vid,memberId:memberId,
      eventType:eventType,eventName:eventName,
      path:location.pathname,
      metadata:metadata||{}
    });
  };
})();`;
}
