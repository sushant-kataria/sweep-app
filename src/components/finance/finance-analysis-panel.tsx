'use client';

import type { FinanceAnalysis } from '@/lib/finance-types';

export function FinanceAnalysisPanel({ analysis }: { analysis: FinanceAnalysis }) {
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
          <h2 className="finance-analysis-heading">Liquidity</h2>
          <p className="finance-analysis-body">{analysis.liquidityAssessment}</p>
        </section>
        <section className="finance-analysis-block">
          <h2 className="finance-analysis-heading">Leverage</h2>
          <p className="finance-analysis-body">{analysis.leverageAssessment}</p>
        </section>
      </div>

      <section className="finance-analysis-block">
        <h2 className="finance-analysis-heading">Asset quality</h2>
        <p className="finance-analysis-body">{analysis.assetQualityNotes}</p>
      </section>

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

      <section className="finance-analysis-verdict">
        <h2 className="finance-analysis-heading">Analyst verdict</h2>
        <p className="finance-analysis-body">{analysis.analystVerdict}</p>
      </section>
    </div>
  );
}