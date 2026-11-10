"use client";

import { useState } from "react";
import "./reports.css";

type Report = "Overview" | "Breakdowns" | "Funnels" | "Retention" | "Insights";
type Props = { report: Exclude<Report,"Overview">; scale: number; onNavigate: (report: Report) => void };
const segmentSets = {
  Device: ["Desktop","Mobile","Tablet"],
  Country: ["United States","Canada","United Kingdom"],
  "Traffic source": ["Organic search","Direct","Referral"],
};
const shares=[57,37,6], counts=[6840,4440,720], rates=[4.8,2.6,3.1];
const journey=[{name:"View product",count:8400,share:100},{name:"Add to cart",count:2940,share:35},{name:"Begin checkout",count:1680,share:20},{name:"Purchase",count:504,share:6}];
const cohorts=[[100,26,21,18,16,14,13],[100,29,23,19,17,15],[100,24,20,17,15],[100,31,25,22],[100,28,23],[100,30]];
const findings=[
  {label:"Conversion",title:"Same store. Different journeys.",body:"Desktop visitors convert at 4.8% in this sample, compared with 2.6% on mobile.",question:"Which mobile checkout step needs a closer look?",report:"Breakdowns" as Report,stat:"1.85×",caption:"desktop vs. mobile conversion",evidence:[4.8,2.6],labels:["Desktop","Mobile"]},
  {label:"Journey",title:"Most losses happen before the cart.",body:"Only 35% of sample product viewers add an item to their cart. This loses 5,460 visitors, the largest loss by count in the example funnel.",question:"Does acquisition intent explain the product-to-cart gap?",report:"Funnels" as Report,stat:"65%",caption:"drop-off after product view",evidence:[100,35],labels:["Product view","Add to cart"]},
  {label:"Loyalty",title:"A return is a new beginning.",body:"In demo cohort 1, 26% of visitors return in week one. That falls to 13% in week six.",question:"Which traffic sources bring visitors who return?",report:"Retention" as Report,stat:"26%",caption:"week-one retention · cohort 1",evidence:[26,13],labels:["Week 1","Week 6"]},
];

