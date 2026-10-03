import type { BrowserContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
const images = JSON.parse(readFileSync(new URL('../src/data/responsiveImages.json', import.meta.url), 'utf8')) as Record<string, unknown>;
const photo = Object.keys(images)[0];
export const catId = 'jd700000000000000000000000000001';
export const cats = [{_id:catId,_creationTime:1,name:'Test Ragdoll',subtitle:'Ragdoll',description:'A published cat profile for interface testing.',image:photo,gallery:[photo],age:'3 месеца',color:'Blue',status:'Достъпен',gender:'female',birthDate:'2026-07-01',isDisplayed:true,category:'kitten',breed:'ragdoll'}, {_id:'jd700000000000000000000000000002',_creationTime:2,name:'Test British',subtitle:'British',description:'Published British profile.',image:photo,gallery:[photo],age:'2 години',color:'Blue',status:'Достъпен',gender:'male',birthDate:'2024-07-01',isDisplayed:true,category:'adult',breed:'british'}];
export async function backendFixture(context: BrowserContext) {
  // This protocol fixture NEVER connects to the customer deployment.
  const state = {submissions:Array.from({length:21},(_,i)=>({_id:`wait_${i}`,_creationTime:Date.now()-i*1000,email:`person${i}@example.test`,name:`Person ${i}`,normalizedEmail:`person${i}@example.test`,status:'new',notes:'',preferences:'Ragdoll',followUpConsent:true,noticeVersion:'2026-10-02',consentedAt:Date.now(),updatedAt:Date.now()})),failSubmission:false,missingTracking:false,longCats:false,mutations:[] as {path:string,args:Record<string,unknown>}[],externalRequests:[] as string[]};
  await context.route('**/*', async route => {
    const url=new URL(route.request().url());
    if (url.hostname==='127.0.0.1' || url.hostname==='localhost') await route.continue();
    else {state.externalRequests.push(url.href);await route.abort();}
  });
  await context.routeWebSocket(/.*/, socket => {
    const queries=new Map<number,{path:string,args:Record<string,unknown>}>();
    let querySet=0; let tick=0;
    const timestamp=()=>{const bytes=Buffer.alloc(8);bytes.writeBigUInt64LE(BigInt(tick));return bytes.toString('base64');};
    const version=()=>({querySet,identity:0,ts:timestamp()});
    const result=(path:string,args:Record<string,unknown>):unknown=>{
      if(path==='auth:validateSession')return {isValid:typeof args.sessionId==='string'&&args.sessionId.startsWith('admin_'),expiresAt:Date.now()+86400000};
      if(path==='siteSettings:getPublicTrackingSettings')return [{key:'google_analytics_id',value:'"G-TEST123"'},{key:'meta_pixel_id',value:'"123456789"'}];
      if(path==='pedigree:getPublicParents')return {mother:null,father:null};
      if(path.includes('cats:'))return path.includes('Statistics')?{totalCats:2,displayedCats:2,maleCats:1,femaleCats:1}:(state.longCats ? [cats[0],{...cats[0],_id:'jd700000000000000000000000000003',name:'A Longer Name for a Beautiful Ragdoll Kitten'},cats[1]] : cats);
      if(path==='waitingList:list'){
        const opts=args.paginationOpts as {cursor:string|null,numItems:number};
        const list=state.submissions.filter(r=>!args.status||r.status===args.status);const start=Number(opts.cursor||0);const end=start+opts.numItems;
        return {page:list.slice(start,end),isDone:end>=list.length,continueCursor:String(end)};
      }
      if(path.includes('announcements:'))return [{_id:'news_fixture',_creationTime:1,title:'Test story',content:'Published story content.',featuredImage:photo,gallery:[],isPublished:true,slug:'test-story',publishedAt:Date.now(),updatedAt:Date.now(),sortOrder:0}];
      if(path==='gallery:getPublishedGalleryItems')return args.category==='certificate'?[]:[{_id:'gallery_fixture',_creationTime:1,title:'Published gallery',imageUrl:photo,category:'photo',isPublished:true,sortOrder:0,uploadedAt:1}];
      if(path.includes('Statistics')||path.includes('Stats'))return {};
      return [];
    };
    const transition=(newQuerySet=querySet)=>{
      const startVersion=version();tick++;querySet=newQuerySet;
      socket.send(JSON.stringify({type:'Transition',startVersion,endVersion:version(),modifications:[...queries].map(([queryId,q])=>(state.missingTracking && q.path==='siteSettings:getPublicTrackingSettings' ? {type:'QueryFailed',queryId,errorMessage:"Could not find public function for 'siteSettings:getPublicTrackingSettings'.",errorData:null,logLines:[],journal:null} : {type:'QueryUpdated',queryId,value:result(q.path,q.args),logLines:[],journal:null}))}));
    };
    socket.onMessage(raw=>{
      const message=JSON.parse(String(raw));
      if(message.type==='ModifyQuerySet'){
        for(const m of message.modifications)if(m.type==='Add')queries.set(m.queryId,{path:m.udfPath,args:m.args[0]||{}});else queries.delete(m.queryId);
        transition(message.newVersion);
      } else if(message.type==='Mutation'||message.type==='Action'){
        const path=message.udfPath;const args=message.args[0]||{};state.mutations.push({path,args});
        const fail=path==='waitingList:submit'&&state.failSubmission || path==='adminLogin:login'&&args.password!=='interface-test-password';
        if(fail){socket.send(JSON.stringify({type:`${message.type}Response`,requestId:message.requestId,success:false,result:'Test backend rejection',logLines:[]}));return;}
        let value:unknown=null;
        if(path==='adminLogin:login')value={success:true,sessionId:'admin_'+'a'.repeat(64),expiresAt:Date.now()+86400000};
        if(path==='waitingList:submit'){
          if(!state.submissions.some(r=>r.normalizedEmail===args.email))state.submissions.unshift({_id:'wait_new',_creationTime:Date.now(),email:args.email||'',phone:args.phone,name:args.name||'New request',normalizedEmail:args.email||'',status:'new',notes:'',preferences:args.preferences||'',followUpConsent:true,noticeVersion:'2026-10-02',consentedAt:Date.now(),updatedAt:Date.now(),context:args.context} as typeof state.submissions[number]);
          value={accepted:true};
        }
        if(path==='waitingList:update'){const item=state.submissions.find(r=>r._id===args.id);if(item)Object.assign(item,args);value={updated:true};}
        if(path==='waitingList:remove'){state.submissions=state.submissions.filter(r=>r._id!==args.id);value={deleted:true};}
        const nextTick=Buffer.alloc(8);nextTick.writeBigUInt64LE(BigInt(tick+1));socket.send(JSON.stringify({type:`${message.type}Response`,requestId:message.requestId,success:true,result:value,ts:nextTick.toString('base64'),logLines:[]}));transition();
      }
    });
  });
  return state;
}
