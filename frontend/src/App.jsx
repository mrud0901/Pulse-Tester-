import React, { useState } from 'react';
import axios from 'axios';
import { Activity, ArrowRight, Loader2 } from 'lucide-react';
import Dashboard from './components/Dashboard';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setReport(null);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/test', { url });
      setReport(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to testing server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="text-center mt-8 mb-8">
        <h1 className="text-xl flex justify-center items-center gap-2" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          <Activity color="var(--accent-primary)" size={40} />
          PulseTester
        </h1>
        <p className="text-gray-400 max-w-xs" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem' }}>
          The enterprise-grade website diagnostic tool. Analyze SEO, Performance, and Mobile Responsiveness in seconds.
        </p>
      </header>

      <main>
        <section className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form onSubmit={handleTest} className="input-group">
            <input
              type="text"
              className="input-field"
              placeholder="e.g. https://yourstartup.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  Run Audit <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
          {error && (
            <div className="status-bad mt-4 text-center">
              {error}
            </div>
          )}
        </section>

        {report && <Dashboard data={report} />}
      </main>
    </div>
  );
}

export default App;
