import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, CheckCircle2, Trash2 } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

export default function CopilotSidebar({ onClose }) {
    const { addChatMessage, assessmentData, updateFunctionScore, updateCategoryScore, updateSubCategoryScore, clearChatHistory } = useAssessment();
    const [inputValue, setInputValue] = useState('');
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [loading, setLoading] = useState(false);

    const bottomRef = useRef(null);
    const messages = assessmentData?.history || [];

    // Load Models
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await fetch('http://127.0.0.1:5001/api/models');
                const data = await res.json();
                setModels(data.models || []);
                if (data.models?.length > 0) setSelectedModel(data.models[0].name);
            } catch (e) {
                console.error("Failed to load models");
            }
        };
        fetchModels();
    }, []);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !selectedModel) return;

        const userMsg = { role: 'user', content: inputValue };
        addChatMessage(userMsg);
        setInputValue('');
        setLoading(true);

        const history = messages.map(m => ({ role: m.role, content: m.rawContent || m.content }));
        history.push({ role: 'user', content: userMsg.content });

        try {
            const res = await fetch('http://127.0.0.1:5001/api/nist/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_name: selectedModel,
                    message: userMsg.content,
                    history: history
                })
            });

            if (!res.ok) throw new Error("Server error");
            const data = await res.json();

            // Parse json_chart blocks to update the dashboard automatically
            const chartPattern = /```json_chart\s*([\s\S]*?)\s*```/g;
            let match;
            while ((match = chartPattern.exec(data.response)) !== null) {
                try {
                    const chartData = JSON.parse(match[1]);
                    if (chartData.type === 'radar' && chartData.data?.labels) {
                        // Update function scores
                        chartData.data.labels.forEach((label, idx) => {
                            const score = chartData.data.datasets[0].data[idx] || 0;
                            updateFunctionScore(label, score, (score / 4) * 100);
                        });
                    } else if (chartData.type === 'bar' && chartData.domain && chartData.category) {
                        // Update sub-category (control) scores
                        chartData.data.labels.forEach((label, idx) => {
                            const score = chartData.data.datasets[0].data[idx] || 0;
                            updateSubCategoryScore(chartData.domain, chartData.category, label, score);
                        });
                    } else if (chartData.type === 'bar' && chartData.domain) {
                        // Update category-level scores for a function
                        chartData.data.labels.forEach((label, idx) => {
                            const score = chartData.data.datasets[0].data[idx] || 0;
                            updateCategoryScore(chartData.domain, label, score);
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse chart update:", e);
                }
            }

            addChatMessage({
                role: 'assistant',
                content: data.response,
                rawContent: data.response,
                toolUsed: data.tool_used,
                model: selectedModel
            });

        } catch (err) {
            addChatMessage({ role: 'assistant', content: `**Error**: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-[#0d1117] relative">
            <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <div className="flex flex-col">
                    <h2 className="font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-500" /> Assessment Copilot
                    </h2>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">NIST CSF 2.0 Agent</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={clearChatHistory} title="Clear Chat History" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Model Selector Bar */}
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50 dark:bg-gray-900/30 flex flex-col gap-2">
                <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className="w-full text-xs font-medium p-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="">-- Choose Assessor Model --</option>
                    {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>

                <select
                    onChange={(e) => {
                        if (e.target.value) setInputValue(e.target.value);
                        e.target.value = '';
                    }}
                    className="w-full text-xs font-medium p-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="">-- Quick Prompts --</option>
                    <option value="I want to run a quick cybersecurity assessment for my organization using the NIST Cybersecurity Framework. Please guide me through 6 key questions and create visual dashboards showing maturity scores.">Start Quick Assessment</option>
                    <option value="I need to conduct a complete comprehensive NIST CSF 2.0 assessment for my organization with complete visual reporting. Here are my details: TechCorp Solutions, Medium Software Company. Please start the comprehensive assessment workflow and guide me through the 740 questions with interactive progress tracking.">Start Comprehensive Workflow</option>
                    <option value="Generate an executive dashboard for our cybersecurity assessment with a high-level maturity radar chart showing scores across all 6 NIST CSF functions, and a color-coded risk heat map highlighting areas needing immediate attention. Use hypothetical data if an active assessment is not running.">Generate Executive Dashboard</option>
                </select>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-center opacity-60">
                        <Bot className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-sm font-medium">I'm ready.</p>
                        <p className="text-xs max-w-[200px] mt-2">Start an assessment, identify gaps, or request dashboards. I'll update the global views automatically.</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-indigo-600'}`}>
                                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                            </div>

                            <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {msg.toolUsed && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm flex items-center gap-1 mb-1">
                                        <CheckCircle2 className="w-3 h-3" /> MCP TOOL
                                    </span>
                                )}

                                <div className={`p-3 rounded-2xl text-[13px] leading-relaxed ${msg.role === 'user'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 rounded-tr-sm border border-blue-100 dark:border-blue-800/50'
                                    : 'bg-white dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200 dark:border-gray-700 shadow-sm'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        <div>{msg.content}</div>
                                    ) : (
                                        <div className="prose dark:prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(msg.content.replace(/```json_chart\\s*([\\s\\S]*?)\\s*```/g, ''))) }} />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> Thinking...
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                <div className="relative">
                    <textarea
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Chat with your assessor..."
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-4 pr-12 py-3 min-h-[52px] max-h-32 resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm shadow-inner"
                        rows={1}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || !selectedModel || loading}
                        className="absolute right-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-all active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
