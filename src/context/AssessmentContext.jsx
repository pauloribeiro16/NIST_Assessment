import { createContext, useContext } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import SyncManager from '../components/SyncManager';

const AssessmentContext = createContext();

export function AssessmentProvider({ children }) {
    const state = useAssessmentStore();

    // Map actions and state for backward compatibility
    const value = {
        authState: state.authState,
        login: state.login,
        logout: state.logout,
        activeWorkflowId: state.activeWorkflowId,
        setActiveWorkflowId: state.setActiveWorkflowId,
        assessmentData: state.assessmentData,
        setAssessmentData: state.setAssessmentData,
        setActiveProject: state.setProjectId, // Map setActiveProject to setProjectId
        updateFunctionScore: state.updateFunctionScore,
        updateCategoryScore: state.updateCategoryScore,
        updateSubCategoryScore: state.updateSubCategoryScore,
        updateSubCategoryComment: state.updateSubCategoryComment,
        updateActionPlan: state.updateActionPlan,
        addChatMessage: state.addChatMessage,
        clearChatHistory: state.clearChatHistory
    };

    return (
        <AssessmentContext.Provider value={value}>
            {children}
            <SyncManager />
        </AssessmentContext.Provider>
    );
}

export function useAssessment() {
    return useContext(AssessmentContext);
}
