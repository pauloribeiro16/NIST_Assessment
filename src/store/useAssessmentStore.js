import { create } from 'zustand';
import { nistColors, nistGuidance, nistTiers } from '../data/nistData';

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001'
    : window.location.origin;

const emptyAssessment = {
    overallMaturity: 0,
    completionRate: 0,
    actionPlan: [],
    functions: {
        "Govern": {
            score: 0, progress: 0,
            categories: {
                "Organizational Context": { score: 0, subcategories: { "GV.OC-01": 0, "GV.OC-02": 0, "GV.OC-03": 0, "GV.OC-04": 0, "GV.OC-05": 0 } },
                "Risk Management Strategy": { score: 0, subcategories: { "GV.RM-01": 0, "GV.RM-02": 0, "GV.RM-03": 0 } },
                "Roles & Responsibilities": { score: 0, subcategories: { "GV.RR-01": 0, "GV.RR-02": 0, "GV.RR-03": 0, "GV.RR-04": 0 } },
                "Policy": { score: 0, subcategories: { "GV.PO-01": 0, "GV.PO-02": 0 } },
                "Oversight": { score: 0, subcategories: { "GV.OV-01": 0, "GV.OV-02": 0, "GV.OV-03": 0 } },
                "Cyber Supply Chain": { score: 0, subcategories: { "GV.SC-01": 0, "GV.SC-02": 0, "GV.SC-03": 0, "GV.SC-04": 0, "GV.SC-05": 0, "GV.SC-06": 0, "GV.SC-07": 0, "GV.SC-08": 0, "GV.SC-09": 0, "GV.SC-10": 0 } }
            }
        },
        "Identify": {
            score: 0, progress: 0,
            categories: {
                "Asset Management": { score: 0, subcategories: { "ID.AM-01": 0, "ID.AM-02": 0, "ID.AM-03": 0, "ID.AM-05": 0, "ID.AM-07": 0, "ID.AM-08": 0 } },
                "Risk Assessment": { score: 0, subcategories: { "ID.RA-01": 0, "ID.RA-02": 0, "ID.RA-03": 0, "ID.RA-05": 0, "ID.RA-07": 0, "ID.RA-08": 0, "ID.RA-09": 0, "ID.RA-10": 0 } },
                "Improvement": { score: 0, subcategories: { "ID.IM-01": 0, "ID.IM-02": 0, "ID.IM-03": 0, "ID.IM-04": 0 } }
            }
        },
        "Protect": {
            score: 0, progress: 0,
            categories: {
                "Identity & Access Control": { score: 0, subcategories: { "PR.AA-01": 0, "PR.AA-02": 0, "PR.AA-03": 0, "PR.AA-04": 0, "PR.AA-05": 0, "PR.AA-06": 0 } },
                "Awareness & Training": { score: 0, subcategories: { "PR.AT-01": 0, "PR.AT-02": 0 } },
                "Data Security": { score: 0, subcategories: { "PR.DS-01": 0, "PR.DS-02": 0, "PR.DS-10": 0, "PR.DS-11": 0 } },
                "Platform Security": { score: 0, subcategories: { "PR.PS-01": 0, "PR.PS-02": 0, "PR.PS-04": 0, "PR.PS-06": 0 } },
                "Infrastructure Resilience": { score: 0, subcategories: { "PR.IR-01": 0, "PR.IR-02": 0, "PR.IR-03": 0, "PR.IR-04": 0 } }
            }
        },
        "Detect": {
            score: 0, progress: 0,
            categories: {
                "Continuous Monitoring": { score: 0, subcategories: { "DE.CM-01": 0, "DE.CM-02": 0, "DE.CM-03": 0, "DE.CM-06": 0, "DE.CM-09": 0 } },
                "Adverse Event Analysis": { score: 0, subcategories: { "DE.AE-02": 0, "DE.AE-03": 0, "DE.AE-04": 0, "DE.AE-06": 0, "DE.AE-07": 0, "DE.AE-08": 0 } }
            }
        },
        "Respond": {
            score: 0, progress: 0,
            categories: {
                "Incident Management": { score: 0, subcategories: { "RS.MA-01": 0, "RS.MA-02": 0, "RS.MA-03": 0, "RS.MA-04": 0, "RS.MA-05": 0 } },
                "Analysis": { score: 0, subcategories: { "RS.AN-03": 0, "RS.AN-06": 0, "RS.AN-07": 0, "RS.AN-08": 0 } },
                "Mitigation": { score: 0, subcategories: { "RS.MI-01": 0, "RS.MI-02": 0 } },
                "Communication": { score: 0, subcategories: { "RS.CO-02": 0, "RS.CO-03": 0 } }
            }
        },
        "Recover": {
            score: 0, progress: 0,
            categories: {
                "Recovery Planning": { score: 0, subcategories: { "RC.RP-01": 0, "RC.RP-02": 0, "RC.RP-03": 0 } },
                "Restoration": { score: 0, subcategories: { "RC.RS-01": 0, "RC.RS-02": 0, "RC.RS-03": 0, "RC.RS-04": 0 } },
                "Communication": { score: 0, subcategories: { "RC.CO-03": 0, "RC.CO-04": 0 } }
            }
        }
    },
    history: [],
    nistColors: nistColors,
    nistGuidance: nistGuidance,
    nistTiers: nistTiers
};

