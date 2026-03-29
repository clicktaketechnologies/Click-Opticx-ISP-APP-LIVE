const logger = require('../utils/logger');
// In a real system you'd require OLTProvisionService properly and call it

class BulkProvision {

  static async run(users) {
    const results = [];

    // Promise.all can overwhelm OLTs if you send 100 fast concurrent SSH ssh requests
    // Using simple chunking to batch process 5 users at a time to prevent OLT firewalling
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const chunk = users.slice(i, i + BATCH_SIZE);
      
      const chunkResults = await Promise.all(
        chunk.map(async (user) => {
          try {
            // Mock provision execution
            // const res = await OLTProvisionService.provisionUser(user);
            await new Promise(r => setTimeout(r, 1000));
            
            return {
              user: user.username,
              status: 'SUCCESS'
            };
          } catch (err) {
            return {
              user: user.username,
              status: 'FAILED',
              error: err.message
            };
          }
        })
      );
      
      results.push(...chunkResults);
    }

    return results;
  }
}

module.exports = BulkProvision;
