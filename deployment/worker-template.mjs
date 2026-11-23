const GS_APP=/*__APP__*/;
const GS_HOME=/*__HOME__*/;
const GS_PDFS=/*__PDFS__*/;
export default {
 async fetch(request, env, ctx) {
  const p=new URL(request.url).pathname;
  const own=p==='/'||p==='/index.html'||p==='/games/paths-of-glory'||p.startsWith('/games/paths-of-glory/')||p==='/downloads/paths-of-glory';
  if(!own)return PREVIOUS.fetch(request,env,ctx);
  const base={'Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...base,Allow:'GET, HEAD'}});
  if(p==='/'||p==='/index.html')return new Response(request.method==='HEAD'?null:GS_HOME,{headers:{...base,'Content-Type':'text/html; charset=utf-8'}});
  if(p==='/games/paths-of-glory')return Response.redirect(new URL('/games/paths-of-glory/',request.url).href,308);
  if(['/games/paths-of-glory/','/games/paths-of-glory/index.html','/games/paths-of-glory/General_Staff_Companion.html','/downloads/paths-of-glory'].includes(p)){
   const headers={...base,'Content-Type':'text/html; charset=utf-8'};
   if(p.endsWith('General_Staff_Companion.html')||p==='/downloads/paths-of-glory')headers['Content-Disposition']='attachment; filename="General_Staff_Companion.html"';
   return new Response(request.method==='HEAD'?null:GS_APP,{headers});
  }
  if(Object.hasOwn(GS_PDFS,p)){
   const bytes=Uint8Array.from(atob(GS_PDFS[p]),c=>c.charCodeAt(0));
   return new Response(request.method==='HEAD'?null:bytes,{headers:{...base,'Content-Type':'application/pdf','Content-Length':String(bytes.length),'Content-Disposition':'attachment; filename="'+p.split('/').pop()+'"'}});
  }
  return new Response('Not found',{status:404,headers:base});
 }
};
