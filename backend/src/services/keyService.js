import { aiKeyRepository } from '../repositories/aiKeyRepository.js';
import { userApiKeyRepository } from '../repositories/userApiKeyRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { decrypt } from '../utils/crypto.js';

const tryDecrypt = (cipher) => {
  if (!cipher) return null;
  try {
    return decrypt(cipher) || null;
  } catch {
    return null;
  }
};

// Resolve a SHARED admin key by name from ai_key_configs (AES-256 at rest).
export const resolveKey = async (keyName) => {
  const doc = await aiKeyRepository.findByName(keyName);
  return tryDecrypt(doc?.encryptedValue);
};

// Resolve a key FOR a specific user: their own key first, then the shared admin
// key if they've been granted access. Returns null if neither is available.
export const resolveKeyForUser = async (userId, keyName) => {
  if (!userId) return resolveKey(keyName);
  const own = await userApiKeyRepository.findByUserAndName(userId, keyName);
  if (own?.enabled) {
    const v = tryDecrypt(own.encryptedValue);
    if (v) return v;
  }
  // Super-admins own the shared keys; granted users may also use them.
  const user = await userRepository.findById(userId);
  if (user?.canUseAdminKeys || user?.roleSlug === 'super-admin') return resolveKey(keyName);
  return null;
};
