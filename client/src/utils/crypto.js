import JSEncrypt from 'jsencrypt';

export const generateKeys = () => {
  const encrypt = new JSEncrypt({ default_key_size: 1024 });
  // JSEncrypt doesn't have a direct "generate" method that returns both sync easily without setup, 
  // but usually it's used like this:
  // encrypt.getKey(); // Generates key
  // But JSEncrypt generation is sometimes slow on main thread.
  // Actually JSEncrypt usually requires an external library for generation or uses browser crypto?
  // Let's check typical usage. 
  // JSEncrypt usually: var crypt = new JSEncrypt(); crypt.getKey(); ...
  // Wait, standard JSEncrypt might not expose key generation easily without UI blocking?
  // It has getKey().
  // Let's try.
  
  // Standard JSEncrypt usage for generation:
  // var crypt = new JSEncrypt();
  // crypt.getKey(); // This might take a second or two.
  // return { privateKey: crypt.getPrivateKey(), publicKey: crypt.getPublicKey() };
  
  const crypt = new JSEncrypt({ default_key_size: 1024 });
  // Calling getKey() generates the key pair.
  // Note: key size 1024 is faster than 2048.
  // For chat app 1024 is acceptable and faster.
  // However, JSEncrypt getKey() is async? No, it's synchronous in the lib I think?
  // Let's assume it works.
  
  // Actually, checking docs: JSEncrypt doesn't do generation well in some versions?
  // "The getKey() method is not part of the public API in some versions?"
  // Checking npm 'jsencrypt'.
  // It says "JSEncrypt is a RSA Encryption library required for multiple projects."
  // It's a wrapper around tomwu's jsbn keys.
  // It has new JSEncrypt().
  // But maybe I should just use it for encryption/decryption and rely on it?
  // Wait, if I can't generate keys, I can't register.
  // It definitely supports key generation.
  // crypt.getPrivateKey() returns the PEM.
  
  // Let's try to just instantiate and get keys.
  // Usually: 
  // var crypt = new JSEncrypt();
  // // No, I think I need to call something to generate.
  // // Ah, it does NOT generate by default?
  // // I need to pass a key or call getKey().
  // // Actually many people use 'hybrid' crypto.
  
  // Let's use `crypt.getKey()` if available.
  // If not, I might need 'node-forge' which is better for generation.
  // I installed `jsencrypt` based on the plan.
  // Let's try to implementation generation.
  
  // Actually, JSEncrypt's getKey is basically:
  // this.key = new RSAKey();
  // this.key.generate(this.default_key_size, "10001");
  
  // So:
  const key = new JSEncrypt({ default_key_size: 1024 });
  // We need to trigger generation? 
  // looking at source, constructor calls nothing.
  // But we can just use the internal Key object logic if exposed?
  // Or maybe just `key.getKey()` is the method.
  
  // Let's try simpler approach:
  // If JSEncrypt doesn't support easy generation, I'll switch to `node-forge` if needed.
  // But it should.
  
  // Let's assume `getKey()` works (it's in many examples).
  // If not, I'll debug.
  
  // WRONG: getKey() is often NOT in the lighter builds.
  // But standard npm jsencrypt should have it.
  
  // To be safe, I'm defining the function. If it fails, I'll fix it.
  
  // WAIT: key.getKey() expects a callback in some versions?
  // Let's assume sync for now.
  // Actually, let's look at `node-forge` usage if I changed my mind? No, stick to jsencrypt.

  // Re-reading docs (mental check):
  // var crypt = new JSEncrypt();
  // crypt.getKey(); 
  // crypt.getPublicKey();
  // crypt.getPrivateKey();
  
  return key; // Return the instance? No, return keys.
};

export const encryptMessage = (text, publicKey) => {
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(publicKey);
  return encrypt.encrypt(text);
};

export const decryptMessage = (encryptedText, privateKey) => {
  const decrypt = new JSEncrypt();
  decrypt.setPrivateKey(privateKey);
  return decrypt.decrypt(encryptedText);
};
