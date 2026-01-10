const fs = require('fs');

function applyEnsCache() {
    // Load ENS cache
    let ensCache = {};
    try {
        if (fs.existsSync('ens-cache.json')) {
            ensCache = JSON.parse(fs.readFileSync('ens-cache.json', 'utf-8'));
            console.log(`🏷️  Loaded ${Object.keys(ensCache).length} ENS entries`);
        } else {
            console.error('❌ ens-cache.json not found. Run update-ens-cache.js first.');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error reading ens-cache.json:', error.message);
        process.exit(1);
    }

    // Load proposals
    let data;
    try {
        if (fs.existsSync('proposals.json')) {
            data = JSON.parse(fs.readFileSync('proposals.json', 'utf-8'));
            console.log(`📂 Loaded ${data.data.proposals.length} proposals`);
        } else {
            console.error('❌ proposals.json not found. Run fetch-proposals.js first.');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error reading proposals.json:', error.message);
        process.exit(1);
    }

    // Apply ENS cache to proposals
    let updated = 0;
    data.data.proposals = data.data.proposals.map(p => {
        const cachedEns = ensCache[p.proposer.id];
        if (cachedEns !== undefined && p.proposer.ens !== cachedEns) {
            updated++;
            return {
                ...p,
                proposer: {
                    ...p.proposer,
                    ens: cachedEns
                }
            };
        }
        return p;
    });

    // Save updated proposals
    fs.writeFileSync('proposals.json', JSON.stringify(data, null, 2));

    const withEns = data.data.proposals.filter(p => p.proposer.ens).length;
    console.log(`\n✅ Updated ${updated} proposals with ENS data`);
    console.log(`🏷️  Proposals with ENS: ${withEns}/${data.data.proposals.length}`);
}

applyEnsCache();
