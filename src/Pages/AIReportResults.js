import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AIReportResults() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('ai_reports')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setReport(data);
        if (data.status !== 'generating') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch report.');
        clearInterval(interval);
        setLoading(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  if (error) return <p className="error-text">{error}</p>;

  if (loading) {
    return (
      <div className="loading-container">
        <h2 className="loading-title">⚡ Generating report...</h2>
        <p className="loading-subtitle">Please wait a few moments.</p>
      </div>
    );
  }

  if (report.status === 'failed') {
    return (
      <div className="failed-container">
        <h2 className="failed-title">❌ Report Generation Failed</h2>
        <p className="failed-message">
          {report.error_message || 'Something went wrong. Please try again.'}
        </p>
      </div>
    );
  }

  const result = report.report_json || {};

  return (
    <div className="report-wrapper">
      {/* Header */}
      <div className="report-header">
        <h2 className="report-title">AI Report Results</h2>
        <p className="report-client">
          <span className="client-name">{report.client_name}</span> —{' '}
          <span className="company-name">{report.company_name}</span>
        </p>
      </div>

      {/* Summary */}
      <div className="summary-section">
        <h3 className="section-title">📋 Summary</h3>
        <p className="summary-text">{result.summary}</p>
      </div>

      {/* Pain Points */}
      <div className="painpoints-section">
        {result.painpoints?.map((pp, idx) => (
          <div key={idx} className="painpoint-card">
            <h3 className="painpoint-title">⚠️ Opportunity #{idx + 1}</h3>
            <p className="painpoint-text">{pp.pain_point}</p>

            {pp.original_quote && (
              <blockquote className="painpoint-quote">
                “{pp.original_quote}”
              </blockquote>
            )}

            <div className="recommendations-list">
              {pp.recommendations?.map((rec, rIdx) => (
                <div key={rIdx} className="recommendation-card">
                  <h4 className="workflow-name">{rec.workflow_name}</h4>
                  <p className="workflow-description">{rec.workflow_description}</p>
                  <p className="workflow-whyfit">
                    <strong>Why Fit:</strong> {rec.why_fit}
                  </p>

                  {rec.benefits && (
                    <ul className="workflow-benefits">
                      {rec.benefits.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  )}

                  {rec.estimated_impact && (
                    <p className="workflow-impact">
                      <strong>Impact:</strong> {rec.estimated_impact.value}{' '}
                      {rec.estimated_impact.unit} ({rec.estimated_impact.notes})
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AI Opportunity Scores */}
      {result.ai_opportunity_score && (
        <div className="scores-section">
          <h3 className="section-title">📊 AI Opportunity Scores</h3>
          <div className="scores-grid">
            {Object.entries(result.ai_opportunity_score).map(([key, val]) => (
              <div key={key} className={`score-card score-${key}`}>
                <p className="score-label">{key}</p>
                <p className="score-value">{val}/10</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
