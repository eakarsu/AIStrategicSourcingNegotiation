require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function init() {
  const client = await pool.connect();
  try {
    console.log('Running non-destructive schema init...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(100) DEFAULT 'procurement_specialist',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rfp_requests (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        category VARCHAR(255),
        description TEXT,
        requirements TEXT,
        budget_range VARCHAR(255),
        deadline DATE,
        evaluation_criteria TEXT,
        attachments TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bids (
        id SERIAL PRIMARY KEY,
        rfp_id INTEGER REFERENCES rfp_requests(id),
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

      CREATE TABLE IF NOT EXISTS cost_models (
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

      CREATE TABLE IF NOT EXISTS negotiation_points (
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

      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        country VARCHAR(100),
        rating DECIMAL(3,2),
        certifications TEXT,
        quality_score DECIMAL(5,2),
        delivery_score DECIMAL(5,2),
        cost_score DECIMAL(5,2),
        years_in_business INTEGER,
        annual_revenue DECIMAL(15,2),
        employee_count INTEGER,
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        contract_title VARCHAR(500) NOT NULL,
        vendor_name VARCHAR(255),
        contract_type VARCHAR(100),
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

      CREATE TABLE IF NOT EXISTS spend_analytics (
        id SERIAL PRIMARY KEY,
        spend_category VARCHAR(255),
        department VARCHAR(255),
        vendor_name VARCHAR(255),
        amount DECIMAL(15,2),
        budget_allocated DECIMAL(15,2),
        period VARCHAR(100),
        fiscal_year VARCHAR(10),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS savings_tracker (
        id SERIAL PRIMARY KEY,
        initiative_name VARCHAR(500),
        category VARCHAR(255),
        original_cost DECIMAL(15,2),
        negotiated_cost DECIMAL(15,2),
        savings_amount DECIMAL(15,2),
        savings_percentage DECIMAL(5,2),
        savings_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'planned',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS risk_assessments (
        id SERIAL PRIMARY KEY,
        assessment_title VARCHAR(500),
        vendor_name VARCHAR(255),
        risk_category VARCHAR(100),
        risk_level VARCHAR(50),
        description TEXT,
        mitigation_strategy TEXT,
        status VARCHAR(50) DEFAULT 'open',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS compliance_records (
        id SERIAL PRIMARY KEY,
        requirement_name VARCHAR(500),
        regulation_type VARCHAR(255),
        vendor_name VARCHAR(255),
        compliance_status VARCHAR(50),
        audit_findings TEXT,
        corrective_actions TEXT,
        next_audit_date DATE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS auctions (
        id SERIAL PRIMARY KEY,
        auction_title VARCHAR(500),
        category VARCHAR(255),
        auction_type VARCHAR(100),
        description TEXT,
        starting_price DECIMAL(15,2),
        reserve_price DECIMAL(15,2),
        current_best_bid DECIMAL(15,2),
        number_of_bidders INTEGER,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        bid_decrement DECIMAL(15,2),
        auto_extend BOOLEAN DEFAULT TRUE,
        winning_vendor VARCHAR(255),
        items_description TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS market_intelligence (
        id SERIAL PRIMARY KEY,
        report_title VARCHAR(500),
        commodity VARCHAR(255),
        current_price DECIMAL(15,2),
        price_trend VARCHAR(50),
        supply_outlook TEXT,
        demand_outlook TEXT,
        key_drivers TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS performance_scorecards (
        id SERIAL PRIMARY KEY,
        vendor_name VARCHAR(255),
        period VARCHAR(100),
        overall_score DECIMAL(5,2),
        quality_score DECIMAL(5,2),
        delivery_score DECIMAL(5,2),
        cost_score DECIMAL(5,2),
        defect_rate DECIMAL(5,2),
        on_time_delivery_pct DECIMAL(5,2),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS approval_workflows (
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
        total_steps INTEGER DEFAULT 5,
        priority VARCHAR(50) DEFAULT 'medium',
        due_date DATE,
        comments TEXT,
        attachments TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS category_strategies (
        id SERIAL PRIMARY KEY,
        category_name VARCHAR(255) NOT NULL,
        annual_spend DECIMAL(15,2),
        number_of_suppliers INTEGER,
        strategic_importance VARCHAR(50),
        supply_risk VARCHAR(50),
        sourcing_strategy TEXT,
        market_dynamics TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        content TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(500),
        message TEXT,
        type VARCHAR(50),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(255),
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        endpoint VARCHAR(100),
        input_data JSONB,
        result JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Schema init complete (non-destructive).');
  } catch (err) {
    console.error('Init error:', err.message);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

init().catch(console.error);
