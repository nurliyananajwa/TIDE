"use client";

import { useState } from "react";
import { fmt, pct, retentionCurve, type View } from "../demo-data";
import type { OceanStageId } from "./ocean-stages";
import styles from "./coastal.module.css";

export function StageReport({ stage, view }: { stage: OceanStageId; view: View }) {
  const [week, setWeek] = useState(1);
  const curve = retentionCurve(view.cohorts);
  const product = view.funnel[0].people;
  const cart = view.funnel[1].people;
  const checkout = view.funnel[2].people;
  const purchased = view.funnel[3].people;

  if (stage === "discovery") {
    const change = view.previous?.visitors ? (view.totals.visitors / view.previous.visitors - 1) * 100 : null;
    const topSource = view.segments["Traffic source"].reduce((top,source)=>source.share>top.share?source:top, {name:"No recorded source",share:0});
    return <>
      <p className={styles.reportInsight}><span>At a glance</span><strong>{topSource.name} brought {pct(topSource.share,0)} of visitors.</strong></p>
      <div className={styles.metrics} aria-live="polite">
        <div><span>Visitors</span><strong>{fmt(view.totals.visitors)}</strong><small>{change === null ? "Selected period" : `${change >= 0 ? "+" : ""}${change.toFixed(0)}% vs ${view.previousLabel}`}</small></div>
        <div><span>Purchased</span><strong>{pct(view.totals.rate)}</strong><small>{fmt(view.totals.purchasers)} people</small></div>
      </div>
      <div className={styles.chartHeading}><h3>Arriving from</h3><span>Share of visitors</span></div>
      <ul className={styles.sources}>
        {view.segments["Traffic source"].map(source => <li key={source.name}>
          <div><span>{source.name}</span><strong>{Math.round(source.share * 100)}%</strong></div>
          <span className={styles.track}><i style={{ width: `${source.share * 100}%` }} /></span>
        </li>)}
      </ul>
    </>;
  }

  if (stage === "engagement") {
    if (!product) return <p className={styles.reportInsight}><span>At a glance</span><strong>No product-view events were recorded for this device and period.</strong></p>;
    return <>
      <p className={styles.reportInsight}><span>At a glance</span><strong>{pct(cart/product,0)} of product viewers added to cart.</strong></p>
      <div className={styles.metrics} aria-live="polite">
        <div><span>Viewed a product</span><strong>{fmt(product)}</strong><small>{pct(product / view.totals.visitors, 0)} of visitors</small></div>
        <div><span>Added to cart</span><strong>{fmt(cart)}</strong><small>{pct(cart / product, 0)} of product viewers</small></div>
      </div>
      <div className={styles.chartHeading}><h3>Taking the next step</h3><span>Share of all visitors</span></div>
      <ul className={styles.sources}>
        {view.funnel.slice(0, 3).map(step => <li key={step.name}>
          <div><span>{step.name}</span><strong>{pct(step.people / view.totals.visitors, 0)}</strong></div>
          <span className={styles.track}><i style={{ width: `${step.people / view.totals.visitors * 100}%` }} /></span>
        </li>)}
      </ul>
      <details className={styles.reportDetails}><summary>Where engagement drops</summary><p>{fmt(product - cart)} product viewers left before adding anything to their cart.</p></details>
    </>;
  }

  if (stage === "conversion") {
    return <>
      <p className={styles.reportInsight}><span>At a glance</span><strong>{checkout ? `${fmt(checkout-purchased)} people have no recorded purchase after ordered checkout.` : "No ordered checkouts were recorded in this selection."}</strong></p>
      <div className={styles.metrics} aria-live="polite">
        <div><span>Purchased</span><strong>{fmt(view.totals.purchasers)}</strong><small>{pct(view.totals.rate)} of all visitors</small></div>
        <div><span>Checkout completion</span><strong>{pct(purchased / checkout, 0)}</strong><small>{fmt(checkout)} began checkout</small></div>
      </div>
      <div className={styles.chartHeading}><h3>Ordered purchase funnel</h3><span>People reaching each step</span></div>
      <ol className={styles.stageFunnel}>
        {view.funnel.map(step => <li key={step.name}>
          <div><span>{step.name}</span><strong>{fmt(step.people)}</strong></div>
          <span className={styles.track}><i style={{ width: `${step.people / Math.max(1,product) * 100}%` }} /></span>
        </li>)}
      </ol>
      <details className={styles.reportDetails}><summary>How to read this funnel</summary><p>Steps must occur in order in the same session. Total purchasers also includes people with missing earlier steps, so the headline can be higher than the final funnel bar.</p>
        <ul>{view.funnel.slice(0,-1).map((step,index)=><li key={step.name}>{step.name}: {fmt(step.people-view.funnel[index+1].people)} left; {pct(view.funnel[index+1].people/step.people,0)} continued.</li>)}</ul>
      </details>
    </>;
  }

  return <>
    <p className={styles.reportInsight} aria-live="polite"><span>At a glance</span><strong>{week===0?"Every cohort starts at 100%.":curve[week].cohorts?`${curve[week].rate.toFixed(0)}% of cohort visitors returned in week ${week}.`:"No fully observed cohorts for this week."}</strong></p>
    <div className={styles.metrics} aria-live="polite">
      <div><span>Returning visitors</span><strong>{fmt(view.totals.returning)}</strong><small>{pct(view.totals.returningShare, 0)} returned on another day</small></div>
      <div><span>{week===0?"Cohort start":`Week ${week} return`}</span><strong>{curve[week].cohorts?`${curve[week].rate.toFixed(0)}%`:"—"}</strong><small>{curve[week].cohorts} eligible cohorts</small></div>
    </div>
    <div className={styles.chartHeading}><h3>Return over time</h3><span>Select a week</span></div>
    <div className={styles.returnBars} role="group" aria-label="Weekly cohort return">
      {curve.map(point => <button key={point.week} disabled={!point.cohorts} aria-pressed={week === point.week} aria-label={`Week ${point.week}: ${point.rate.toFixed(0)} percent returned`} onClick={() => setWeek(point.week)}>
        <span><i style={{ height: `${point.rate}%` }} /></span>
        <small>{point.week === 0 ? "Start" : `W${point.week}`}</small>
      </button>)}
    </div>
    <details className={styles.reportDetails}><summary>How retention is measured</summary><p>Weekly rates follow visitors first observed in the selected period, using Monday calendar weeks. Follow-up continues through 31 Jan 2021; incomplete later weeks are excluded. Device selection applies to the first observed device and subsequent activity. Returning visitors above counts people who visited on another day in the selected period.</p></details>
  </>;
}
