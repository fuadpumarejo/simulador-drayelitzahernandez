#!/usr/bin/env python3
"""Arma index.html autocontenido (sin CDN): estilos, fuentes, librerías y código en un solo archivo para GitHub Pages."""
import base64, glob, os, sys, hashlib
R=os.path.dirname(os.path.abspath(__file__))
rd=lambda p,m='r':open(os.path.join(R,p),m,encoding=None if 'b' in m else 'utf-8').read()
def font(name,file,weight):
    b=base64.b64encode(rd(file,'rb')).decode()
    return "@font-face{font-family:'%s';font-style:normal;font-weight:%s;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}"%(name,weight,b)
fonts=font('Marcellus','vendor/marcellus-latin-400.woff2','400')+'\n'+font('Albert Sans','vendor/albert-sans-latin-wght.woff2','100 900')
safe=lambda s:s.replace('</script','<\\/script').replace('<!--','<\\!--').replace('\ufffd','\\uFFFD')
vendor=''.join('<script>/* %s */\n%s\n</script>\n'%(os.path.basename(f),safe(rd(f))) for f in ['vendor/fflate.umd.js','vendor/jspdf.umd.min.js','vendor/xlsx.full.min.js'])
app='\n'.join('/* ---- %s ---- */\n%s'%(os.path.basename(f),rd(f)) for f in sorted(glob.glob(os.path.join(R,'src/js/*.js'))))
html=rd('src/shell.html').replace('/*FONTS*/',fonts).replace('/*CSS*/',rd('src/css/app.css')).replace('<!--VENDOR-->',vendor).replace('/*APP*/',safe(app))
open(os.path.join(R,'index.html'),'w',encoding='utf-8').write(html)
print('index.html',len(html.encode()),'bytes','sha256',hashlib.sha256(html.encode()).hexdigest()[:16])