// Ocean heat scale: stronger teal = more visitors retained.
function heatStyle(value:number|undefined){
  if(value===undefined) return {background:"transparent",color:"#7fa9b3",border:"1px dashed #9cc9cf66"};
  if(value===100) return {background:"#0b5a6e",color:"#effdfb"};
  const strength=Math.min(1,value/35);
  return {background:`rgba(15,110,124,${.12+strength*.7})`,color:strength>.55?"#effdfb":"#0f4a5a"};
}
function MiniEvidence({index}:{index:number}) {
  const finding=findings[index], max=Math.max(...finding.evidence);
  return <div className="evidence-bars" aria-label="Illustrative evidence">{finding.evidence.map((value,i)=><div key={i}><span>{finding.labels[i]}</span><div><i style={{width:value/max*100+"%"}}/></div><strong>{value}%</strong></div>)}</div>;
}
export default function ReportStudio({report,scale,onNavigate}:Props) {
  const [group,setGroup]=useState<keyof typeof segmentSets>("Device");
  const [segment,setSegment]=useState(0);
  const [step,setStep]=useState(0);
  const [cohort,setCohort]=useState(0);
  const [week,setWeek]=useState(1);
  const [saved,setSaved]=useState<number[]>([]);
  const n=(v:number)=>Math.round(v*scale).toLocaleString("en-US");
  const names=segmentSets[group], currentStep=journey[step], row=cohorts[cohort];
  const retention=row[week];
  const titles={Breakdowns:["01 / AUDIENCE OBSERVATORY","Different people.","Different currents."],Funnels:["02 / JOURNEY EXPLORER","Follow the steps.","Find the friction."],Retention:["03 / RETURNING SHORES","The art of", "coming back."],Insights:["04 / THE FIELD NOTES","Beneath the numbers,", "a story unfolds."]};
  const title=titles[report];
  return <div className="report-studio report-bento" data-report={report}>
    <div className="report-intro"><div><span className="studio-overline">{title[0]}</span><h2>{title[1]} <em>{title[2]}</em></h2></div><span className="report-edition">THE TIDE REPORT<b>ILLUSTRATIVE DATA / 001</b></span></div>

    {report==="Breakdowns"&&<>
      <div className="report-toolbar"><div className="report-tabs" role="group" aria-label="Breakdown dimension">{Object.keys(segmentSets).map(item=><button key={item} aria-pressed={group===item} onClick={()=>{setGroup(item as keyof typeof segmentSets);setSegment(0)}}>{item}</button>)}</div><span>Select a segment to inspect it ↙</span></div>
      <div className="breakdown-bento"><section className="report-card segment-comparison"><span className="report-small-label">AUDIENCE MIX / {group.toUpperCase()}</span><h3>A closer look at<br/><em>who&apos;s here.</em></h3><div className="segment-bars">{names.map((name,i)=><button key={name} aria-pressed={segment===i} onClick={()=>setSegment(i)}><span className="segment-index">0{i+1}</span><div><strong>{name}<b>{n(counts[i])}</b></strong><div className="segment-track"><i style={{width:shares[i]+"%"}}/></div></div><span>{shares[i]}%</span></button>)}</div><span className="report-caption">Relative share of the illustrative audience</span></section><section className="report-card segment-focus" aria-live="polite"><span className="report-small-label">IN FOCUS / 0{segment+1}</span><h3>{names[segment]}</h3><div className="segment-focus-number">{rates[segment]}<span>%</span></div><p>conversion rate</p><div className="focus-ring" aria-hidden="true"><i/><i/><i/></div><span className="report-caption">A segment is a starting point for a question.</span></section><button className="report-card segment-question" onClick={()=>onNavigate("Funnels")}><span className="report-small-label">YOUR NEXT QUESTION ↗</span><h3>Where does<br/>interest <em>become action?</em></h3><span>Compare the journey in Funnels →</span></button></div>
      <p className="report-definition">All segment values are illustrative. Device and date filters simulate a selected audience; shares and rates are fixed demo examples.</p>
    </>}

    {report==="Funnels"&&<>
      <><div className="funnel-bento">{journey.map((stage,i)=><button key={stage.name} className={`report-card stage-card stage-card-${i} ${step===i?"selected-stage":""}`} aria-pressed={step===i} onClick={()=>setStep(i)}><span className="report-small-label">0{i+1} / {i===0?"DISCOVER":i===1?"CONSIDER":i===2?"COMMIT":"COMPLETE"}</span><h3>{stage.name}</h3><strong>{n(stage.count)}</strong><div className="stage-volume"><i style={{height:Math.max(stage.share,8)+"%"}}/></div><span>{stage.share}% of starting audience</span></button>)}</div><div className="funnel-bento-detail"><section className="report-card selected-stage-note" aria-live="polite"><span className="report-small-label">IN FOCUS / {currentStep.name.toUpperCase()}</span><h3>{step===0?"A first spark of interest.":step===3?"From interest to action.":"What keeps the journey moving?"}</h3><p>{step===0?"8,400 demo visitors viewed a product. Select another stage to compare the loss between steps.":`${(currentStep.count/journey[step-1].count*100).toFixed(1)}% continue from the previous step. ${n(journey[step-1].count-currentStep.count)} demo visitors do not reach this step.`}</p></section><section className="report-card completion-note"><span className="report-small-label">JOURNEY COMPLETION</span><strong>6.0<span>%</span></strong><p>Product view → Purchase</p></section></div></>
      <div className="report-callout"><span>↘</span><div><strong>The largest visitor loss happens before the cart.</strong><p>65% of demo product viewers never add an item. Start your investigation there.</p></div><button onClick={()=>onNavigate("Insights")}>Read the sample insight ↗</button></div>
      <p className="report-definition">Definition: a visitor counts at a step only after completing the previous step in the same session. This prototype uses a fixed four-step example.</p>
    </>}

    {report==="Retention"&&<>
      <><div className="retention-summary"><section className="report-card"><span className="report-small-label">COHORTS IN VIEW</span><strong>06</strong><p>Groups of first-time visitors</p></section><section className="report-card"><span className="report-small-label">COHORT {cohort+1} / WEEK {week}</span><strong>{retention===undefined?"—":retention+"%"}</strong><p>{retention===undefined?"This week is not yet observed":"Visitors retained in this week"}</p></section><section className="report-card"><span className="report-small-label">A RETURN IS A SIGNAL</span><h3>Familiar shores.<br/><em>Fresh opportunities.</em></h3></section></div><section className="report-card cohort-matrix"><div className="matrix-heading"><div><span className="report-small-label">THE COHORT TABLE</span><h3>Who finds their way back?</h3></div><span>Choose any cell to inspect ↙</span></div><div className="table-scroll"><table><thead><tr><th>First active week</th><th>Visitors</th>{Array.from({length:7},(_,i)=><th key={i}>Week {i}</th>)}</tr></thead><tbody>{cohorts.map((values,i)=><tr key={i}><th scope="row">Demo cohort 0{i+1}</th><td>{n(2100-i*120)}</td>{Array.from({length:7},(_,j)=><td key={j}><button className={cohort===i&&week===j?"matrix-selected":""} style={heatStyle(values[j])} onClick={()=>{setCohort(i);setWeek(j)}} aria-label={`Cohort ${i+1}, week ${j}: ${values[j]===undefined?"not observed":values[j]+" percent"}`} aria-pressed={cohort===i&&week===j}>{values[j]===undefined?"—":values[j]+"%"}</button></td>)}</tr>)}</tbody></table></div><p className="matrix-reading" aria-live="polite">Cohort {cohort+1} · Week {week}: {retention===undefined?"this future week is not observed yet.":`${retention}% of the original cohort had ${week===0?"their first activity":"a return event"} in this week.`}</p></section></>
      <p className="report-definition">Definition: week 0 is the first active calendar week. A visitor is retained in week N if they have any event in that week. — means the week is not yet observed. All cohorts are illustrative.</p>
    </>}

    {report==="Insights"&&<>
      <div className="insight-bento">{findings.map((finding,i)=><article key={finding.label} className={`report-card editorial-finding finding-${i}`}><div className="finding-meta"><span>0{i+1} / {finding.label.toUpperCase()}</span><button aria-label={`${saved.includes(i)?"Unsave":"Save"} insight ${i+1}`} aria-pressed={saved.includes(i)} onClick={()=>setSaved(saved.includes(i)?saved.filter(id=>id!==i):[...saved,i])}>{saved.includes(i)?"✓":"+"}</button></div><h3>{finding.title}</h3><div className="finding-stat">{finding.stat}<span>{finding.caption}</span></div><p>{finding.body}</p><MiniEvidence index={i}/><div className="finding-question"><small>NEXT QUESTION</small><p>{finding.question}</p></div><button className="finding-link" onClick={()=>onNavigate(finding.report)}>Explore {finding.report.toLowerCase()} <span>↗</span></button></article>)}</div>
      <p className="report-definition">These are sample stories built from illustrative values, not findings from the GA4 dataset. Saved notes are temporary in this prototype.</p>
    </>}
  </div>;
}


