'use client';

import type { StockAnalysis } from '@/lib/stock-types';

export function StockAnalysisPanel({ analysis }: { analysis: StockAnalysis }) {
  return (
    <div className="finance-analysis space-y-4">
      <section className="finance-analysis-block">
        <h2 className="finance-analysis-heading">Executive summary</h2>
        <p className="finance-analysis-body">{analysis.executiveSummary}</p>
      </section>

      <section className="finance-analysis-block">
        <h2 className="finance-analysis-heading">Key highlights</h2>
        <ul className="finance-analysis-list">
          {analysis.keyHighlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="finance-analysis-grid">
        <section className="finance-analysis-block">
          <h2 className="finance-analysis-heading">Valuation</h2>
          <p className="finance-analysis-body">{analysis.valuationAssessment}</p>
        </section>
        <section className="finance-analysis-block">
          <h2 className="finance-analysis-heading">Momentum</h2>
          <p className="finance-analysis-body">{analysis.momentumAssessment}</p>
        </section>
      </div>

      <div className="finance-analysis-grid">
        <section className="finance-analysis-block finance-analysis-block--positive">
          <h2 className="finance-analysis-heading">Strengths</h2>
          <ul className="finance-analysis-list">
            {analysis.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="finance-analysis-block finance-analysis-block--risk">
          <h2 className="finance-analysis-heading">Risk factors</h2>
          <ul className="finance-analysis-list">
            {analysis.riskFactors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="finance-analysis-block">
        <h2 className="finance-analysis-heading">Watch items</h2>
        <ul className="finance-analysis-list">
          {analysis.watchItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}