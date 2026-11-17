#!/usr/bin/env python3
"""Ejecuta las cinco suites con datos ficticios y resume. Requiere: python3 -m http.server 8765 en la raíz del repositorio y Google Chrome."""
import subprocess, sys, json, os, glob
here=os.path.dirname(os.path.abspath(__file__)); fails=0
for f in os.listdir(os.path.join(here,'out')) if os.path.isdir(os.path.join(here,'out')) else []:
    if f.endswith('.json'): os.remove(os.path.join(here,'out',f))
for t in ['t_a','t_b','t_c','t_d','t_e','t_f','t_g','t_h']:
    r=subprocess.run([sys.executable,os.path.join(here,t+'.py')],capture_output=True,text=True,cwd=here)
    lines=[l for l in r.stdout.splitlines() if l.startswith(('PASS','FAIL','ERRS'))]
    print(f'== {t}: {sum(l.startswith("PASS") for l in lines)} aprobadas, {sum(l.startswith("FAIL") for l in lines)} fallidas'); [print('  ',l[:260]) for l in lines if not l.startswith('PASS')]
    if r.returncode: print('   ERROR DE EJECUCIÓN:',r.stderr.strip().splitlines()[-1][:300] if r.stderr.strip() else ''); fails+=1
allr=[]
for f in sorted(glob.glob(os.path.join(here,'out','[a-h].json'))): allr+=json.load(open(f))
json.dump(allr,open(os.path.join(here,'out','resultados.json'),'w'),ensure_ascii=False,indent=1)
print('TOTAL',len(allr),'verificaciones;',sum(1 for x in allr if x[1]),'aprobadas;',sum(1 for x in allr if not x[1]),'fallidas'); sys.exit(1 if fails or any(not x[1] for x in allr) else 0)