export const useAssessmentStore = create((set, get) => ({
    authState: (() => {
        try {
            const saved = localStorage.getItem('nist_auth');
            return saved ? JSON.parse(saved) : { user: null, token: null };
        } catch (e) {
            return { user: null, token: null };
        }
    })(),
    activeWorkflowId: null,
    projectId: null,
    assessmentData: emptyAssessment,

    // Static Data Shortcuts
    nistColors,
    nistGuidance,
    nistTiers,

    // Actions
    setAuthState: (auth) => set({ authState: auth }),
    setProjectId: (id) => set({ projectId: id }),
    setActiveWorkflowId: (id) => set({ activeWorkflowId: id }),
    setAssessmentData: (update) => set((state) => ({
        assessmentData: typeof update === 'function' ? update(state.assessmentData) : update
    })),

    login: async (username, password) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${API_BASE}/api/token`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                const token = data.access_token;
                
                // Fetch profile to get role for RBAC
                const meRes = await fetch(`${API_BASE}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const meData = await meRes.json();

                const newAuth = { 
                    user: { 
                        username, 
                        role: meData.role || 'user',
                        full_name: meData.full_name || ''
                    }, 
                    token 
                };
                set({ authState: newAuth });
                localStorage.setItem('nist_auth', JSON.stringify(newAuth));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    },

    register: async (userData) => {
        try {
            const formData = new FormData();
            formData.append('username', userData.username);
            formData.append('password', userData.password);
            
            // For FastAPI OAuth2 we use standard login but FastAPI uses json for our register
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (response.ok) return { success: true };
            const errData = await response.json();
            return { success: false, error: errData.detail || 'Registration failed' };
        } catch (err) {
            console.error('Register error:', err);
            return { success: false, error: 'Connection failed' };
        }
    },

    logout: () => {
        set({ authState: { user: null, token: null } });
        localStorage.removeItem('nist_auth');
    },

    updateFunctionScore: (funcName, score, progress) => set((state) => ({
        assessmentData: {
            ...state.assessmentData,
            functions: {
                ...state.assessmentData.functions,
                [funcName]: {
                    ...state.assessmentData.functions[funcName],
                    score,
                    progress
                }
            }
        }
    })),

    updateCategoryScore: (funcName, categoryName, score) => set((state) => {
        const currentFunc = state.assessmentData.functions[funcName];
        if (!currentFunc || !currentFunc.categories[categoryName]) return {};

        return {
            assessmentData: {
                ...state.assessmentData,
                functions: {
                    ...state.assessmentData.functions,
                    [funcName]: {
                        ...currentFunc,
                        categories: {
                            ...currentFunc.categories,
                            [categoryName]: {
                                ...currentFunc.categories[categoryName],
                                score
                            }
                        }
                    }
                }
            }
        };
    }),

    updateSubCategoryScore: (funcName, categoryName, subCatId, score) => set((state) => {
        const currentFunc = state.assessmentData.functions[funcName];
        if (!currentFunc || !currentFunc.categories[categoryName]) return {};
        const currentCat = currentFunc.categories[categoryName];

        // 1. Update Subcategories
        const newSubcategories = {
            ...currentCat.subcategories,
            [subCatId]: score
        };

        // 2. Recalculate Category Score
        const subScores = Object.values(newSubcategories);
        const newCatScore = subScores.reduce((a, b) => a + b, 0) / subScores.length;

        // 3. Prepare new Categories map
        const newCategories = {
            ...currentFunc.categories,
            [categoryName]: {
                ...currentCat,
                score: newCatScore,
                subcategories: newSubcategories
            }
        };

        // 4. Recalculate Function Score
        const catScores = Object.values(newCategories).map(cat => cat.score || 0);
        const newFuncScore = catScores.reduce((a, b) => a + b, 0) / catScores.length;

        // 5. Recalculate Global Maturity & Completion Rate
        const allFuncs = Object.values({
            ...state.assessmentData.functions,
            [funcName]: {
                ...currentFunc,
                score: newFuncScore,
                categories: newCategories
            }
        });
        const allFuncScores = allFuncs.map(f => f.score || 0);
        const globalMaturity = allFuncScores.reduce((a, b) => a + b, 0) / allFuncScores.length;

        const allSubcategories = [];
        allFuncs.forEach(f => {
            Object.values(f.categories).forEach(c => {
                allSubcategories.push(...Object.values(c.subcategories));
            });
        });
        const completedCount = allSubcategories.filter(s => s > 0).length;
        const completionRate = Math.round((completedCount / allSubcategories.length) * 100);

        return {
            assessmentData: {
                ...state.assessmentData,
                overallMaturity: globalMaturity,
                completionRate: completionRate,
                functions: {
                    ...state.assessmentData.functions,
                    [funcName]: {
                        ...currentFunc,
                        score: newFuncScore,
                        categories: newCategories
                    }
                }
            }
        };
    }),

    updateSubCategoryComment: (funcName, categoryName, subLabel, comment) => set((state) => {
        const currentFunc = state.assessmentData.functions[funcName];
        if (!currentFunc) return {};
        const currentCat = currentFunc.categories[categoryName];
        if (!currentCat) return {};

        return {
            assessmentData: {
                ...state.assessmentData,
                functions: {
                    ...state.assessmentData.functions,
                    [funcName]: {
                        ...currentFunc,
                        categories: {
                            ...currentFunc.categories,
                            [categoryName]: {
                                ...currentCat,
                                subcategoryComments: {
                                    ...(currentCat.subcategoryComments || {}),
                                    [subLabel]: comment
                                }
                            }
                        }
                    }
                }
            }
        };
    }),

    updateActionPlan: (newPlan) => set((state) => ({
        assessmentData: {
            ...state.assessmentData,
            actionPlan: typeof newPlan === 'function' ? newPlan(state.assessmentData.actionPlan || []) : newPlan
        }
    })),

    addChatMessage: (msg) => set((state) => ({
        assessmentData: {
            ...state.assessmentData,
            history: [...(state.assessmentData?.history || []), msg]
        }
    })),

    clearChatHistory: () => set((state) => ({
        assessmentData: {
            ...state.assessmentData,
            history: []
        }
    })),

    // Async Fetch Pattern
    fetchProjectData: async () => {
        const { projectId, authState } = get();
        if (!projectId) return;

        const headers = authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {};
        try {
            const r = await fetch(`${API_BASE}/api/projects/${projectId}`, { headers });
            if (!r.ok) return;
            const data = await r.json();
            if (data) {
                set((state) => ({
                    assessmentData: {
                        ...emptyAssessment,
                        name: data.name || '',
                        functions: data.functions,
                        overallMaturity: data.overallMaturity ?? 0,
                        completionRate: data.completionRate ?? 0,
                        actionPlan: data.actionPlan || []
                    }
                }));
            }
        } catch (err) {
            console.warn('[Zustand] Backend unreachable:', err);
        }
    }
}));
