import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('revops_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const mockData = {
  kpis: {
    total_revenue: 1020000.0,
    mrr: 148500.0,
    arr: 1782000.0,
    new_leads: 142,
    qualified_leads: 86,
    meetings: 48,
    deals_won: 24,
    deals_lost: 8,
    conversion_rate: 75.0,
    avg_deal_size: 42500.0,
  },
  charts: {
    monthly_revenue: [
      { month: 'Jan', revenue: 142000, target: 120000 },
      { month: 'Feb', revenue: 165000, target: 130000 },
      { month: 'Mar', revenue: 198000, target: 150000 },
      { month: 'Apr', revenue: 210000, target: 170000 },
      { month: 'May', revenue: 245000, target: 190000 },
      { month: 'Jun', revenue: 289000, target: 210000 },
      { month: 'Jul', revenue: 340000, target: 250000 },
    ],
    sales_funnel: [
      { stage: 'New Leads', count: 142, value: 1820000 },
      { stage: 'Qualified', count: 86, value: 1240000 },
      { stage: 'Meeting', count: 48, value: 890000 },
      { stage: 'Proposal', count: 28, value: 650000 },
      { stage: 'Negotiation', count: 16, value: 480000 },
      { stage: 'Won', count: 24, value: 1020000 },
    ],
    lead_sources: [
      { name: 'Inbound Web', value: 42 },
      { name: 'Outbound Sales', value: 28 },
      { name: 'Partner Referral', value: 18 },
      { name: 'Events & Webinars', value: 12 },
    ],
    forecast_90d: [
      { period: 'Month 1 (Commit)', pipeline_value: 450000, weighted_forecast: 380000 },
      { period: 'Month 2 (Best Case)', pipeline_value: 680000, weighted_forecast: 490000 },
      { period: 'Month 3 (Pipeline)', pipeline_value: 920000, weighted_forecast: 580000 },
    ],
    team_performance: [
      { rep: 'Sarah Jenkins', deals_closed: 8, revenue: 340000, quota_pct: 118 },
      { rep: 'Alex Morgan', deals_closed: 6, revenue: 280000, quota_pct: 105 },
      { rep: 'David Chen', deals_closed: 5, revenue: 210000, quota_pct: 92 },
      { rep: 'Elena Rostova', deals_closed: 5, revenue: 190000, quota_pct: 88 },
    ],
  },
  deals: [
    { id: 1, title: 'Stripe - Enterprise Platform License', company_name: 'Stripe Financial', contact_name: 'Marcus Vance', stage: 'NEGOTIATION', value: 120000, win_probability: 85, health_score: 90, risk_flag: null },
    { id: 2, title: 'Datadog - AI Sales Intelligence Module', company_name: 'Datadog Cloud', contact_name: 'Sarah Lin', stage: 'PROPOSAL', value: 85000, win_probability: 70, health_score: 82, risk_flag: 'Proposal Pending Review' },
    { id: 3, title: 'Figma - Commercial Expansion Seat Package', company_name: 'Figma Design', contact_name: 'David Kovacs', stage: 'WON', value: 64000, win_probability: 100, health_score: 98, risk_flag: null },
    { id: 4, title: 'Vercel - Developer RevOps Integration', company_name: 'Vercel Hosting', contact_name: 'Alex Morgan', stage: 'MEETING', value: 45000, win_probability: 55, health_score: 75, risk_flag: null },
    { id: 5, title: 'Snowflake - Global Revenue Operations OS', company_name: 'Snowflake Data', contact_name: 'Rachel Stern', stage: 'QUALIFIED', value: 180000, win_probability: 60, health_score: 88, risk_flag: null },
  ],
  leads: [
    { id: 1, title: 'Enterprise RevOps Modernization', contact_name: 'Marcus Vance', company_name: 'Stripe Financial', status: 'QUALIFIED', source: 'Inbound Web', value: 120000, score: 92, intent_score: 95, urgency_score: 88, budget_score: 94, engagement_score: 90 },
    { id: 2, title: 'Automated Pipeline Scoring Engine', contact_name: 'Sarah Lin', company_name: 'Datadog Cloud', status: 'NEW', source: 'Partner Referral', value: 85000, score: 78, intent_score: 80, urgency_score: 70, budget_score: 85, engagement_score: 75 },
    { id: 3, title: 'Global Sales Funnel Optimization', contact_name: 'Rachel Stern', company_name: 'Snowflake Data', status: 'NEW', source: 'Outbound SDR', value: 150000, score: 85, intent_score: 88, urgency_score: 82, budget_score: 90, engagement_score: 80 },
  ],
  companies: [
    { id: 1, name: 'Stripe Financial', domain: 'stripe.com', industry: 'FinTech', size: '500-2000', annual_revenue: 15000000.0, location: 'San Francisco, CA' },
    { id: 2, name: 'Datadog Cloud', domain: 'datadoghq.com', industry: 'SaaS & Cloud', size: '1000-5000', annual_revenue: 25000000.0, location: 'New York, NY' },
    { id: 3, name: 'Figma Design', domain: 'figma.com', industry: 'Design Technology', size: '200-500', annual_revenue: 8000000.0, location: 'San Francisco, CA' },
    { id: 4, name: 'Snowflake Data', domain: 'snowflake.com', industry: 'Data & Analytics', size: '2000+', annual_revenue: 40000000.0, location: 'Bozeman, MT' },
  ],
  contacts: [
    { id: 1, first_name: 'Marcus', last_name: 'Vance', email: 'marcus.vance@stripe.com', phone: '+1 (415) 890-1234', title: 'VP of Global Revenue', company_name: 'Stripe Financial' },
    { id: 2, first_name: 'Sarah', last_name: 'Lin', email: 'sarah.lin@datadoghq.com', phone: '+1 (212) 555-9012', title: 'Head of Revenue Operations', company_name: 'Datadog Cloud' },
    { id: 3, first_name: 'David', last_name: 'Kovacs', email: 'd.kovacs@figma.com', phone: '+1 (415) 321-7890', title: 'Chief Commercial Officer', company_name: 'Figma Design' },
  ],
  customers: [
    { id: 1, name: 'Stripe Financial', company_name: 'Stripe Financial', status: 'ACTIVE', mrr: 45000.0, arr: 540000.0, health_score: 94 },
    { id: 2, name: 'Figma Design', company_name: 'Figma Design', status: 'EXPANDING', mrr: 28000.0, arr: 336000.0, health_score: 88 },
  ],
  notifications: [
    { id: 1, title: '🎉 Deal Closed Won!', message: 'Figma expanded contract by $64,000 ARR.', category: 'DEAL_WON', is_read: false },
    { id: 2, title: '🔥 High Intent Lead Alert', message: 'Stripe Financial lead scored 92/100 by AI Engine.', category: 'LEAD_ASSIGNED', is_read: false },
    { id: 3, title: '⏰ Upcoming Meeting', message: 'Stripe Final Contract Review starts in 3 hours.', category: 'MEETING_REMINDER', is_read: true },
  ]
};
