import React from 'react';
import { Share2, Clock, Globe, ShieldAlert, Monitor, CheckCircle, XCircle, Lock, TerminalSquare } from 'lucide-react';

export default function Dashboard({ data }) {
  if (!data) return null;

  const isUp = data.status >= 200 && data.status < 400;
  
  return (
    <div className="grid grid-cols-1 gap-6 mt-8 animate-fade-in">
      {/* Top Status Cards */}
      <div className="grid grid-cols-3">
        <div className="glass-panel metric-card">
          <div className="metric-title flex items-center gap-2">
            <Globe size={18} /> Availablity
          </div>
          <div className={`metric-value ${isUp ? 'status-good' : 'status-bad'}`}>
            {isUp ? <CheckCircle size={28} /> : <XCircle size={28} />}
            {isUp ? 'Online' : 'Offline'}
          </div>
          <span className="text-sm text-gray-400">Status Code: {data.status}</span>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-title flex items-center gap-2">
            <Clock size={18} /> Performance
          </div>
          <div className="metric-value text-white">
             {data.responseTime}
          </div>
          <span className="text-sm text-gray-400">Total DOM Load Time</span>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-title flex items-center gap-2">
            <ShieldAlert size={18} /> Link Health
          </div>
          <div className={`metric-value ${data.brokenLinks?.length === 0 ? 'status-good' : 'status-bad'}`}>
            {data.brokenLinks?.length || 0} Broken
          </div>
          <span className="text-sm text-gray-400">From {data.linksChecked || 0} links checked</span>
        </div>
      </div>

      {/* Break Down of New Tests */}
      <div className="grid grid-cols-2">
         {/* Network Security Headers */}
        <div className="glass-panel">
          <h3 className="mb-4 text-xl flex items-center gap-2"><Lock size={20} /> Security Headers</h3>
          <ul className="space-y-3">
            <li className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Strict-Transport-Security (HSTS)</span>
              <span className={data.security?.hsts ? 'status-good' : 'status-warn'}>
                {data.security?.hsts ? 'Enabled' : 'Missing'}
              </span>
            </li>
            <li className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">X-Frame-Options</span>
              <span className={data.security?.xFrameOptions ? 'status-good' : 'status-warn'}>
                {data.security?.xFrameOptions ? 'Enabled' : 'Missing'}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-400">X-Content-Type-Options</span>
              <span className={data.security?.xContentTypeOptions ? 'status-good' : 'status-warn'}>
                {data.security?.xContentTypeOptions ? 'Enabled' : 'Missing'}
              </span>
            </li>
          </ul>
        </div>
        
        {/* Functional Runtime Diagnostics */}
        <div className="glass-panel">
          <h3 className="mb-4 text-xl flex items-center gap-2"><TerminalSquare size={20} /> Console Diagnostics</h3>
          {data.functional?.consoleErrors && data.functional.consoleErrors.length > 0 ? (
             <ul className="space-y-2 mt-2 h-32 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                {data.functional.consoleErrors.map((err, i) => (
                  <li key={i} className="text-sm bg-gray-900 p-2 rounded border border-red-900 text-red-400 font-mono break-all">
                    {err}
                  </li>
                ))}
             </ul>
          ) : (
            <div className="status-good font-medium mt-4 p-3 bg-gray-900 rounded-lg text-sm flex items-center gap-2">
               <CheckCircle size={16} /> No JavaScript errors detected on load!
            </div>
          )}
        </div>
      </div>

       {/* Broken Links List */}
      <div className="glass-panel">
          <h3 className="mb-4 text-xl flex items-center gap-2"><ShieldAlert size={20} /> Failed Links Report</h3>
          {data.brokenLinks && data.brokenLinks.length > 0 ? (
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="pb-3 text-gray-400 font-medium">Failing URL</th>
                      <th className="pb-3 text-gray-400 font-medium text-right">Failure Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.brokenLinks.map((link, idx) => (
                      <tr key={idx} className="border-b border-gray-800/50">
                        <td className="py-3 pr-4 text-sm text-red-400 break-all">{link.url}</td>
                        <td className="py-3 text-sm font-mono text-right status-bad">{link.status}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          ) : (
             <p className="text-gray-400">All sampled links returned a healthy 200 OK status.</p>
          )}
      </div>

      {/* SEO & Responsiveness */}
      <div className="grid grid-cols-2">
        <div className="glass-panel">
          <h3 className="mb-4 text-xl flex items-center gap-2"><Share2 size={20} /> SEO Diagnostics</h3>
          <ul className="space-y-3">
            <li className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Page Title</span>
              <span className="font-medium text-right max-w-xs truncate" title={data.seo?.title}>{data.seo?.title || 'Missing'}</span>
            </li>
            <li className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Meta Description</span>
              <span className={data.seo?.hasDescription ? 'status-good' : 'status-warn'}>
                {data.seo?.hasDescription ? 'Found' : 'Missing'}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-400">Missing Image Alts</span>
              <span className={data.seo?.missingAltTags === 0 ? 'status-good' : 'status-warn'}>
                {data.seo?.missingAltTags}
              </span>
            </li>
          </ul>
        </div>

        <div className="glass-panel">
          <h3 className="mb-4 text-xl flex items-center gap-2"><Monitor size={20} /> UX & Layout</h3>
          <ul className="space-y-3">
            <li className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Mobile Friendly (Overall)</span>
              <span className={data.responsiveness?.mobileFriendly ? 'status-good font-medium' : 'status-bad font-medium'}>
                {data.responsiveness?.mobileFriendly ? '✓ Passes' : '✗ Issues Found'}
              </span>
            </li>
            <li className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Viewport Meta Tag</span>
              <span className={data.responsiveness?.hasViewportMeta ? 'status-good' : 'status-bad'}>
                {data.responsiveness?.hasViewportMeta ? 'Present' : 'Missing'}
              </span>
            </li>
            <li className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">No Horizontal Overflow</span>
              <span className={data.responsiveness?.noHorizontalOverflow ? 'status-good' : 'status-bad'}>
                {data.responsiveness?.noHorizontalOverflow ? 'OK' : 'Overflows'}
              </span>
            </li>
            <li className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Tiny Text Elements</span>
              <span className={data.responsiveness?.tinyTextCount === 0 ? 'status-good' : 'status-warn'}>
                {data.responsiveness?.tinyTextCount === 0 ? 'None' : `${data.responsiveness?.tinyTextCount} Found`}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-400">Small Touch Targets</span>
              <span className={data.responsiveness?.smallTouchTargets === 0 ? 'status-good' : 'status-warn'}>
                {data.responsiveness?.smallTouchTargets === 0 ? 'None' : `${data.responsiveness?.smallTouchTargets} Found`}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Visual Screenshot */}
      {data.desktopScreenshot && (
        <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="mb-4 text-xl">Desktop Rendering</h3>
          <div className="rounded-lg overflow-hidden border border-gray-800">
            <img src={data.desktopScreenshot} alt="Website Screenshot" className="w-full h-auto object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}
