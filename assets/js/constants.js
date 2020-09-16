module.exports = {
  Notifications: {
    HashrateReport: 'hashrate-report',
    HashrateReportString: 'hashrate-report-string',
    KoinBalanceUpdate: 'koin-balance-update',
    EthBalanceUpdate: 'eth-balance-update',
    ErrorReport: 'error-report',
    MinerActivated: 'miner-activated',
    ToggleMiner: 'toggle-miner',
    RestoreState: 'restore-state'
  },
  StateKey: {
    ...this.Notifications,
    Configuration: 'koinos-config'
  }
};
