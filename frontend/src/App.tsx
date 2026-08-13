import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/Unauthorized';

// Portals
import CandidateLayout from './layouts/CandidateLayout';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import SkillPassport from './pages/candidate/SkillPassport';
import BrowseJobs from './pages/candidate/BrowseJobs';
import CandidateAssessments from './pages/candidate/CandidateAssessments';
import CandidateRoadmaps from './pages/candidate/CandidateRoadmaps';
import CandidateOffers from './pages/candidate/CandidateOffers';

import RecruiterLayout from './layouts/RecruiterLayout';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import JobList from './pages/recruiter/JobList';
import JobIntelligenceWorkspace from './pages/recruiter/JobIntelligenceWorkspace';
import MatchIntelligence from './pages/recruiter/MatchIntelligence';
import InterviewWorkspace from './pages/recruiter/InterviewWorkspace';
import CandidatesList from './pages/recruiter/CandidatesList';
import RecruiterAssessments from './pages/recruiter/RecruiterAssessments';
import RecruiterInterviews from './pages/recruiter/RecruiterInterviews';
import RecruiterOffers from './pages/recruiter/RecruiterOffers';
import ApplicationKanban from './pages/recruiter/ApplicationKanban';

import InterviewerDashboard from './pages/interviewer/InterviewerDashboard';
import HiringManagerDashboard from './pages/hiringManager/HiringManagerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AssessmentBuilder from './pages/recruiter/AssessmentBuilder';
import CodingTerminal from './pages/candidate/CodingTerminal';
import RoadmapWorkspace from './pages/candidate/RoadmapWorkspace';
import OfferLetterView from './pages/candidate/OfferLetterView';
import AIInterviewSandbox from './pages/candidate/AIInterviewSandbox';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Portals */}
          <Route
            path="/candidate"
            element={
              <ProtectedRoute allowedRoles={['CANDIDATE']}>
                <CandidateLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CandidateDashboard />} />
            <Route path="passport" element={<SkillPassport />} />
            <Route path="jobs" element={<BrowseJobs />} />
            <Route path="assessments" element={<CandidateAssessments />} />
            <Route path="roadmap" element={<CandidateRoadmaps />} />
            <Route path="offers" element={<CandidateOffers />} />
          </Route>
          <Route
            path="/candidate/assessment/:assessmentId"
            element={
              <ProtectedRoute allowedRoles={['CANDIDATE']}>
                <CodingTerminal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/applications/:applicationId/roadmap"
            element={
              <ProtectedRoute allowedRoles={['CANDIDATE']}>
                <RoadmapWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/applications/:applicationId/offer"
            element={
              <ProtectedRoute allowedRoles={['CANDIDATE']}>
                <OfferLetterView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/applications/:applicationId/ai-interview"
            element={
              <ProtectedRoute allowedRoles={['CANDIDATE']}>
                <AIInterviewSandbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RecruiterDashboard />} />
            <Route path="jobs" element={<JobList />} />
            <Route path="jobs/create" element={<JobIntelligenceWorkspace />} />
            <Route path="jobs/edit/:id" element={<JobIntelligenceWorkspace />} />
            <Route path="jobs/:jobId/matches" element={<MatchIntelligence />} />
            <Route path="jobs/:jobId/interviews/schedule/:applicationId" element={<InterviewWorkspace />} />
            <Route path="jobs/:jobId/assessment/edit" element={<AssessmentBuilder />} />
            <Route path="candidates" element={<CandidatesList />} />
            <Route path="applications" element={<ApplicationKanban />} />
            <Route path="assessments" element={<RecruiterAssessments />} />
            <Route path="interviews" element={<RecruiterInterviews />} />
            <Route path="offers" element={<RecruiterOffers />} />
          </Route>
          <Route
            path="/interviewer/*"
            element={
              <ProtectedRoute allowedRoles={['INTERVIEWER']}>
                <InterviewerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hiring-manager/*"
            element={
              <ProtectedRoute allowedRoles={['HIRING_MANAGER']}>
                <HiringManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
