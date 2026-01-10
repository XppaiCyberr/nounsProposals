const fs = require('fs');
const { createPublicClient, http } = require('viem');
const { mainnet } = require('viem/chains');

// Create viem client for ENS resolution
const client = createPublicClient({
    chain: mainnet,
    transport: http(),
});

async function resolveENS(address) {
    try {
        const ensName = await client.getEnsName({ address });
        return ensName || null;
    } catch (error) {
        return null;
    }
}

async function updateEnsCache() {
    // Load existing ENS cache
    let ensCache = {};
    try {
        if (fs.existsSync('ens-cache.json')) {
            ensCache = JSON.parse(fs.readFileSync('ens-cache.json', 'utf-8'));
            console.log(`🏷️  Loaded ${Object.keys(ensCache).length} cached ENS names`);
        }
    } catch (error) {
        console.log('⚠️  Could not load ens-cache.json, starting fresh');
    }

    // Load proposals to get all addresses
    let proposals = [];
    try {
        if (fs.existsSync('proposals.json')) {
            const data = JSON.parse(fs.readFileSync('proposals.json', 'utf-8'));
            proposals = data.data?.proposals || [];
            console.log(`📂 Loaded ${proposals.length} proposals`);
        } else {
            console.error('❌ proposals.json not found. Run fetch-proposals.js first.');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error reading proposals.json:', error.message);
        process.exit(1);
    }

    // Get unique addresses
    const allAddresses = [...new Set(proposals.map(p => p.proposer.id))];
    const newAddresses = allAddresses.filter(addr => !(addr in ensCache));

    console.log(`\n🔍 Found ${allAddresses.length} unique addresses`);
    console.log(`   ${allAddresses.length - newAddresses.length} already cached`);
    console.log(`   ${newAddresses.length} need ENS resolution...`);

    if (newAddresses.length === 0) {
        console.log('\n✅ ENS cache is up to date!');
        return;
    }

    // Resolve ENS names for new addresses
    for (let i = 0; i < newAddresses.length; i++) {
        const address = newAddresses[i];
        ensCache[address] = await resolveENS(address);
        if ((i + 1) % 10 === 0 || i === newAddresses.length - 1) {
            console.log(`   Resolved ${i + 1}/${newAddresses.length} addresses`);
            // Save progress periodically
            fs.writeFileSync('ens-cache.json', JSON.stringify(ensCache, null, 2));
        }
    }

    // Final save
    fs.writeFileSync('ens-cache.json', JSON.stringify(ensCache, null, 2));

    const ensResolved = Object.values(ensCache).filter(Boolean).length;
    console.log(`\n✅ ENS cache saved to ens-cache.json`);
    console.log(`🏷️  Total ENS names resolved: ${ensResolved}/${Object.keys(ensCache).length}`);
}

updateEnsCache();
