import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PeoplePage } from '@/pages/PeoplePage';
import { NewPersonPage } from '@/pages/NewPersonPage';
import { PersonDetailPage } from '@/pages/PersonDetailPage';
import { EditPersonPage } from '@/pages/EditPersonPage';
import { IdCardsPage } from '@/pages/IdCardsPage';
import { IdCardDetailPage } from '@/pages/IdCardDetailPage';
import { CertificatesPage } from '@/pages/CertificatesPage';
import { CertificateDetailPage } from '@/pages/CertificateDetailPage';
import { OfferLettersPage } from '@/pages/OfferLettersPage';
import { OfferLetterDetailPage } from '@/pages/OfferLetterDetailPage';
import { EmployeeAgreementsPage } from '@/pages/EmployeeAgreementsPage';
import { EmployeeAgreementDetailPage } from '@/pages/EmployeeAgreementDetailPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UsersAccessPage } from '@/pages/UsersAccessPage';
import { VerifyIdPage } from '@/pages/VerifyIdPage';
import { VerifyCertificatePage } from '@/pages/VerifyCertificatePage';
import { EmbedCardPage } from '@/pages/EmbedCardPage';
import { ApiDocsPage } from '@/pages/ApiDocsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/id/:code" element={<VerifyIdPage />} />
        <Route path="/verify/certificate/:code" element={<VerifyCertificatePage />} />
        <Route path="/embed/id-card/:identifier" element={<EmbedCardPage />} />

        {/* Protected Dashboard Routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/new" element={<NewPersonPage />} />
          <Route path="/people/:id" element={<PersonDetailPage />} />
          <Route path="/people/:id/edit" element={<EditPersonPage />} />
          <Route path="/id-cards" element={<IdCardsPage />} />
          <Route path="/id-cards/:id" element={<IdCardDetailPage />} />
          <Route path="/offer-letters" element={<OfferLettersPage />} />
          <Route path="/offer-letters/:id" element={<OfferLetterDetailPage />} />
          <Route path="/employee-agreements" element={<EmployeeAgreementsPage />} />
          <Route path="/employee-agreements/:id" element={<EmployeeAgreementDetailPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/certificates/:id" element={<CertificateDetailPage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/users" element={<UsersAccessPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
