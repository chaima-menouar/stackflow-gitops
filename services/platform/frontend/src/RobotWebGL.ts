/* StackFlow: native WebGL2 robot and deployment orbit. No extra npm dependencies. */
export type FeatureId="ci"|"containers"|"k8s"|"cloud"|"metrics"|"infra";
export type Feature={id:FeatureId;name:string;detail:string;color:string};
export const FEATURES:Feature[]=[
{id:"ci",name:"CI / CD",detail:"Tests & security checks",color:"#e685ff"},
{id:"containers",name:"CONTAINERS",detail:"Build and image registry",color:"#b38bff"},
{id:"k8s",name:"KUBERNETES",detail:"Cluster orchestration",color:"#9e88ff"},
{id:"cloud",name:"CLOUD DEPLOY",detail:"Reviewed GitOps release",color:"#ff88d5"},
{id:"metrics",name:"MONITORING",detail:"Prometheus & Grafana",color:"#da89fa"},
{id:"infra",name:"INFRASTRUCTURE",detail:"Environment provisioning",color:"#af9bff"}];
type M=Float32Array;type V=[number,number,number];
const TWO=Math.PI*2;
function id():M{return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);}
function mm(a:M,b:M):M{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[r+4]*b[c*4+1]+a[r+8]*b[c*4+2]+a[r+12]*b[c*4+3];return o;}
function move(x:number,y:number,z:number):M{const m=id();m[12]=x;m[13]=y;m[14]=z;return m;}
function size(x:number,y:number,z:number):M{const m=id();m[0]=x;m[5]=y;m[10]=z;return m;}
function rx(a:number):M{const m=id(),c=Math.cos(a),s=Math.sin(a);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m;}
function ry(a:number):M{const m=id(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m;}
function rz(a:number):M{const m=id(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m;}
function mat(...p:M[]):M{return p.reduce(mm,id());}
function projection(aspect:number):M{const f=1/Math.tan(43*Math.PI/360),m=new Float32Array(16),near=.1,far=80;m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);return mm(m,move(0,0,-10));}
function rgb(v:string):V{const x=parseInt(v.slice(1),16);return[((x>>16)&255)/255,((x>>8)&255)/255,(x&255)/255];}
type Geom={vertices:number[];indices:number[]};
function sphere():Geom{
const v:number[]=[],q:number[]=[];const rows=18,cols=24;
for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){const a=i*Math.PI/rows,b=j*TWO/cols,x=Math.sin(a)*Math.cos(b),y=Math.cos(a),z=Math.sin(a)*Math.sin(b);v.push(x,y,z,x,y,z,j/cols,i/rows);}
for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;q.push(a,b,a+1,b,b+1,a+1);}
return {vertices:v,indices:q};
}
function torus():Geom{
const v:number[]=[],q:number[]=[];const rows=8,cols=60;
for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){const a=i*TWO/rows,b=j*TWO/cols,x=(1+.055*Math.cos(a))*Math.cos(b),y=(1+.055*Math.cos(a))*Math.sin(b),z=.055*Math.sin(a);v.push(x,y,z,Math.cos(a)*Math.cos(b),Math.cos(a)*Math.sin(b),Math.sin(a),j/cols,i/rows);}
for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;q.push(a,b,a+1,b,b+1,a+1);}
return {vertices:v,indices:q};
}
const quad:Geom={vertices:[-.5,-.5,0,0,0,1,0,1,.5,-.5,0,0,0,1,1,1,.5,.5,0,0,0,1,1,0,-.5,.5,0,0,0,1,0,0],indices:[0,1,2,0,2,3]};
type Mesh={vao:WebGLVertexArrayObject;vbo:WebGLBuffer;ebo:WebGLBuffer;n:number};
function mesh(gl:WebGL2RenderingContext,geom:Geom):Mesh{
const vao=gl.createVertexArray(),vbo=gl.createBuffer(),ebo=gl.createBuffer();
if(!vao||!vbo||!ebo)throw Error("WebGL resource unavailable");
gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geom.vertices),gl.STATIC_DRAW);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ebo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(geom.indices),gl.STATIC_DRAW);
for(const [i,n,off] of [[0,3,0],[1,3,3],[2,2,6]]){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,gl.FLOAT,false,32,off*4);}
gl.bindVertexArray(null);return {vao,vbo,ebo,n:geom.indices.length};
}
const vs=[
"#version 300 es","precision highp float;","layout(location=0) in vec3 aPos;","layout(location=1) in vec3 aNormal;","layout(location=2) in vec2 aUv;",
"uniform mat4 uModel;","uniform mat4 uVP;","out vec3 normal;","out vec2 uv;",
"void main(){gl_Position=uVP*uModel*vec4(aPos,1.0);normal=mat3(uModel)*aNormal;uv=aUv;}"
].join("\n");
const fs=[
"#version 300 es","precision highp float;","in vec3 normal;","in vec2 uv;","uniform vec3 uColor;","uniform vec3 uEmission;",
"uniform float uGlow;","uniform float uAlpha;","uniform int uTextured;","uniform sampler2D uMap;","out vec4 pixel;",
"void main(){if(uTextured==1){vec4 t=texture(uMap,uv);pixel=vec4(t.rgb,t.a*uAlpha);return;}",
"vec3 n=normalize(normal);float l=max(0.0,dot(n,normalize(vec3(-0.5,0.6,1.0))));",
"float rim=pow(1.0-abs(n.z),2.0);float shine=pow(max(0.0,dot(reflect(-normalize(vec3(-0.5,0.6,1.0)),n),vec3(0.0,0.0,1.0))),20.0);",
"pixel=vec4(uColor*(0.46+0.45*l)+uEmission*uGlow*(0.50+rim*0.56)+vec3(0.45,0.3,0.6)*shine,uAlpha);}"
].join("\n");
function compile(gl:WebGL2RenderingContext,type:number,code:string):WebGLShader{
const s=gl.createShader(type);if(!s)throw Error("No shader");gl.shaderSource(s,code);gl.compileShader(s);
if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||"Shader compilation failed");return s;
}
function createProgram(gl:WebGL2RenderingContext):WebGLProgram{
const p=gl.createProgram();if(!p)throw Error("No program");
const a=compile(gl,gl.VERTEX_SHADER,vs),b=compile(gl,gl.FRAGMENT_SHADER,fs);
gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);gl.deleteShader(a);gl.deleteShader(b);
if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p)||"3D program failed");return p;
}
function textureCanvas(f:Feature):HTMLCanvasElement{
const canvas=document.createElement("canvas");canvas.width=512;canvas.height=256;
const c=canvas.getContext("2d");if(!c)throw Error("Canvas 2D unavailable");
c.shadowBlur=16;c.shadowColor=f.color;
c.beginPath();c.roundRect(9,10,494,235,25);const g=c.createLinearGradient(0,0,512,256);g.addColorStop(0,"rgba(90,34,152,.94)");g.addColorStop(1,"rgba(25,15,52,.96)");c.fillStyle=g;c.fill();c.strokeStyle=f.color;c.lineWidth=5;c.stroke();c.shadowBlur=0;
c.fillStyle="#f9eaff";c.font="bold 27px sans-serif";c.fillText(f.name,38,85);
c.fillStyle="#c4a3dd";c.font="20px sans-serif";c.fillText(f.detail,38,123);
c.strokeStyle=f.color;c.lineWidth=5;c.beginPath();c.moveTo(38,152);c.lineTo(280,152);c.stroke();
c.fillStyle="rgba(237,201,255,.65)";for(let i=0;i<4;i++){c.beginPath();c.roundRect(40+i*39,185,22,11,4);c.fill();}
c.lineWidth=7;c.strokeStyle="#f2caff";c.lineCap="round";c.lineJoin="round";
const x=409,y=133;
if(f.id==="metrics"){c.beginPath();c.moveTo(x-41,y+29);c.lineTo(x-15,y);c.lineTo(x+3,y+14);c.lineTo(x+41,y-34);c.stroke();}
else if(f.id==="cloud"){c.beginPath();c.arc(x-13,y+8,19,Math.PI*.76,Math.PI*1.6);c.arc(x+9,y-16,25,Math.PI*1.15,Math.PI*1.92);c.arc(x+32,y+10,19,-Math.PI*.5,Math.PI*.48);c.lineTo(x-20,y+29);c.stroke();c.beginPath();c.moveTo(x+8,y+28);c.lineTo(x+8,y-13);c.lineTo(x-6,y+4);c.moveTo(x+8,y-13);c.lineTo(x+22,y+4);c.stroke();}
else if(f.id==="k8s"){c.beginPath();c.arc(x,y,34,0,TWO);c.stroke();for(let i=0;i<6;i++){const a=i*TWO/6;c.beginPath();c.moveTo(x+12*Math.cos(a),y+12*Math.sin(a));c.lineTo(x+43*Math.cos(a),y+43*Math.sin(a));c.stroke();}}
else if(f.id==="ci"){for(let i=0;i<3;i++){c.beginPath();c.arc(x-31+i*31,y+((i%2)*17),9,0,TWO);c.stroke();}c.beginPath();c.moveTo(x-22,y);c.lineTo(x-9,y+15);c.moveTo(x+10,y+15);c.lineTo(x+21,y);c.stroke();}
else if(f.id==="containers"){for(const dx of [-20,18])for(const dy of [-18,18])c.strokeRect(x+dx-14,y+dy-13,28,26);}
else{c.beginPath();c.moveTo(x,y-40);c.lineTo(x+38,y-20);c.lineTo(x+38,y+20);c.lineTo(x,y+42);c.lineTo(x-38,y+20);c.lineTo(x-38,y-20);c.closePath();c.stroke();}
return canvas;
}
type U={model:WebGLUniformLocation|null;vp:WebGLUniformLocation|null;color:WebGLUniformLocation|null;emission:WebGLUniformLocation|null;glow:WebGLUniformLocation|null;alpha:WebGLUniformLocation|null;textured:WebGLUniformLocation|null;map:WebGLUniformLocation|null};
function uniforms(gl:WebGL2RenderingContext,p:WebGLProgram):U{
const q=(s:string)=>gl.getUniformLocation(p,s);return {model:q("uModel"),vp:q("uVP"),color:q("uColor"),emission:q("uEmission"),glow:q("uGlow"),alpha:q("uAlpha"),textured:q("uTextured"),map:q("uMap")};
}
export class RobotRenderer{
private gl:WebGL2RenderingContext;private prog:WebGLProgram;private u:U;private meshes:Record<"sphere"|"torus"|"quad",Mesh>;
private textures:WebGLTexture[]=[];private vp=id();private raf=0;private started=performance.now();private last=0;private elapsed=0;private selected:FeatureId="ci";
private width=1;private height=1;private yaw=0;private pitch=0;private tx=0;private ty=0;private paused=false;private reduced=false;private visible=true;private disposed=false;
private observer:ResizeObserver;private intersection:IntersectionObserver|null=null;private projected:{id:FeatureId;x:number;y:number;z:number}[]=[];
private lost:(e:Event)=>void;
constructor(private canvas:HTMLCanvasElement,private onSelect:(id:FeatureId)=>void,private onError:()=>void){
const gl=canvas.getContext("webgl2",{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:"high-performance"});
if(!gl)throw Error("WebGL2 unavailable");this.gl=gl;
this.prog=createProgram(gl);gl.useProgram(this.prog);this.u=uniforms(gl,this.prog);
this.meshes={sphere:mesh(gl,sphere()),torus:mesh(gl,torus()),quad:mesh(gl,quad)};
gl.uniform1i(this.u.map,0);
for(const f of FEATURES){const tex=gl.createTexture();if(!tex)throw Error("Texture allocation failed");
gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,textureCanvas(f));
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
this.textures.push(tex);}
this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);
if(typeof IntersectionObserver!=="undefined"){this.intersection=new IntersectionObserver(e=>{this.visible=e[0]?.isIntersecting??true;});this.intersection.observe(canvas);}
this.lost=(e)=>{e.preventDefault();this.onError();this.dispose();};canvas.addEventListener("webglcontextlost",this.lost);
this.resize();this.raf=requestAnimationFrame(this.frame);
}
private resize(){const {gl,canvas}=this,r=canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,1.6);
this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);
canvas.width=Math.max(1,Math.round(this.width*d));canvas.height=Math.max(1,Math.round(this.height*d));
gl.viewport(0,0,canvas.width,canvas.height);this.vp=projection(canvas.width/canvas.height);}
select(id:FeatureId){this.selected=id;}
pointer(x:number,y:number){if(this.reduced)return;this.tx=x;this.ty=y;}
pause(v:boolean){this.paused=v;this.last=performance.now();}
motionReduced(v:boolean){this.reduced=v;}
tap(x:number,y:number){const nearest=this.projected.map(p=>({id:p.id,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];if(nearest?.d<95)this.onSelect(nearest.id);}
hover(x:number,y:number){return this.projected.some(p=>Math.hypot(p.x-x,p.y-y)<88);}
private draw(shape:"sphere"|"torus"|"quad",root:M,p:V,sz:V,color:string,glow=0,alpha=1,rotation:M=id(),texture?:WebGLTexture){
const {gl}=this,m=mat(root,move(...p),rotation,size(...sz)),geo=this.meshes[shape];
gl.uniformMatrix4fv(this.u.model,false,m);gl.uniform3fv(this.u.color,rgb(color));gl.uniform3fv(this.u.emission,rgb(color));
gl.uniform1f(this.u.glow,glow);gl.uniform1f(this.u.alpha,alpha);gl.uniform1i(this.u.textured,texture?1:0);
if(texture){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);}
gl.bindVertexArray(geo.vao);gl.drawElements(gl.TRIANGLES,geo.n,gl.UNSIGNED_SHORT,0);
}
private ball(m:M,p:V,d:V,c:string,glow=0){this.draw("sphere",m,p,d,c,glow);}
private ring(m:M,p:V,d:V,c:string,a=1,rot:M=id()){this.draw("torus",m,p,d,c,.5,a,rot);}
private arm(body:M,side:number,t:number){
const activePosition=this.orbitPos(FEATURES.findIndex(f=>f.id===this.selected),t);
const reach=Math.max(0,side*activePosition[0])/2.6;
const a=side*(.18+.14*Math.sin(t*.98+side*1.3)+reach*.30);
const parent=mat(body,move(side*.78,-.18,.08),rz(a));
this.ball(parent,[0,0,0],[.30,.30,.27],"#c7b6e9",.13);
this.ball(parent,[side*.36,.09,.07],[.45,.22,.22],"#e0d3f2",.18);
this.ball(parent,[side*.70,.20,.15],[.22,.22,.22],"#3c2357",.32);
this.ring(parent,[side*.70,.20,.34],[.16,.16,.15],"#c276ff");
this.ball(parent,[side*.87,.40,.24],[.28,.34,.21],"#d6c8e9",.18);
const hand=mat(parent,move(side*.94,.70,.42),ry(.09*Math.sin(t+side)));
this.ball(hand,[0,0,0],[.26,.26,.14],"#f3dcfc",.16);
this.ring(hand,[0,0,.11],[.14,.14,.12],"#d76eff");
this.ball(hand,[0,0,.14],[.06,.06,.07],"#fb8eff",1.25);
for(let j=-1;j<=1;j++){this.ball(hand,[j*.145,.26+(j===0?.07:0),.04],[.071,.2,.085],"#e5cffa",.12);this.ball(hand,[j*.145,.42+(j===0?.07:0),.06],[.077,.078,.077],"#cc79e9",.72);}
this.ball(hand,[side*.24,-.05,.08],[.17,.09,.09],"#dac7e8",.25);
}
private robot(t:number){
const body=mat(ry(this.yaw),rx(this.pitch),move(0,.06*Math.sin(t*.91),0));
this.ball(body,[0,-1.69,-.08],[.50,.26,.47],"#302046",.27);
this.ring(body,[0,-1.86,.07],[.58,.21,.55],"#b95dfb",1,rx(Math.PI/2));
this.ball(body,[0,-1.34,0],[.62,.30,.56],"#d2c4e9",.16);
this.ball(body,[0,-.61,0],[.89,1.00,.65],"#ddd0f3",.15);
this.ball(body,[0,-.71,.51],[.57,.67,.19],"#201530",.25);
this.ball(body,[0,-.34,.62],[.47,.43,.11],"#402157",.31);
this.ball(body,[0,-.46,.72],[.26,.25,.08],"#17102d",.30);
this.ring(body,[0,-.47,.81],[.31,.31,.18],"#be65ff");
this.ball(body,[0,-.45,.83],[.17,.17,.07],"#ac47de",.72);
this.ball(body,[0,.30,0],[.33,.21,.32],"#1d1529",.22);
this.arm(body,-1,t);this.arm(body,1,t);
const active=this.orbitPos(FEATURES.findIndex(f=>f.id===this.selected),t);
const look=Math.max(-.25,Math.min(.25,active[0]*.075));
const head=mat(body,move(0,.47,0),ry(look+.08*Math.sin(t*.55)),rz(.029*Math.sin(t*.72)),move(0,-.47,0));
this.ball(head,[0,1.22,.04],[1.03,.75,.67],"#eee5ff",.15);
this.ball(head,[0,1.19,.59],[.91,.58,.22],"#231637",.12);
this.ball(head,[0,1.19,.76],[.83,.49,.145],"#0d0b1e",.13);
this.ring(head,[0,1.2,.80],[.95,.57,.16],"#ae5df4");
for(const side of [-1,1]){
this.ball(head,[side*1.04,1.24,.12],[.24,.32,.30],"#31204c",.23);
this.ring(head,[side*1.11,1.23,.37],[.21,.21,.12],"#c779f6");
const fin=mat(head,move(side*1.01,1.86,-.08),rz(-side*.29));
this.ball(fin,[0,.16,0],[.14,.38,.19],"#d8c5eb",.20);
this.ball(fin,[0,.20,.14],[.058,.23,.065],"#9f55ca",.72);
}
const blink=(t%5.4)>5.15?.12:1;
for(const side of [-1,1])for(let j=0;j<13;j++){
const v=j/6-1;
this.ball(head,[side*.35+v*.18,1.18+.13-.13*v*v,.913],[.049,.047*blink,.029],"#e48afc",1.3);
}
this.ball(head,[0,.47,.17],[.48,.13,.29],"#191322",.12);
}
private orbitPos(i:number,t:number):V{const a=t*.23+i*TWO/6-.3;return [Math.cos(a)*2.5,Math.sin(a)*1.53+.08,Math.sin(a)*1.24-.07];}
private orbit(t:number){
const base=mat(ry(this.yaw*.4),rx(this.pitch*.4));
this.ring(base,[0,.09,-.45],[2.56,1.56,1],"#a74aef",.24,ry(-.25));
this.ring(base,[0,.08,-.45],[2.63,1.61,1],"#ce4fae",.16,ry(-.25));
const points:{id:FeatureId;x:number;y:number;z:number}[]=[];
for(let i=0;i<FEATURES.length;i++){
const f=FEATURES[i],p=this.orbitPos(i,t),angle=t*.23+i*TWO/6-.3;
const w=this.vp[3]*p[0]+this.vp[7]*p[1]+this.vp[11]*p[2]+this.vp[15];
const x=(this.vp[0]*p[0]+this.vp[4]*p[1]+this.vp[8]*p[2]+this.vp[12])/w;
const y=(this.vp[1]*p[0]+this.vp[5]*p[1]+this.vp[9]*p[2]+this.vp[13])/w;
points.push({id:f.id,x:(x*.5+.5)*this.width,y:(.5-y*.5)*this.height,z:p[2]});
const root=mat(base,move(...p),ry(-Math.cos(angle)*.25),rz(.05*Math.sin(angle)));
const k=f.id===this.selected?1.13:1;
this.draw("quad",root,[0,0,-.025],[1.55*k,.83*k,1],f.color,.2,.22);
this.draw("quad",root,[0,0,.005],[1.54*k,.82*k,1],f.color,0,.99,id(),this.textures[i]);
}
for(let i=0;i<25;i++){const a=t*(.30+i%3*.025)+i*TWO/25,p:[number,number,number]=[Math.cos(a)*2.56,Math.sin(a)*1.54+.08,Math.sin(a)*1.25-.06];
this.ball(base,p,[.03,.03,.03],i%3===0?"#f48ddc":"#c786ff",1.1);}
// A stream of light travels from the robot hand to the selected feature.
const target=this.orbitPos(FEATURES.findIndex(f=>f.id===this.selected),t);
const handX=target[0]>=0?1.72:-1.72;
for(let j=0;j<7;j++){
  const f=((j/7+t*.33)%1);
  const p:[number,number,number]=[handX+(target[0]-handX)*f,.45+(target[1]-.45)*f,.66+(target[2]-.66)*f];
  const radius=.024+.015*Math.sin(Math.PI*f);
  this.ball(base,p,[radius,radius,radius],"#f2a6ff",1.12);
}
this.projected=points;
}
private frame=(now:number)=>{
if(this.disposed)return;this.raf=requestAnimationFrame(this.frame);
if(this.paused||!this.visible||document.hidden){this.last=now;return;}
const delta=Math.min(.055,(now-(this.last||now))/1000);this.last=now;
if(!this.reduced)this.elapsed+=delta;
this.yaw+=(this.tx*.16-this.yaw)*.05;this.pitch+=(this.ty*.13-this.pitch)*.05;
try{this.render(this.elapsed);}catch{this.onError();this.dispose();}
};
private render(t:number){const gl=this.gl;
gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
gl.disable(gl.CULL_FACE);gl.useProgram(this.prog);gl.uniformMatrix4fv(this.u.vp,false,this.vp);
gl.depthMask(true);this.robot(t);gl.depthMask(false);this.orbit(t);gl.depthMask(true);gl.bindVertexArray(null);
}
dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.raf);this.observer.disconnect();this.intersection?.disconnect();this.canvas.removeEventListener("webglcontextlost",this.lost);
const gl=this.gl;if(gl.isContextLost())return;
for(const m of Object.values(this.meshes)){gl.deleteVertexArray(m.vao);gl.deleteBuffer(m.vbo);gl.deleteBuffer(m.ebo);}
for(const t of this.textures)gl.deleteTexture(t);
gl.deleteProgram(this.prog);
}
}
