# Reinsurance Management System

A comprehensive reinsurance administration tool designed to help insurance and reinsurance companies manage treaties, create plans, calculate cessions, and handle facultative submissions.

## Overall Workflow

Setting up and managing your reinsurance cessions follows a logical progression through the different modules of the application. 

### 1. Master Configuration
Begin in the **Master** tab to configure default application values and mappings. This ensures that terminology aligns with your internal data when importing CSV files.

### 2. Treaties
Navigate to the **Treaties** tab to establish your reinsurance agreements.
* **General Settings**: Define the treaty name, duration, and retention types (absolute amount or percentage).
* **Facultative Limit**: Specify an absolute threshold above which policies require manual review in the Facultative step instead of automatic cession.
* **Premium Rates**: Upload or manually enter your premium rate matrix based on age, gender, and risk coverage. 
* **Reinsurers**: Detail the reinsurers involved in the treaty and their share percentages (must total exactly 100%).

**Pro-Tip**: Use the **Template** download button to get a pre-formatted Excel template for your treaty data. This lets you bulk-upload treaties and their associated rate matrices with a single action.

### 3. Plans
Use the **Plans** tab to link your consumer products to the internal risk coverages.
* Map a "Plan Name" and "Plan Code" to a specific "Risk Coverage" (e.g., Death Benefit, Critical Illness) ensuring that the system correctly applies treaty rules to incoming policies.
* You can bulk import plans using the provided CSV template.

### 4. Input (Calculator)
Once Treaties and Plans are set up, you can process individual or bulk policies in the **Input** tab.
* Enter policyholder details, age, gender, chosen plan, and sum assured.
* The system uses the previously configured treaties and rate matrices to evaluate whether the policy fits retention rules.
* If a policy exceeds the **Facultative Limit** set in its matching treaty, it is sent to the Facultative queue instead of being automatically ceded.
* **Bulk Upload**: You can use the "Upload CSV" feature to process hundreds of policies at once using standard headers (`policy_number`, `dob`, `gender`, `sum_assured`, etc.). Duplicate cessions for the exact same DOC, DOB, risk coverage, policy number, and customer ID will be blocked unless parameters change (which generates a new actual cession).

### 5. Facultative
Policies exceeding their respective treaty's Facultative Limit arrive in the **Facultative** tab.
* Review the policy details and limits.
* **Accept**: Approves the reinsurance coverage and generates an actual `Cession No`, moving the policy to the Cessions queue.
* **Decline**: Marks the policy as declined, rejecting reinsurance.

### 6. Cessions
The **Cessions** tab displays all successfully processed policies that have been validly ceded. Policies that are "Facultative Pending" or "Declined" do not appear here. You can download the cessions as an Excel file for auditing and reporting.

### 7. Accounts
Generate and download Statements of Accounts for a selected reinsurer over a specified time period.

Enjoy using the Reinsurance Management System!
