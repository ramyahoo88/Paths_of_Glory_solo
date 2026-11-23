"""Build the audit Markdown as a readable, paginated PDF; no browser required."""
from pathlib import Path
import re,html,sys
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,Preformatted,PageBreak,KeepTogether
root=Path(sys.argv[1]).resolve()
name='General_Staff_v0.8.3_Verification'
for tag,file in [('Body','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf'),('Italic','DejaVuSans-Oblique.ttf'),('Mono','DejaVuSansMono.ttf')]:
 pdfmetrics.registerFont(TTFont(tag,'/usr/share/fonts/truetype/dejavu/'+file))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Italic',boldItalic='Bold')
body=ParagraphStyle('body',fontName='Body',fontSize=8.8,leading=11.8,spaceAfter=5,textColor=colors.HexColor('#242a32'),splitLongWords=True)
styles={1:ParagraphStyle('h1',parent=body,fontName='Bold',fontSize=20,leading=24,spaceAfter=14,keepWithNext=True),2:ParagraphStyle('h2',parent=body,fontName='Bold',fontSize=13,leading=17,spaceBefore=12,spaceAfter=8,keepWithNext=True),3:ParagraphStyle('h3',parent=body,fontName='Bold',fontSize=10.5,leading=14,spaceBefore=10,spaceAfter=7,keepWithNext=True)}
cell=ParagraphStyle('cell',parent=body,fontSize=7.8,leading=10.8,spaceAfter=0)
def inline(s):
 s=html.escape(s)
 s=re.sub(r'`([^`]+)`',lambda m:'<font name="Mono" size="7.6">'+(m[1][:32]+'<br/>'+m[1][32:] if re.fullmatch('[a-f0-9]{64}',m[1]) else m[1])+'</font>',s)
 s=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)',r'<link href="\2" color="#1d5675">\1</link>',s)
 s=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',s)
 s=re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)',r'<i>\1</i>',s)
 return s
lines=(root/(name+'.md')).read_text().splitlines();story=[];i=0
while i<len(lines):
 line=lines[i]
 if not line.strip():i+=1;continue
 if line.startswith('```'):
  buf=[];i+=1
  while i<len(lines) and not lines[i].startswith('```'):buf.append(lines[i]);i+=1
  story.append(Preformatted('\n'.join(buf),ParagraphStyle('code',parent=body,fontName='Mono',fontSize=8,leading=11,leftIndent=8,backColor=colors.HexColor('#f2f4f5'),borderPadding=6)));i+=1;continue
 if line.startswith('|'):
  rows=[]
  while i<len(lines) and lines[i].startswith('|'):
   row=[x.strip() for x in lines[i].strip().strip('|').split('|')]
   if not all(re.fullmatch(r':?-+:?',x) for x in row):rows.append(row)
   i+=1
  n=len(rows[0]);width=512
  if n==2:fr=[.26,.74]
  elif n==3:fr=[.24,.60,.16] if rows[0][0]=='Item' else [.24,.13,.63] if rows[0][0]=='Output' else [.12,.27,.61] if rows[0][0]=='Priority' else [.15,.55,.30] if rows[0][0]=='Case' else [.44,.28,.28] if rows[0][0].startswith("Candidate") else [.12,.14,.74] if rows[0][0]=='ID' else [.36,.16,.48] if rows[0][0]=='Artifact' else [.40,.30,.30]
  elif n==4:fr=[.43,.13,.29,.15] if rows[0][0]=='Artifact' else [.40,.22,.19,.19] if rows[0][0]=='Policy tested' else [.10,.16,.21,.53]
  else:fr=[1/n]*n
  t=Table([[Paragraph(inline(x),cell) for x in r] for r in rows],colWidths=[width*x for x in fr],repeatRows=1,hAlign='LEFT')
  t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e6edf1')),('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.35,colors.HexColor('#b9c7ce')),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
  story.extend([KeepTogether(t) if len(rows)<=5 else t,Spacer(1,9)]);continue
 h=re.match(r'^(#{1,3}) (.*)',line)
 if h:story.append(Paragraph(inline(h[2]),styles[len(h[1])]));i+=1;continue
 bullet=re.match(r'^(?:- |(\d+)\. )(.*)',line)
 if bullet:
  p=Paragraph(inline(bullet[2]),ParagraphStyle('bullet',parent=body,leftIndent=12,firstLineIndent=0),bulletText=(bullet[1]+'.' if bullet[1] else '•'));story.append(p);i+=1;continue
 buf=[line];i+=1
 while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|- |\d+\. )',lines[i]):buf.append(lines[i]);i+=1
 story.append(Paragraph(inline(' '.join(buf)),body))
def footer(canvas,doc):
 canvas.saveState();canvas.setStrokeColor(colors.HexColor('#c6d1d7'));canvas.line(50,39,562,39);canvas.setFont('Body',7);canvas.setFillColor(colors.HexColor('#56616b'));canvas.drawString(50,27,'General Staff v0.8.3 • Independent audit • 22 November 2026');canvas.drawRightString(562,27,str(doc.page));canvas.restoreState()
doc=SimpleDocTemplate(str(root/(name+'.pdf')),pagesize=(612,792),rightMargin=50,leftMargin=50,topMargin=42,bottomMargin=50,title='General Staff v0.8.3 — Closure Verification',author='Codex')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(root/(name+'.pdf'))
