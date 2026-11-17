import os, sys, json, io, time
from playwright.sync_api import sync_playwright
U='http://localhost:8765/'
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'out'); os.makedirs(OUT,exist_ok=True)
def launch(p): return p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)
def page(b,w=1280,h=860,mobile=False,tz=None):
    kw=dict(viewport={'width':w,'height':h},accept_downloads=True)
    if mobile: kw.update(has_touch=True,is_mobile=True,device_scale_factor=2)
    if tz: kw['timezone_id']=tz
    ctx=b.new_context(**kw); pg=ctx.new_page(); pg.errs=[]
    pg.on('console',lambda m:pg.errs.append(m.text) if m.type=='error' else None); pg.on('pageerror',lambda e:pg.errs.append('PAGEERR '+str(e)))
    def blockext(r):
        if 'localhost' in r.request.url or r.request.url.startswith(('data:','blob:')): r.continue_()
        else: pg.errs.append('EXTERNAL '+r.request.url); r.abort()
    pg.route('**/*',blockext)
    return ctx,pg
def ready(pg,url='index.html'):
    pg.goto(U+url); pg.wait_for_function('window.__ready===true',timeout=20000); pg.wait_for_timeout(200)
def act(pg,name,extra=''): pg.click(f'[data-act="{name}"]{extra}')
def flush(pg): pg.evaluate('(async()=>{await Sim.leave();await Saver.flush()})()'); pg.wait_for_timeout(120)
RES=[]
def T(tid,ok,note=''):
    RES.append((tid,bool(ok),note)); print(('PASS' if ok else 'FAIL'),tid,note)
def dump(name):
    json.dump(RES,open(os.path.join(OUT,name),'w'),ensure_ascii=False,indent=1)
import base64
def mkimg(pg,w=900,h=1200,label='FICTICIA',color='#b98a72',exif=None):
    """Imagen sintética (no es una persona). Devuelve bytes JPEG."""
    d=pg.evaluate("""([w,h,label,color])=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#cfcbd6';x.fillRect(0,0,w,h);x.fillStyle=color;x.beginPath();x.ellipse(w/2,h/2,w*.3,h*.36,0,0,7);x.fill();
      x.strokeStyle='#333';x.lineWidth=6;for(let i=0;i<8;i++){x.beginPath();x.moveTo(0,h*i/8);x.lineTo(w,h*(i+1)/8);x.stroke()}x.fillStyle='#111';x.font='bold '+Math.round(w/14)+'px sans-serif';x.fillText(label,20,h-30);return c.toDataURL('image/jpeg',.9)}""",[w,h,label,color])
    b=base64.b64decode(d.split(',')[1])
    if exif:  # inserta un segmento EXIF mínimo con DateTimeOriginal
        s=exif.encode()+b'\x00'
        tiff=b'II*\x00\x08\x00\x00\x00'+b'\x01\x00'+b'\x69\x87\x04\x00\x01\x00\x00\x00\x1a\x00\x00\x00'+b'\x00\x00\x00\x00'+b'\x01\x00'+b'\x03\x90\x02\x00\x14\x00\x00\x00\x2c\x00\x00\x00'+b'\x00\x00\x00\x00'+s
        seg=b'Exif\x00\x00'+tiff; b=b[:2]+b'\xff\xe1'+(len(seg)+2).to_bytes(2,'big')+seg+b[2:]
    return b
def files(pg,sel,items):
    pg.set_input_files(sel,[{'name':n,'mimeType':m,'buffer':b} for n,m,b in items])
def modal_ok(pg): pg.click('#mCard button.primary, #mCard button.dangerfill'); pg.wait_for_timeout(150)
def fb(pg,vals,submit=True):
    for k,v in vals.items():
        el=pg.locator('#fb_'+k)
        if isinstance(v,bool): el.set_checked(v)
        elif el.evaluate('e=>e.tagName')=='SELECT': el.select_option(v)
        else: el.fill(str(v))
    if submit: pg.click('#fbForm button[type=submit]'); pg.wait_for_timeout(200)
def dl(pg,trigger):
    with pg.expect_download(timeout=60000) as d: trigger()
    f=d.value; path=os.path.join(OUT,f.suggested_filename); f.save_as(path); return path
def new_case(pg,name,regions=('nariz',),way='guiada',consent=True):
    pg.click('[data-act="nav"][data-v="hoy"]:visible'); act(pg,'newVal'); pg.fill('#w_name',name)
    if consent: pg.check('#w_cd'); pg.check('#w_cp')
    act(pg,'wizNext'); pg.wait_for_timeout(200)
    for r in regions: pg.click(f'[data-act="wizRegion"][data-r="{r}"]')
    pg.click(f'[data-act="wizStart"][data-way="{way}"]'); pg.wait_for_selector('[data-act="capFinish"], .guide svg'); pg.wait_for_timeout(150)
def world(pg): return pg.evaluate("(()=>{const r=document.querySelector('#world').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()")
def place(pg,mod,pts,slid,W=900,H=1200):
    if pg.locator(f'.modbtn[data-m="{mod}"]').count()==0: act(pg,'allMods')
    pg.click(f'.modbtn[data-m="{mod}"]'); pg.wait_for_timeout(80); s=world(pg)
    for (x,y) in pts: pg.mouse.click(s[0]+x/W*s[2], s[1]+y/H*s[3]); pg.wait_for_timeout(70)
    for k,v in slid.items(): slider(pg,'#s_'+k,v)
def slider(pg,sel,v):
    pg.evaluate("([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}",[sel,v])

def quick_case(pg,name,sim=True):
    new_case(pg,name,('nariz',),'guiada')
    act(pg,'capPick'); files(pg,'#fileLib',[('f.jpg','image/jpeg',mkimg(pg,900,1200,'FRONTAL'))]); pg.wait_for_selector('.capprev'); act(pg,'capAccept'); pg.wait_for_timeout(500)
    act(pg,'capMode','[data-m="tablero"]'); act(pg,'capFinish'); pg.click('#cfReady'); pg.click('#crHere'); pg.wait_for_timeout(500)
    if sim:
        pg.click('.gcard [data-act="editPhoto"]'); pg.wait_for_selector('#panel .modbtn'); pg.wait_for_timeout(700)
        place(pg,'rinoFrontal',[(450,512),(450,668),(394,670),(506,670)],{'dorso':-55})
        act(pg,'ptool','[data-t="priv"]'); act(pg,'maskAdd','[data-sh="rect"]'); flush(pg); act(pg,'closeEditor'); pg.wait_for_timeout(500)
    return pg.evaluate('S.pid')
def tab(pg,t): pg.click(f'[data-act="ptab"][data-arg="{t}"]'); pg.wait_for_timeout(350)
