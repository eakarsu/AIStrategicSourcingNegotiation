require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();
  try {
    // Drop and recreate tables
    await client.query(`
      DROP TABLE IF EXISTS notes CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS activity_log CASCADE;
      DROP TABLE IF EXISTS category_strategies CASCADE;
      DROP TABLE IF EXISTS approval_workflows CASCADE;
      DROP TABLE IF EXISTS performance_scorecards CASCADE;
      DROP TABLE IF EXISTS market_intelligence CASCADE;
      DROP TABLE IF EXISTS auctions CASCADE;
      DROP TABLE IF EXISTS compliance_records CASCADE;
      DROP TABLE IF EXISTS risk_assessments CASCADE;
      DROP TABLE IF EXISTS savings_tracker CASCADE;
      DROP TABLE IF EXISTS spend_analytics CASCADE;
      DROP TABLE IF EXISTS suppliers CASCADE;
      DROP TABLE IF EXISTS contracts CASCADE;
      DROP TABLE IF EXISTS negotiation_points CASCADE;
      DROP TABLE IF EXISTS cost_models CASCADE;
      DROP TABLE IF EXISTS bids CASCADE;
      DROP TABLE IF EXISTS rfp_requests CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(100) DEFAULT 'procurement_specialist',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE rfp_requests (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        category VARCHAR(255),
        description TEXT,
        requirements TEXT,
        budget_range VARCHAR(255),
        deadline DATE,
        evaluation_criteria TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE bids (
        id SERIAL PRIMARY KEY,
        rfp_title VARCHAR(500),
        vendor_name VARCHAR(255) NOT NULL,
        bid_amount DECIMAL(15,2),
        delivery_timeline VARCHAR(255),
        technical_score DECIMAL(5,2),
        commercial_score DECIMAL(5,2),
        compliance_score DECIMAL(5,2),
        vendor_experience TEXT,
        warranty_terms TEXT,
        payment_terms TEXT,
        status VARCHAR(50) DEFAULT 'submitted',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE cost_models (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(500) NOT NULL,
        category VARCHAR(255),
        material_cost DECIMAL(15,2),
        labor_cost DECIMAL(15,2),
        overhead_cost DECIMAL(15,2),
        logistics_cost DECIMAL(15,2),
        margin_percentage DECIMAL(5,2),
        market_price DECIMAL(15,2),
        target_price DECIMAL(15,2),
        volume INTEGER,
        unit VARCHAR(50),
        supplier VARCHAR(255),
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE negotiation_points (
        id SERIAL PRIMARY KEY,
        negotiation_title VARCHAR(500) NOT NULL,
        vendor_name VARCHAR(255),
        category VARCHAR(255),
        our_position TEXT,
        vendor_position TEXT,
        batna TEXT,
        target_outcome TEXT,
        leverage_points TEXT,
        risk_factors TEXT,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'preparation',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE suppliers (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(500) NOT NULL,
        contact_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        category VARCHAR(255),
        rating DECIMAL(3,2),
        certifications TEXT,
        annual_revenue DECIMAL(15,2),
        employee_count INTEGER,
        years_in_business INTEGER,
        payment_terms VARCHAR(255),
        quality_score DECIMAL(5,2),
        delivery_score DECIMAL(5,2),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE spend_analytics (
        id SERIAL PRIMARY KEY,
        spend_category VARCHAR(255),
        department VARCHAR(255),
        vendor_name VARCHAR(255),
        amount DECIMAL(15,2),
        period VARCHAR(100),
        fiscal_year INTEGER,
        budget_allocated DECIMAL(15,2),
        variance_percentage DECIMAL(5,2),
        transaction_count INTEGER,
        contract_reference VARCHAR(255),
        cost_center VARCHAR(255),
        payment_method VARCHAR(100),
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(50) DEFAULT 'tracked',
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE savings_tracker (
        id SERIAL PRIMARY KEY,
        initiative_name VARCHAR(500),
        category VARCHAR(255),
        vendor_name VARCHAR(255),
        original_cost DECIMAL(15,2),
        negotiated_cost DECIMAL(15,2),
        savings_amount DECIMAL(15,2),
        savings_percentage DECIMAL(5,2),
        savings_type VARCHAR(100),
        implementation_date DATE,
        validation_status VARCHAR(50) DEFAULT 'pending',
        department VARCHAR(255),
        fiscal_year INTEGER,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE risk_assessments (
        id SERIAL PRIMARY KEY,
        assessment_title VARCHAR(500),
        vendor_name VARCHAR(255),
        risk_category VARCHAR(100),
        risk_level VARCHAR(50),
        probability DECIMAL(5,2),
        impact_score DECIMAL(5,2),
        risk_score DECIMAL(5,2),
        description TEXT,
        mitigation_strategy TEXT,
        contingency_plan TEXT,
        owner VARCHAR(255),
        review_date DATE,
        status VARCHAR(50) DEFAULT 'identified',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE compliance_records (
        id SERIAL PRIMARY KEY,
        requirement_name VARCHAR(500),
        regulation_type VARCHAR(100),
        vendor_name VARCHAR(255),
        compliance_status VARCHAR(50) DEFAULT 'under_review',
        last_audit_date DATE,
        next_audit_date DATE,
        audit_findings TEXT,
        corrective_actions TEXT,
        documentation_status VARCHAR(50) DEFAULT 'pending',
        risk_rating VARCHAR(50) DEFAULT 'medium',
        responsible_party VARCHAR(255),
        evidence_links TEXT,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE auctions (
        id SERIAL PRIMARY KEY,
        auction_title VARCHAR(500),
        category VARCHAR(255),
        auction_type VARCHAR(50),
        description TEXT,
        starting_price DECIMAL(15,2),
        reserve_price DECIMAL(15,2),
        current_best_bid DECIMAL(15,2),
        number_of_bidders INTEGER,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        bid_decrement DECIMAL(15,2),
        auto_extend BOOLEAN DEFAULT true,
        winning_vendor VARCHAR(255),
        items_description TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE market_intelligence (
        id SERIAL PRIMARY KEY,
        report_title VARCHAR(500),
        commodity VARCHAR(255),
        market_segment VARCHAR(255),
        current_price DECIMAL(15,2),
        price_trend VARCHAR(50),
        price_change_pct DECIMAL(5,2),
        supply_outlook VARCHAR(50),
        demand_outlook VARCHAR(50),
        key_drivers TEXT,
        competitor_activity TEXT,
        forecast_summary TEXT,
        data_source VARCHAR(255),
        report_date DATE,
        region VARCHAR(255),
        impact_assessment TEXT,
        status VARCHAR(50) DEFAULT 'current',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE performance_scorecards (
        id SERIAL PRIMARY KEY,
        vendor_name VARCHAR(255),
        evaluation_period VARCHAR(100),
        overall_score DECIMAL(5,2),
        quality_score DECIMAL(5,2),
        delivery_score DECIMAL(5,2),
        cost_score DECIMAL(5,2),
        responsiveness_score DECIMAL(5,2),
        innovation_score DECIMAL(5,2),
        compliance_score DECIMAL(5,2),
        defect_rate DECIMAL(5,2),
        on_time_delivery_pct DECIMAL(5,2),
        cost_variance_pct DECIMAL(5,2),
        corrective_actions TEXT,
        improvement_plan TEXT,
        evaluator VARCHAR(255),
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE approval_workflows (
        id SERIAL PRIMARY KEY,
        request_title VARCHAR(500),
        request_type VARCHAR(100),
        requestor VARCHAR(255),
        department VARCHAR(255),
        amount DECIMAL(15,2),
        justification TEXT,
        current_approver VARCHAR(255),
        approval_chain TEXT,
        current_step INTEGER DEFAULT 1,
        total_steps INTEGER DEFAULT 3,
        priority VARCHAR(50) DEFAULT 'medium',
        due_date DATE,
        comments TEXT,
        attachments TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE category_strategies (
        id SERIAL PRIMARY KEY,
        category_name VARCHAR(255),
        category_owner VARCHAR(255),
        annual_spend DECIMAL(15,2),
        number_of_suppliers INTEGER,
        strategic_importance VARCHAR(50),
        supply_risk VARCHAR(50),
        sourcing_strategy VARCHAR(100),
        current_state TEXT,
        target_state TEXT,
        key_initiatives TEXT,
        savings_target_pct DECIMAL(5,2),
        timeline VARCHAR(255),
        stakeholders TEXT,
        market_dynamics TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE contracts (
        id SERIAL PRIMARY KEY,
        contract_title VARCHAR(500) NOT NULL,
        vendor_name VARCHAR(255),
        contract_type VARCHAR(255),
        start_date DATE,
        end_date DATE,
        total_value DECIMAL(15,2),
        payment_schedule TEXT,
        terms_conditions TEXT,
        sla_terms TEXT,
        termination_clause TEXT,
        renewal_terms TEXT,
        governing_law VARCHAR(255),
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        entity_type VARCHAR(100) NOT NULL,
        entity_id INTEGER,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(500) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        link VARCHAR(500),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE notes (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tables created successfully');

    // Seed users
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
      ('Sarah Chen', 'sarah@company.com', $1, 'procurement_manager'),
      ('James Wilson', 'james@company.com', $1, 'procurement_specialist'),
      ('Maria Garcia', 'maria@company.com', $1, 'senior_buyer'),
      ('Admin User', 'admin@company.com', $1, 'admin')
    `, [hash]);
    console.log('Users seeded');

    // Seed RFP Requests (15 items)
    await client.query(`
      INSERT INTO rfp_requests (title, category, description, requirements, budget_range, deadline, evaluation_criteria, status, created_by) VALUES
      ('Enterprise Cloud Infrastructure Migration', 'IT Infrastructure', 'Complete migration of on-premise infrastructure to cloud-based solutions including compute, storage, and networking.', 'Multi-cloud support, 99.99% uptime SLA, data encryption at rest and in transit, compliance with SOC2 and HIPAA', '$500K - $2M', '2026-06-30', 'Technical capability 30%, Price 25%, Experience 20%, Support 15%, Security 10%', 'published', 1),
      ('Office Furniture Procurement Q3 2026', 'Facilities', 'Procurement of ergonomic office furniture for new headquarters expansion covering 3 floors.', 'Ergonomic certified, sustainable materials, 10-year warranty, bulk delivery capability', '$200K - $500K', '2026-05-15', 'Quality 35%, Price 30%, Sustainability 20%, Delivery 15%', 'published', 1),
      ('Fleet Management Software Solution', 'Software', 'Comprehensive fleet management system for 500+ vehicle fleet including GPS tracking, maintenance scheduling, and fuel management.', 'Real-time GPS tracking, mobile app, API integration, predictive maintenance, fuel card integration', '$100K - $300K', '2026-07-01', 'Functionality 30%, Ease of use 25%, Price 20%, Support 15%, Integration 10%', 'draft', 2),
      ('Industrial Raw Materials - Steel Supply', 'Raw Materials', 'Annual contract for structural steel supply for manufacturing operations across 5 plants.', 'Grade A36 and A572 steel, JIT delivery, quality certificates, volume flexibility ±20%', '$5M - $10M', '2026-04-30', 'Price 35%, Quality 25%, Reliability 20%, Flexibility 20%', 'published', 1),
      ('Cybersecurity Assessment Services', 'Professional Services', 'Comprehensive cybersecurity assessment including penetration testing, vulnerability assessment, and compliance audit.', 'CREST certified testers, OWASP methodology, quarterly assessments, 24/7 incident response', '$150K - $400K', '2026-05-30', 'Expertise 35%, Methodology 25%, Price 20%, Response time 20%', 'published', 3),
      ('Corporate Travel Management Program', 'Travel Services', 'End-to-end corporate travel management for 2000+ employees including booking, expense management, and policy enforcement.', 'Online booking tool, mobile app, 24/7 support, negotiated airline rates, duty of care', '$1M - $3M', '2026-08-15', 'Service quality 30%, Technology 25%, Price 25%, Global coverage 20%', 'draft', 2),
      ('Warehouse Automation Equipment', 'Manufacturing', 'Automated storage and retrieval systems for 200,000 sq ft distribution center modernization.', 'AS/RS systems, conveyor integration, WMS compatibility, 99.5% accuracy rate', '$2M - $5M', '2026-09-01', 'Technology 30%, ROI 25%, Reliability 25%, Support 20%', 'published', 1),
      ('Employee Benefits Administration', 'HR Services', 'Full-service benefits administration platform for health insurance, 401k, and wellness programs.', 'Self-service portal, ACA compliance, multi-carrier integration, analytics dashboard', '$200K - $600K', '2026-06-15', 'Compliance 30%, User experience 25%, Price 20%, Integration 25%', 'published', 3),
      ('Packaging Materials Supply Agreement', 'Packaging', 'Sustainable packaging materials for consumer products including corrugated boxes, protective packaging, and labels.', 'FSC certified, minimum 80% recycled content, custom printing, 48-hour turnaround', '$800K - $1.5M', '2026-05-01', 'Sustainability 30%, Price 25%, Quality 25%, Lead time 20%', 'draft', 2),
      ('Data Analytics Platform Implementation', 'IT Software', 'Enterprise data analytics platform with BI dashboards, predictive analytics, and data governance tools.', 'Cloud-native, real-time processing, drag-and-drop interface, role-based access, API connectors', '$300K - $800K', '2026-07-30', 'Capability 30%, Scalability 25%, Price 20%, Support 25%', 'published', 1),
      ('Commercial HVAC System Replacement', 'Facilities', 'Replacement of HVAC systems across 8 office buildings totaling 400,000 sq ft.', 'Energy Star certified, smart controls, predictive maintenance, 15-year warranty', '$1.5M - $3M', '2026-08-01', 'Energy efficiency 30%, Price 25%, Warranty 25%, Installation timeline 20%', 'published', 3),
      ('Logistics & Freight Services', 'Logistics', 'Multi-modal freight and logistics services covering domestic and international shipments.', 'Door-to-door tracking, customs brokerage, temperature controlled, hazmat certified', '$3M - $8M', '2026-06-01', 'Reliability 30%, Price 25%, Coverage 25%, Technology 20%', 'published', 1),
      ('Laboratory Equipment Procurement', 'Scientific', 'Procurement of analytical laboratory equipment for R&D facility expansion.', 'ISO 17025 calibration, validation documentation, training included, service contracts', '$500K - $1.2M', '2026-09-15', 'Accuracy 30%, Reliability 25%, Price 20%, Service 25%', 'draft', 2),
      ('Managed Print Services', 'IT Services', 'Enterprise managed print services for 50 locations with 800+ devices.', 'Fleet optimization, automatic toner replenishment, secure printing, usage analytics', '$400K - $700K', '2026-05-30', 'Cost per page 30%, Reliability 25%, Service 25%, Security 20%', 'published', 3),
      ('Catering Services for Corporate Events', 'Food Services', 'Premium catering services for corporate events, board meetings, and employee appreciation events.', 'Diverse menu options, dietary accommodations, sustainable sourcing, professional service staff', '$150K - $350K', '2026-04-15', 'Quality 35%, Presentation 25%, Price 20%, Flexibility 20%', 'published', 1),
      ('Telecommunications Infrastructure Upgrade', 'Telecom', 'Upgrade of enterprise telecommunications including VoIP, unified communications, and network infrastructure.', 'SIP trunking, video conferencing, contact center integration, SD-WAN capable', '$600K - $1.5M', '2026-07-15', 'Technology 30%, Reliability 25%, Price 25%, Migration support 20%', 'draft', 2)
    `);
    console.log('RFP requests seeded (16 items)');

    // Seed Bids (15 items)
    await client.query(`
      INSERT INTO bids (rfp_title, vendor_name, bid_amount, delivery_timeline, technical_score, commercial_score, compliance_score, vendor_experience, warranty_terms, payment_terms, status, created_by) VALUES
      ('Enterprise Cloud Migration', 'CloudTech Solutions', 1250000.00, '6 months', 92.50, 88.00, 95.00, '15 years cloud infrastructure, 200+ enterprise migrations, AWS/Azure/GCP certified', '3-year comprehensive warranty with 24/7 support', 'Net 30, 20% upfront, milestone-based payments', 'under_review', 1),
      ('Enterprise Cloud Migration', 'SkyScale Inc', 980000.00, '8 months', 85.00, 92.00, 90.00, '10 years in cloud services, 150+ migrations, specializing in hybrid cloud', '2-year warranty with business hours support', 'Net 45, 30% upfront, quarterly payments', 'submitted', 1),
      ('Enterprise Cloud Migration', 'NexGen Cloud', 1450000.00, '5 months', 96.00, 82.00, 97.00, '20 years IT infrastructure, Fortune 500 clients, full-stack cloud capability', '5-year premium warranty with dedicated support team', 'Net 30, 15% upfront, milestone-based', 'under_review', 1),
      ('Office Furniture Procurement', 'ErgoWorks Global', 380000.00, '8 weeks', 90.00, 85.00, 92.00, '25 years in commercial furniture, BIFMA certified, sustainability leader', '10-year structural, 5-year upholstery', 'Net 30, 50% on order, 50% on delivery', 'submitted', 2),
      ('Office Furniture Procurement', 'ModernSpace Furniture', 320000.00, '10 weeks', 82.00, 91.00, 88.00, '12 years commercial furniture, GSA contract holder', '7-year warranty, fabric protection plan', 'Net 45, 40% deposit', 'submitted', 2),
      ('Fleet Management Software', 'FleetMaster Pro', 185000.00, '3 months', 94.00, 87.00, 93.00, '18 years fleet technology, 50K+ vehicles managed, patented algorithms', 'SaaS - continuous updates included', 'Annual subscription, Net 30', 'under_review', 2),
      ('Fleet Management Software', 'VehicleTrack Systems', 145000.00, '4 months', 86.00, 93.00, 85.00, '8 years fleet management, strong mobile platform', 'Standard SaaS terms with 99.9% uptime', 'Monthly subscription, auto-renewal', 'submitted', 2),
      ('Steel Supply Contract', 'GlobalSteel Corp', 7500000.00, '12 months rolling', 88.00, 90.00, 94.00, '40 years steel manufacturing, ISO 9001, capacity 500K tons/year', 'Material defect replacement within 48 hours', 'Net 60, monthly invoicing', 'shortlisted', 1),
      ('Steel Supply Contract', 'PremiumMetals Inc', 8200000.00, '12 months rolling', 95.00, 84.00, 96.00, '35 years, premium grade specialist, zero-defect program', 'Full replacement + consequential damages coverage', 'Net 45, bi-weekly invoicing', 'submitted', 1),
      ('Steel Supply Contract', 'IronBridge Supply', 6800000.00, '12 months rolling', 82.00, 95.00, 88.00, '15 years, competitive pricing leader, 3 domestic mills', 'Standard material warranty, 30-day claims', 'Net 30, monthly invoicing', 'shortlisted', 1),
      ('Cybersecurity Assessment', 'CyberShield Associates', 280000.00, '6 months', 96.00, 86.00, 98.00, 'CREST certified, 500+ assessments, former NSA analysts', 'Reassessment guarantee if critical vulnerabilities missed', 'Quarterly payments, Net 30', 'under_review', 3),
      ('Cybersecurity Assessment', 'SecureNet Partners', 220000.00, '6 months', 88.00, 92.00, 90.00, '12 years cybersecurity consulting, CISSP team', 'Standard professional services warranty', 'Monthly retainer, Net 30', 'submitted', 3),
      ('Warehouse Automation', 'AutoStore Systems', 3800000.00, '9 months', 95.00, 85.00, 93.00, 'Global leader in AS/RS, 800+ installations worldwide', '5-year parts and labor, preventive maintenance included', '30% upfront, milestone payments, Net 30', 'shortlisted', 1),
      ('Warehouse Automation', 'RoboLogistics Inc', 3200000.00, '12 months', 88.00, 92.00, 90.00, '10 years automation, strong integration capabilities', '3-year warranty with optional extension', '25% upfront, quarterly payments', 'submitted', 1),
      ('Data Analytics Platform', 'DataViz Enterprise', 520000.00, '4 months', 93.00, 88.00, 91.00, '15 years BI solutions, 300+ enterprise deployments', 'SaaS subscription with continuous updates', 'Annual license, Net 30', 'under_review', 1),
      ('Data Analytics Platform', 'InsightHub Analytics', 450000.00, '5 months', 87.00, 93.00, 88.00, '8 years, modern cloud-native architecture, AI-powered', 'Standard SaaS terms', 'Monthly or annual subscription', 'submitted', 1)
    `);
    console.log('Bids seeded (16 items)');

    // Seed Cost Models (15 items)
    await client.query(`
      INSERT INTO cost_models (product_name, category, material_cost, labor_cost, overhead_cost, logistics_cost, margin_percentage, market_price, target_price, volume, unit, supplier, status, created_by) VALUES
      ('Structural Steel Beams (W8x31)', 'Raw Materials', 420.00, 85.00, 65.00, 45.00, 15.00, 780.00, 680.00, 5000, 'tons', 'GlobalSteel Corp', 'approved', 1),
      ('Industrial Servo Motors', 'Components', 180.00, 45.00, 35.00, 20.00, 22.00, 420.00, 340.00, 2000, 'units', 'MotorTech Industries', 'draft', 2),
      ('Custom PCB Assemblies', 'Electronics', 25.00, 18.00, 12.00, 5.00, 30.00, 95.00, 78.00, 50000, 'units', 'CircuitPro Manufacturing', 'approved', 1),
      ('Hydraulic Cylinders (Heavy Duty)', 'Components', 320.00, 120.00, 80.00, 35.00, 18.00, 750.00, 655.00, 1000, 'units', 'HydraForce Systems', 'under_review', 3),
      ('Corrugated Packaging (Custom)', 'Packaging', 0.85, 0.35, 0.25, 0.15, 25.00, 2.50, 2.00, 500000, 'units', 'PackRight Solutions', 'approved', 2),
      ('Stainless Steel Fasteners Kit', 'Hardware', 12.00, 3.50, 2.80, 1.50, 35.00, 32.00, 26.73, 100000, 'kits', 'FastenAll Supply', 'draft', 1),
      ('Industrial Lubricants (Synthetic)', 'Chemicals', 8.50, 2.00, 3.00, 2.50, 28.00, 25.00, 20.51, 20000, 'gallons', 'ChemLub International', 'approved', 3),
      ('Carbon Fiber Composite Sheets', 'Advanced Materials', 85.00, 35.00, 25.00, 15.00, 20.00, 220.00, 200.00, 3000, 'sheets', 'CompositeTech Corp', 'under_review', 1),
      ('LED Industrial Lighting Fixtures', 'Electrical', 45.00, 15.00, 10.00, 8.00, 25.00, 120.00, 97.50, 10000, 'units', 'BrightWay Lighting', 'approved', 2),
      ('Precision Bearings (Class 5)', 'Components', 28.00, 8.00, 6.00, 3.00, 30.00, 72.00, 58.50, 25000, 'units', 'BearingPro GmbH', 'draft', 1),
      ('Safety PPE Kits (Complete)', 'Safety', 35.00, 5.00, 8.00, 4.00, 35.00, 85.00, 70.27, 15000, 'kits', 'SafetyFirst Supply', 'approved', 3),
      ('Aluminum Extrusion Profiles', 'Raw Materials', 3.50, 1.20, 0.80, 0.50, 20.00, 8.50, 7.50, 200000, 'meters', 'AlumCraft Industries', 'approved', 1),
      ('Industrial Rubber Gaskets', 'Sealing', 2.20, 0.80, 0.60, 0.30, 28.00, 6.00, 4.99, 75000, 'units', 'SealTech Rubber', 'under_review', 2),
      ('Welding Consumables (MIG Wire)', 'Consumables', 1.80, 0.20, 0.30, 0.40, 32.00, 4.50, 3.97, 50000, 'kg', 'WeldSupply Pro', 'draft', 1),
      ('Thermal Insulation Panels', 'Building Materials', 18.00, 6.00, 4.00, 5.00, 22.00, 48.00, 40.24, 8000, 'panels', 'InsulMax Corp', 'approved', 3),
      ('Pneumatic Actuators', 'Components', 95.00, 30.00, 20.00, 12.00, 25.00, 230.00, 196.25, 5000, 'units', 'AirTech Automation', 'draft', 2)
    `);
    console.log('Cost models seeded (16 items)');

    // Seed Negotiation Points (15 items)
    await client.query(`
      INSERT INTO negotiation_points (negotiation_title, vendor_name, category, our_position, vendor_position, batna, target_outcome, leverage_points, risk_factors, priority, status, created_by) VALUES
      ('Annual Steel Supply Contract Renewal', 'GlobalSteel Corp', 'Raw Materials', 'Seeking 8% price reduction based on increased volume commitment and market trends showing declining raw material costs', 'Vendor claims costs have increased 3% due to energy prices and will seek a price increase', 'Switch to IronBridge Supply who offered 12% lower pricing, or split volume between two suppliers', 'Achieve 5-8% cost reduction with improved delivery terms and quality guarantees', 'Volume increase of 20%, 3-year commitment, competitor quotes 10-15% lower, market indices declining', 'Supply disruption during transition, quality consistency with new supplier, relationship damage', 'high', 'in_progress', 1),
      ('Cloud Infrastructure Multi-Year Deal', 'CloudTech Solutions', 'IT Services', 'Lock in 3-year pricing with annual 5% reduction and expanded scope of services', 'Vendor wants annual price escalator of 3% and minimum commit increase', 'Migrate to multi-cloud strategy using AWS/Azure directly, or engage SkyScale as alternative', 'Fixed pricing for 3 years with performance-based credits and elastic scaling', 'Large deal size attracting executive attention, competitor proposals in hand, end of vendor fiscal year', 'Migration costs and business disruption, vendor lock-in, service degradation during contract disputes', 'high', 'preparation', 1),
      ('Office Furniture Bulk Purchase', 'ErgoWorks Global', 'Facilities', 'Seeking 15% volume discount on standard catalog pricing with free installation', 'Vendor offers 8% discount, installation at cost', 'ModernSpace Furniture has comparable products at 20% lower list price', 'Achieve 12-15% discount with installation included and extended warranty', 'Large one-time order value, potential for ongoing relationship, competing quotes available', 'Delivery delays affecting office opening, quality differences between vendors', 'medium', 'preparation', 2),
      ('Cybersecurity Services Scope Expansion', 'CyberShield Associates', 'Professional Services', 'Add continuous monitoring to existing assessment contract at 30% bundle discount', 'Vendor pricing continuous monitoring as separate engagement at full rate', 'SecureNet Partners offered bundled assessment + monitoring at 25% below CyberShield rates', 'Bundle assessment and monitoring with 25-30% total discount and dedicated analyst', 'Existing relationship and institutional knowledge, competitive bundle pricing in market', 'Knowledge transfer risk if switching, gaps in coverage during transition', 'high', 'in_progress', 3),
      ('Warehouse Automation Payment Terms', 'AutoStore Systems', 'Manufacturing', 'Milestone-based payments tied to performance acceptance, retention of 10% until final acceptance', 'Vendor wants 40% upfront payment and progress payments monthly', 'RoboLogistics offers 20% upfront with performance-based payment schedule', 'Maximum 25% upfront, milestone payments, 10% retention for 90 days post go-live', 'Project scale and reference value, competitor payment terms, year-end budget availability', 'Project delays due to payment disputes, vendor financial stability, scope creep', 'medium', 'preparation', 1),
      ('Packaging Materials Annual Contract', 'PackRight Solutions', 'Packaging', 'Reduce cost per unit by 10% through material optimization and increased volume', 'Vendor cites rising pulp prices and proposes 5% increase', 'Three alternative suppliers pre-qualified with comparable quality at lower costs', 'Achieve 5-10% reduction through design optimization and volume commitment', '500K unit annual volume, design-to-value opportunities, multiple qualified alternatives', 'Packaging quality affecting product protection, customer perception, supply continuity', 'medium', 'in_progress', 2),
      ('Fleet Software License Negotiation', 'FleetMaster Pro', 'Software', 'Convert from per-vehicle to enterprise license model for better scalability', 'Vendor prefers per-vehicle pricing as fleet grows, offering 5% volume discount', 'VehicleTrack offers flat enterprise pricing at 25% below FleetMaster per-vehicle costs', 'Enterprise license with price cap, unlimited vehicles, included premium support', 'Growing fleet makes per-vehicle costly, competitive enterprise offers available', 'Feature gaps in alternative solutions, data migration complexity, user retraining', 'medium', 'preparation', 2),
      ('Logistics Rate Renegotiation', 'TransGlobal Freight', 'Logistics', 'Achieve market-rate alignment with 10% reduction on current contracted rates', 'Carrier claims fuel surcharges justify current rates, offers 2% reduction', 'Qualified 3 alternative carriers with 15-20% lower rates on key lanes', 'Secure 8-12% overall rate reduction with fuel surcharge caps and guaranteed capacity', 'Spot market rates 15% below contract, multiple carrier alternatives, large volume commitment', 'Service reliability with new carriers, capacity during peak seasons, claims handling', 'high', 'in_progress', 1),
      ('Lab Equipment Service Contract', 'AnalytiCal Instruments', 'Scientific', 'Combine service contracts for all instruments under single comprehensive agreement at 20% discount', 'Vendor prices each instrument separately, minimal multi-unit discount', 'Third-party service organizations offer 30-40% savings on out-of-warranty equipment', 'Consolidated service agreement with 15-20% discount and guaranteed response times', 'Total installed base value, competitive third-party service options, contract bundling leverage', 'OEM parts access with third-party service, instrument uptime requirements, calibration accuracy', 'medium', 'preparation', 3),
      ('Benefits Platform Migration', 'BenefitStream Corp', 'HR Services', 'Negotiate implementation costs down by 40% in exchange for 3-year commitment', 'Vendor offers standard implementation fee with first-year discount only', 'Two competitors waiving implementation fees entirely for 3-year contracts', 'Zero or minimal implementation fee with 3-year contract and annual rate cap of 3%', 'Competitors waiving implementation, open enrollment timing pressure on vendor, reference customer value', 'Migration risk during open enrollment, employee experience disruption, data accuracy', 'high', 'in_progress', 3),
      ('HVAC System Installation Bid', 'ClimateControl Pro', 'Facilities', 'Fixed-price contract with liquidated damages for delays, 15-year warranty', 'Vendor proposes time-and-materials with 10-year standard warranty', 'Alternative contractors providing fixed-price bids with 12-year warranties at 10% lower', 'Fixed-price with max 5% change order allowance, 15-year warranty, performance guarantees', 'Multiple qualified bidders, project can be phased giving flexibility, building codes requiring upgrade anyway', 'Installation quality, warranty claim responsiveness, energy efficiency guarantees', 'medium', 'preparation', 1),
      ('Print Services Consolidation', 'PrintManage Solutions', 'IT Services', 'Consolidate 5 regional print contracts into single national agreement at 20% savings', 'Vendor offers 10% consolidation discount but wants 5-year term', 'Keep regional contracts and renegotiate individually, or use managed print broker', 'Single national contract, 15-20% savings, 3-year term with renewal options', 'Spend consolidation leverage, competitive market, vendor desire for national account reference', 'Regional service quality variation, single point of failure, contract exit flexibility', 'low', 'preparation', 2),
      ('Travel Management Program RFP', 'TravelEdge Corporate', 'Travel Services', 'Zero management fee model with revenue sharing on hotel commissions', 'Vendor proposes flat per-transaction fee model', 'Current provider willing to match terms, two other TMCs proposing hybrid models', 'Low or zero management fee, 50/50 commission sharing, guaranteed savings targets', 'Large travel spend attracting TMC interest, competitive proposals, current provider retention risk', 'Service degradation in race-to-bottom pricing, traveler satisfaction, duty of care coverage', 'medium', 'in_progress', 1),
      ('Telecom Infrastructure Upgrade', 'ConnectPro Telecom', 'Telecom', 'Bundle voice, data, and contact center into single contract at 25% below current total spend', 'Vendor offers bundled discount of 12% with 5-year commitment', 'Competitive proposals from two major carriers at 20-30% below current rates', 'Achieve 20-25% total cost reduction with flexible term and technology refresh clause', 'Deregulated market with aggressive competition, bundle leverage, technology refresh cycle', 'Number porting complexity, service interruption risk, vendor financial stability', 'high', 'preparation', 3),
      ('Catering Services Exclusive Partnership', 'GourmetCorp Events', 'Food Services', 'Volume-based pricing with 20% discount for exclusivity commitment', 'Vendor offers 10% discount for preferred vendor status without exclusivity', 'Multiple local caterers available for event-by-event pricing', 'Preferred vendor status with 15% discount, menu flexibility, and last-minute accommodation guarantee', 'Event volume and predictability, marketing value for caterer, multiple alternatives available', 'Menu fatigue with single provider, quality consistency at scale, dietary restriction handling', 'low', 'preparation', 2)
    `);
    console.log('Negotiation points seeded (15 items)');

    // Seed Contracts (15 items)
    await client.query(`
      INSERT INTO contracts (contract_title, vendor_name, contract_type, start_date, end_date, total_value, payment_schedule, terms_conditions, sla_terms, termination_clause, renewal_terms, governing_law, status, created_by) VALUES
      ('Master Services Agreement - Cloud Infrastructure', 'CloudTech Solutions', 'Master Services Agreement', '2026-01-01', '2028-12-31', 3750000.00, 'Monthly invoicing, Net 30, milestone payments for migration phases', 'Vendor shall provide cloud infrastructure services including migration, management, and optimization. All data remains property of client. Vendor must maintain SOC2 Type II certification.', '99.99% uptime, 15-minute response for P1 incidents, 4-hour resolution for P1, monthly reporting', '90 days written notice, immediate for material breach, transition assistance for 6 months post-termination', 'Auto-renewal for 1-year terms, 60-day opt-out notice, pricing cap of CPI + 2%', 'State of Delaware', 'active', 1),
      ('Supply Agreement - Structural Steel', 'GlobalSteel Corp', 'Supply Agreement', '2026-04-01', '2029-03-31', 22500000.00, 'Monthly invoicing based on delivery, Net 60, quarterly price adjustments per index', 'Vendor to supply structural steel per specifications. Quality certificates required per shipment. Volume flexibility of ±20% per quarter.', 'On-time delivery 95%, quality rejection rate <0.5%, 48-hour emergency delivery capability', '180 days written notice, immediate for quality failures, wind-down supply for 90 days', 'Annual renewal with 90-day notice, price tied to ASTM steel index', 'State of Ohio', 'active', 1),
      ('Software License Agreement - Fleet Management', 'FleetMaster Pro', 'SaaS Agreement', '2026-03-01', '2029-02-28', 555000.00, 'Annual prepaid license, Net 30, price locked for initial term', 'Enterprise license for fleet management platform including GPS, maintenance, fuel management. Unlimited users and vehicles.', '99.9% platform availability, 1-hour response for critical issues, daily data backup, API rate limits 10K/hour', '30 days for convenience with prorated refund, immediate for data breach', 'Auto-renewal at then-current rates, 30-day opt-out, rate increase cap 5%', 'State of California', 'active', 2),
      ('Professional Services Agreement - Cybersecurity', 'CyberShield Associates', 'Professional Services', '2026-02-01', '2027-01-31', 280000.00, 'Quarterly payments in advance, Net 30', 'Quarterly penetration testing, continuous vulnerability scanning, incident response retainer. All findings confidential.', 'Assessment reports within 5 business days, critical vulnerability notification within 4 hours, annual compliance report', '30 days written notice, immediate for confidentiality breach', 'Renewal at mutually agreed terms, 60-day negotiation period', 'State of New York', 'active', 3),
      ('Equipment Purchase Agreement - Warehouse Automation', 'AutoStore Systems', 'Capital Equipment Purchase', '2026-06-01', '2027-05-31', 3800000.00, '30% on contract signing, 30% on delivery, 30% on commissioning, 10% retention for 90 days', 'Purchase and installation of AS/RS system including design, manufacturing, delivery, installation, and commissioning.', 'System accuracy 99.95%, throughput 500 picks/hour, availability 99.5%, installation complete within 9 months', 'Mutual termination with 60 days notice, buyer termination for schedule delays >30 days', 'N/A - one-time purchase with warranty', 'State of Texas', 'draft', 1),
      ('Furniture Supply Agreement', 'ErgoWorks Global', 'Purchase Agreement', '2026-05-01', '2026-08-31', 380000.00, '50% on order confirmation, 50% on delivery and acceptance', 'Supply and installation of ergonomic office furniture per specifications. All items must be BIFMA certified.', 'Delivery within 8 weeks, installation within 2 weeks of delivery, zero defects on delivery', '14 days for defective goods, mutual termination for force majeure', 'N/A - project-based purchase', 'State of Illinois', 'pending_signature', 2),
      ('Managed Services Agreement - Print Services', 'PrintManage Solutions', 'Managed Services', '2026-07-01', '2029-06-30', 1800000.00, 'Monthly cost-per-page billing, Net 30, quarterly true-up', 'Managed print services across 50 locations including equipment, supplies, maintenance, and optimization.', 'Device uptime 99%, 4-hour response for device failure, automatic supply replenishment, monthly usage reports', '90 days written notice, immediate for persistent SLA failures (3+ months)', 'Auto-renewal for 1-year terms, 60-day opt-out, annual pricing review', 'State of Georgia', 'under_review', 2),
      ('Transportation Services Agreement', 'TransGlobal Freight', 'Services Agreement', '2026-01-15', '2028-01-14', 9500000.00, 'Weekly invoicing based on shipments, Net 45, monthly fuel surcharge adjustment', 'Multi-modal freight services including FTL, LTL, and intermodal. Carrier must maintain $5M cargo insurance.', 'On-time delivery 97%, claims ratio <0.1%, pickup within 2 hours of request, real-time tracking on all shipments', '60 days written notice, immediate for safety violations, 90-day transition assistance', 'Annual renewal with 90-day notice, rate review tied to DAT index', 'State of Tennessee', 'active', 1),
      ('Benefits Administration Platform Agreement', 'BenefitStream Corp', 'SaaS Agreement', '2026-01-01', '2028-12-31', 480000.00, 'Annual prepaid, Net 30, implementation fee waived for 3-year term', 'Full-service benefits administration including enrollment, eligibility management, carrier connections, and employee portal.', '99.95% availability during open enrollment, 99.9% otherwise, 2-hour response for critical issues, daily eligibility feeds', '12 months notice for convenience, immediate for data breach, 180-day transition assistance', 'Auto-renewal for 2-year terms, 180-day opt-out, rate cap CPI + 3%', 'State of Massachusetts', 'active', 3),
      ('HVAC Installation Contract', 'ClimateControl Pro', 'Construction Contract', '2026-09-01', '2027-06-30', 2400000.00, 'Monthly progress payments based on certified completion, 10% retention', 'Design, supply, and installation of HVAC systems across 8 buildings. Must meet ASHRAE 90.1 standards.', 'Installation per approved schedule, commissioning test results per specifications, 1-year defect correction period', 'Owner termination for convenience with payment for work completed, termination for cause with 10-day cure period', '15-year parts warranty, annual maintenance optional renewal', 'State of Pennsylvania', 'draft', 1),
      ('Catering Services Agreement', 'GourmetCorp Events', 'Services Agreement', '2026-04-01', '2027-03-31', 250000.00, 'Per-event invoicing, Net 15, quarterly reconciliation against volume commitment', 'Preferred catering vendor for corporate events, board meetings, and employee functions. Menu customization required.', 'Confirmation within 24 hours, dietary accommodations, professional service staff, post-event cleanup', '30 days written notice, immediate for health/safety violations', 'Annual renewal with 30-day notice, pricing review for >10% volume changes', 'State of New York', 'active', 2),
      ('Data Analytics License Agreement', 'DataViz Enterprise', 'Enterprise License', '2026-08-01', '2029-07-31', 1560000.00, 'Annual prepaid license, Net 30, implementation services billed monthly', 'Enterprise license for data analytics platform including BI, predictive analytics, data governance. 500 named users.', '99.9% availability, 4-hour response critical, daily backup, quarterly business reviews', '90 days notice for convenience, immediate for IP infringement, data export within 30 days', 'Auto-renewal for 1-year terms, 90-day opt-out, max 5% annual increase', 'State of Washington', 'pending_signature', 1),
      ('Laboratory Equipment Purchase & Service', 'AnalytiCal Instruments', 'Purchase & Service Agreement', '2026-10-01', '2031-09-30', 850000.00, 'Equipment: 100% on delivery. Service: quarterly prepaid, Net 30', 'Purchase of analytical instruments and 5-year comprehensive service agreement including calibration and parts.', 'Instrument uptime 98%, 24-hour response, annual calibration, loaner equipment for repairs >3 days', 'Service: 90 days notice. Equipment warranty: standard manufacturer terms', 'Service renewal at then-current rates, 90-day notice, equipment trade-in program', 'State of New Jersey', 'under_review', 3),
      ('Telecommunications Services Agreement', 'ConnectPro Telecom', 'Services Agreement', '2026-07-01', '2029-06-30', 1350000.00, 'Monthly billing, Net 30, annual rate review', 'Unified communications services including VoIP, video conferencing, SIP trunking, and SD-WAN for 50 locations.', '99.99% voice availability, 99.9% data, 4-hour restore for service outages, 24/7 NOC monitoring', '60 days written notice, immediate for persistent outages, number porting assistance for 90 days', 'Auto-renewal for 1-year terms, 60-day opt-out, technology refresh every 3 years', 'State of Virginia', 'draft', 3),
      ('Travel Management Services Agreement', 'TravelEdge Corporate', 'Services Agreement', '2026-05-01', '2028-04-30', 180000.00, 'Monthly management fee, Net 30, quarterly savings reporting', 'Full-service travel management including booking, expense, policy enforcement, and duty of care for 2000 travelers.', 'Booking response <2 hours, 24/7 emergency assistance, monthly savings report, 95% policy compliance', '90 days notice for convenience, immediate for duty of care failures', 'Annual renewal with 60-day notice, fee review tied to transaction volume', 'State of Colorado', 'active', 1)
    `);
    console.log('Contracts seeded (15 items)');

    // Seed Suppliers (15 items)
    await client.query(`
      INSERT INTO suppliers (company_name, contact_name, email, phone, address, category, rating, certifications, annual_revenue, employee_count, years_in_business, payment_terms, quality_score, delivery_score, status, notes, created_by) VALUES
      ('GlobalSteel Corp', 'Robert Zhang', 'rzhang@globalsteel.com', '+1 (312) 555-0101', '4500 Industrial Blvd, Chicago, IL 60632', 'Raw Materials', 4.50, 'ISO 9001:2015, ISO 14001:2015, ASTM Certified, AISC Member', 850000000.00, 12000, 40, 'Net 60', 94.50, 92.00, 'active', 'Tier 1 strategic supplier for structural steel. Long-standing relationship with consistent quality. Primary supplier for all 5 manufacturing plants.', 1),
      ('CloudTech Solutions', 'Jennifer Park', 'jpark@cloudtech.io', '+1 (415) 555-0202', '1200 Cloud Way, Suite 400, San Francisco, CA 94105', 'IT Infrastructure', 4.70, 'AWS Advanced Partner, Azure Gold Partner, SOC2 Type II, ISO 27001, HIPAA Compliant', 320000000.00, 4500, 15, 'Net 30', 96.00, 95.50, 'active', 'Leading cloud infrastructure provider. Completed 200+ enterprise migrations. Excellent technical team and 24/7 support.', 1),
      ('ErgoWorks Global', 'Michael Torres', 'mtorres@ergoworks.com', '+1 (616) 555-0303', '8900 Furniture Ave, Grand Rapids, MI 49503', 'Facilities', 4.20, 'BIFMA Certified, FSC Certified, GREENGUARD Gold, B Corp Certified', 180000000.00, 2800, 25, 'Net 30', 90.00, 88.50, 'active', 'Premium ergonomic furniture manufacturer. Strong sustainability credentials. 10-year structural warranty standard.', 2),
      ('FleetMaster Pro', 'David Chen', 'dchen@fleetmaster.com', '+1 (512) 555-0404', '3300 Tech Ridge Blvd, Austin, TX 78758', 'Software', 4.30, 'ISO 27001, SOC2 Type II, FedRAMP Authorized', 95000000.00, 800, 18, 'Annual subscription', 94.00, 93.00, 'active', 'Best-in-class fleet management SaaS. Patented predictive maintenance algorithms. 50K+ vehicles managed globally.', 2),
      ('CyberShield Associates', 'Sarah Mitchell', 'smitchell@cybershield.com', '+1 (703) 555-0505', '1800 Tysons Blvd, Suite 600, McLean, VA 22102', 'Professional Services', 4.80, 'CREST Certified, PCI QSA, CISSP Team, FedRAMP 3PAO', 45000000.00, 350, 12, 'Net 30', 98.00, 96.00, 'active', 'Elite cybersecurity firm with former NSA analysts. 500+ assessments completed. Exceptional quality and thoroughness.', 3),
      ('PackRight Solutions', 'Lisa Anderson', 'landerson@packright.com', '+1 (920) 555-0606', '2200 Paper Mill Rd, Green Bay, WI 54304', 'Packaging', 4.10, 'FSC Certified, SFI Certified, ISO 9001, Cradle to Cradle Silver', 120000000.00, 1500, 22, 'Net 30', 88.00, 91.00, 'active', 'Sustainable packaging leader. 80%+ recycled content standard. Custom printing capabilities with 48-hour turnaround.', 2),
      ('AutoStore Systems', 'Erik Lindqvist', 'elindqvist@autostore.com', '+47 555-0707', 'Stokkastrandvegen 85, 5578 Nedre Vats, Norway', 'Manufacturing', 4.60, 'ISO 9001, CE Marked, UL Listed, SIL 2 Certified', 650000000.00, 5000, 28, 'Milestone payments', 95.00, 90.00, 'active', 'Global leader in automated storage and retrieval. 800+ installations worldwide. Cutting-edge robotics technology.', 1),
      ('TransGlobal Freight', 'Carlos Mendez', 'cmendez@transglobal.com', '+1 (901) 555-0808', '5600 Logistics Pkwy, Memphis, TN 38118', 'Logistics', 4.00, 'C-TPAT Certified, SmartWay Partner, IATA Member, Hazmat Certified', 2100000000.00, 18000, 35, 'Net 45', 85.00, 88.00, 'active', 'Multi-modal freight provider with global coverage. Strong domestic and international capabilities. Real-time tracking on all shipments.', 1),
      ('DataViz Enterprise', 'Amanda Foster', 'afoster@dataviz.com', '+1 (206) 555-0909', '2100 Analytics Way, Seattle, WA 98109', 'IT Software', 4.40, 'SOC2 Type II, ISO 27001, GDPR Compliant, FedRAMP In Process', 210000000.00, 1800, 15, 'Annual license', 93.00, 91.50, 'active', 'Enterprise data analytics platform. 300+ enterprise deployments. Strong BI and predictive analytics capabilities.', 1),
      ('BenefitStream Corp', 'Rachel Kim', 'rkim@benefitstream.com', '+1 (617) 555-1010', '100 Federal St, Suite 2000, Boston, MA 02110', 'HR Services', 4.30, 'SOC2 Type II, HIPAA Compliant, ACA Certified', 85000000.00, 600, 10, 'Annual prepaid', 91.00, 89.00, 'active', 'Full-service benefits administration. Multi-carrier integration. Strong self-service portal and analytics dashboard.', 3),
      ('IronBridge Supply', 'Thomas Wright', 'twright@ironbridge.com', '+1 (216) 555-1111', '7800 Steel Valley Rd, Cleveland, OH 44105', 'Raw Materials', 3.80, 'ISO 9001, ASTM Certified', 420000000.00, 5500, 15, 'Net 30', 82.00, 86.00, 'active', 'Competitive pricing leader with 3 domestic mills. Good for standard grade materials. Growing quality program.', 1),
      ('SkyScale Inc', 'Priya Patel', 'ppatel@skyscale.com', '+1 (425) 555-1212', '15000 NE 36th St, Redmond, WA 98052', 'IT Infrastructure', 3.90, 'AWS Partner, Azure Partner, SOC2 Type II', 150000000.00, 1200, 10, 'Net 45', 85.00, 83.00, 'inactive', 'Hybrid cloud specialist. Competitive pricing but less mature support organization. Good for secondary cloud workloads.', 1),
      ('ClimateControl Pro', 'James O''Brien', 'jobrien@climatecontrol.com', '+1 (215) 555-1313', '3400 Industrial Hwy, Philadelphia, PA 19153', 'Facilities', 4.10, 'NATE Certified, EPA 608, ASHRAE Member, LEED AP', 95000000.00, 1100, 20, 'Progress payments', 89.00, 87.00, 'active', 'Commercial HVAC specialist. Energy Star certified systems. Smart building controls integration.', 1),
      ('ConnectPro Telecom', 'Kevin Murphy', 'kmurphy@connectpro.com', '+1 (571) 555-1414', '12100 Sunset Hills Rd, Reston, VA 20190', 'Telecom', 4.20, 'ISO 27001, SOC2 Type II, CPNI Compliant', 480000000.00, 3200, 18, 'Monthly billing', 88.00, 90.00, 'active', 'Unified communications provider. Strong VoIP and video conferencing. SD-WAN capable with 24/7 NOC monitoring.', 3),
      ('MotorTech Industries', 'Hans Weber', 'hweber@motortech.de', '+49 711 555-1515', 'Industriestrasse 45, 70565 Stuttgart, Germany', 'Components', 4.50, 'ISO 9001, ISO 14001, IATF 16949, CE Marked', 310000000.00, 3800, 30, 'Net 45', 96.00, 93.50, 'active', 'Premium servo motor and drive manufacturer. Automotive-grade quality standards. Strong engineering support.', 2)
    `);
    console.log('Suppliers seeded (15 items)');

    // Seed Spend Analytics (15 items)
    await client.query(`
      INSERT INTO spend_analytics (spend_category, department, vendor_name, amount, period, fiscal_year, budget_allocated, variance_percentage, transaction_count, contract_reference, cost_center, payment_method, currency, status, notes, created_by) VALUES
      ('IT Infrastructure', 'Information Technology', 'CloudTech Solutions', 1250000.00, 'Q1 2026', 2026, 1500000.00, -16.67, 45, 'MSA-CLOUD-2026', 'CC-IT-001', 'ACH', 'USD', 'tracked', 'Cloud migration project phase 1 spend', 1),
      ('Raw Materials', 'Manufacturing', 'GlobalSteel Corp', 2850000.00, 'Q1 2026', 2026, 2500000.00, 14.00, 120, 'SA-STEEL-2026', 'CC-MFG-001', 'Wire Transfer', 'USD', 'flagged', 'Over budget due to emergency orders in March', 1),
      ('Office Supplies', 'Administration', 'OfficeMax Corp', 85000.00, 'Q1 2026', 2026, 100000.00, -15.00, 340, 'PO-OFFICE-2026', 'CC-ADM-001', 'P-Card', 'USD', 'tracked', 'Standard office supplies procurement', 2),
      ('Professional Services', 'Information Security', 'CyberShield Associates', 70000.00, 'Q1 2026', 2026, 70000.00, 0.00, 4, 'PSA-CYBER-2026', 'CC-SEC-001', 'ACH', 'USD', 'reviewed', 'Quarterly cybersecurity assessment', 3),
      ('Fleet Operations', 'Operations', 'FleetMaster Pro', 46250.00, 'Q1 2026', 2026, 46250.00, 0.00, 1, 'SLA-FLEET-2026', 'CC-OPS-001', 'ACH', 'USD', 'tracked', 'Annual license Q1 portion', 2),
      ('Logistics', 'Supply Chain', 'TransGlobal Freight', 2375000.00, 'Q1 2026', 2026, 2200000.00, 7.95, 890, 'TSA-FREIGHT-2026', 'CC-SCM-001', 'ACH', 'USD', 'flagged', 'Increased shipping volume due to seasonal demand', 1),
      ('Facilities', 'Facilities Management', 'ClimateControl Pro', 180000.00, 'Q1 2026', 2026, 600000.00, -70.00, 8, 'CC-HVAC-2026', 'CC-FAC-001', 'Check', 'USD', 'tracked', 'HVAC project progress payments', 1),
      ('Software Licenses', 'Information Technology', 'DataViz Enterprise', 520000.00, 'Q1 2026', 2026, 520000.00, 0.00, 1, 'ELA-DATAVIZ-2026', 'CC-IT-002', 'Wire Transfer', 'USD', 'reviewed', 'Annual platform license renewal', 1),
      ('HR Services', 'Human Resources', 'BenefitStream Corp', 160000.00, 'Q1 2026', 2026, 160000.00, 0.00, 3, 'SAA-BENEFITS-2026', 'CC-HR-001', 'ACH', 'USD', 'tracked', 'Benefits administration Q1', 3),
      ('Packaging', 'Manufacturing', 'PackRight Solutions', 320000.00, 'Q1 2026', 2026, 350000.00, -8.57, 65, 'SA-PACK-2026', 'CC-MFG-002', 'ACH', 'USD', 'tracked', 'Sustainable packaging materials', 2),
      ('Telecom', 'Information Technology', 'ConnectPro Telecom', 112500.00, 'Q1 2026', 2026, 112500.00, 0.00, 12, 'TSA-TELECOM-2026', 'CC-IT-003', 'ACH', 'USD', 'tracked', 'Unified communications services', 3),
      ('Travel', 'All Departments', 'TravelEdge Corporate', 450000.00, 'Q1 2026', 2026, 400000.00, 12.50, 1200, 'TMSA-TRAVEL-2026', 'CC-TRV-001', 'Corporate Card', 'USD', 'flagged', 'Travel spend exceeded budget due to Q1 conferences', 1),
      ('Maintenance', 'Manufacturing', 'MotorTech Industries', 95000.00, 'Q1 2026', 2026, 120000.00, -20.83, 15, 'PO-MOTORS-2026', 'CC-MFG-003', 'Wire Transfer', 'EUR', 'tracked', 'Servo motor replacements and spare parts', 2),
      ('Print Services', 'Administration', 'PrintManage Solutions', 150000.00, 'Q1 2026', 2026, 150000.00, 0.00, 50, 'MSA-PRINT-2026', 'CC-ADM-002', 'ACH', 'USD', 'reviewed', 'Managed print services Q1', 2),
      ('Catering', 'Human Resources', 'GourmetCorp Events', 62500.00, 'Q1 2026', 2026, 62500.00, 0.00, 18, 'CSA-CATER-2026', 'CC-HR-002', 'Check', 'USD', 'tracked', 'Corporate events and board meetings catering', 2)
    `);
    console.log('Spend analytics seeded (15 items)');

    // Seed Savings Tracker (15 items)
    await client.query(`
      INSERT INTO savings_tracker (initiative_name, category, vendor_name, original_cost, negotiated_cost, savings_amount, savings_percentage, savings_type, implementation_date, validation_status, department, fiscal_year, notes, created_by) VALUES
      ('Steel Supply Renegotiation 2026', 'Raw Materials', 'GlobalSteel Corp', 8500000.00, 7650000.00, 850000.00, 10.00, 'cost_reduction', '2026-04-01', 'validated', 'Manufacturing', 2026, 'Achieved 10% reduction through volume commitment and market leverage', 1),
      ('Cloud Infrastructure Optimization', 'IT Services', 'CloudTech Solutions', 1500000.00, 1250000.00, 250000.00, 16.67, 'cost_reduction', '2026-01-15', 'validated', 'IT', 2026, 'Right-sizing instances and reserved capacity pricing', 1),
      ('Packaging Redesign Initiative', 'Packaging', 'PackRight Solutions', 1400000.00, 1190000.00, 210000.00, 15.00, 'process_improvement', '2026-03-01', 'validated', 'Manufacturing', 2026, 'Material optimization reducing weight by 15% without quality impact', 2),
      ('Fleet Software Enterprise License', 'Software', 'FleetMaster Pro', 225000.00, 185000.00, 40000.00, 17.78, 'cost_reduction', '2026-03-01', 'validated', 'Operations', 2026, 'Converted per-vehicle to enterprise license model', 2),
      ('Freight Rate Renegotiation', 'Logistics', 'TransGlobal Freight', 9500000.00, 8550000.00, 950000.00, 10.00, 'cost_reduction', '2026-01-15', 'pending', 'Supply Chain', 2026, 'Market-rate alignment with fuel surcharge caps', 1),
      ('Office Furniture Volume Discount', 'Facilities', 'ErgoWorks Global', 440000.00, 380000.00, 60000.00, 13.64, 'cost_reduction', '2026-05-01', 'validated', 'Facilities', 2026, 'Bulk purchase discount with free installation', 2),
      ('Cybersecurity Bundle Savings', 'Professional Services', 'CyberShield Associates', 350000.00, 280000.00, 70000.00, 20.00, 'cost_reduction', '2026-02-01', 'validated', 'InfoSec', 2026, 'Bundled assessment and monitoring services', 3),
      ('Print Services Consolidation', 'IT Services', 'PrintManage Solutions', 720000.00, 600000.00, 120000.00, 16.67, 'cost_reduction', '2026-07-01', 'pending', 'Administration', 2026, 'Consolidated 5 regional contracts to single national', 2),
      ('Benefits Platform Migration Savings', 'HR Services', 'BenefitStream Corp', 200000.00, 160000.00, 40000.00, 20.00, 'cost_avoidance', '2026-01-01', 'validated', 'HR', 2026, 'Waived implementation fee for 3-year commitment', 3),
      ('Telecom Bundle Consolidation', 'Telecom', 'ConnectPro Telecom', 500000.00, 450000.00, 50000.00, 10.00, 'cost_reduction', '2026-07-01', 'pending', 'IT', 2026, 'Bundled voice, data, contact center services', 3),
      ('Travel Program Optimization', 'Travel', 'TravelEdge Corporate', 1800000.00, 1620000.00, 180000.00, 10.00, 'cost_avoidance', '2026-05-01', 'validated', 'All Departments', 2026, 'Negotiated hotel rates and advance booking discounts', 1),
      ('HVAC Energy Efficiency Upgrade', 'Facilities', 'ClimateControl Pro', 360000.00, 288000.00, 72000.00, 20.00, 'process_improvement', '2027-01-01', 'pending', 'Facilities', 2027, 'Annual energy savings from new high-efficiency HVAC', 1),
      ('Spare Parts Inventory Reduction', 'Components', 'MotorTech Industries', 180000.00, 144000.00, 36000.00, 20.00, 'process_improvement', '2026-06-01', 'validated', 'Manufacturing', 2026, 'VMI program reducing inventory holding costs', 2),
      ('Data Analytics License Renegotiation', 'Software', 'DataViz Enterprise', 600000.00, 520000.00, 80000.00, 13.33, 'cost_reduction', '2026-08-01', 'pending', 'IT', 2026, 'Multi-year commitment discount with usage optimization', 1),
      ('Catering Preferred Vendor Program', 'Food Services', 'GourmetCorp Events', 300000.00, 255000.00, 45000.00, 15.00, 'cost_reduction', '2026-04-01', 'validated', 'HR', 2026, 'Volume-based pricing through preferred vendor agreement', 2)
    `);
    console.log('Savings tracker seeded (15 items)');

    // Seed Risk Assessments (15 items)
    await client.query(`
      INSERT INTO risk_assessments (assessment_title, vendor_name, risk_category, risk_level, probability, impact_score, risk_score, description, mitigation_strategy, contingency_plan, owner, review_date, status, created_by) VALUES
      ('Single Source Dependency - Steel', 'GlobalSteel Corp', 'supply_chain', 'high', 70.00, 90.00, 63.00, 'GlobalSteel supplies 80% of structural steel needs. Any disruption would halt manufacturing operations across all plants.', 'Qualify IronBridge Supply as secondary source. Target 60/40 split within 12 months.', 'Emergency procurement from spot market. 30-day safety stock maintained at each plant.', 'Sarah Chen', '2026-06-30', 'mitigating', 1),
      ('Cloud Provider Lock-in', 'CloudTech Solutions', 'operational', 'medium', 40.00, 75.00, 30.00, 'Deep integration with CloudTech proprietary tools creates switching costs estimated at $2M+.', 'Implement multi-cloud architecture for non-critical workloads. Use container orchestration for portability.', 'Documented migration runbook to AWS/Azure direct. 6-month transition plan maintained.', 'James Wilson', '2026-09-30', 'monitoring', 1),
      ('Cybersecurity Vendor Data Access', 'CyberShield Associates', 'cybersecurity', 'high', 30.00, 95.00, 28.50, 'CyberShield has deep access to security infrastructure during assessments. Potential for data exposure.', 'NDAs with liquidated damages. Segregated assessment environments. Background checks on all consultants.', 'Immediate access revocation procedures. Incident response plan with legal team pre-briefed.', 'Maria Garcia', '2026-04-30', 'monitoring', 3),
      ('Geopolitical Risk - European Suppliers', 'MotorTech Industries', 'geopolitical', 'medium', 35.00, 70.00, 24.50, 'European supply chain exposed to EU regulatory changes, trade disputes, and currency fluctuation.', 'Hedge EUR/USD exposure. Maintain 60-day buffer stock. Identify domestic alternatives.', 'Pre-qualified US-based servo motor suppliers. Currency hedging instruments in place.', 'Sarah Chen', '2026-07-31', 'identified', 1),
      ('Financial Stability - SkyScale', 'SkyScale Inc', 'financial', 'high', 55.00, 80.00, 44.00, 'SkyScale reported declining revenue and customer churn. Risk of service disruption or acquisition.', 'Reduce dependency. Ensure data portability. Monitor quarterly financials.', 'Migration plan to alternative provider. Data backup and export procedures tested quarterly.', 'James Wilson', '2026-05-31', 'mitigating', 1),
      ('Compliance Gap - GDPR', 'DataViz Enterprise', 'compliance', 'medium', 45.00, 85.00, 38.25, 'DataViz processes EU employee data but FedRAMP certification pending. Potential GDPR compliance gap.', 'Require data processing agreement update. Audit data handling procedures. Restrict EU data processing.', 'Alternative analytics platform identified. Data repatriation plan documented.', 'Maria Garcia', '2026-06-30', 'mitigating', 3),
      ('Natural Disaster - Warehouse', 'AutoStore Systems', 'operational', 'low', 15.00, 95.00, 14.25, 'Single warehouse location for critical automation components. Flood/earthquake risk in Norway coastal area.', 'Require vendor BCP documentation. Insurance coverage verification. Spare parts inventory.', 'Emergency procurement from alternative automation vendors. Manual operation procedures.', 'Sarah Chen', '2026-12-31', 'monitoring', 1),
      ('Freight Capacity Shortage', 'TransGlobal Freight', 'supply_chain', 'high', 60.00, 70.00, 42.00, 'Peak season capacity constraints leading to delayed shipments and premium rates.', 'Advance booking for peak periods. Multi-carrier strategy. Intermodal options for non-urgent freight.', 'Spot market carriers pre-qualified. Customer communication templates for delay notification.', 'James Wilson', '2026-08-31', 'mitigating', 1),
      ('Labor Dispute Risk', 'IronBridge Supply', 'operational', 'medium', 40.00, 75.00, 30.00, 'IronBridge union contract expires Q3 2026. Historical precedent of strikes at 2 of 3 mills.', 'Increase safety stock before contract expiration. Qualify alternative suppliers for affected grades.', 'Emergency supply agreements with GlobalSteel and Asian mills. 45-day inventory buffer.', 'Sarah Chen', '2026-07-31', 'identified', 1),
      ('Technology Obsolescence', 'FleetMaster Pro', 'operational', 'low', 20.00, 60.00, 12.00, 'FleetMaster platform architecture aging. Competitor platforms offering more modern AI/ML capabilities.', 'Annual technology roadmap reviews. Feature comparison with market leaders.', 'VehicleTrack and 2 other platforms evaluated as alternatives. 6-month migration timeline.', 'James Wilson', '2026-12-31', 'monitoring', 2),
      ('Packaging Supply Disruption', 'PackRight Solutions', 'supply_chain', 'medium', 35.00, 65.00, 22.75, 'Single facility for custom packaging. Pulp price volatility and environmental regulations increasing.', 'Qualify secondary packaging supplier. Price escalation clauses with ceiling. 30-day safety stock.', 'Standard packaging alternatives identified. Temporary design simplification options.', 'Maria Garcia', '2026-06-30', 'identified', 2),
      ('Benefits Data Breach Risk', 'BenefitStream Corp', 'cybersecurity', 'high', 25.00, 98.00, 24.50, 'Platform processes sensitive PII and PHI for all employees. High-value target for cyber attacks.', 'Annual security audit requirement. Cyber insurance coverage. Data encryption requirements enforced.', 'Incident response plan. Employee notification procedures. Regulatory reporting protocols.', 'Maria Garcia', '2026-03-31', 'monitoring', 3),
      ('Regulatory Change - EPA', 'ChemLub International', 'compliance', 'medium', 50.00, 60.00, 30.00, 'Pending EPA regulations on synthetic lubricant disposal may increase costs and limit product availability.', 'Monitor regulatory developments. Evaluate bio-based alternatives. Budget contingency for compliance costs.', 'Alternative lubricant suppliers with compliant formulations identified.', 'Sarah Chen', '2026-09-30', 'identified', 1),
      ('Contract Dispute Risk - HVAC', 'ClimateControl Pro', 'operational', 'medium', 30.00, 70.00, 21.00, 'Complex multi-building HVAC project with potential for scope disputes and change orders exceeding 5% allowance.', 'Detailed scope documentation. Weekly progress meetings. Independent project oversight.', 'Alternative contractors pre-qualified. Phased approach allowing contractor change between buildings.', 'James Wilson', '2026-08-31', 'identified', 1),
      ('Currency Fluctuation Impact', 'AutoStore Systems', 'financial', 'medium', 55.00, 50.00, 27.50, 'Equipment purchase denominated in NOK/EUR. 10% currency movement would impact budget by $380K.', 'Forward contracts for major payments. Payment milestone timing optimization.', 'Renegotiate pricing in USD. Alternative domestic automation vendors evaluated.', 'Sarah Chen', '2026-06-30', 'mitigating', 1)
    `);
    console.log('Risk assessments seeded (15 items)');

    // Seed Compliance Records (15 items)
    await client.query(`
      INSERT INTO compliance_records (requirement_name, regulation_type, vendor_name, compliance_status, last_audit_date, next_audit_date, audit_findings, corrective_actions, documentation_status, risk_rating, responsible_party, evidence_links, notes, created_by) VALUES
      ('SOC2 Type II Certification', 'SOX', 'CloudTech Solutions', 'compliant', '2025-11-15', '2026-11-15', 'All controls operating effectively. No exceptions noted.', 'N/A - Clean audit report', 'complete', 'low', 'Jennifer Park', 'SOC2 report on file, Certificate #CT-2025-SOC2-1147', 'Annual renewal required. Valid through Nov 2026.', 1),
      ('HIPAA Compliance - Data Handling', 'HIPAA', 'BenefitStream Corp', 'compliant', '2025-09-20', '2026-09-20', 'PHI handling procedures meet HIPAA requirements. BAA executed and current.', 'Minor: Update data retention policy to reflect new 7-year requirement', 'complete', 'low', 'Rachel Kim', 'BAA executed 2025-01-01, HIPAA attestation on file', 'BAA renewal due with contract renewal.', 3),
      ('GDPR Data Processing', 'GDPR', 'DataViz Enterprise', 'partial', '2025-10-01', '2026-04-01', 'EU data transfer mechanisms need updating post-Schrems II. Standard contractual clauses require revision.', 'Update SCCs to new EU-approved version. Implement data localization for EU employee data.', 'incomplete', 'high', 'Amanda Foster', 'DPA on file but requires amendment', 'Urgent: EU data residency requirements not fully met. Target remediation by April 2026.', 1),
      ('ISO 9001 Quality Management', 'ISO_9001', 'GlobalSteel Corp', 'compliant', '2025-12-01', '2026-12-01', 'Quality management system fully operational. Continuous improvement program effective.', 'N/A - Certification maintained', 'complete', 'low', 'Robert Zhang', 'ISO 9001:2015 Certificate #GS-QMS-2025-089', 'Surveillance audit passed December 2025.', 1),
      ('ISO 27001 InfoSec', 'ISO_27001', 'CyberShield Associates', 'compliant', '2025-08-15', '2026-08-15', 'Information security controls meet ISO 27001 requirements. Penetration testing of own systems clean.', 'N/A - Full compliance', 'complete', 'low', 'Sarah Mitchell', 'ISO 27001 Certificate, Pen test reports on file', 'Practice what they preach - exemplary security posture.', 3),
      ('OSHA Safety Standards', 'OSHA', 'IronBridge Supply', 'non_compliant', '2025-07-10', '2026-01-10', 'Three OSHA recordable incidents in Q3 2025. Safety training documentation gaps. PPE compliance at 85%.', 'Mandatory safety retraining program. PPE compliance monitoring. Monthly safety audits implemented.', 'incomplete', 'high', 'Thomas Wright', 'OSHA 300 log on file, Corrective action plan submitted', 'Elevated risk. Monthly progress reviews required until full compliance.', 1),
      ('EPA Environmental Compliance', 'EPA', 'PackRight Solutions', 'compliant', '2025-11-01', '2026-11-01', 'Environmental permits current. Waste management procedures compliant. Emissions within limits.', 'Minor: Update stormwater management plan for facility expansion', 'complete', 'low', 'Lisa Anderson', 'EPA permits on file, Emissions report 2025', 'Strong environmental program. FSC and SFI certifications maintained.', 2),
      ('FAR/DFAR Compliance', 'FAR', 'AutoStore Systems', 'under_review', '2025-06-15', '2026-06-15', 'FAR compliance review pending for government subcontract requirements. Country of origin documentation needed.', 'Complete country of origin documentation for all components. FAR flowdown clauses in sub-supplier contracts.', 'pending', 'medium', 'Erik Lindqvist', 'FAR compliance questionnaire submitted', 'Required for government project eligibility. Under review.', 1),
      ('PCI DSS Compliance', 'SOX', 'FleetMaster Pro', 'compliant', '2025-10-15', '2026-10-15', 'Payment card data handling meets PCI DSS requirements. Tokenization implemented for stored card data.', 'N/A - Compliant', 'complete', 'low', 'David Chen', 'PCI DSS AOC on file, SAQ-D completed', 'Annual assessment required. Fuel card integration PCI compliant.', 2),
      ('C-TPAT Security', 'FAR', 'TransGlobal Freight', 'compliant', '2025-09-01', '2026-09-01', 'C-TPAT Tier III status maintained. Supply chain security procedures validated.', 'N/A - Highest tier maintained', 'complete', 'low', 'Carlos Mendez', 'C-TPAT certificate, Security profile on file', 'Tier III provides expedited customs processing benefits.', 1),
      ('ITAR Export Controls', 'ITAR', 'MotorTech Industries', 'partial', '2025-08-01', '2026-02-01', 'ITAR registration current but export control procedures for dual-use components need strengthening.', 'Implement enhanced export screening. Train staff on dual-use identification. Update compliance manual.', 'incomplete', 'high', 'Hans Weber', 'ITAR registration on file, EAR classification pending', 'Critical for defense-related projects. Remediation in progress.', 2),
      ('ACA Benefits Compliance', 'HIPAA', 'BenefitStream Corp', 'compliant', '2026-01-15', '2027-01-15', 'ACA reporting (Forms 1094-C/1095-C) completed accurately and timely. Affordability tests passed.', 'N/A - Full compliance maintained', 'complete', 'low', 'Rachel Kim', 'ACA filing confirmations on file', '2025 tax year filings completed on time.', 3),
      ('ISO 14001 Environmental', 'ISO_9001', 'ErgoWorks Global', 'compliant', '2025-10-20', '2026-10-20', 'Environmental management system effective. Sustainability targets on track. Carbon footprint reduced 8%.', 'Continue progress toward 2030 carbon neutral target', 'complete', 'low', 'Michael Torres', 'ISO 14001 Certificate, Sustainability Report 2025', 'B Corp certified. Leading on sustainability metrics.', 2),
      ('ASHRAE Standards Compliance', 'OSHA', 'ClimateControl Pro', 'compliant', '2025-12-10', '2026-12-10', 'All installations meet ASHRAE 90.1 and 62.1 standards. Energy modeling validated.', 'N/A - Design compliance verified', 'complete', 'low', 'James OBrien', 'ASHRAE compliance certificates per project', 'Required for building permit approvals.', 1),
      ('SOC2 Type II - Analytics', 'SOX', 'DataViz Enterprise', 'under_review', '2025-07-01', '2026-07-01', 'SOC2 report received with one qualified exception on logical access controls.', 'Vendor implementing enhanced access review procedures. Remediation target March 2026.', 'pending', 'medium', 'Amanda Foster', 'SOC2 report with management response on file', 'Exception noted but vendor committed to remediation. Monitoring closely.', 1)
    `);
    console.log('Compliance records seeded (15 items)');

    // Seed Auctions (15 items)
    await client.query(`
      INSERT INTO auctions (auction_title, category, auction_type, description, starting_price, reserve_price, current_best_bid, number_of_bidders, start_time, end_time, bid_decrement, auto_extend, winning_vendor, items_description, status, created_by) VALUES
      ('Q3 Steel Supply Reverse Auction', 'Raw Materials', 'reverse', 'Reverse auction for Q3 2026 structural steel requirements across all manufacturing plants.', 8500000.00, 7200000.00, 7350000.00, 5, '2026-04-15 09:00:00', '2026-04-15 17:00:00', 25000.00, true, 'IronBridge Supply', '5,000 tons A36 structural steel, 2,000 tons A572 Grade 50, delivery to 5 plant locations', 'completed', 1),
      ('Office Furniture Sealed Bid', 'Facilities', 'sealed_bid', 'Sealed bid auction for headquarters expansion furniture package.', 500000.00, 350000.00, 365000.00, 4, '2026-05-01 08:00:00', '2026-05-15 17:00:00', 0.00, false, 'ErgoWorks Global', '450 workstations, 50 conference tables, 200 task chairs, 100 executive chairs, filing systems', 'completed', 2),
      ('IT Hardware Refresh Auction', 'IT Equipment', 'reverse', 'Reverse auction for enterprise laptop and desktop refresh program.', 2200000.00, 1800000.00, NULL, 6, '2026-06-10 09:00:00', '2026-06-10 15:00:00', 10000.00, true, NULL, '1,500 laptops, 500 desktops, 200 monitors, docking stations and peripherals', 'scheduled', 1),
      ('Janitorial Services Auction', 'Facilities Services', 'reverse', 'Reverse auction for janitorial and cleaning services across 12 locations.', 1200000.00, 950000.00, 980000.00, 7, '2026-03-20 10:00:00', '2026-03-20 16:00:00', 5000.00, true, 'CleanPro Services', 'Daily cleaning, floor care, window washing, special events cleanup for 12 office locations', 'completed', 2),
      ('Corrugated Packaging Dutch Auction', 'Packaging', 'dutch', 'Dutch auction for annual corrugated packaging contract.', 800000.00, 1200000.00, 1050000.00, 4, '2026-04-01 09:00:00', '2026-04-01 12:00:00', 15000.00, false, 'PackRight Solutions', '500,000 custom corrugated boxes in 12 sizes, FSC certified, custom printing', 'completed', 2),
      ('Temporary Staffing Services', 'HR Services', 'reverse', 'Reverse auction for temporary staffing services - manufacturing and admin roles.', 3500000.00, 2800000.00, NULL, 5, '2026-07-01 09:00:00', '2026-07-01 17:00:00', 20000.00, true, NULL, 'Manufacturing temps (150 FTE), admin temps (50 FTE), annual contract', 'scheduled', 3),
      ('MRO Supplies Annual Contract', 'MRO', 'reverse', 'Reverse auction for maintenance, repair, and operations supplies.', 950000.00, 750000.00, 785000.00, 8, '2026-03-05 08:00:00', '2026-03-05 14:00:00', 5000.00, true, 'IndustrialSupply Co', 'Fasteners, lubricants, safety supplies, hand tools, electrical components - annual blanket PO', 'completed', 1),
      ('Uniform and Workwear Program', 'Safety', 'sealed_bid', 'Sealed bid for employee uniform and workwear program.', 400000.00, 300000.00, NULL, 5, '2026-06-15 08:00:00', '2026-06-30 17:00:00', 0.00, false, NULL, 'FR clothing, hi-vis vests, steel-toe boots, hard hats for 2,000 manufacturing employees', 'scheduled', 2),
      ('Waste Management Services', 'Environmental', 'reverse', 'Reverse auction for industrial and office waste management services.', 650000.00, 500000.00, 520000.00, 4, '2026-02-28 10:00:00', '2026-02-28 15:00:00', 5000.00, true, 'GreenWaste Solutions', 'Industrial waste disposal, recycling services, hazmat handling, office recycling programs', 'completed', 1),
      ('Security Services Contract', 'Security', 'reverse', 'Reverse auction for physical security services at manufacturing and office locations.', 1800000.00, 1400000.00, NULL, 6, '2026-08-01 09:00:00', '2026-08-01 17:00:00', 10000.00, true, NULL, 'Guard services (24/7), access control management, CCTV monitoring, patrol services for 8 locations', 'scheduled', 3),
      ('Laboratory Consumables Auction', 'Scientific', 'reverse', 'Reverse auction for annual laboratory consumables and reagents.', 280000.00, 220000.00, 235000.00, 5, '2026-03-15 09:00:00', '2026-03-15 14:00:00', 2500.00, true, 'LabSupply Direct', 'Reagents, glassware, filters, sample containers, calibration standards - annual contract', 'completed', 3),
      ('Landscaping Services', 'Facilities Services', 'sealed_bid', 'Sealed bid for landscaping and grounds maintenance.', 350000.00, 250000.00, 275000.00, 6, '2026-04-10 08:00:00', '2026-04-25 17:00:00', 0.00, false, 'GreenScape Pro', 'Lawn care, tree maintenance, snow removal, irrigation for 8 campus locations', 'completed', 2),
      ('Electrical Components Bulk Buy', 'Components', 'reverse', 'Reverse auction for bulk electrical components procurement.', 450000.00, 350000.00, NULL, 7, '2026-07-15 09:00:00', '2026-07-15 16:00:00', 5000.00, true, NULL, 'Circuit breakers, wiring, conduit, panels, switches - annual manufacturing supply', 'scheduled', 1),
      ('Corporate Insurance Renewal', 'Insurance', 'sealed_bid', 'Sealed bid auction for corporate insurance portfolio renewal.', 2500000.00, 2000000.00, NULL, 4, '2026-09-01 08:00:00', '2026-09-15 17:00:00', 0.00, false, NULL, 'Property, casualty, liability, D&O, cyber, cargo insurance portfolio', 'scheduled', 1),
      ('Forklift Fleet Lease Auction', 'Equipment', 'reverse', 'Reverse auction for forklift fleet lease across distribution centers.', 800000.00, 620000.00, 645000.00, 5, '2026-03-25 09:00:00', '2026-03-25 15:00:00', 5000.00, true, 'ForkliftPro Leasing', '75 forklifts (various capacities), 36-month lease, full maintenance included', 'completed', 1)
    `);
    console.log('Auctions seeded (15 items)');

    // Seed Market Intelligence (15 items)
    await client.query(`
      INSERT INTO market_intelligence (report_title, commodity, market_segment, current_price, price_trend, price_change_pct, supply_outlook, demand_outlook, key_drivers, competitor_activity, forecast_summary, data_source, report_date, region, impact_assessment, status, created_by) VALUES
      ('Hot Rolled Steel Coil Market Update', 'Steel - HRC', 'Metals & Mining', 680.00, 'falling', -8.50, 'surplus', 'declining', 'Chinese overcapacity driving global prices down. US tariffs providing floor but import pressure increasing. Energy costs stabilizing.', 'Major competitors locking in 12-month contracts at current rates. Some shifting to domestic mills.', 'Prices expected to decline further 5-10% in Q2 before stabilizing in H2. Recommend delaying large purchases if possible.', 'Platts, CRU, AISI Reports', '2026-03-15', 'North America', 'Favorable for buyers. Estimated $400K savings potential on annual steel spend at projected prices.', 'current', 1),
      ('Crude Oil & Energy Outlook', 'Crude Oil - WTI', 'Energy', 72.50, 'stable', 2.30, 'balanced', 'stable', 'OPEC+ production cuts balancing with slowing global demand. US shale production steady. Geopolitical tensions providing risk premium.', 'Competitors hedging at current levels. Some shifting to renewables for facility energy.', 'Oil expected to trade $68-78 range through 2026. Natural gas prices may spike in winter. Recommend fuel surcharge caps in logistics contracts.', 'EIA, Bloomberg, Reuters', '2026-03-10', 'Global', 'Moderate impact on logistics costs. Fuel surcharges expected to remain stable. $150K exposure in freight contracts.', 'current', 1),
      ('Semiconductor & Electronics Market', 'Semiconductors', 'Electronics', 45.00, 'rising', 12.00, 'tight', 'growing', 'AI chip demand surging. Automotive semiconductor demand strong. New fab capacity coming online late 2027. Lead times extending.', 'Competitors placing advance orders and building strategic buffer stocks.', 'Supply constraints expected through 2027. Recommend securing allocation agreements and considering alternative chip architectures.', 'Gartner, IDC, SIA', '2026-03-12', 'Global', 'Critical for PCB assemblies. Lead time extension may delay production. $200K cost increase risk on electronics components.', 'current', 1),
      ('Corrugated Packaging Market', 'Containerboard', 'Packaging', 850.00, 'rising', 5.50, 'balanced', 'growing', 'E-commerce driving packaging demand. Recycled fiber costs increasing. New sustainable packaging regulations in EU.', 'Competitors investing in reusable packaging. Some shifting to alternative materials.', 'Moderate price increases expected through 2026. Recycled content premiums increasing. Recommend design optimization to reduce material usage.', 'RISI, AF&PA, PPI', '2026-03-08', 'North America', 'Direct impact on packaging costs. $120K potential increase on annual packaging spend.', 'current', 2),
      ('Cloud Computing Services Pricing', 'Cloud IaaS/PaaS', 'Technology', 0.08, 'falling', -15.00, 'surplus', 'growing', 'Hyperscaler competition intensifying. New regions launching. Spot instance availability improving. ARM-based instances cheaper.', 'Competitors negotiating enterprise agreements with committed spend discounts of 30-40%.', 'Cloud pricing expected to continue declining 10-15% annually. Recommend enterprise agreement renegotiation and architecture optimization.', 'Flexera, Gartner, IDC', '2026-03-14', 'Global', 'Favorable for optimization. Estimated $250K savings through right-sizing and reserved capacity.', 'current', 1),
      ('Natural Rubber Market Analysis', 'Natural Rubber', 'Chemicals & Materials', 1.65, 'volatile', -3.20, 'tight', 'stable', 'Weather disruptions in Southeast Asia. Thai production declining. Synthetic rubber substitution increasing.', 'Competitors building strategic reserves. Some qualifying synthetic alternatives.', 'Volatility expected to continue. Recommend dual sourcing with synthetic alternatives for non-critical applications.', 'IRSG, SICOM, Reuters', '2026-03-05', 'Asia-Pacific', 'Affects gasket and sealing costs. $50K exposure on rubber components.', 'current', 2),
      ('Aluminum Market Intelligence', 'Aluminum - LME', 'Metals & Mining', 2450.00, 'rising', 6.80, 'balanced', 'growing', 'Green aluminum premium increasing. China export restrictions. Aerospace and EV demand strong.', 'Competitors securing long-term supply agreements. Green aluminum premium now 8-12%.', 'Prices expected to continue gradual increase. Green premiums will widen. Recommend hedging and considering recycled aluminum.', 'LME, CRU, Platts', '2026-03-11', 'Global', 'Impact on extrusion profile costs. $180K potential increase on annual aluminum spend.', 'current', 1),
      ('Freight & Logistics Rate Index', 'Truckload Freight', 'Logistics', 2.85, 'stable', 1.50, 'balanced', 'stable', 'Driver shortage easing slightly. Fuel prices stable. Regulatory compliance costs increasing (ELD, emissions).', 'Competitors renegotiating annual contracts. Some shifting to intermodal for longer hauls.', 'Rates expected to remain stable with slight increases in peak season. Recommend locking rates for key lanes before Q4 peak.', 'DAT, FreightWaves, CASS', '2026-03-13', 'North America', 'Moderate impact. Current contract rates competitive with market. Peak season surcharges expected Q4.', 'current', 1),
      ('Copper Wire & Cable Pricing', 'Copper - COMEX', 'Metals & Mining', 4.25, 'rising', 9.20, 'tight', 'growing', 'Electrification trend driving demand. Mine supply disruptions in Chile and Peru. Green energy infrastructure buildout.', 'Competitors forward purchasing and building inventory positions.', 'Copper expected to reach $4.50-4.75 by year end. Consider forward purchases for large projects.', 'COMEX, LME, ICSG', '2026-03-09', 'Global', 'Significant impact on electrical component costs. $95K exposure on annual copper wire purchases.', 'current', 1),
      ('Office Furniture Market Trends', 'Office Furniture', 'Commercial Furnishings', 0.00, 'stable', 0.00, 'surplus', 'declining', 'Remote work reducing demand. Sustainable materials cost premium. Ergonomic standards tightening.', 'Competitors negotiating aggressive discounts in buyers market. Some opting for refurbished furniture.', 'Favorable buyers market expected to continue. Strong negotiating position for volume purchases.', 'BIFMA, IBISWorld', '2026-03-07', 'North America', 'Favorable. Estimated 10-15% savings achievable on furniture procurement.', 'current', 2),
      ('Cybersecurity Services Market', 'InfoSec Services', 'Professional Services', 250.00, 'rising', 18.00, 'tight', 'growing', 'Talent shortage in cybersecurity. Regulatory requirements increasing. AI-driven threats evolving rapidly.', 'Competitors locking in multi-year agreements. Some building internal SOC capabilities.', 'Service rates expected to increase 15-20% annually. Recommend long-term agreements and consider managed security services.', 'Gartner, Cybersecurity Ventures', '2026-03-06', 'Global', 'Direct impact on security assessment costs. $50K annual increase risk on cybersecurity services.', 'current', 3),
      ('Industrial Lubricants Market', 'Synthetic Lubricants', 'Chemicals', 8.50, 'stable', 1.20, 'balanced', 'stable', 'Base oil prices stable. Additive costs increasing slightly. Bio-lubricant alternatives gaining market share.', 'Competitors evaluating bio-based alternatives for sustainability targets.', 'Prices expected to remain stable. Bio-lubricant premiums decreasing. Recommend pilot testing bio alternatives.', 'ICIS, Kline & Company', '2026-03-04', 'North America', 'Minimal impact. Current contract pricing competitive. Bio-lubricant evaluation recommended.', 'outdated', 1),
      ('Temporary Labor Market Analysis', 'Temporary Staffing', 'HR Services', 28.50, 'rising', 7.00, 'tight', 'growing', 'Manufacturing labor shortage continuing. Wage inflation in skilled trades. Automation reducing unskilled demand.', 'Competitors offering sign-on bonuses and premium rates. Some investing in automation to reduce headcount.', 'Staffing rates expected to increase 5-8% in 2026. Recommend automation investment and longer-term temp commitments.', 'SIA, BLS, ASA', '2026-03-03', 'North America', 'Direct impact on manufacturing temp costs. $200K annual exposure if rates increase as projected.', 'current', 3),
      ('Palladium & Precious Metals', 'Palladium', 'Metals & Mining', 950.00, 'falling', -12.00, 'surplus', 'declining', 'EV transition reducing catalytic converter demand. Russian supply stabilizing. Recycling volumes increasing.', 'Competitors reducing palladium inventory. Some switching to platinum-based catalysts.', 'Downtrend expected to continue. Recommend spot purchasing over long-term contracts.', 'Johnson Matthey, LBMA', '2026-02-28', 'Global', 'Limited direct impact. Relevant for any catalytic or electronics components using palladium.', 'current', 1),
      ('SaaS & Enterprise Software Pricing', 'Enterprise Software', 'Technology', 0.00, 'rising', 8.00, 'balanced', 'growing', 'AI feature premiums. Platform consolidation trend. Vendors shifting to consumption-based pricing.', 'Competitors negotiating multi-year enterprise agreements. Some consolidating vendor count.', 'Enterprise software costs increasing 8-12% annually. Recommend vendor consolidation and multi-year commitments for price protection.', 'Gartner, Flexera, Zylo', '2026-03-01', 'Global', 'Broad impact across software portfolio. $300K annual exposure across all SaaS subscriptions.', 'current', 1)
    `);
    console.log('Market intelligence seeded (15 items)');

    // Seed Performance Scorecards (15 items)
    await client.query(`
      INSERT INTO performance_scorecards (vendor_name, evaluation_period, overall_score, quality_score, delivery_score, cost_score, responsiveness_score, innovation_score, compliance_score, defect_rate, on_time_delivery_pct, cost_variance_pct, corrective_actions, improvement_plan, evaluator, status, created_by) VALUES
      ('GlobalSteel Corp', 'Q4 2025', 91.50, 94.50, 92.00, 88.00, 90.00, 85.00, 95.00, 0.35, 94.80, 2.10, 'None required - strong performance across all categories', 'Focus on innovation: explore advanced alloys and just-in-sequence delivery capabilities', 'Sarah Chen', 'approved', 1),
      ('CloudTech Solutions', 'Q4 2025', 95.20, 96.00, 95.50, 92.00, 97.00, 94.00, 96.00, 0.10, 99.20, -3.50, 'None required - exceeding expectations', 'Explore AI-ops capabilities and automated cost optimization recommendations', 'James Wilson', 'approved', 1),
      ('CyberShield Associates', 'Q4 2025', 96.80, 98.00, 96.00, 88.00, 99.00, 95.00, 98.00, 0.00, 100.00, 5.00, 'Cost slightly above benchmark - review rate card', 'Develop automated reporting dashboard. Explore AI-driven threat detection offerings.', 'Maria Garcia', 'approved', 3),
      ('ErgoWorks Global', 'Q4 2025', 87.30, 90.00, 88.50, 85.00, 84.00, 82.00, 92.00, 1.20, 91.50, 3.80, 'Improve delivery consistency. Address 2 damaged shipment incidents.', 'Implement QC checkpoint before shipping. Add delivery tracking notifications.', 'James Wilson', 'submitted', 2),
      ('FleetMaster Pro', 'Q4 2025', 92.50, 94.00, 93.00, 90.00, 91.00, 93.00, 94.00, 0.20, 99.50, 1.20, 'Minor UI issues reported - resolved within SLA', 'Develop predictive analytics dashboard. Mobile app enhancement for driver experience.', 'James Wilson', 'approved', 2),
      ('PackRight Solutions', 'Q4 2025', 88.70, 88.00, 91.00, 90.00, 85.00, 82.00, 93.00, 0.80, 93.50, -1.50, 'Improve print quality consistency on custom packaging', 'Invest in digital printing capabilities. Develop sustainable ink alternatives.', 'Maria Garcia', 'submitted', 2),
      ('TransGlobal Freight', 'Q4 2025', 85.30, 85.00, 88.00, 82.00, 84.00, 78.00, 92.00, 0.08, 96.20, 4.50, 'Claims processing time exceeds target. Peak season surcharges excessive.', 'Improve claims resolution SLA. Develop dedicated account team. Peak season capacity planning.', 'Sarah Chen', 'approved', 1),
      ('AutoStore Systems', 'Q4 2025', 93.80, 95.00, 90.00, 92.00, 94.00, 96.00, 95.00, 0.05, 88.00, -2.00, 'Installation timeline running 2 weeks behind schedule', 'Accelerate installation with additional crew. Weekly progress meetings with project sponsor.', 'Sarah Chen', 'reviewed', 1),
      ('DataViz Enterprise', 'Q4 2025', 89.50, 93.00, 91.50, 85.00, 88.00, 90.00, 87.00, 0.15, 98.00, 3.20, 'SOC2 exception needs resolution. Custom report development slow.', 'Resolve SOC2 finding by March 2026. Assign dedicated solutions architect for custom requests.', 'James Wilson', 'submitted', 1),
      ('BenefitStream Corp', 'Q4 2025', 90.20, 91.00, 89.00, 92.00, 90.00, 85.00, 94.00, 0.30, 97.50, -0.80, 'Open enrollment reporting delays. Minor data accuracy issues.', 'Pre-enrollment testing improvements. Automated data validation before carrier feeds.', 'Maria Garcia', 'approved', 3),
      ('IronBridge Supply', 'Q4 2025', 78.50, 82.00, 86.00, 92.00, 75.00, 70.00, 65.00, 2.10, 90.50, -8.00, 'Quality rejections above threshold. Safety compliance issues flagged.', 'Mandatory quality improvement plan. Monthly quality audits. Safety retraining program.', 'Sarah Chen', 'reviewed', 1),
      ('ConnectPro Telecom', 'Q4 2025', 88.00, 88.00, 90.00, 86.00, 87.00, 84.00, 91.00, 0.50, 96.80, 2.50, 'Two outage incidents in Q4 exceeding SLA. RCA reports satisfactory.', 'Network redundancy improvements. Proactive monitoring enhancement. Quarterly business reviews.', 'Maria Garcia', 'submitted', 3),
      ('MotorTech Industries', 'Q4 2025', 94.20, 96.00, 93.50, 90.00, 92.00, 95.00, 96.00, 0.12, 95.20, 1.80, 'None required - consistent high performance', 'Explore IoT-enabled motors with predictive maintenance. Develop local support capability.', 'James Wilson', 'approved', 2),
      ('ClimateControl Pro', 'Q4 2025', 86.50, 89.00, 87.00, 84.00, 85.00, 83.00, 88.00, 0.90, 92.00, 4.20, 'Change order frequency higher than expected. Communication delays on schedule changes.', 'Weekly schedule updates. Dedicated project coordinator. Change order pre-approval process.', 'Sarah Chen', 'reviewed', 1),
      ('SkyScale Inc', 'Q4 2025', 76.80, 85.00, 83.00, 88.00, 72.00, 68.00, 70.00, 1.50, 89.00, -5.00, 'Support responsiveness below expectations. Staff turnover affecting service quality.', 'Assign dedicated support team. Escalation procedures. Monthly performance reviews. Consider replacement if no improvement by Q2.', 'James Wilson', 'reviewed', 1)
    `);
    console.log('Performance scorecards seeded (15 items)');

    // Seed Approval Workflows (15 items)
    await client.query(`
      INSERT INTO approval_workflows (request_title, request_type, requestor, department, amount, justification, current_approver, approval_chain, current_step, total_steps, priority, due_date, comments, status, created_by) VALUES
      ('Cloud Infrastructure Migration Phase 2', 'purchase_order', 'James Wilson', 'Information Technology', 850000.00, 'Phase 2 of cloud migration covering production workloads. Critical path for digital transformation initiative. ROI of 35% over 3 years through reduced infrastructure costs.', 'VP of Technology', 'IT Director > VP of Technology > CFO', 2, 3, 'high', '2026-04-15', 'Phase 1 completed successfully under budget. Phase 2 scope validated by architecture review board.', 'in_review', 1),
      ('Annual Steel Supply Contract Renewal', 'contract', 'Sarah Chen', 'Procurement', 7650000.00, 'Annual steel supply contract renewal with GlobalSteel Corp. Negotiated 10% reduction from prior year. Volume commitment of 5,000 tons.', 'CFO', 'Procurement Director > VP Operations > CFO', 3, 3, 'high', '2026-03-31', 'Legal review complete. Favorable terms achieved. Board notification required for contracts >$5M.', 'in_review', 1),
      ('Cybersecurity Monitoring Service', 'purchase_order', 'Maria Garcia', 'Information Security', 180000.00, 'Continuous security monitoring service to complement quarterly assessments. Required for SOC2 compliance and cyber insurance requirements.', 'IT Director', 'InfoSec Manager > IT Director > VP of Technology', 2, 3, 'high', '2026-04-01', 'Audit committee recommended continuous monitoring. Insurance requires 24/7 monitoring by Q2.', 'in_review', 3),
      ('Warehouse Automation Equipment', 'purchase_order', 'Sarah Chen', 'Operations', 3800000.00, 'AS/RS system for distribution center modernization. Expected to increase throughput by 300% and reduce labor costs by $1.2M annually. Payback period 3.2 years.', 'CEO', 'VP Operations > CFO > CEO', 2, 3, 'high', '2026-05-15', 'Competitive bidding complete. AutoStore selected. Capital budget approved for FY2026.', 'in_review', 1),
      ('Office Furniture - HQ Expansion', 'purchase_order', 'James Wilson', 'Facilities', 380000.00, 'Ergonomic office furniture for 3-floor headquarters expansion. 450 workstations needed for new hires and relocations starting Q3.', 'VP of Operations', 'Facilities Manager > VP of Operations', 2, 2, 'medium', '2026-04-30', 'Space planning complete. ErgoWorks selected through competitive bid. Delivery aligned with construction schedule.', 'approved', 2),
      ('Data Analytics Platform License', 'contract', 'James Wilson', 'Information Technology', 520000.00, 'Enterprise analytics platform annual license. Supports 500 users across BI, predictive analytics, and data governance. Replaces 3 legacy tools.', 'VP of Technology', 'IT Director > VP of Technology > CFO', 2, 3, 'medium', '2026-07-15', 'Tool consolidation saves $180K annually. User adoption training plan in place.', 'in_review', 1),
      ('Emergency Steel Order - Plant 3', 'purchase_order', 'Sarah Chen', 'Manufacturing', 450000.00, 'Emergency steel order for Plant 3 production line repair. Equipment failure requires immediate structural steel for rebuild. 48-hour delivery needed.', 'VP Operations', 'Plant Manager > VP Operations', 2, 2, 'urgent', '2026-03-22', 'Production line down. Revenue impact $200K/day. Emergency procurement authority invoked.', 'approved', 1),
      ('Travel Management Software Upgrade', 'budget', 'Maria Garcia', 'All Departments', 85000.00, 'Upgrade travel management platform to include AI-powered booking optimization and enhanced duty of care features.', 'VP of HR', 'Travel Manager > VP of HR', 1, 2, 'low', '2026-06-30', 'Expected 8% savings on travel spend through AI optimization. Improves traveler experience.', 'pending', 1),
      ('Vendor Onboarding - NewTech Robotics', 'vendor_onboarding', 'James Wilson', 'Procurement', 0.00, 'New vendor qualification for robotic process automation. Required as alternative to AutoStore for smaller automation projects.', 'Procurement Director', 'Category Manager > Procurement Director', 1, 2, 'medium', '2026-05-31', 'Technical evaluation complete. Financial due diligence in progress. References checked.', 'pending', 2),
      ('HVAC System Change Order #3', 'change_order', 'Sarah Chen', 'Facilities', 125000.00, 'Change order for upgraded smart building controls on buildings 5-8. Original scope used standard controls. Smart controls improve energy efficiency by additional 15%.', 'VP Operations', 'Facilities Manager > VP Operations > CFO', 2, 3, 'medium', '2026-09-15', 'Within 5% change order allowance. Energy savings ROI of 2.5 years on incremental cost.', 'in_review', 1),
      ('Benefits Platform Enhancement', 'budget', 'Maria Garcia', 'Human Resources', 45000.00, 'Additional module for wellness program integration and mental health resources. Supports employee retention initiative.', 'VP of HR', 'Benefits Manager > VP of HR', 1, 2, 'medium', '2026-06-01', 'Employee survey identified wellness support as top priority. Aligns with retention strategy.', 'pending', 3),
      ('Freight Rate Lock - Q4 Peak', 'contract', 'Sarah Chen', 'Supply Chain', 2200000.00, 'Lock freight rates for Q4 peak season. Pre-negotiated rates 8% below projected spot market. Guarantees capacity for holiday shipping.', 'VP Supply Chain', 'Logistics Manager > VP Supply Chain > CFO', 2, 3, 'high', '2026-08-31', 'Historical data shows 25% rate spikes in Q4. Early lock provides significant savings.', 'in_review', 1),
      ('Lab Equipment Service Extension', 'contract', 'Maria Garcia', 'R&D', 120000.00, 'Extend comprehensive service agreement for analytical instruments. Covers calibration, preventive maintenance, and emergency repairs.', 'VP of R&D', 'Lab Director > VP of R&D', 1, 2, 'low', '2026-09-30', 'Current service contract expiring. Third-party service evaluated but OEM preferred for accuracy.', 'pending', 3),
      ('Print Services Contract Amendment', 'change_order', 'James Wilson', 'Administration', 35000.00, 'Amendment to add secure printing and badge-release functionality across all 50 locations. Required for data security compliance.', 'IT Director', 'Print Services Manager > IT Director', 1, 2, 'medium', '2026-07-31', 'Security audit recommended badge-release printing. Prevents sensitive document exposure.', 'pending', 2),
      ('Catering Contract Annual Renewal', 'contract', 'James Wilson', 'Human Resources', 255000.00, 'Annual renewal of preferred catering vendor agreement. 15% volume discount maintained. New sustainable sourcing requirements added.', 'VP of HR', 'Events Manager > VP of HR', 2, 2, 'low', '2026-03-31', 'Employee satisfaction scores for catering at 4.2/5. Menu diversity expanded. Sustainability commitment added.', 'approved', 2)
    `);
    console.log('Approval workflows seeded (15 items)');

    // Seed Category Strategies (15 items)
    await client.query(`
      INSERT INTO category_strategies (category_name, category_owner, annual_spend, number_of_suppliers, strategic_importance, supply_risk, sourcing_strategy, current_state, target_state, key_initiatives, savings_target_pct, timeline, stakeholders, market_dynamics, status, created_by) VALUES
      ('Structural Steel & Metals', 'Sarah Chen', 22500000.00, 3, 'critical', 'high', 'dual_source', 'Single primary supplier (80% share). Price tied to market index. Quality consistent but limited leverage.', 'Balanced dual-source with 60/40 split. Index-based pricing with floor/ceiling. Strategic partnership with innovation collaboration.', 'Qualify second source, Negotiate volume-based tiered pricing, Implement VMI program, Explore recycled steel options', 8.00, '12 months', 'VP Operations, Plant Managers, Quality Director', 'Global steel oversupply. Prices declining. Chinese exports increasing. Trade policy uncertainty.', 'in_progress', 1),
      ('Cloud & IT Infrastructure', 'James Wilson', 4800000.00, 4, 'critical', 'medium', 'strategic_partnership', 'Multi-vendor cloud environment. Primary provider handles 70% of workloads. Growing spend with limited optimization.', 'Optimized multi-cloud strategy. FinOps practice established. Reserved capacity maximized. Vendor-agnostic architecture.', 'Implement FinOps program, Architecture modernization for portability, Enterprise agreement renegotiation, AI-ops adoption', 15.00, '18 months', 'CTO, VP Technology, InfoSec Director', 'Hyperscaler competition intensifying. Prices declining 10-15% annually. AI services becoming differentiator.', 'approved', 1),
      ('Professional Services', 'Maria Garcia', 2500000.00, 8, 'high', 'low', 'competitive_bidding', 'Ad-hoc engagement model. Multiple vendors for different specialties. Rate cards not standardized.', 'Preferred vendor panel with standardized rates. Framework agreements for key specialties. Quality-based selection.', 'Establish preferred vendor panel, Standardize rate cards, Implement quality scorecards, Consolidate spend with top performers', 12.00, '9 months', 'VP Legal, InfoSec Director, HR Director', 'Talent shortage driving rates up. Remote delivery reducing costs. AI tools changing service delivery.', 'in_progress', 3),
      ('Packaging & Labeling', 'James Wilson', 1400000.00, 5, 'medium', 'medium', 'dual_source', 'Single supplier for custom packaging. Standard packaging from distributor. Sustainability requirements increasing.', 'Dual-sourced custom packaging. Sustainable materials standard. Design optimization program reducing material usage.', 'Qualify secondary packaging supplier, Design-to-value program, Transition to 100% recycled content, Implement reusable packaging pilot', 10.00, '12 months', 'VP Manufacturing, Sustainability Director, Marketing', 'Sustainability regulations tightening. Recycled content premiums decreasing. E-commerce driving demand.', 'draft', 2),
      ('Logistics & Transportation', 'Sarah Chen', 9500000.00, 6, 'critical', 'medium', 'competitive_bidding', 'Primary carrier handles 65% of volume. Limited intermodal usage. Spot market exposure during peaks.', 'Diversified carrier portfolio. 30% intermodal for appropriate lanes. Dynamic routing optimization. Peak capacity guaranteed.', 'Carrier diversification program, Intermodal expansion, TMS implementation, Peak season capacity agreements', 10.00, '12 months', 'VP Supply Chain, Distribution Directors, Customer Service', 'Capacity tightening seasonally. Digital freight platforms emerging. Sustainability requirements for Scope 3.', 'in_progress', 1),
      ('Office Furniture & Facilities', 'James Wilson', 1200000.00, 4, 'low', 'low', 'competitive_bidding', 'Project-based procurement. Multiple vendors for different product categories. Limited leverage from fragmented spend.', 'Consolidated preferred vendor program. Standardized product catalog. Volume-based pricing with annual commitment.', 'Vendor consolidation, Product standardization, Sustainability certification requirements, Refurbished furniture program', 15.00, '6 months', 'VP Facilities, HR Director, Sustainability Director', 'Buyers market due to remote work trend. Sustainability becoming differentiator. Ergonomic standards tightening.', 'approved', 2),
      ('Fleet Management & Vehicles', 'James Wilson', 1800000.00, 3, 'high', 'low', 'strategic_partnership', 'Software and vehicle leasing from different vendors. Limited integration. Per-vehicle licensing model.', 'Integrated fleet management platform. Enterprise licensing. Telematics-driven maintenance. EV transition roadmap.', 'Enterprise license conversion, EV pilot program, Predictive maintenance implementation, Total cost of ownership analysis', 12.00, '18 months', 'VP Operations, Safety Director, Sustainability Director', 'EV transition accelerating. Telematics becoming standard. Software consolidation trend.', 'draft', 2),
      ('Cybersecurity Services', 'Maria Garcia', 500000.00, 3, 'critical', 'high', 'strategic_partnership', 'Assessment and monitoring from single provider. Deep institutional knowledge. Limited competition due to specialty.', 'Strategic partnership with primary provider. Secondary provider for validation. Continuous monitoring standard.', 'Establish strategic partnership agreement, Qualify validation provider, Implement continuous monitoring, Develop internal SOC capability', 5.00, '12 months', 'CISO, CTO, VP Legal, Audit Committee', 'Talent shortage. Rates rising 15-20% annually. AI-driven tools changing landscape. Regulatory requirements expanding.', 'approved', 3),
      ('HR Services & Benefits', 'Maria Garcia', 800000.00, 4, 'high', 'medium', 'sole_source', 'Single platform for benefits admin. Separate vendors for wellness and EAP. Limited integration between systems.', 'Integrated HR services platform. Consolidated benefits, wellness, and EAP. Self-service optimization.', 'Platform consolidation assessment, Wellness program integration, Employee experience redesign, Analytics capability enhancement', 8.00, '18 months', 'VP HR, Benefits Director, Employee Experience', 'Platform consolidation trend. AI-powered benefits recommendation. Employee experience focus increasing.', 'draft', 3),
      ('Telecommunications', 'Maria Garcia', 1350000.00, 3, 'high', 'medium', 'competitive_bidding', 'Legacy voice and data from incumbent. Video conferencing from separate vendor. Contact center outdated.', 'Unified communications platform. SD-WAN for all locations. Cloud-based contact center. Technology refresh cycle.', 'UC platform migration, SD-WAN deployment, Contact center modernization, 5G evaluation for manufacturing', 20.00, '24 months', 'CTO, VP Technology, Customer Service Director', 'Technology convergence. 5G deployment. Cloud-native UC platforms. Aggressive vendor competition.', 'in_progress', 3),
      ('MRO & Industrial Supplies', 'Sarah Chen', 950000.00, 12, 'medium', 'low', 'competitive_bidding', 'Highly fragmented spend. Multiple POs with small vendors. Limited visibility and control. P-card usage high.', 'Consolidated MRO distributor. VMI for high-volume items. E-procurement catalog. Spend visibility dashboard.', 'Distributor consolidation, VMI implementation, E-procurement catalog rollout, Maverick spend reduction program', 15.00, '9 months', 'Plant Managers, Maintenance Directors, Finance', 'Distribution consolidation trend. E-commerce disrupting traditional distributors. VMI becoming standard.', 'approved', 1),
      ('Scientific & Lab Equipment', 'Maria Garcia', 850000.00, 6, 'high', 'medium', 'dual_source', 'OEM-dependent for service. Limited aftermarket options for specialized instruments. Long lead times.', 'Multi-vendor service strategy. Aftermarket parts qualification. Preventive maintenance optimization.', 'Third-party service qualification, Spare parts inventory optimization, Preventive maintenance scheduling, Equipment lifecycle management', 10.00, '12 months', 'VP R&D, Lab Directors, Quality Director', 'Aftermarket services growing. IoT-enabled instruments. Service contract bundling opportunities.', 'draft', 3),
      ('Catering & Food Services', 'James Wilson', 350000.00, 5, 'low', 'low', 'competitive_bidding', 'Multiple caterers used ad-hoc. No preferred vendor program. Quality and pricing inconsistent.', 'Preferred vendor program with 2-3 caterers. Volume-based pricing. Sustainability and dietary standards.', 'Preferred vendor selection, Sustainable sourcing requirements, Menu standardization with flexibility, Employee satisfaction tracking', 12.00, '6 months', 'VP HR, Events Manager, Sustainability Director', 'Sustainability focus increasing. Local sourcing trend. Dietary diversity requirements growing.', 'approved', 2),
      ('Print & Document Services', 'James Wilson', 600000.00, 3, 'low', 'low', 'sole_source', 'Regional contracts with different providers. Inconsistent pricing. Device fleet not optimized.', 'Single national managed print provider. Fleet optimization. Secure printing standard. Usage-based pricing.', 'National contract consolidation, Fleet right-sizing, Secure print implementation, Digital workflow adoption', 18.00, '9 months', 'VP Administration, IT Director, InfoSec Director', 'Print volumes declining. Digital transformation reducing need. Managed print services commoditizing.', 'in_progress', 2),
      ('Travel & Expense Management', 'Sarah Chen', 1800000.00, 2, 'medium', 'low', 'strategic_partnership', 'TMC managing bookings. Separate expense tool. Policy enforcement manual. Limited analytics.', 'Integrated travel and expense platform. AI-powered booking optimization. Automated policy enforcement. Duty of care standard.', 'Platform integration, AI booking optimization, Policy automation, Sustainability tracking for business travel', 10.00, '12 months', 'VP Finance, VP HR, Travel Manager, Risk Manager', 'TMC competition increasing. AI disrupting booking. Sustainability reporting for Scope 3 travel emissions.', 'draft', 1)
    `);
    console.log('Category strategies seeded (15 items)');

    // Seed notifications
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, link) VALUES
      (1, 'Welcome to Strategic Sourcing', 'Your account has been set up. Start by exploring the dashboard.', 'info', '/'),
      (1, 'New RFP Submitted', 'A new RFP for Cloud Infrastructure has been submitted for review.', 'success', '/rfp'),
      (1, 'Contract Expiring Soon', 'The contract with TechVendor Solutions expires in 30 days.', 'warning', '/contracts'),
      (1, 'Risk Alert: Supply Chain', 'High risk detected for semiconductor supply chain disruption.', 'error', '/risk-assessment'),
      (1, 'Savings Milestone Reached', 'Total procurement savings have exceeded $1M this quarter.', 'success', '/savings'),
      (2, 'New Bid Received', 'GlobalTech Corp submitted a bid for the ERP implementation RFP.', 'info', '/bids'),
      (2, 'Approval Required', 'A purchase order for $250K requires your approval.', 'warning', '/approvals'),
      (3, 'Compliance Review Due', 'Annual compliance review for top 5 suppliers is due next week.', 'warning', '/compliance'),
      (4, 'System Update Complete', 'Platform has been updated with new analytics features.', 'info', '/'),
      (4, 'New User Registered', 'A new procurement specialist has joined the team.', 'info', '/'),
      (1, 'Auction Ending Soon', 'The reverse auction for IT Hardware ends in 2 hours.', 'warning', '/auctions'),
      (1, 'Scorecard Review Needed', 'Q4 vendor scorecards are ready for your review.', 'info', '/scorecards')
    `);
    console.log('Notifications seeded');

    // Seed activity log
    await client.query(`
      INSERT INTO activity_log (user_id, entity_type, entity_id, action, details) VALUES
      (1, 'rfp_requests', 1, 'create', 'Created RFP: Enterprise Cloud Infrastructure Migration'),
      (1, 'rfp_requests', 2, 'create', 'Created RFP: Office Furniture Procurement Q3 2026'),
      (2, 'bids', 1, 'create', 'Submitted bid from GlobalTech Corp'),
      (1, 'suppliers', 1, 'update', 'Updated supplier rating for TechVendor Solutions'),
      (3, 'contracts', 1, 'create', 'Created contract: Cloud Services Master Agreement'),
      (1, 'risk_assessments', 1, 'create', 'Created risk assessment for semiconductor supply chain'),
      (2, 'spend_analytics', 1, 'view', 'Viewed Q4 spend report for IT Infrastructure'),
      (1, 'savings_tracker', 1, 'update', 'Validated savings initiative: Cloud migration cost optimization'),
      (3, 'compliance_records', 1, 'create', 'Added compliance record for GDPR Data Processing'),
      (1, 'auctions', 1, 'create', 'Created reverse auction for IT Hardware Bulk Purchase'),
      (2, 'negotiation_points', 1, 'view', 'Viewed negotiation strategy for ERP implementation'),
      (1, 'category_strategies', 1, 'update', 'Updated IT Hardware category strategy')
    `);
    console.log('Activity log seeded');

    // Seed some notes
    await client.query(`
      INSERT INTO notes (entity_type, entity_id, content, user_id) VALUES
      ('suppliers', 1, 'Excellent response time on last 3 orders. Consider for preferred vendor status.', 1),
      ('suppliers', 2, 'Price increases expected in Q2. Lock in rates early.', 2),
      ('rfp_requests', 1, 'CFO wants detailed ROI analysis before shortlisting vendors.', 1),
      ('contracts', 1, 'Legal team reviewing SLA terms. Follow up by end of week.', 3),
      ('risk_assessments', 1, 'Secondary supplier identified as backup. Contact info shared with ops team.', 1),
      ('bids', 1, 'Technical team rates this vendor highly. Schedule demo for next week.', 2)
    `);
    console.log('Notes seeded');

    console.log('\n✅ Database seeded successfully!');
    console.log('Demo login: admin@company.com / password123');
  } catch (err) {
    console.error('Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
