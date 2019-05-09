const configs = {
  development: {
    env: process.env.NODE_ENV,
    database: 'mongodb://localhost/mytablefootball',
    jwtSecret: 'testing',
    dashboardUrl: 'http://localhost:9000',
    mail: {
      defaultFrom: 'sjw948@gmail.com',
      defaultName: 'The MyTableFootball Team',
    },
    mailjet: {
      apiKey: '18b36c0843618ae057cb4a444f30297e',
      apiSecret: '552a5cd2473ca1bbe6f7c9f0d716e77f'
    }
  },
}

export const config = configs[process.env.NODE_ENV || 'development']