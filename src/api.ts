import express from 'express'
import { utils } from 'ethers';
import env from './env';
import { pg } from './libs/pg/pg';
import { Network } from 'alchemy-sdk';
import path from 'path';
import bytea from './helpers/bytea';

export default function APIRouter(app: express.Application) {
    // add router
    const router = express.Router()
    app.use('/api', router)

    router.get('/assets/*', (req, res) => {
        res.status(200).sendFile(path.join(__dirname, '../public/docs/',req.path))
    })

    router.get('/', (req, res) => {
        console.log(path.join(__dirname, '../public/docs/index.html'))
        res.status(200).sendFile(path.join(__dirname, '../public/docs/index.html'))
    })

    // headerMiddleware
    router.use((req, res, next) => {
        const headers = req.headers || {}
        const secret = headers['x-paradigm-secret'] as string

        // allow debugging
        if(req.query?.debug=='true'){
            return next()
        }

        if (secret != env.API_PARADIGM_SECRET_HEADER) {
            return res.status(401).send('Unauthorized')
        }
        next()
    })

    router.get('/:wallet/nfts', async (req, res) => {
        const wallet = req.params?.wallet
        if (!wallet || !utils.isAddress(wallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' })
        }

        const chain = req.query?.chain as Network | undefined
        if (chain && Array.isArray(chain)) {
            return res.status(400).json({ error: 'Invalid chain, only one supported' })
        }
        if (chain && !Object.values(Network).includes(chain)) {
            return res.status(400).json({ error: 'Invalid chain' })
        }

        const _exclude = req.query?.exclude as string | string[]
        const _only = req.query?.only as string | string[]
        if(_exclude && _only) {
            return res.status(400).json({ error: 'Invalid params, cannot have exclude or onlyAddresses at the same time.' })
        }
        const cleanExclude = []
        if(_exclude){
            const exclude = Array.isArray(_exclude) ? _exclude : [_exclude]
            if (exclude) {
                for (const e of exclude) {
                    if (utils.isAddress(e)) {
                        cleanExclude.push(e.substring(2))
                    }
                }
            }
            if (!cleanExclude.length) {
                return res.status(400).json({ error: 'Invalid exclude params' })
            }
        }
        
        const cleanOnlyAddresses = []
        if(_only){
            const only = Array.isArray(_only) ? _only : [_only]
            for (const e of only) {
                if (utils.isAddress(e)) {
                    cleanOnlyAddresses.push(e.substring(2))
                }
            }

            if (!cleanOnlyAddresses.length) {
                return res.status(400).json({ error: 'Invalid onlyAddresses params' })
            }
        }

        const page = req.query?.page || 0

        // Query NFTs for this NFT
        let query = `SELECT t.*,c.blockchain,c.address as contract_address FROM token_ownership t JOIN contract c ON t.contract_id = c.contract_id WHERE t.owner = decode($1,'hex')`;
        if(cleanExclude.length) {
            query=`SELECT t.*,c.blockchain,c.address as contract_address FROM token_ownership t JOIN contract c ON t.contract_id = c.contract_id WHERE t.owner = decode($1,'hex') and encode(c.address,'hex') not in (${cleanExclude.map((a)=>`'${a.toLowerCase()}'`).join(', ')}) `;
        }else if (cleanOnlyAddresses.length) {
            query=`SELECT t.*,c.blockchain,c.address as contract_address FROM token_ownership t JOIN contract c ON t.contract_id = c.contract_id WHERE t.owner = decode($1,'hex') and encode(c.address,'hex') in (${cleanOnlyAddresses.map((a)=>`'${a.toLowerCase()}'`).join(', ')}) `;
        }
        if (chain) {
            query += ` AND c.blockchain = $3::blockchain`;
        }
        // add limit
        query += ` LIMIT 1000 OFFSET $2*1000`
        const inputs = [wallet.substring(2), page]
        console.log(query)
        const nfts = await pg.query(query, chain ? [...inputs, chain] : inputs)
        if (!nfts || !nfts?.rows.length) {
            return res.status(200).json({ success: true, data: [], page })
        }
        const results = nfts.rows as { owner: string, contract_address: string, blockchain: Network, token_id: number, contract_id: number }[]

        for (const result of results) {
            result.owner = bytea.byteaBufferToString(result.owner as unknown as Buffer)
            result.contract_address = bytea.byteaBufferToString(result.contract_address as unknown as Buffer)
        }

        return res.status(200).json({ success: true, data: nfts.rows, page })
    })

    router.post('/ownerOf', async (req, res) => {
        const body = req.body as { nfts: { chain?: Network, address: string, tokenId: number }[] }

        if (!body?.nfts || !body?.nfts.length) {
            return res.status(400).json({ error: 'Invalid body' })
        }

        for (const nft of body.nfts) {
            if (!nft?.address || !utils.isAddress(nft.address) || !nft?.tokenId) {
                return res.status(400).json({ error: 'Invalid nft', nft })
            }
            nft.chain = nft.chain || Network.ETH_MAINNET
        }

        if (body.nfts.length > 200) {
            return res.status(400).json({ error: 'Too many nfts, max 200' })
        }

        const query = `
    WITH token_list (address, token_id, blockchain) AS (
        VALUES
            ${body.nfts.map((nft) => `(decode('${nft.address.substring(2)}','hex'), ${nft.tokenId}, '${nft.chain!}'::blockchain)`).join(', ')}
    )
    SELECT tl.token_id, tl.blockchain, tl.address as contract_address, t.owner
    FROM token_list tl
    JOIN contract c ON c.address = tl.address AND c.blockchain = tl.blockchain
    JOIN token_ownership t ON t.contract_id = c.contract_id AND t.token_id = tl.token_id;
    `

        const ownerResponse = await pg.query(query)

        if (!ownerResponse || !ownerResponse?.rows.length) {
            return res.status(200).json({ success: true, data: [] })
        }
        for (const result of ownerResponse.rows) {
            result.owner = bytea.byteaBufferToString(result.owner)
            result.contract_address = bytea.byteaBufferToString(result.contract_address)
        }

        return res.status(200).json({ success: true, data: ownerResponse.rows as { owner: string, contract_address: string, blockchain: Network, token_id: number, contract_id: number }[] })
    })
}