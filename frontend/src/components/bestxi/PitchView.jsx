import { PlayerPhoto, ClubLogo, RatingChip, DataQualityBadge, Modal } from '../ui/index.jsx';
import { getRatingTone, statusMeta } from '../../data.js';

function PitchSurface({ children }) {
  return (
    <svg viewBox="0 0 680 480" width="100%" style={{display:'block',borderRadius:'var(--radius-lg)'}}>
      <defs>
        <pattern id="grass" patternUnits="userSpaceOnUse" width="68" height="480">
          <rect width="34" height="480" fill="var(--color-pitch-grass)"/>
          <rect x="34" width="34" height="480" fill="var(--color-pitch-grass-2)"/>
        </pattern>
        <radialGradient id="pitch-vig" cx="0.5" cy="0.55" r="0.7">
          <stop offset="0%" stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)"/>
        </radialGradient>
        <pattern id="zellige-p" patternUnits="userSpaceOnUse" width="48" height="48">
          <g fill="none" stroke="rgba(212,175,55,0.06)" strokeWidth="0.4">
            <polygon points="24,4 28,18 42,18 30,26 34,40 24,32 14,40 18,26 6,18 20,18"/>
          </g>
        </pattern>
      </defs>
      <rect width="680" height="480" fill="url(#grass)"/>
      <rect width="680" height="480" fill="url(#zellige-p)"/>
      <rect width="680" height="480" fill="url(#pitch-vig)"/>
      <g stroke="var(--color-pitch-line)" strokeWidth="1.5" fill="none" opacity="0.9">
        <rect x="20" y="20" width="640" height="440"/>
        <line x1="20" y1="240" x2="660" y2="240"/>
        <circle cx="340" cy="240" r="60"/>
        <circle cx="340" cy="240" r="2" fill="var(--color-pitch-line)"/>
        <rect x="180" y="20" width="320" height="80"/>
        <rect x="260" y="20" width="160" height="32"/>
        <circle cx="340" cy="80" r="2" fill="var(--color-pitch-line)"/>
        <path d="M 280 100 A 60 60 0 0 0 400 100"/>
        <rect x="180" y="380" width="320" height="80"/>
        <rect x="260" y="428" width="160" height="32"/>
        <circle cx="340" cy="400" r="2" fill="var(--color-pitch-line)"/>
        <path d="M 280 380 A 60 60 0 0 1 400 380"/>
        <path d="M 20 28 A 8 8 0 0 0 28 20"/>
        <path d="M 652 20 A 8 8 0 0 0 660 28"/>
        <path d="M 20 452 A 8 8 0 0 1 28 460"/>
        <path d="M 660 452 A 8 8 0 0 1 652 460"/>
        <rect x="318" y="14" width="44" height="6" stroke="var(--color-pitch-line)" fill="var(--color-pitch-grass-2)"/>
        <rect x="318" y="460" width="44" height="6" stroke="var(--color-pitch-line)" fill="var(--color-pitch-grass-2)"/>
      </g>
      {children}
    </svg>
  );
}

