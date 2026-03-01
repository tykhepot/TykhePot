#!/usr/bin/env node
/**
 * Configure VRF Account for TykhePot
 * 
 * After creating VRF account via Switchboard CLI, run:
 *   node scripts/set-vrf-config.js <VRF_PUBKEY>
 */

const fs = require('fs');
const path = require('path');

const CONTRACT_CONFIG_PATH = path.join(
  __dirname, 
  '../../frontend/src/config/contract.js'
);

function main() {
  const vrfPubkey = process.argv[2];
  
  if (!vrfPubkey) {
    console.log("Usage: node set-vrf-config.js <VRF_PUBKEY>");
    console.log("\nExample:");
    console.log("  node set-vrf-config.js 7XmhYJHxXKrJLkpYE9mhv8YHNa7PqxqyYhSv6Vz5CkQn");
    process.exit(1);
  }

  // Validate pubkey format
  if (vrfPubkey.length < 32 || vrfPubkey.length > 48) {
    console.error("❌ Invalid pubkey format");
    process.exit(1);
  }

  // Read current config
  let config = fs.readFileSync(CONTRACT_CONFIG_PATH, 'utf-8');

  // Update VRF_ACCOUNT
  const updated = config.replace(
    /export const VRF_ACCOUNT = "[^"]*";/,
    `export const VRF_ACCOUNT = "${vrfPubkey}";`
  );

  if (updated === config) {
    console.log("⚠️  VRF_ACCOUNT line not found. Adding...");
    // Add after AUTHORITY_WALLET
    const insertAfter = "export const AUTHORITY_WALLET";
    const insertPos = updated.indexOf(insertAfter);
    if (insertPos > -1) {
      const endOfLine = updated.indexOf('\n', insertPos);
      config = 
        updated.slice(0, endOfLine + 1) +
        `\n// VRF Account (Switchboard VRF)\nexport const VRF_ACCOUNT = "${vrfPubkey}";\n` +
        updated.slice(endOfLine + 1);
    }
  } else {
    config = updated;
  }

  // Write back
  fs.writeFileSync(CONTRACT_CONFIG_PATH, config);
  
  console.log("✅ VRF Account configured:");
  console.log(`   ${vrfPubkey}`);
  console.log("\n📝 Updated: frontend/src/config/contract.js");
}

main();
