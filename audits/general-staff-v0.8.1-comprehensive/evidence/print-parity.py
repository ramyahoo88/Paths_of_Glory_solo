"""Content parity and page-fragmentation checks on actual shipped files; requires PyMuPDF."""
import os,json,re,pathlib,hashlib
from html.parser import HTMLParser
import fitz
here=pathlib.Path(__file__).resolve().parent
root=pathlib.Path(os.environ.get('GS_ROOT',here.parent/'source'))
d=json.loads(re.search(r'const D = (.*);', (root/'app/General_Staff_Companion.html').read_text()).group(1))
class Tables(HTMLParser):
 def __init__(self):super().__init__();self.tables=[];self.table=None;self.row=None;self.cell=None
 def handle_starttag(self,t,a):
  if t=='table':self.table=[]
  elif t=='tr':self.row=[]
  elif t in ['td','th']:self.cell=''
 def handle_data(self,s):
  if self.cell is not None:self.cell+=s
 def handle_endtag(self,t):
  if t in ['td','th']:self.row.append(' '.join(self.cell.split()));self.cell=None
  elif t=='tr':self.table.append(self.row);self.row=None
  elif t=='table':self.tables.append(self.table);self.table=None
p=Tables();p.feed((root/'print/out/reference.html').read_text())
fronts=[t for t in p.tables if t[0][0]=='Staff number']
for side,t in zip(['cp','ap'],fronts):
 assert t[0][1:]==[str(x) for x in range(1,7)]
 for row,lvl in zip(t[1:],['mobilization','limited','total']):assert row[1:]==d['frontTable'][side][lvl]
events=[t for t in p.tables if t[0][:2]==['#','Card']]
assert len(events)==2
for side,t in zip(['cp','ap'],events):
 assert len(t)==56
 for row,e in zip(t[1:],d['events'][side]):assert row==[str(e['n']),e['name'],str(e['pri']),e['when']],(row,e)
expected={'Army column':['1.2','2.0','2.5','3.0','3.5','4.0','4.7','5.3','5.8','6.3'],'Corps column':['0.3','0.5','0.8','1.3','1.5','1.8','2.0','2.5','3.0']}
for title,vals in expected.items():assert next(t for t in p.tables if t[0][0]==title)[1][1:]==vals
objects=[t for t in p.tables if t[0][0]=='Front' and 'Objective list' in t[0][1]]
for side,t in zip(['cp','ap'],objects):
 for f,spaces in t[1:]:assert spaces==' → '.join(d['objectives'][side][f])

cards=fitz.open(root/'print/out/staff_cards.pdf');pages=[];ids=[]
for i,page in enumerate(cards,1):
 text=page.get_text();found=[int(x)for x in re.findall(r'(\d+)/18\s*·\s*v0\.8\.1',text)];ties=text.count('Tie:');heads=text.lower().count('front number');backs=text.count('Paths of Glory solo bot');ids+=found
 assert (i%2==1 and len(found)==ties==heads==6 and backs==0)or(i%2==0 and not found and ties==0 and heads==0 and backs==6),(i,found,ties,heads,backs)
 pages.append({'page':i,'cards':found,'ties':ties,'backs':backs})
assert sorted(ids)==list(range(1,19))
out={'frontCellsCompared':36,'eventRowsCompared':110,'objectiveRowsCompared':10,'expectedHitColumnsCompared':19,'cardPages':pages,'pageCounts':{n:len(fitz.open(root/f'print/out/{n}.pdf')) for n in ['rules','reference','staff_cards']}}
(here/'print-parity.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
