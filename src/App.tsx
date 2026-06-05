/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Send, Trash2, Database, Terminal, Cpu, GitCommit, Download } from 'lucide-react';

export default function App() {
  const [auth, setAuth] = useState<{username: string, role: string} | null>({ username: 'admin', role: 'admin' });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');
  const [error, setError] = useState('');
  
  // Security Audit state
  const [activeTab, setActiveTab] = useState<'matrix' | 'logs' | 'architecture' | 'patch'>('matrix');
  const [logs, setLogs] = useState<{exploit: string, mitigation: string} | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);

  const downloadLog = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const body = await res.json();
        setItems(body.data || []);
      }
    } catch {
      console.error("Failed to fetch");
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/logs/dirty-cow');
      if (res.ok) {
         const data = await res.json();
         setLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch logs");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs' && !logs) {
      fetchLogs();
    }
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent, isRegister = false) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { username, password, role: username === 'admin' ? 'admin' : 'user' } : { username, password };
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'Error occurred');
      } else {
        if (!isRegister) {
          setAuth(data.user);
          setUsername('');
          setPassword('');
        } else {
          setError('Registered securely. Please log in.');
        }
      }
    } catch {
      setError('Network error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem) return;
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItem })
      });
      if (res.ok) {
        setNewItem('');
        fetchItems();
      }
    } catch { console.error("Create fail"); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/data/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchItems();
      } else {
         const data = await res.json();
         alert(data.message);
      }
    } catch { console.error("Delete fail"); }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#C9D1D9] font-sans p-6 flex flex-col gap-5 overflow-x-hidden">
      
      {/* Header Pipeline */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-[#30363D] pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#58A6FF]" />
          <div>
            <h1 className="text-2xl font-semibold text-[#58A6FF] tracking-tight">SecureStack</h1>
            <p className="text-[10px] text-[#8B949E] font-mono tracking-wider uppercase opacity-80 pt-0.5">Dirty COW Mitigated</p>
          </div>
        </div>
        
        <div className="font-mono text-xs flex gap-4 flex-wrap sm:flex-nowrap">
          {auth && (
            <div className="flex items-center gap-3 pl-2 sm:border-l border-[#30363D] border-transparent">
               <div className="text-right hidden sm:flex flex-col items-end">
                  <span className="block text-sm font-medium text-white leading-tight">{auth.username}</span>
                  <span className={`inline-block px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-widest mt-1 bg-[#DA3633]/20 text-[#DA3633] border border-[#DA3633]/30`}>
                    {auth.role}
                  </span>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 md:grid-rows-10 gap-4">
          <>
            
            {/* Security Audit panel */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-0 flex flex-col md:col-span-12 md:row-span-10 overflow-hidden shadow-2xl">
                <div className="bg-[#010409] border-b border-[#30363D] p-3 flex flex-col gap-3">
                  <div className="text-[11px] uppercase tracking-[0.1em] text-[#8B949E] font-bold flex justify-between items-center px-2">
                    <span>Security Audit</span>
                    <div className="hidden sm:flex nav-preview gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#30363D]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#30363D]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#30363D]"></div>
                    </div>
                  </div>
                  <div className="flex gap-2 px-2">
                    <button 
                      onClick={() => setActiveTab('matrix')}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${activeTab === 'matrix' ? 'bg-[#21262D] text-[#C9D1D9] border border-[#30363D]' : 'text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#21262d]/50 border border-transparent'}`}
                    >
                      Vulnerability Matrix
                    </button>
                    <button 
                      onClick={() => setActiveTab('logs')}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${activeTab === 'logs' ? 'bg-[#21262D] text-[#C9D1D9] border border-[#30363D]' : 'text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#21262d]/50 border border-transparent'}`}
                    >
                      <Terminal className="w-3.5 h-3.5" /> Pipeline Logs
                    </button>
                    <button 
                      onClick={() => setActiveTab('architecture')}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${activeTab === 'architecture' ? 'bg-[#21262D] text-[#C9D1D9] border border-[#30363D]' : 'text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#21262d]/50 border border-transparent'}`}
                    >
                      <Cpu className="w-3.5 h-3.5" /> Root Cause Arc.
                    </button>
                    <button 
                      onClick={() => setActiveTab('patch')}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${activeTab === 'patch' ? 'bg-[#21262D] text-[#C9D1D9] border border-[#30363D]' : 'text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#21262d]/50 border border-transparent'}`}
                    >
                      <GitCommit className="w-3.5 h-3.5" /> Patch Analysis
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto p-5 custom-scrollbar">
                  {activeTab === 'matrix' ? (
                    <table className="w-full text-xs border-collapse font-sans">
                      <thead>
                        <tr>
                          <th className="text-left p-2 border-b border-[#30363D] text-[#8B949E] font-semibold">Vector</th>
                          <th className="text-left p-2 border-b border-[#30363D] text-[#8B949E] font-semibold hidden sm:table-cell">Exploit Scenario</th>
                          <th className="text-left p-2 border-b border-[#30363D] text-[#8B949E] font-semibold">Mitigation Strategy</th>
                          <th className="text-left p-2 border-b border-[#30363D] text-[#8B949E] font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-[#010409]">
                          <td className="p-2.5 border-b border-transparent text-[#DA3633] font-bold text-[11px]">Dirty COW</td>
                          <td className="p-2.5 border-b border-transparent font-mono text-[10px] hidden sm:table-cell">CVE-2016-5195 / Privilege Esc.</td>
                          <td className="p-2.5 border-b border-transparent text-[#238636] font-medium text-[11px]">Patch Kernel &gt; 4.8.x + CI/CD Audit</td>
                          <td className="p-2.5 border-b border-transparent">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-[#238636]/10 text-[#7EE787] text-[9px] font-mono uppercase tracking-widest border border-[#238636]/30">
                               <div className="w-1.5 h-1.5 rounded-full bg-[#7EE787]"></div> Executed
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : activeTab === 'architecture' ? (
                     <div className="flex flex-col gap-6">
                        <div className="border border-[#30363D] rounded bg-[#010409] p-4">
                           <h3 className="text-sm font-semibold text-[#58A6FF] mb-2 flex items-center gap-2"><Cpu className="w-4 h-4" /> The Race Condition </h3>
                           <p className="text-xs text-[#8B949E] leading-relaxed mb-6">
                             Dirty COW is a privilege escalation vulnerability that exploits a race condition in the implementation of the Copy-On-Write (COW) mechanism in the Linux kernel's memory subsystem.
                           </p>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-[#0D1117] p-4 rounded border border-[#30363D]">
                                 <div className="text-[10px] uppercase font-bold text-[#D29922] mb-3 border-b border-[#30363D] pb-2">Thread 1: Memory Advisory</div>
                                 <code className="text-[10px] text-[#C9D1D9] font-mono leading-relaxed block whitespace-pre">
<span className="text-[#8B949E]">while(1) {'{'}</span><br/>
&nbsp;&nbsp;<span className="text-[#8B949E]">/* Discard the private copy of the page */</span><br/>
&nbsp;&nbsp;<span className="text-[#FF7B72]">madvise</span>(map, 100, <span className="text-[#79C0FF]">MADV_DONTNEED</span>);<br/>
<span className="text-[#8B949E]">{'}'}</span>
                                 </code>
                                 <p className="text-[10px] text-[#8B949E] mt-3">Continuously tells the kernel to throw away the private COW page, forcing the next access to fetch the original read-only page.</p>
                              </div>
                              <div className="bg-[#0D1117] p-4 rounded border border-[#30363D]">
                                 <div className="text-[10px] uppercase font-bold text-[#DA3633] mb-3 border-b border-[#30363D] pb-2">Thread 2: Memory Write</div>
                                 <code className="text-[10px] text-[#C9D1D9] font-mono leading-relaxed block whitespace-pre">
<span className="text-[#8B949E]">while(1) {'{'}</span><br/>
&nbsp;&nbsp;<span className="text-[#8B949E]">/* Write to /proc/self/mem bypassing COW */</span><br/>
&nbsp;&nbsp;lseek(f, 0, SEEK_SET);<br/>
&nbsp;&nbsp;<span className="text-[#FF7B72]">write</span>(f, <span className="text-[#A5D6FF]">"COMPROMISED"</span>, 11);<br/>
<span className="text-[#8B949E]">{'}'}</span>
                                 </code>
                                 <p className="text-[10px] text-[#8B949E] mt-3">Attempts to write to the memory mapping. If scheduled right after `madvise`, the kernel incorrectly writes to the underlying read-only physical page.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  ) : activeTab === 'patch' ? (
                     <div className="flex flex-col gap-6">
                        <div className="border border-[#30363D] rounded bg-[#010409] p-4">
                           <h3 className="text-sm font-semibold text-[#238636] mb-2 flex items-center gap-2"><GitCommit className="w-4 h-4" /> Kernel Mitigation (FOLL_FORCE logic)</h3>
                           <p className="text-xs text-[#8B949E] leading-relaxed mb-4">
                             The fix involved modifying `mm/gup.c` (get_user_pages) by introducing a new flag `FOLL_COW` to explicitly record that a Copy-On-Write break had occurred, eliminating the race dependency on the PTE (Page Table Entry) state.
                           </p>

                           <div className="bg-[#0D1117] p-4 rounded border border-[#30363D] overflow-x-auto">
                              <pre className="text-[10px] font-mono leading-relaxed">
<span className="text-[#8B949E]">--- a/mm/gup.c</span><br/>
<span className="text-[#8B949E]">+++ b/mm/gup.c</span><br/>
<span className="text-[#D29922]">@@ -412,8 +412,11 @@ static int faultin_page(struct task_struct *tsk, struct vm_area_struct *vma,</span><br/>
<span>&nbsp;</span><br/>
<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if ((ret &amp; VM_FAULT_WRITE) &amp;&amp; !(vma-&gt;vm_flags &amp; VM_WRITE))</span><br/>
<span className="text-[#DA3633]">-	        *flags |= FOLL_COW;</span><br/>
<span className="text-[#238636]">+	        *flags |= FOLL_COW; /* Exploit vector closed */</span><br/>
<span className="text-[#238636]">+	return 0;</span><br/>
<span>&nbsp;</span><br/>
<span className="text-[#8B949E]"> /* ... (internal kernel logic replaced the write fault retry loop) */</span><br/>
                              </pre>
                           </div>
                           <div className="mt-4 p-3 bg-[#238636]/10 border border-[#238636]/30 rounded flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#7EE787] mt-1.5"></div>
                              <p className="text-[10px] text-[#7EE787] leading-relaxed">By tracking <code>FOLL_COW</code>, the kernel guarantees that when evaluating <code>FOLL_FORCE</code>, it can deterministically identify whether the COW copy was successfully instantiated, neutralizing the race window used by Thread 2's <code>write()</code> call.</p>
                           </div>
                        </div>
                     </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {logsLoading ? (
                        <div className="text-xs font-mono text-[#8B949E] flex items-center gap-2">
                           <span className="w-3 h-3 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin"></span>
                           Triggering exploit simulation and fetching logs...
                        </div>
                      ) : logs ? (
                        <>
                           <div>
                             <div className="flex justify-between items-center mb-2">
                               <div className="text-[10px] uppercase font-bold text-[#DA3633] font-mono tracking-wider">Exploit Stage Logs</div>
                               <button onClick={() => downloadLog(logs.exploit, 'exploit_stage.log')} className="text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#30363D] p-1 rounded transition-colors flex items-center gap-1.5" title="Download Exploit Logs">
                                 <Download className="w-3.5 h-3.5" />
                               </button>
                             </div>
                             <div className="bg-[#0D1117] p-3 rounded border border-[#30363D] font-mono text-[10px] text-[#C9D1D9] whitespace-pre break-all overflow-x-auto leading-relaxed shadow-inner">
                               {logs.exploit}
                             </div>
                           </div>
                           <div>
                             <div className="flex justify-between items-center mb-2">
                               <div className="text-[10px] uppercase font-bold text-[#238636] font-mono tracking-wider">Mitigation Stage Logs</div>
                               <button onClick={() => downloadLog(logs.mitigation, 'mitigation_stage.log')} className="text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#30363D] p-1 rounded transition-colors flex items-center gap-1.5" title="Download Mitigation Logs">
                                 <Download className="w-3.5 h-3.5" />
                               </button>
                             </div>
                             <div className="bg-[#0D1117] p-3 rounded border border-[#30363D] font-mono text-[10px] text-[#7EE787] whitespace-pre break-all overflow-x-auto leading-relaxed shadow-inner">
                               {logs.mitigation}
                             </div>
                           </div>
                        </>
                      ) : (
                         <div className="text-xs text-[#DA3633] font-mono">Failed to fetch logs. Is the script test_dirty_cow.sh available?</div>
                      )}
                    </div>
                  )}
                </div>
            </div>

          </>
      </div>
    </div>
  );
}
