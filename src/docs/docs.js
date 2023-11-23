/**
 * Configuration parameter sampleUrl: "https://lighthouse.cbop.io"
 * @api {get} /api/:wallet/nfts Get NFTs by wallet
 * @apiVersion 0.1.0
 * @apiGroup NFTs
 * @apiName Get NFTs by wallet
 *
 *
 * @apiParam {String} wallet A valid wallet address.
 *
 * @apiQuery {String="eth-mainnet","eth-goerli"} [chain] The chain to query. Else all chains are queried.
 * @apiHeader {String} x-paradigm-secret A valid secret key.
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {"success":true,
 *  "data":[{
 *   "token_ownership_id":"1278504",
 *   "contract_id":"4",
 *   "token_id":"37",
 *   "owner":"0x86c71b7d27d00d7814a763f9e6f16fdb09f7e4df",
 *   "count":"2",
 *   "updated_at":"2023-11-23T19:46:51.793Z",
 *   "blockchain":"eth-mainnet",
 *   "contract_address":"0xa47fb7c4edd3475ce66f49a66b9bf1edbc61e52d"
 *   },
 *   ...
 *  ]
 * }
 *
 * @apiError {String} error Error description
 *
 * @apiErrorExample Error:Invalid Address
 *     HTTP/1.1 400 OK
 *     {
 *       "error": 'Invalid wallet address'
 *     }
 * 
 * @apiErrorExample Error:Invalid Chain
 *     HTTP/1.1 400 OK
 *     {
 *       "error": 'Invalid Chain'
 *     }
 * 
 */
function getNFTsByWallet() {
    return
  }
  
  /**
   * Configuration parameter sampleUrl: "https://lighthouse.cbop.io"
   * @api {post} /api/ownerOf Get owner of NFTs
   * @apiVersion 0.1.0
   * @apiGroup Owners
   * @apiName Get owner of NFTs
   *
   * @apiBody {Object[]} nfts A list of NFTs
   * @apiBody {Number} nfts.address=0xb286ac8eff9f44e2c377c6770cad5fc78bff9ed6 An NFT address
   * @apiBody {String} nfts.tokenId=1 An NFT token ID
   * @apiBody {String="eth-mainnet","eth-goerli"} [nfts.chain] An NFT token ID
   * 
   * @apiExample {json} JSON sample body:
    {
    "nfts": [
        {
        "address": "0xb286ac8eff9f44e2c377c6770cad5fc78bff9ed6",
        "tokenId": 52
        },
        {
        "address": "0xb286ac8eff9f44e2c377c6770cad5fc78bff9ed6",
        "tokenId": 50
        }
      ]
    }
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *    {"success":true,
   *       "data":[{
   *       "token_id":52,
   *       "blockchain":"eth-mainnet",
   *       "contract_address":"0xb286ac8eff9f44e2c377c6770cad5fc78bff9ed6",
   *       "owner":"0x86c71b7d27d00d7814a763f9e6f16fdb09f7e4df"
   *     },
   *     {
   *       "token_id":50,
   *       "blockchain":"eth-mainnet",
   *       "contract_address":"0xb286ac8eff9f44e2c377c6770cad5fc78bff9ed6",
   *       "owner":"0xbad858a0cf09f210fcf35cbf83569178879b47f2"
   *     }]}
   *
   *
   * @apiError {Boolean} success Unsuccessful query.
   *
   * @apiErrorExample Error-InvalidBody:
   *     HTTP/1.1 404 OK
   *     {
   *       error: 'Invalid body'
   *     }
   *
   * @apiErrorExample Error-InvalidNFT:
   *     HTTP/1.1 404 OK
   *     {
   *       "success": false,
   *        "nft": {
   *         "address": "0xb286ac8eff9f44e2c377c6770cad5fc78bff9ed6",
*            "tokenId": "52"
   *       }
   *     }
   *
   */
  function getOwnerByNFTs() {
    return
  }
  