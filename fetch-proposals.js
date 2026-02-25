const fs = require('fs');

const DEFAULT_GRAPHQL_ENDPOINT = 'https://api.goldsky.com/api/public/project_cldf2o9pqagp43svvbk5u3kmo/subgraphs/nouns/prod/gn';
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || DEFAULT_GRAPHQL_ENDPOINT;
const BATCH_SIZE = 1000;

async function fetchProposals() {
    let allProposals = [];
    let skip = 0;
    let hasMore = true;

    // Load existing ENS cache if available
    let ensCache = {};
    try {
        if (fs.existsSync('ens-cache.json')) {
            ensCache = JSON.parse(fs.readFileSync('ens-cache.json', 'utf-8'));
            console.log(`🏷️  Loaded ${Object.keys(ensCache).length} cached ENS names`);
        } else {
            console.log('ℹ️  No ens-cache.json found. Run update-ens-cache.js to resolve ENS names.');
        }
    } catch (error) {
        console.log('⚠️  Could not load ens-cache.json');
    }

    console.log('🔄 Fetching all proposals from API...');

    try {
        while (hasMore) {
            const query = `
        query MyQuery {
          proposals(orderBy: id, first: ${BATCH_SIZE}, skip: ${skip}) {
            id
            title
            status
            proposer {
              id
            }
          }
        }
      `;

            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const proposals = data.data?.proposals || [];

            allProposals = allProposals.concat(proposals);
            console.log(`   Fetched ${proposals.length} proposals (total: ${allProposals.length})`);

            if (proposals.length < BATCH_SIZE) {
                hasMore = false;
            } else {
                skip += BATCH_SIZE;
            }
        }

        // Add ENS names from cache to proposals
        const proposalsWithENS = allProposals.map(p => ({
            id: p.id,
            title: p.title,
            status: p.status,
            proposer: {
                id: p.proposer.id,
                ens: ensCache[p.proposer.id] || null
            }
        }));

        // Sort by id
        proposalsWithENS.sort((a, b) => parseInt(a.id) - parseInt(b.id));

        // Save proposals to JSON file
        const output = { data: { proposals: proposalsWithENS } };
        fs.writeFileSync('proposals.json', JSON.stringify(output, null, 2));

        const ensResolved = proposalsWithENS.filter(p => p.proposer.ens).length;
        console.log(`\n✅ Data exported to proposals.json`);
        console.log(`📊 Total proposals: ${proposalsWithENS.length}`);
        console.log(`🏷️  Proposals with ENS: ${ensResolved}/${proposalsWithENS.length}`);

        return output;
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fetchProposals();
