import React, {useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";

type Project = {id:string;repository:string};
type Deployment = {id:string;project_id:string;commit_sha:string;environment:string;status:string;created_at:string};
type Health = {status:string;mode:string;github_connected:boolean};

function App(){
  const [token,setToken] = useState("");
  const [projects,setProjects] = useState<Project[]>([]);
  const [deployments,setDeployments] = useState<Deployment[]>([]);
  const [health,setHealth] = useState<Health|null>(null);
  const [repo,setRepo] = useState("chaima-menouar/stackflow-gitops");
  const [sha,setSha] = useState("");
  const [projectId,setProjectId] = useState("");
  const [notice,setNotice] = useState("Connect using your local development token to load the control center.");
  const [busy,setBusy] = useState(false);

  async function api(path:string,method="GET",body?:unknown,extra:Record<string,string>={}){
    const response=await fetch(path,{method,headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json",...extra},body:body?JSON.stringify(body):undefined});
    if(!response.ok){const msg=await response.text();throw new Error(`${response.status}: ${msg.slice(0,250)}`);}
    return response.json();
  }
  async function refresh(){
    setBusy(true);
    try{
      const [p,d,h]=await Promise.all([api("/api/projects"),api("/api/deployments"),fetch("/health").then(r=>r.json())]);
      setProjects(p);setDeployments(d);setHealth(h);
      if(!projectId && p.length)setProjectId(p[0].id);
      setNotice("Live API state refreshed. A workflow dispatch is not a verified deployment.");
    }catch(error){setNotice(String(error));}finally{setBusy(false);}
  }
  async function register(){
    setBusy(true);
    try{
      const p=await api("/api/projects","POST",{repository:repo});
      setProjectId(p.id);setNotice(`Registered ${p.repository}.`);
      setProjects(await api("/api/projects"));
    }catch(error){setNotice(String(error));}finally{setBusy(false);}
  }
  async function deploy(){
    if(!projectId){setNotice("Register a project first.");return;}
    setBusy(true);
    try{
      const key=crypto.randomUUID();
      const result=await api(`/api/projects/${encodeURIComponent(projectId)}/deployments`,"POST",
        {commit_sha:sha,environment:"staging"},{"Idempotency-Key":key});
      setNotice(`${result.status}: ${result.message}`);
      setDeployments(await api("/api/deployments"));
    }catch(error){setNotice(String(error));}finally{setBusy(false);}
  }
  const pending=deployments.filter(d=>d.status==="workflow_dispatched").length;
  return <div className="layout">
    <aside><div className="brand"><span className="gem">◆</span> STACKFLOW</div><div className="subbrand">DevOps control center</div>
      <nav><a className="active" href="#overview">▦ <span>Overview</span></a><a href="#projects">▣ <span>Projects</span></a><a href="#deployments">↗ <span>Deployments</span></a><a href="#operations">◉ <span>Operations</span></a></nav>
      <div className="sidefoot"><div className="pulse" /> Local-first prototype<br/><small>Single operator · v0.2</small></div>
    </aside>
    <main id="overview">
      <div className="topbar"><span>STACKFLOW / WORKSPACE</span><span className="tag">◈  DEVELOPMENT</span></div>
      <header><div className="eyebrow">YOUR DEPLOYMENT WORKSPACE</div><h1>Build with confidence.<br/><em>Deploy with control.</em></h1><p>Automate validation, container builds, and GitOps release proposals — with review at every production boundary.</p></header>
      <div className="metrics"><div className="stat"><span>Registered projects</span><strong>{projects.length}</strong><small>Strict allowlist</small></div><div className="stat"><span>Workflow requests</span><strong>{deployments.length}</strong><small>Recorded in API</small></div><div className="stat"><span>Awaiting verification</span><strong>{pending}</strong><small>Not confirmed healthy</small></div><div className="stat"><span>GitHub integration</span><strong className="status">{health?.github_connected?"CONNECTED":"NOT SET"}</strong><small>{health?.github_connected?"Backend token present":"Requires server token"}</small></div></div>
      <div className="notice" role="status"><span>ⓘ</span><span>{notice}</span></div>
      <section className="grid">
        <div className="card" id="projects"><h2>Access & projects</h2><p>Single-operator access for local demonstrations. GitHub OAuth is planned, not implemented.</p>
          <label>Local API token</label><div className="inline"><input type="password" aria-label="Local API token" placeholder="DEV_ADMIN_API_TOKEN" value={token} onChange={e=>setToken(e.target.value)}/><button disabled={busy} onClick={refresh}>Connect</button></div>
          <label>Approved repository</label><div className="inline"><input aria-label="Repository" value={repo} onChange={e=>setRepo(e.target.value)} /><button className="secondary" disabled={busy} onClick={register}>Register</button></div>
          <div className="list">{projects.length?projects.map(p=><div className="item" key={p.id}><div><b>▣ {p.repository}</b><small>Authorized source</small></div><span className="badge">Registered</span></div>):<div className="empty">No registered projects yet.</div>}</div>
        </div>
        <div className="card"><h2>Deploy to staging</h2><p>Dispatch the GitHub Actions workflow for an approved `main` commit. A release requires CI and an approved GitOps PR.</p>
          <label>Project</label><select aria-label="Project" value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.repository}</option>)}</select>
          <label>Git commit SHA · 40 characters</label><input aria-label="Commit SHA" placeholder="Enter latest approved main commit" value={sha} onChange={e=>setSha(e.target.value)} maxLength={40}/>
          <button className="wide" disabled={busy||sha.length!==40||!projectId} onClick={deploy}>↗ Request staging build</button>
          <div className="hint">Production promotion and rollback are reviewed GitOps operations. No direct cluster mutations.</div>
        </div>
      </section>
      <section className="card history" id="deployments"><div className="sectionhead"><div><h2>Deployment requests</h2><p>Records show workflow dispatch only, not Kubernetes health.</p></div><button className="secondary" disabled={busy} onClick={refresh}>↻ Refresh</button></div>
        <div className="table"><div className="tr heading"><span>COMMIT</span><span>ENVIRONMENT</span><span>STATUS</span><span>REQUESTED</span></div>{deployments.length?deployments.map(d=><div className="tr" key={d.id}><span className="mono">{d.commit_sha.slice(0,10)}</span><span>{d.environment}</span><span className="badge neutral">{d.status}</span><span>{new Date(d.created_at).toLocaleString()}</span></div>):<div className="empty">No deployment requests recorded.</div>}</div>
      </section>
      <section className="banner" id="operations"><div><b>Operations & observability</b><p>Prometheus metrics and Grafana are available through the optional local Docker Compose profile. Release validation still requires a running Kubernetes cluster.</p></div><a href="https://github.com/chaima-menouar/stackflow-gitops/actions" target="_blank" rel="noreferrer">View CI workflows ↗</a></section>
      <footer>StackFlow · GitOps-first delivery · Prototype scope is documented openly</footer>
    </main>
  </div>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
