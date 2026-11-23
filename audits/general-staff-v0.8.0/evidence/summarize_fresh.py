#!/usr/bin/env python3
"""Validate and summarize the two new 200-game A/B runs packaged here."""
import json,math,pathlib
p=pathlib.Path(__file__).resolve().parent
a=json.loads((p/'fresh-baseline-200.json').read_text())
b=json.loads((p/'fresh-v080-200.json').read_text())
assert a['opts']=={'edgeShift':0,'campaign':None}
assert b['opts']=={'edgeShift':0.75,'campaign':'west'}
assert a['reference']['commit']==b['reference']['commit']=='62a7746f34271e9e362db04b0a3dd0f9c4798aa4'
assert a['candidate']['commit']==b['candidate']['commit']=='569bdc7b3eb1768504cc2393147c05fcbc95b0e4'
assert a['candidate']['dirty']==b['candidate']['dirty']==False
assert a['n']==b['n']==200 and a['errs']==b['errs']==0
A,B=a['games'],b['games'];assert len(A)==len(B)==200
assert [g['seed'] for g in A]==[g['seed'] for g in B]==list(range(2200000,2200200))
for g in A+B:
 assert g['result'] in ('Central Powers','Allied Powers') and g['victory']
 assert g['candidateDecisionErrors']==0
 assert g['candidateWin']==(g['result']=='Central Powers')
old=sum(g['candidateWin'] for g in A);new=sum(g['candidateWin'] for g in B)
gain=sum(not x['candidateWin'] and y['candidateWin'] for x,y in zip(A,B))
loss=sum(x['candidateWin'] and not y['candidateWin'] for x,y in zip(A,B))
assert new-old==gain-loss
n=len(A); delta=(new-old)/n; pairs=gain+loss
variance=(pairs-n*delta*delta)/(n-1);se=math.sqrt(variance/n)
pval=min(1.,2*sum(math.comb(pairs,k) for k in range(min(gain,loss)+1))/2**pairs) if pairs else 1.
s={
 'seeds':[2200000,2200199], 'games_per_arm':n,
 'baseline_cp_wins':old,'v080_cp_wins':new,
 'baseline_cp_win_rate':old/n,'v080_cp_win_rate':new/n,
 'difference_points':100*delta,'gained':gain,'lost':loss,
 'paired_difference_approx_95ci_points':[100*(delta-1.95996398454*se),100*(delta+1.95996398454*se)],
 'mcnemar_two_sided_exact_p':pval,
 'candidate_decision_errors_both_runs':0,
 'limits':'Repository ab.js harness; fixed v0.7.6 Allied opponent; no human-play inference or full strict health claim.'
}
print(json.dumps(s,indent=2))
