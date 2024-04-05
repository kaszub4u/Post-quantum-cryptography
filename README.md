
   			//PQC Lattice cryptography
      
   			const p = 2n**256n - 189n;
			const q = 2n**1279n - 1n;//2n**9941n - 1n;//;//2n**512n - 569n
			
			const ntru = new NTRU(p, q);

   			const text = 'test'.repeat(1000);
			
			const [f, h] = await ntru.genKeys();
		
			const encrypted = await ntru.encryptNTRU(text, h, 123456789n);
			
			console.log(encrypted, encrypted.length);
			
			const decrypted = await ntru.decryptNTRU(encrypted, f);
			
			console.log(decrypted);
