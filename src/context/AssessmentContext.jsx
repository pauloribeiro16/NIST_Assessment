import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AssessmentContext = createContext();

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001'
    : window.location.origin;
const LOCAL_KEY = 'nist_assessment_cache';

export function AssessmentProvider({ children }) {
    const [authState, setAuthState] = useState({ 
        user: { username: 'admin', full_name: 'System Administrator' }, 
        token: 'disabled_auth_bypass_token' 
    });
    const [activeWorkflowId, setActiveWorkflowId] = useState(null);
    const emptyAssessment = {
        overallMaturity: 0,
        completionRate: 0,
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
        nistColors: {
            "Govern": "#FFB300",
            "Identify": "#4FB6E1",
            "Protect": "#9186E1",
            "Detect": "#FFB347",
            "Respond": "#EB7979",
            "Recover": "#82EEA2"
        },
        nistGuidance: {
            // GOVERN - Organizational Context
            "GV.OC-01": { name: "Mission and Strategic Alignment", guidance: "Ensure cybersecurity strategy supports the organizational mission.\n\n• Document the organizational mission and vision.\n• Map cybersecurity objectives to business goals.\n• Review alignment annually with leadership." },
            "GV.OC-02": { name: "Internal & External Context", guidance: "Understand the internal and external environment that affects cybersecurity risk.\n\n• Identify regulatory and legal requirements.\n• Assess supplier and partner dependencies.\n• Map threat landscape relevant to the org." },
            "GV.OC-03": { name: "Legal & Regulatory Requirements", guidance: "Legal, regulatory and contractual cybersecurity obligations are understood.\n\n• Catalog applicable laws (e.g. GDPR, HIPAA).\n• Track changes to regulations.\n• Assign ownership for each compliance area." },
            "GV.OC-04": { name: "Critical Objectives and Dependencies", guidance: "Critical assets and services that support organizational objectives are identified.\n\n• Define business-critical services.\n• Map dependencies between services.\n• Use BIA to prioritize protection efforts." },
            "GV.OC-05": { name: "Outcomes & Risk Tolerance", guidance: "Cybersecurity outcomes and risk tolerance are established.\n\n• Define acceptable risk levels.\n• Communicate risk appetite to stakeholders.\n• Review and update risk tolerance regularly." },

            // GOVERN - Risk Management Strategy
            "GV.RM-01": { name: "Risk Management Strategy", guidance: "An organizational risk management strategy is established and communicated.\n\n• Define risk management framework (e.g. NIST RMF).\n• Communicate strategy to all stakeholders.\n• Integrate with enterprise risk management." },
            "GV.RM-02": { name: "Risk Appetite and Tolerance", guidance: "Risk appetite and tolerance are documented and reviewed.\n\n• Quantify acceptable loss thresholds.\n• Review with executive leadership quarterly.\n• Embed in procurement and project decisions." },
            "GV.RM-03": { name: "Cybersecurity Risk Coordination", guidance: "Cybersecurity risk management is coordinated across the organization.\n\n• Establish cross-functional risk committee.\n• Share risk data between departments.\n• Integrate with IT and operational risk processes." },

            // GOVERN - Roles & Responsibilities
            "GV.RR-01": { name: "Leadership Roles & Accountability", guidance: "Cybersecurity leadership roles are defined and accountable.\n\n• Assign a CISO or equivalent.\n• Define board-level oversight responsibilities.\n• Communicate accountability structure." },
            "GV.RR-02": { name: "Workforce Roles & Responsibilities", guidance: "All staff understand their cybersecurity responsibilities.\n\n• Document role-specific security duties.\n• Include in job descriptions and onboarding.\n• Reinforce through regular training." },
            "GV.RR-03": { name: "Adequate Resources", guidance: "Adequate resources are allocated to cybersecurity.\n\n• Budget for security tools, training, and personnel.\n• Track spending vs. risk reduction.\n• Present resource needs to leadership annually." },
            "GV.RR-04": { name: "Cybersecurity in HR Practices", guidance: "Cybersecurity is incorporated into human resources practices.\n\n• Conduct background checks for sensitive roles.\n• Include security clauses in employment agreements.\n• Manage access changes on role transitions." },

            // GOVERN - Policy
            "GV.PO-01": { name: "Cybersecurity Policy", guidance: "A cybersecurity policy is established and communicated.\n\n• Draft and approve a formal cybersecurity policy.\n• Distribute and acknowledge it organization-wide.\n• Review and update at least annually." },
            "GV.PO-02": { name: "Policy Review & Updates", guidance: "Cybersecurity policies are reviewed and updated to reflect changes.\n\n• Schedule annual policy review cycles.\n• Trigger reviews after significant incidents.\n• Track version history and approvals." },

            // GOVERN - Oversight
            "GV.OV-01": { name: "Cybersecurity Review by Leadership", guidance: "Cybersecurity risk management results are reviewed by leadership.\n\n• Present risk dashboards to leadership quarterly.\n• Document review meeting outcomes.\n• Link findings to action items." },
            "GV.OV-02": { name: "Cybersecurity Strategy Review", guidance: "The cybersecurity strategy is reviewed and adjusted as needed.\n\n• Assess effectiveness of the strategy periodically.\n• Incorporate lessons learned from incidents.\n• Adjust objectives based on threat landscape." },
            "GV.OV-03": { name: "Organizational Cybersecurity Results", guidance: "Organizational cybersecurity results are communicated.\n\n• Report performance metrics to stakeholders.\n• Use KPIs and KRIs to track outcomes.\n• Share results with the board and executives." },

            // GOVERN - Cyber Supply Chain
            "GV.SC-01": { name: "Supply Chain Security Policy", guidance: "Cybersecurity supply chain policy is established.\n\n• Define supplier security requirements.\n• Include security in procurement processes.\n• Communicate expectations to all vendors." },
            "GV.SC-02": { name: "Supply Chain Roles & Responsibilities", guidance: "Cybersecurity supply chain roles and responsibilities are assigned.\n\n• Designate a supply chain security owner.\n• Integrate with vendor management teams.\n• Establish communication channels with suppliers." },
            "GV.SC-03": { name: "Supply Chain Risk Identification", guidance: "Cybersecurity supply chain risk is identified and prioritized.\n\n• Classify suppliers by criticality and risk.\n• Conduct annual supplier risk assessments.\n• Maintain a supplier risk register." },
            "GV.SC-04": { name: "Supplier Risk Management Plans", guidance: "Suppliers are assessed and risk is documented in plans.\n\n• Require security questionnaires from key suppliers.\n• Conduct on-site assessments for critical vendors.\n• Document and track mitigation actions." },
            "GV.SC-05": { name: "Requirements for Suppliers", guidance: "Requirements and controls for suppliers are established.\n\n• Include security SLAs in contracts.\n• Require right-to-audit clauses.\n• Mandate breach notification timelines." },
            "GV.SC-06": { name: "Planning and Due Diligence", guidance: "Planning and due diligence is performed before acquiring suppliers.\n\n• Assess new vendors before onboarding.\n• Review financial stability and security posture.\n• Document due-diligence findings." },
            "GV.SC-07": { name: "Supply Chain Incident Response", guidance: "Cybersecurity supply chain incidents are identified and responded to.\n\n• Include suppliers in incident response plans.\n• Define escalation paths for supplier breaches.\n• Conduct post-incident reviews with suppliers." },
            "GV.SC-08": { name: "Responsible Party for Services", guidance: "Cybersecurity requirements for delivered services are identified.\n\n• Map delivered services to responsible parties.\n• Track SLA compliance.\n• Review service security reports regularly." },
            "GV.SC-09": { name: "Supply Chain Product Vetting", guidance: "Products and services are vetted before deployment.\n\n• Test hardware and software before deployment.\n• Check for known vulnerabilities in products.\n• Establish component allowlists." },
            "GV.SC-10": { name: "Supply Chain Risk Monitoring", guidance: "Cybersecurity risk in the supply chain is monitored over time.\n\n• Subscribe to supplier threat intelligence feeds.\n• Monitor for supplier breaches or geopolitical risks.\n• Update risk ratings after external events." },

            // IDENTIFY - Asset Management
            "ID.AM-01": { name: "Physical Device Inventory", guidance: "An inventory of physical devices and systems is maintained.\n\n• Implement automated asset discovery (e.g. Nmap, Lansweeper).\n• Document hardware specs, location, and owner.\n• Track lifecycle from procurement to decommissioning." },
            "ID.AM-02": { name: "Software & Platforms Inventory", guidance: "An inventory of software platforms and applications is maintained.\n\n• Catalog all authorized software by version.\n• Track license expiration and renewals.\n• Detect and remove unauthorized applications." },
            "ID.AM-03": { name: "Communication & Data Flows", guidance: "Communication and data flows are documented and mapped.\n\n• Create network topology and data flow diagrams.\n• Identify all external connections.\n• Classify data flows by sensitivity." },
            "ID.AM-05": { name: "Prioritization of Resources", guidance: "Resources are prioritized based on classification, criticality, and business value.\n\n• Classify assets by sensitivity and criticality.\n• Apply protection controls proportional to risk.\n• Review priorities after organizational changes." },
            "ID.AM-07": { name: "Inventories of Data", guidance: "Inventories of data and their corresponding information systems are maintained.\n\n• Create a data inventory with classification labels.\n• Map data to the systems that store or process it.\n• Review data inventory after major system changes." },
            "ID.AM-08": { name: "Systems, Hardware & Software Lifecycle", guidance: "Systems, hardware, software and services are managed through their lifecycle.\n\n• Define EOL policies for hardware and software.\n• Plan timely replacements before EOL dates.\n• Maintain records of decommissioned assets." },

            // IDENTIFY - Risk Assessment
            "ID.RA-01": { name: "Asset Vulnerabilities Identification", guidance: "Asset vulnerabilities are identified and documented.\n\n• Run authenticated vulnerability scans regularly.\n• Subscribe to CVE/NVD and vendor advisories.\n• Maintain a vulnerability register with priority ratings." },
            "ID.RA-02": { name: "Threat Intelligence Sources", guidance: "Cyber threat intelligence is gathered from information sharing sources.\n\n• Subscribe to ISACs relevant to your sector.\n• Integrate threat feeds into SIEM.\n• Participate in peer information-sharing groups." },
            "ID.RA-03": { name: "Threats Identified & Communicated", guidance: "Threats, vulnerabilities, and likelihoods are identified and communicated.\n\n• Conduct regular threat modeling sessions.\n• Document and share identified threats with stakeholders.\n• Use structured formats (STRIDE, PASTA, etc.)." },
            "ID.RA-05": { name: "Threat & Vulnerability Prioritization", guidance: "Threats and vulnerabilities are matched to risk and prioritized for response.\n\n• Use CVSS scores combined with asset criticality.\n• Apply risk-based prioritization (e.g. SSVC).\n• Track remediation progress in a ticketing system." },
            "ID.RA-07": { name: "Risk Response Actions", guidance: "Risk responses are identified, prioritized, planned, tracked and communicated.\n\n• Evaluate accept, mitigate, transfer, or avoid options.\n• Document risk decisions and residual risk.\n• Report risk response status to leadership." },
            "ID.RA-08": { name: "Coordinated Vulnerability Disclosure", guidance: "A process exists for receiving, analyzing, and advising on vulnerabilities from external parties.\n\n• Establish a public vulnerability disclosure policy.\n• Provide a secure channel for reporting (e.g. security.txt).\n• Acknowledge reports within 48 hours." },
            "ID.RA-09": { name: "Software & Supply Chain Authenticity", guidance: "The authenticity of hardware and software is assessed prior to acquisition.\n\n• Verify software signatures and checksums.\n• Require SBOMs from key software vendors.\n• Source hardware only from trusted suppliers." },
            "ID.RA-10": { name: "Critical Suppliers Risk Assessment", guidance: "Critical suppliers and third parties are assessed for risk.\n\n• Classify suppliers by criticality.\n• Conduct security assessments for Tier 1 suppliers.\n• Review assessments annually and after incidents." },

            // IDENTIFY - Improvement
            "ID.IM-01": { name: "Improvements from Evaluations", guidance: "Improvements are identified from evaluations, assessments and audits.\n\n• Review penetration test findings and track remediation.\n• Incorporate audit findings into the security roadmap.\n• Track improvement items to closure." },
            "ID.IM-02": { name: "Improvements from Security Tests", guidance: "Plans and processes are improved based on security tests and exercises.\n\n• Conduct tabletop exercises and red team exercises.\n• Document gaps discovered and assign owners.\n• Re-test after improvements are implemented." },
            "ID.IM-03": { name: "Improvements from Execution", guidance: "Improvements are identified from execution of operational processes.\n\n• Review operational security metrics monthly.\n• Identify bottlenecks or repeated failures.\n• Feed lessons into process improvement cycles." },
            "ID.IM-04": { name: "Incident Lessons Learned", guidance: "Incident response plans incorporate lessons learned.\n\n• Conduct post-incident reviews (PIRs) within 2 weeks.\n• Update playbooks based on findings.\n• Share non-sensitive lessons across the organization." },

            // PROTECT - Identity & Access Control
            "PR.AA-01": { name: "Identity & Credential Management", guidance: "Identities and credentials are managed throughout their lifecycle.\n\n• Enforce MFA on all privileged and external accounts.\n• Automate provisioning and de-provisioning.\n• Review access rights quarterly." },
            "PR.AA-02": { name: "Physical Access Control", guidance: "Physical access to assets is managed and protected.\n\n• Use badge access and CCTV in sensitive areas.\n• Log physical access to server rooms.\n• Escort visitors in restricted zones." },
            "PR.AA-03": { name: "Remote Access Management", guidance: "Remote access is managed and monitored.\n\n• Require VPN with MFA for remote workers.\n• Monitor remote session logs for anomalies.\n• Apply least-privilege to remote access roles." },
            "PR.AA-04": { name: "Access Permissions & Authorizations", guidance: "Access permissions and authorizations are managed proportional to risk.\n\n• Implement role-based access control (RBAC).\n• Review and recertify privileges semi-annually.\n• Apply principle of least privilege." },
            "PR.AA-05": { name: "Network Access Integrity", guidance: "Network access is managed to minimize the unauthorized access risk.\n\n• Segment the network by trust zones.\n• Use 802.1X for network access control.\n• Monitor for unauthorized devices." },
            "PR.AA-06": { name: "Identities Verification & Binding", guidance: "Physical and logical assets are bound to identities.\n\n• Bind certificates or tokens to devices.\n• Use device identity in access decisions.\n• Track device-to-user associations." },

            // PROTECT - Awareness & Training
            "PR.AT-01": { name: "Awareness Training for All Users", guidance: "All users are informed and trained to perform cybersecurity duties.\n\n• Conduct annual security awareness training.\n• Run quarterly phishing simulations.\n• Track training completion rates." },
            "PR.AT-02": { name: "Privileged User Training", guidance: "Individuals with elevated privileges receive additional training.\n\n• Provide role-specific training for admins and IT staff.\n• Include insider threat and social engineering topics.\n• Verify understanding with assessments." },

            // PROTECT - Data Security
            "PR.DS-01": { name: "Data-at-Rest Protection", guidance: "Data-at-rest is protected to ensure confidentiality and integrity.\n\n• Encrypt sensitive data stores using AES-256.\n• Control physical access to storage media.\n• Audit access logs for sensitive datasets." },
            "PR.DS-02": { name: "Data-in-Transit Protection", guidance: "Data-in-transit is protected to ensure confidentiality and integrity.\n\n• Enforce TLS 1.2+ on all network communications.\n• Prohibit plaintext protocols (e.g. Telnet, FTP).\n• Monitor for unencrypted transmissions." },
            "PR.DS-10": { name: "Data-in-Use Protection", guidance: "Data-in-use is protected to ensure confidentiality and integrity.\n\n• Apply DLP controls on endpoints.\n• Prevent copy/paste of sensitive data to unapproved apps.\n• Use memory encryption where feasible." },
            "PR.DS-11": { name: "Data Backups", guidance: "Backups of data are created, maintained, and tested.\n\n• Follow 3-2-1 backup strategy.\n• Test restore procedures quarterly.\n• Store offsite/offline copies of critical backups." },

            // PROTECT - Platform Security
            "PR.PS-01": { name: "Configuration Management", guidance: "IT assets are configured to minimize their attack surface.\n\n• Use CIS Benchmarks as hardening baselines.\n• Enforce baselines with configuration management tools.\n• Detect and remediate drift automatically." },
            "PR.PS-02": { name: "Software Maintenance", guidance: "Software is maintained to reduce attack vectors.\n\n• Patch critical vulnerabilities within 30 days.\n• Use automated patch management tools.\n• Track patch status in an asset inventory." },
            "PR.PS-04": { name: "Log Generation", guidance: "Logs and security telemetry are generated and retained.\n\n• Enable logging on all critical systems.\n• Centralize logs in a SIEM.\n• Define retention periods (minimum 90 days hot, 1 year cold)." },
            "PR.PS-06": { name: "Secure Software Development", guidance: "Secure software development practices are implemented.\n\n• Integrate SAST/DAST in CI/CD pipelines.\n• Conduct code reviews with security focus.\n• Train developers on secure coding (OWASP Top 10)." },

            // PROTECT - Infrastructure Resilience
            "PR.IR-01": { name: "Network Integrity Protection", guidance: "Networks and environments are protected from unauthorized access.\n\n• Segment networks by sensitivity and function.\n• Use firewalls and ACLs to enforce boundaries.\n• Monitor for unauthorized lateral movement." },
            "PR.IR-02": { name: "Capacity & Availability Management", guidance: "The organization's capacity is managed to ensure performance and availability.\n\n• Monitor resource utilization trends.\n• Plan capacity to handle peak demand.\n• Implement auto-scaling for critical services." },
            "PR.IR-03": { name: "Telecommunications Redundancy", guidance: "Telecommunications and supporting infrastructure are resilient.\n\n• Use redundant ISP connections.\n• Test failover capabilities regularly.\n• Document recovery time objectives (RTO)." },
            "PR.IR-04": { name: "Failsafe Mechanisms", guidance: "Adequate resource capacity to ensure availability is maintained.\n\n• Design systems with fallback/failsafe modes.\n• Test degraded-mode operations.\n• Implement circuit breakers in critical applications." },

            // DETECT - Continuous Monitoring
            "DE.CM-01": { name: "Networks Monitored", guidance: "Networks and network services are monitored for anomalies.\n\n• Deploy IDS/IPS at network boundaries.\n• Analyze NetFlow and packet captures.\n• Alert on unusual traffic volumes or destinations." },
            "DE.CM-02": { name: "Physical Environment Monitored", guidance: "The physical environment is monitored for unauthorized access.\n\n• Install CCTV in key areas.\n• Use environmental sensors (temp, humidity).\n• Alert on after-hours physical access." },
            "DE.CM-03": { name: "Personnel Activity Monitored", guidance: "Personnel activity is monitored for anomalies using user behavior analytics.\n\n• Implement a UEBA solution.\n• Monitor privileged user activity closely.\n• Alert on policy violations and anomalous logins." },
            "DE.CM-06": { name: "External Service Provider Activity Monitored", guidance: "External service provider activity is monitored for compliance.\n\n• Log and review third-party access sessions.\n• Require vendors to report security events.\n• Audit vendor activity quarterly." },
            "DE.CM-09": { name: "Computing Hardware & Software Monitored", guidance: "Computing hardware and software activities are monitored for anomalies.\n\n• Deploy EDR on all endpoints.\n• Alert on new processes, drivers, or registry changes.\n• Monitor software inventory changes in real-time." },

            // DETECT - Adverse Event Analysis
            "DE.AE-02": { name: "Potentially Adverse Events Analyzed", guidance: "Potentially adverse events are analyzed to understand attack targets and methods.\n\n• Triage all security alerts within defined SLAs.\n• Correlate events across multiple log sources.\n• Tag events by MITRE ATT&CK technique." },
            "DE.AE-03": { name: "Information Correlated from Multiple Sources", guidance: "Information is correlated from multiple sources to understand attacks.\n\n• Integrate SIEM with threat intelligence platforms.\n• Correlate endpoint, network, and cloud telemetry.\n• Build detection rules based on real-world TTPs." },
            "DE.AE-04": { name: "Estimated Impact of Adverse Events", guidance: "The estimated impact and scope of adverse events is understood.\n\n• Classify events by severity and potential impact.\n• Estimate affected assets and data.\n• Update classification as investigations progress." },
            "DE.AE-06": { name: "Information on Adverse Events Shared", guidance: "Information about adverse events is provided to authorized staff.\n\n• Distribute alerts to relevant teams promptly.\n• Use ticket-based workflows for tracking.\n• Produce executive summaries for leadership." },
            "DE.AE-07": { name: "Cyber Intelligence Integrated into Analysis", guidance: "Cyber threat intelligence is integrated into adversarial event analysis.\n\n• Consume threat feeds in SIEM rules.\n• Cross-reference indicators of compromise (IoCs).\n• Pivot from indicators to broader threat actor profiles." },
            "DE.AE-08": { name: "Incidents Declared Based on Criteria", guidance: "Incidents are declared when adverse events meet defined criteria.\n\n• Define clear incident declaration thresholds.\n• Assign severity levels (P1-P4).\n• Document escalation and notification procedures." },

            // RESPOND - Incident Management
            "RS.MA-01": { name: "Incident Response Plan Execution", guidance: "The incident response plan is executed and maintained.\n\n• Activate IR plan immediately upon declaration.\n• Follow pre-defined playbooks for common incident types.\n• Test the plan at least annually." },
            "RS.MA-02": { name: "Incident Reports Triaged", guidance: "Incident reports are triaged to ensure timely handling.\n\n• Establish SLAs for triage (e.g. P1 within 15 min).\n• Use a dedicated ticket queue for security incidents.\n• Assign incident coordinators for each event." },
            "RS.MA-03": { name: "Incidents Categorized & Prioritized", guidance: "Incidents are categorized and prioritized to guide response.\n\n• Use a severity matrix based on impact and urgency.\n• Maintain a priority queue in the IR ticketing system.\n• Escalate high-severity incidents to leadership immediately." },
            "RS.MA-04": { name: "Incidents Escalated", guidance: "Incidents with a notable impact are escalated to appropriate parties.\n\n• Define escalation thresholds in the IR plan.\n• Notify legal, PR, and senior leadership as needed.\n• Document all escalation decisions and timing." },
            "RS.MA-05": { name: "Incidents Contained", guidance: "Incidents are contained to prevent further damage.\n\n• Isolate affected systems from the network promptly.\n• Block malicious indicators at firewalls and proxies.\n• Preserve forensic evidence before remediation." },

            // RESPOND - Analysis
            "RS.AN-03": { name: "Analysis Performed to Understand Attacks", guidance: "Analysis is performed to establish root cause and understand the nature of attacks.\n\n• Perform root cause analysis (RCA) for all significant incidents.\n• Use forensic tools to reconstruct timelines.\n• Map attacks to MITRE ATT&CK framework." },
            "RS.AN-06": { name: "Actions Taken Catalogued", guidance: "Actions taken during an incident are catalogued for forensics.\n\n• Maintain a detailed incident log with timestamps.\n• Record all commands, actions, and decisions.\n• Store logs in a tamper-evident location." },
            "RS.AN-07": { name: "Search for Incidents Undetected", guidance: "Cause and extent of an incident is understood by hunting for undetected activity.\n\n• Conduct threat hunting after major incidents.\n• Search for signs of lateral movement or persistence.\n• Hunt using IOCs and TTPs from the incident." },
            "RS.AN-08": { name: "Magnitude of Incident Estimated", guidance: "The magnitude of incidents is estimated and validated.\n\n• Count affected systems, users, and data records.\n• Estimate business impact in hours of downtime and cost.\n• Update impact estimates as investigation progresses." },

            // RESPOND - Mitigation
            "RS.MI-01": { name: "Incidents Contained for Limiting Impact", guidance: "Incidents are contained, mitigated, and newly identified vulnerabilities mitigated.\n\n• Apply emergency patches or workarounds.\n• Remove attacker persistence mechanisms.\n• Monitor for re-infection after remediation." },
            "RS.MI-02": { name: "Incidents Eradicated", guidance: "Incidents are eradicated and systems restored to a known good state.\n\n• Rebuild or re-image compromised systems.\n• Verify integrity of restored systems.\n• Rescan for vulnerabilities after recovery." },

            // RESPOND - Communication
            "RS.CO-02": { name: "Personnel Notified of Incident", guidance: "Internal stakeholders are notified of incidents in a timely manner.\n\n• Define notification trees by incident severity.\n• Use out-of-band communication channels (e.g. phone).\n• Document time and method of notifications." },
            "RS.CO-03": { name: "Information Shared Externally", guidance: "Information is shared with external partners per incident response plans.\n\n• Report to regulators within required timeframes (e.g. 72 hrs for GDPR).\n• Notify affected customers and partners as required.\n• Coordinate disclosures with legal and PR teams." },

            // RECOVER - Recovery Planning
            "RC.RP-01": { name: "Recovery Plan in Place", guidance: "A recovery plan is in place and executed during or after a cybersecurity incident.\n\n• Document recovery procedures for critical systems.\n• Test the plan at least once per year.\n• Assign recovery roles and responsibilities." },
            "RC.RP-02": { name: "Recovery Strategy Selection", guidance: "Recovery strategies are selected to restore operations effectively.\n\n• Define recovery strategies per system criticality.\n• Include warm/cold standby options for critical services.\n• Align strategy to RTO and RPO objectives." },
            "RC.RP-03": { name: "Recovery Steps Execution", guidance: "Recovery steps are executed to restore systems and services.\n\n• Follow documented recovery runbooks.\n• Validate system integrity before restoring services.\n• Communicate restoration status to stakeholders." },

            // RECOVER - Restoration
            "RC.RS-01": { name: "Restoration of Affected Systems", guidance: "The integrity of backups and assets is verified and restoration is performed.\n\n• Restore from last-known-good backups.\n• Verify checksums before deploying restored systems.\n• Perform smoke tests after restoration." },
            "RC.RS-02": { name: "Selection of Assets for Restoration", guidance: "Selection of restoration actions is based on asset criticality and integrity.\n\n• Prioritize restoration of business-critical systems.\n• Use asset classification to guide order of recovery.\n• Document restoration sequence decisions." },
            "RC.RS-03": { name: "Restoration Accomplishment Verified", guidance: "The accuracy of restoration is verified and communicated.\n\n• Run functional tests post-restoration.\n• Get sign-off from system owners before going live.\n• Document restoration completion and outcomes." },
            "RC.RS-04": { name: "Security Measures Reinstated", guidance: "Critical assets are verified as secure after restoration.\n\n• Re-apply all security controls after recovery.\n• Rescan systems for vulnerabilities.\n• Confirm logging and monitoring are active." },

            // RECOVER - Communication
            "RC.CO-03": { name: "Recovery Activities Communicated", guidance: "Recovery activities are communicated to internal and external stakeholders.\n\n• Provide regular status updates during recovery.\n• Use predefined templates for communications.\n• Archive all communications for audit purposes." },
            "RC.CO-04": { name: "Public Communications Coordinated", guidance: "Public communications about the recovery are coordinated with leadership.\n\n• Align external statements with PR and legal.\n• Avoid speculative or premature disclosures.\n• Issue a formal post-incident summary when appropriate." }
        },
        nistTiers: {
            1: { name: "Partial", description: "Cybersecurity risk management is not formalized; risk is managed in an ad hoc and sometimes reactive manner." },
            2: { name: "Risk Informed", description: "Risk management practices are approved by management but may not be established as organizational-wide policy." },
            3: { name: "Repeatable", description: "The organization's risk management practices are formally approved and expressed as policy." },
            4: { name: "Adaptive", description: "The organization adapts its cybersecurity practices based on lessons learned and predictive indicators." }
        },
        history: []
    };

    // ── PERSISTENCE ────────────────────────────────────────────────────────────
    // projectId is NOT read from useParams() here because AssessmentProvider
    // sits above <Routes> in App.jsx — useParams() would always return undefined.
    // Instead, DashboardLayout calls setActiveProject(id) once it's inside the route.
    const [projectId, setProjectId] = useState(null);
    const setActiveProject = useCallback((id) => {
        setProjectId(prev => prev === id ? prev : id);
    }, []);

    const getLocalKey = useCallback(() => `${LOCAL_KEY}_${projectId}`, [projectId]);


    // 1. Initialize from localStorage so the first render already has data.
    const [assessmentData, setAssessmentData] = useState(() => {
        if (!projectId) return emptyAssessment;
        try {
            const cached = localStorage.getItem(`${LOCAL_KEY}_${projectId}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                return {
                    ...emptyAssessment,
                    functions: parsed.functions || emptyAssessment.functions,
                    overallMaturity: parsed.overallMaturity ?? 0,
                    completionRate: parsed.completionRate ?? 0,
                };
            }
        } catch (_) { }
        return emptyAssessment;
    });

    // 2. On mount or project change, fetch the authoritative state from the backend and sync.
    useEffect(() => {
        if (!projectId) return;

        // Reset to local cache or empty first to avoid showing old project data
        try {
            const cached = localStorage.getItem(getLocalKey());
            if (cached) {
                const parsed = JSON.parse(cached);
                setAssessmentData({
                    ...emptyAssessment,
                    functions: parsed.functions || emptyAssessment.functions,
                    overallMaturity: parsed.overallMaturity ?? 0,
                    completionRate: parsed.completionRate ?? 0,
                });
            } else {
                setAssessmentData(emptyAssessment);
            }
        } catch (_) {
            setAssessmentData(emptyAssessment);
        }

        const headers = authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {};

        fetch(`${API_BASE}/api/projects/${projectId}`, { headers })
            .then(r => {
                if (!r.ok) {
                    console.warn(`[AssessmentContext] Backend returned ${r.status} for project ${projectId}. Keeping local cache.`);
                    return null;
                }
                return r.json();
            })
            .then(data => {
                if (!data) return; // non-OK response
                if (data && data.functions && Object.keys(data.functions).length > 0) {
                    setAssessmentData(prev => ({
                        ...prev,
                        functions: data.functions,
                        overallMaturity: data.overallMaturity ?? prev.overallMaturity,
                        completionRate: data.completionRate ?? prev.completionRate,
                    }));
                    // Also update the local cache with the canonical backend data
                    try { localStorage.setItem(getLocalKey(), JSON.stringify(data)); } catch (_) { }
                }
            })
            .catch((err) => { console.warn('[AssessmentContext] Backend unreachable, keeping localStorage cache:', err); });

    }, [projectId, getLocalKey, authState.token]);

    const login = async (username, password) => {
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
                const newAuth = { user: { username }, token: data.access_token };
                setAuthState(newAuth);
                localStorage.setItem('nist_auth', JSON.stringify(newAuth));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    };

    const logout = () => {
        setAuthState({ user: null, token: null });
        localStorage.removeItem('nist_auth');
    };

    // 3. Whenever scores change, persist to both localStorage (fast) and backend (debounced).
    const initDone = useRef(false);
    const saveTimer = useRef(null);
    useEffect(() => { initDone.current = true; }, []);

    useEffect(() => {
        if (!initDone.current || !projectId || !assessmentData) return;
        const toSave = {
            functions: assessmentData.functions,
            overallMaturity: assessmentData.overallMaturity,
            completionRate: assessmentData.completionRate,
        };
        // Update localStorage instantly (no page refresh risk)
        try { localStorage.setItem(getLocalKey(), JSON.stringify(toSave)); } catch (_) { }
        const headers = {
            'Content-Type': 'application/json',
            ...(authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {})
        };

        saveTimer.current = setTimeout(() => {
            fetch(`${API_BASE}/api/projects/${projectId}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(toSave),
            }).catch(() => { /* silent fail — data still safe in localStorage */ });
        }, 1000);
    }, [assessmentData, projectId, getLocalKey, authState.token]);


    const updateFunctionScore = (funcName, score, progress) => {
        setAssessmentData(prev => ({
            ...prev,
            functions: {
                ...prev.functions,
                [funcName]: {
                    ...prev.functions[funcName],
                    score,
                    progress
                }
            }
        }));
    };

    const updateCategoryScore = (funcName, categoryName, score) => {
        setAssessmentData(prev => {
            const currentFunc = prev.functions[funcName];
            if (!currentFunc || !currentFunc.categories[categoryName]) return prev;

            return {
                ...prev,
                functions: {
                    ...prev.functions,
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
            };
        });
    };

    const updateSubCategoryScore = (funcName, categoryName, subCatId, score) => {
        setAssessmentData(prev => {
            const currentFunc = prev.functions[funcName];
            if (!currentFunc || !currentFunc.categories[categoryName]) return prev;
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
                ...prev.functions,
                [funcName]: {
                    ...currentFunc,
                    score: newFuncScore,
                    categories: newCategories
                }
            });
            const allFuncScores = allFuncs.map(f => f.score || 0);
            const globalMaturity = allFuncScores.reduce((a, b) => a + b, 0) / allFuncScores.length;

            // Completion Rate: percentage of subcategories with score > 0
            const allSubcategories = [];
            allFuncs.forEach(f => {
                Object.values(f.categories).forEach(c => {
                    allSubcategories.push(...Object.values(c.subcategories));
                });
            });
            const completedCount = allSubcategories.filter(s => s > 0).length;
            const completionRate = Math.round((completedCount / allSubcategories.length) * 100);

            return {
                ...prev,
                overallMaturity: globalMaturity,
                completionRate: completionRate,
                functions: {
                    ...prev.functions,
                    [funcName]: {
                        ...currentFunc,
                        score: newFuncScore,
                        categories: newCategories
                    }
                }
            };
        });
    };

    const updateSubCategoryComment = (funcName, categoryName, subLabel, comment) => {
        setAssessmentData(prev => {
            if (!prev) return prev;

            const currentFunc = prev.functions[funcName];
            if (!currentFunc) return prev;

            const currentCat = currentFunc.categories[categoryName];
            if (!currentCat) return prev;

            return {
                ...prev,
                functions: {
                    ...prev.functions,
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
            };
        });
    };

    const addChatMessage = (msg) => {
        setAssessmentData(prev => ({
            ...prev,
            history: [...(prev?.history || []), msg]
        }));
    };

    const clearChatHistory = () => {
        setAssessmentData(prev => ({
            ...prev,
            history: []
        }));
    };

    return (
        <AssessmentContext.Provider value={{
            authState, login, logout,
            activeWorkflowId, setActiveWorkflowId,
            assessmentData, setAssessmentData,
            setActiveProject,
            updateFunctionScore,
            updateCategoryScore,
            updateSubCategoryScore,
            updateSubCategoryComment,
            addChatMessage,
            clearChatHistory
        }}>
            {children}
        </AssessmentContext.Provider>
    );
}

export function useAssessment() {
    return useContext(AssessmentContext);
}
