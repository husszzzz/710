const GH = "https://api.github.com";

function cors(extra={}) {
  return {
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"Content-Type",
    "Access-Control-Allow-Methods":"POST,OPTIONS",
    ...extra
  };
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8",...cors()}})}
function enc(s){return encodeURIComponent(s)}
async function gh(path, token, opts={}){
  const headers={"Accept":"application/vnd.github+json","Authorization":`Bearer ${token}`,"X-GitHub-Api-Version":"2022-11-28",...(opts.headers||{})};
  const r=await fetch(GH+path,{...opts,headers});
  const text=await r.text();
  let data; try{data=JSON.parse(text)}catch{data={message:text}};
  if(!r.ok) throw new Error(`GitHub ${r.status}: ${data.message||"request failed"}`);
  return data;
}
function auth(body){if(!body.token||typeof body.token!=="string")throw new Error("GitHub Token مطلوب");return body.token}
export default {
  async fetch(req){
    if(req.method==="OPTIONS") return new Response("",{headers:cors()});
    const u=new URL(req.url);
    if(u.pathname!="/api/github") return new Response("Zone66 Control Panel",{status:200});
    if(req.method!=="POST") return json({error:"POST only"},405);
    try{
      const body=await req.json(); const token=auth(body);
      const owner=body.owner, repo=body.repo, branch=body.branch||"main";
      if(!owner||!repo) throw new Error("owner/repo مطلوب");

      if(body.action==="connect"){
        const r=await gh(`/repos/${enc(owner)}/${enc(repo)}`,token);
        const ref=await gh(`/repos/${enc(owner)}/${enc(repo)}/git/ref/heads/${enc(branch)}`,token);
        return json({name:r.full_name,private:r.private,sha:ref.object.sha});
      }

      if(body.action==="tree"){
        const ref=await gh(`/repos/${enc(owner)}/${enc(repo)}/git/ref/heads/${enc(branch)}`,token);
        const tree=await gh(`/repos/${enc(owner)}/${enc(repo)}/git/trees/${ref.object.sha}?recursive=1`,token);
        return json({files:(tree.tree||[]).filter(x=>x.type==="blob").map(x=>({path:x.path,type:x.type,sha:x.sha}))});
      }

      if(body.action==="read"){
        if(!body.path) throw new Error("path مطلوب");
        const f=await gh(`/repos/${enc(owner)}/${enc(repo)}/contents/${body.path.split("/").map(enc).join("/")}?ref=${enc(branch)}`,token);
        if(f.type!=="file") throw new Error("المسار ليس ملفاً");
        const content=atob((f.content||"").replace(/\n/g,""));
        return json({content,sha:f.sha});
      }

      if(body.action==="write"){
        if(!body.path||!body.content||!body.sha) throw new Error("path/content/sha مطلوبة");
        const content=btoa(unescape(encodeURIComponent(body.content)));
        const r=await gh(`/repos/${enc(owner)}/${enc(repo)}/contents/${body.path.split("/").map(enc).join("/")}`,token,{
          method:"PUT",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({message:body.message||"Update from Zone66 Control Panel",content,sha:body.sha,branch})
        });
        return json({commit:r.commit?.sha||"",sha:r.content?.sha||""});
      }

      if(body.action==="dispatch"){
        const wf=body.workflow||".github/workflows/build.yml";
        await gh(`/repos/${enc(owner)}/${enc(repo)}/actions/workflows/${wf.split("/").map(enc).join("/")}/dispatches`,token,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ref:branch})
        });
        return json({ok:true});
      }

      if(body.action==="runs"){
        const r=await gh(`/repos/${enc(owner)}/${enc(repo)}/actions/runs?branch=${enc(branch)}&per_page=10`,token);
        return json({runs:(r.workflow_runs||[]).map(x=>({id:x.id,name:x.name,status:x.status,conclusion:x.conclusion,html_url:x.html_url,created_at:x.created_at}))});
      }

      throw new Error("Unknown action");
    }catch(e){return json({error:e.message||String(e)},400)}
  }
}