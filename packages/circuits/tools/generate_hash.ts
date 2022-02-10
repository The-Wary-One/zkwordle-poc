import { buildMimcSponge } from 'circomlibjs'

(async function() {
    if (process.argv.length != 3) {
       throw Error('Usage: ts-node generate_hash.ts <json input>')
    } else {
        const input = JSON.parse(process.argv[2])
        const hasher = await buildMimcSponge()
        const hash = hasher.multiHash(input, input.length, 1);
        console.log(`Hash: ${hasher.F.toString(hash,10)}`)
        process.exit(0)
    }    
})().catch(e => {
    console.error(e)
    process.exit(1)
})