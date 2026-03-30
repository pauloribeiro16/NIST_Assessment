import { useEffect, useRef } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001'
    : window.location.origin;

export default function SyncManager() {
    const assessmentData = useAssessmentStore(state => state.assessmentData);
    const projectId = useAssessmentStore(state => state.projectId);
    const authState = useAssessmentStore(state => state.authState);
    const fetchProjectData = useAssessmentStore(state => state.fetchProjectData);
    const setAssessmentData = useAssessmentStore(state => state.setAssessmentData);

    const initDone = useRef(false);
    const saveTimer = useRef(null);

    // 1. Initial Load when Project ID changes
    useEffect(() => {
        if (projectId) {
            const getLocalKey = () => `nist_assessment_cache_${projectId}`;
            
            // Try loading from localStorage immediately to prevent showing 0s
            try {
                const cached = localStorage.getItem(getLocalKey());
                if (cached) {
                    const parsed = JSON.parse(cached);
                    // Ensure full structure if parsed is partial
                    setAssessmentData(prev => ({
                        ...prev,
                        ...parsed
                    }));
                }
            } catch (_) { }

            // Then fetch single source of truth from backend
            fetchProjectData();
        }
    }, [projectId, fetchProjectData, setAssessmentData]);

    // 2. Continuous Sync (Debounced Save)
    useEffect(() => {
        if (!initDone.current) {
            initDone.current = true;
            return;
        }
        if (!projectId || !assessmentData) return;

        const getLocalKey = () => `nist_assessment_cache_${projectId}`;
        
        const toSave = {
            name: assessmentData.name || '',
            functions: assessmentData.functions,
            overallMaturity: assessmentData.overallMaturity,
            completionRate: assessmentData.completionRate,
            actionPlan: assessmentData.actionPlan || []
        };

        // Update localStorage instantly
        try { 
            localStorage.setItem(getLocalKey(), JSON.stringify(toSave)); 
        } catch (_) { }

        const headers = {
            'Content-Type': 'application/json',
            ...(authState?.token ? { 'Authorization': `Bearer ${authState.token}` } : {})
        };

        // Clear previous timer
        if (saveTimer.current) clearTimeout(saveTimer.current);

        saveTimer.current = setTimeout(() => {
            fetch(`${API_BASE}/api/projects/${projectId}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(toSave),
            }).catch(() => { /* silent fail — data still safe in localStorage */ });
        }, 1000);

        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [assessmentData, projectId, authState?.token]);

    return null; // This component has no UI
}
