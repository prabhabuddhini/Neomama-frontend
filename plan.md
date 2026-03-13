# NeoMama Web & Backend Implementation Plan

> **Goal:** Complete the remaining backend APIs and connect the mock frontend UI to real live data. (Mobile app development is excluded from this plan).

---

## Phase 1: Dashboard API & Integration ✅
*The dashboard UI (`dashboard.html` / `dashboard.js`) is currently static. We need an API to provide summary statistics.*

### 1.1 Backend: Create Dashboard Models & Service
- [x] Create `DashboardSummaryModel.cs` to hold stats (TotalPatients, HighRiskCases, MonthlyVisits, ExpectedDeliveries).
- [x] Create `DashboardService.cs` to handle the business logic of calculating these statistics.

### 1.2 Backend: Implement Dashboard Logic
- [x] Implement logic to calculate **Total Patients** (count all patients).
- [x] Implement logic to calculate **High-Risk Cases** (filter pregnancies based on a risk flag or condition).
- [x] Implement logic to calculate **Monthly Visits** (filter by `LastVisit` within the current month).
- [x] Implement logic to calculate **Expected Deliveries** (filter pregnancies where Expected Delivery Date is in the current month).

### 1.3 Backend: Create Dashboard Controller
- [x] Create `DashboardController.cs`.
- [x] Add a `GET /api/dashboard/summary` endpoint that returns the `DashboardSummaryModel`.

### 1.4 Frontend: Connect Dashboard
- [x] Open `frontend/web portal/js/dashboard.js`.
- [x] Remove hardcoded summary numbers.
- [x] Add a `fetch()` call to `http://localhost:5001/api/dashboard/summary`.
- [x] Update the UI DOM elements with the live data from the response.

---

## Phase 2: Risk Identification & AI Alerts API ✅
*The AI Alerts UI (`ai-alerts.html` / `ai-alerts.js`) currently uses a hardcoded array of fake alerts. We need a system that scans the database and generates real alerts.*

### 2.1 Backend: Create Alert Models
- [x] Create `AlertModel.cs` with fields: `Id`, `PatientName`, `AlertType`, `Severity`, `Date`, `Status`, `Message`, and `Recommendation`.

### 2.2 Backend: Create Alerts Service (Risk Engine)
- [x] Create `AlertsService.cs`.
- [x] Write logic to scan `Pregnancies` for High Blood Pressure risks (e.g., Systolic > 140 or Diastolic > 90).
- [x] Write logic to scan `Pregnancies` for abnormal weight changes.
- [x] Write logic to scan `Babies` and `GrowthRecords` for underweight/growth delay alerts.
- [x] Write logic to scan `Patients` for missed clinic visits.
- [x] Consolidate these checks into a single method that returns a `List<AlertModel>`.

### 2.3 Backend: Create Alerts Controller
- [x] Create `AlertsController.cs`.
- [x] Add a `GET /api/alerts` endpoint that calls the `AlertsService` and returns the generated alerts.

### 2.4 Frontend: Connect AI Alerts
- [x] Open `frontend/web portal/js/ai-alerts.js`.
- [x] Remove the hardcoded `const alerts = [...]` array.
- [x] Add a `fetch()` call to `http://localhost:5001/api/alerts`.
- [x] Ensure the frontend filtering (by severity, type, etc.) still works with the live data array.

---

## Phase 3: Reports & Analytics API ✅
*The Reports page (`reports.html` / `reports.js`) needs actual aggregated data for its charts and tables.*

### 3.1 Backend: Create Reports Models & Service
- [x] Create `ReportsService.cs` to aggregate data.
- [x] Implement a method to return data for a "Pregnancy Risk Breakdown" chart (e.g., counts of Low, Moderate, High risk).
- [x] Implement a method to return data for "Monthly Patient Registrations" (group patients by creation date).

### 3.2 Backend: Create Reports Controller
- [x] Create `ReportsController.cs`.
- [x] Add `GET /api/reports/risk-breakdown` endpoint.
- [x] Add `GET /api/reports/registration-trends` endpoint.

### 3.3 Frontend: Connect Reports UI
- [x] Open `frontend/web portal/js/reports.js`.
- [x] Remove any hardcoded data powering the charts (e.g., Chart.js datasets).
- [x] Add `fetch()` calls to the new `/api/reports` endpoints.
- [x] Re-render the charts using the live data.

---

## Phase 4: Data Validation & Frontend Polish ✅
*Ensure data flows smoothly from registration to alerts.*

### 4.1 Form Submissions & APIs
- [x] Verify that adding a new pregnancy via `pregnancy.html` successfully POSTs to `/api/pregnancies` and saves the data.
- [x] Verify that adding a baby growth record via `baby-growth.html` successfully POSTs to `/api/growthrecords`.

### 4.2 Cross-Checking Risk Logic
- [x] Manually create a patient with high blood pressure via the UI.
- [x] Navigate to the AI Alerts page and verify that the system successfully generates a "High Blood Pressure" alert for that specific patient.

### 4.3 Final Cleanup
- [x] Review all frontend JS files and remove any remaining hardcoded mock data.
- [x] Ensure proper error handling is in place for all `fetch()` calls (e.g., showing a user-friendly message if the API fails).
- [x] Fixed duplicate `DOMContentLoaded` handler bug in `manage-clinic.js`.