function PlayerSlot({ slot, onClick, isActive }) {
  const { x, y, slot: pos, player } = slot;
  const ringColor = isActive ? 'var(--color-red)' : (player ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)');
  const size = 52;
  const tone = player ? getRatingTone(player.rating || player.avgRating) : null;
  const sm = player && player.status && player.status !== 'available' ? statusMeta(player.status) : null;

  return (
    <g transform={`translate(${x - size/2}, ${y - size/2})`} onClick={onClick} style={{cursor:'pointer'}}>
      <foreignObject width={size+80} height={size+38} x={-40} overflow="visible">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          <div style={{fontFamily:'var(--font-mono)',fontSize:9,fontWeight:600,letterSpacing:'0.14em',color:'var(--color-gold)',textTransform:'uppercase',marginBottom:-2}}>{pos}</div>
          <div style={{position:'relative',transition:'transform 200ms cubic-bezier(0.5,1.5,0.4,0.95)',transform:isActive?'scale(1.06)':'none'}}>
            <div style={{width:size,height:size,borderRadius:'50%',padding:2,background:ringColor,boxShadow:isActive?'0 0 0 3px rgba(193,18,31,0.25),0 6px 18px rgba(0,0,0,0.5)':'0 4px 12px rgba(0,0,0,0.6)',transition:'all 200ms ease'}}>
              {player
                ? <PlayerPhoto player={player} size={size-4}/>
                : <div style={{width:size-4,height:size-4,borderRadius:'50%',background:'rgba(0,0,0,0.4)',border:'1px dashed rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontSize:18,color:'var(--color-text-tertiary)'}}>+</div>}
            </div>
            {player && tone && (
              <div style={{position:'absolute',top:-4,right:-6,background:tone.solid,color:'#0D0F0E',fontFamily:'var(--font-mono)',fontSize:10,fontWeight:600,padding:'2px 5px',borderRadius:4,border:'2px solid var(--color-pitch-grass)',lineHeight:1}}>
                {(player.rating||player.avgRating||0).toFixed(1)}
              </div>
            )}
            {sm && (
              <div title={sm.label} style={{position:'absolute',bottom:-2,right:-2,width:16,height:16,borderRadius:'50%',background:sm.dot,border:'2px solid var(--color-pitch-grass)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:'#fff',lineHeight:1}}>
                {player.status==='suspended'?'!':'+'}
              </div>
            )}
            {player && (
              <div title={player.club?.name} style={{position:'absolute',bottom:-2,left:-2,width:14,height:14,borderRadius:3,background:player.club?.color||'#333',border:'2px solid var(--color-pitch-grass)'}}/>
            )}
          </div>
          <div style={{fontFamily:'var(--font-body)',fontSize:10.5,fontWeight:600,color:'#F0EDE8',textShadow:'0 1px 3px rgba(0,0,0,0.8)',whiteSpace:'nowrap',letterSpacing:'0.02em'}}>
            {player ? (player.name||player.fullName||'').split(' ').slice(-1)[0] : ' '}
          </div>
        </div>
      </foreignObject>
    </g>
  );
}

export function PitchView({ formation, startingXI, activeSlot, onSlotClick, compact }) {
  return (
    <div style={{position:'relative',background:'var(--color-pitch-grass)',borderRadius:'var(--radius-lg)',overflow:'hidden',border:'1px solid var(--color-border)'}}>
      <PitchSurface>
        {startingXI.map((s,i)=>(
          <PlayerSlot key={i} slot={s} onClick={()=>onSlotClick&&onSlotClick(i)} isActive={activeSlot===i}/>
        ))}
      </PitchSurface>
      {!compact&&(
        <div style={{position:'absolute',top:14,insetInlineStart:14,padding:'5px 12px',borderRadius:6,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.08)',fontFamily:'var(--font-display)',fontSize:18,letterSpacing:'0.06em',color:'var(--color-gold)'}}>
          {formation}
        </div>
      )}
      {!compact&&(
        <div style={{position:'absolute',top:14,insetInlineEnd:14,padding:'4px 10px',borderRadius:'var(--radius-full)',background:'rgba(0,0,0,0.65)',fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.2em',color:'var(--color-text-secondary)',textTransform:'uppercase'}}>
          ↑ Attack
        </div>
      )}
    </div>
  );
}

function SubRow({ rank, player, highlight, onSelect }) {
  const unavailable = player.status && player.status !== 'available';
  const meta = unavailable ? statusMeta(player.status) : null;
  return (
    <div onClick={onSelect}
      style={{display:'flex',alignItems:'center',gap:14,padding:'10px 24px',cursor:onSelect?'pointer':'default',transition:'background 120ms ease',opacity:unavailable?0.72:1}}
      onMouseEnter={e=>{ if(!highlight) e.currentTarget.style.background='var(--color-surface-2)'; }}
      onMouseLeave={e=>{ if(!highlight) e.currentTarget.style.background='transparent'; }}>
      <div style={{width:24,textAlign:'center',fontFamily:'var(--font-mono)',fontSize:13,color:'var(--color-gold)',fontWeight:600}}>{rank}</div>
      <div style={{position:'relative'}}>
        <PlayerPhoto player={player} size={36}/>
        {unavailable&&<span style={{position:'absolute',bottom:-1,right:-1,width:11,height:11,borderRadius:'50%',background:meta.dot,border:'2px solid var(--color-surface)'}}/>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,fontSize:13.5,color:'var(--color-text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{player.name||player.fullName}</div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:3,fontSize:11.5,color:'var(--color-text-secondary)'}}>
          <ClubLogo club={player.club} size={14}/>
          <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{player.club?.name}</span>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
        <RatingChip rating={player.rating||player.avgRating} size="sm"/>
        <DataQualityBadge quality={player.dataQ||player.dataQuality}/>
      </div>
    </div>
  );
}

export function SubstitutesList({ open, slot, starter, subs, onClose, onSwap }) {
  if (!slot) return null;
  return (
    <Modal isOpen={open} onClose={onClose} title={`Top Substitutes — ${slot}`} subtitle={`Sorted by recent form · ${subs.length} options`} size="md">
      <div style={{padding:'16px 0'}}>
        {starter&&(
          <div style={{padding:'12px 24px',background:'var(--color-red-soft)',borderBottom:'1px solid var(--color-border)'}}>
            <div style={{fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--color-red)',marginBottom:8}}>Current Starter</div>
            <SubRow rank="●" player={starter} highlight onSelect={()=>{}}/>
          </div>
        )}
        <div style={{padding:'8px 0'}}>
          {subs.map((p,i)=>(
            <SubRow key={p.id||p.slug} rank={i+1} player={p} onSelect={()=>{ onSwap(p); onClose(); }}/>
          ))}
        </div>
      </div>
    </Modal>
  );
}
