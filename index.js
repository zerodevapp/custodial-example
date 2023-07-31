const { ECDSAProvider, getCustodialOwner } = require('@zerodevapp/sdk')
const { encodeFunctionData, parseAbi, createPublicClient, http } = require('viem');
const { polygonMumbai } = require('viem/chains')

// Production Project
const projectId = 'd00dbcef-2f10-479e-8c10-28a9fd95717d'

const contractAddress = '0x34bE7f35132E97915633BC1fc020364EA5134863'
const contractABI = [
  'function mint(address _to) public',
  'function balanceOf(address owner) external view returns (uint256 balance)'
]
const publicClient = createPublicClient({ 
    chain: polygonMumbai,
    transport: http('https://polygon-mumbai.infura.io/v3/f36f7f706a58477884ce6fe89165666c')
})

const main = async () => {
    const owner = await getCustodialOwner(
        'anyUserId', // This can litlerally be anything to identify a wallet
        {
            custodialFilePath: 'custodial.txt',
        }
    )
    let ecdsaProvider = await ECDSAProvider.init({
        projectId,
        owner,
        opts: {
            paymasterConfig: {
                policy: "VERIFYING_PAYMASTER"
            }
        }
    });
    console.log('My address:', await ecdsaProvider.getAddress())
    
    const { hash } = await ecdsaProvider.sendUserOperation({
        target: contractAddress,
        data: encodeFunctionData({abi: parseAbi(contractABI), functionName: 'mint', args: [await ecdsaProvider.getAddress()]}),
    });
    await ecdsaProvider.waitForUserOperationTransaction(hash)
    const balanceOf = await publicClient.readContract({ address: contractAddress, abi: parseAbi(contractABI), functionName: 'balanceOf', args: [await ecdsaProvider.getAddress()] })
    console.log(`NFT balance: ${balanceOf}`)
}

main().then(() => process.exit(0))