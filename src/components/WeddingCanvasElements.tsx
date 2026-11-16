import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { WeddingElement, WeddingSection } from "../static/weddingDesign";
import { playableDropboxMediaUrl } from "../static/sites";

type Props = { elements: WeddingElement[]; section: WeddingSection; editorMode?: boolean; selectedId?: string };
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
function post(data: Record<string,unknown>) {
  if(window.parent!==window)window.parent.postMessage(data,window.location.origin);
}
function Placed({ element, editorMode=false, selectedId }: {element: WeddingElement; editorMode?:boolean; selectedId?:string}) {
  const drag=useRef<{x:number;y:number;startX:number;startY:number;sectionWidth:number}|null>(null);
  const style:CSSProperties={
    left:element.x+"%",top:element.y+"px",width:Math.min(element.width,100-element.x)+"%",
    color:element.color,fontSize:element.fontSize+"px",textAlign:element.align,
    fontFamily:element.font==="romantic"?"'Great Vibes',cursive":element.font==="classic"?"'Playfair Display',serif":"'DM Sans',sans-serif",
  };
  const select=()=>post({type:"WEDDING2_SELECT",id:"element:"+element.id});
  const onDown=(event: ReactPointerEvent<HTMLDivElement>)=>{
    if(!editorMode)return;
    if(event.button!==0)return;
    event.preventDefault(); event.stopPropagation();
    const section=event.currentTarget.closest<HTMLElement>("section");
    drag.current={x:element.x,y:element.y,startX:event.clientX,startY:event.clientY,sectionWidth:section?.getBoundingClientRect().width||360};
    event.currentTarget.setPointerCapture(event.pointerId);select();
  };
  const onMove=(event: ReactPointerEvent<HTMLDivElement>)=>{
    if(!drag.current)return;
    const d=drag.current;
    const x=clamp(d.x+(event.clientX-d.startX)/d.sectionWidth*100,0,Math.max(0,100-element.width));
    const y=clamp(d.y+event.clientY-d.startY,0,1800);
    event.currentTarget.style.left=x+"%";event.currentTarget.style.top=y+"px";
  };
  const onUp=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(!drag.current)return;
    const d=drag.current;drag.current=null;
    const x=clamp(d.x+(event.clientX-d.startX)/d.sectionWidth*100,0,Math.max(0,100-element.width));
    const y=clamp(d.y+event.clientY-d.startY,0,1800);
    post({type:"WEDDING2_DROP",id:element.id,x:Math.round(x*10)/10,y:Math.round(y)});
  };
  const media=/^https:\/\//i.test(element.url)||/^\/videos\/[a-zA-Z0-9._-]+$/.test(element.url)?playableDropboxMediaUrl(element.url):"";
  const link=/^https:\/\//i.test(element.url)||/^#[a-zA-Z0-9-]+$/.test(element.url)?element.url:"#";
  return <div className={"w2-canvas-element"+(editorMode?" w2-canvas-element--editable":"")+(selectedId==="element:"+element.id?" w2-canvas-element--active":"")+" w2-animation-"+element.animation}
    style={style} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={()=>{drag.current=null;}}
    role={editorMode?"button":undefined} tabIndex={editorMode?0:undefined}
    aria-label={editorMode?"Geser atau pilih "+element.type:undefined}
    onKeyDown={event=>{if(editorMode&&(event.key==="Enter"||event.key===" ")){event.preventDefault();select();}}}>
    {element.type==="text"&&<span className="w2-placed-text">{element.text}</span>}
    {element.type==="image"&&(media?<img src={media} alt={element.text||"Foto undangan"} loading="lazy"/>:<div className="w2-placed-placeholder">✧ Foto<br/>Masukkan URL gambar</div>)}
    {element.type==="video"&&(media?<video src={media} muted playsInline loop autoPlay controls={!editorMode}/>:<div className="w2-placed-placeholder">▶ Video<br/>Masukkan URL video</div>)}
    {element.type==="button"&&<a className="w2-placed-button" href={editorMode?undefined:link} target={link.startsWith("https:")?"_blank":undefined} rel="noopener noreferrer" onClick={event=>{if(editorMode)event.preventDefault();}}>{element.text||"Tombol"} ↗</a>}
    {element.type==="ornament"&&(element.text==="flower"?
      <svg className="w2-placed-flower" viewBox="0 0 120 120" role="img" aria-label="Ornamen bunga kertas">
        <g fill="#fffdf4" stroke={element.color} strokeWidth="1.3">
          <ellipse cx="60" cy="35" rx="13" ry="25"/><ellipse cx="60" cy="85" rx="13" ry="25"/>
          <ellipse cx="35" cy="60" rx="25" ry="13"/><ellipse cx="85" cy="60" rx="25" ry="13"/>
          <ellipse cx="42" cy="42" rx="13" ry="24" transform="rotate(-45 42 42)"/>
          <ellipse cx="78" cy="42" rx="13" ry="24" transform="rotate(45 78 42)"/>
          <ellipse cx="42" cy="78" rx="13" ry="24" transform="rotate(45 42 78)"/>
          <ellipse cx="78" cy="78" rx="13" ry="24" transform="rotate(-45 78 78)"/>
        </g><circle cx="60" cy="60" r="10" fill="#ccb17b" stroke="#9a854f" strokeWidth="2"/>
      </svg>
      :<span className="w2-placed-ornament" aria-hidden="true">{element.text||"❦"}</span>)}
    {editorMode&&<span className="w2-element-handle" aria-hidden="true">⠿</span>}
  </div>;
}
export function WeddingCanvasElements({elements,section,editorMode,selectedId}:Props) {
  return <>{elements.filter(item=>item.section===section).map(element=><Placed key={element.id} element={element} editorMode={editorMode} selectedId={selectedId}/>)}</>;
}
