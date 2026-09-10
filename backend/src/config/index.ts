import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'ku_csc_edoc_default_secret_key_2026',
  pg: {
    host: process.env.PG_HOST || '158.108.110.98',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    database: process.env.PG_DATABASE || 'edoc_db',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
  },
  cscApi: {
    baseUrl: process.env.CSC_API_BASE_URL || 'https://api.csc.ku.ac.th',
    apiKey: process.env.CSC_API_KEY || '',
  },
  promptpay: {
    accountNumber: process.env.PROMPTPAY_ACCOUNT || '0994000159491',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  kuAllLogin: {
    driver: process.env.KU_ALLLOGIN_DRIVER || 'oauth',
    authorizeUrl: process.env.KU_ALLLOGIN_AUTHORIZE_URL || 'https://alllogin.ku.ac.th/realms/KU-Alllogin/protocol/openid-connect/auth',
    tokenUrl: process.env.KU_ALLLOGIN_TOKEN_URL || 'https://alllogin.ku.ac.th/realms/KU-Alllogin/protocol/openid-connect/token',
    userInfoUrl: process.env.KU_ALLLOGIN_USER_INFO_URL || 'https://alllogin.ku.ac.th/realms/KU-Alllogin/protocol/openid-connect/userinfo',
    clientId: process.env.KU_ALLLOGIN_CLIENT_ID || 'KU_CSC_MIS',
    clientSecret: process.env.KU_ALLLOGIN_CLIENT_SECRET || 'TJXjO72OrZkP3Dk4vTYB74IpLbYLwJoH',
    redirectUri: process.env.KU_ALLLOGIN_REDIRECT_URI || 'http://localhost:5050/api/auth/ku/callback',
    scope: process.env.KU_ALLLOGIN_SCOPE || 'openid profile email',
  },
};
