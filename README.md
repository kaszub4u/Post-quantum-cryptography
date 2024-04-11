
			https://en.wikipedia.org/wiki/NTRUEncrypt
      
			//PQC Lattice cryptography
      
			const p = 2n**256n - 189n;

			const q = 2n**1279n - 1n;//2n**9941n - 1n;//2n**512n - 569n
			
			const ntru = new NTRU(p, q);

   			const [f, h] = await ntru.genKeys();

			const text = 'test'.repeat(1000);


			//text
			const encrypted = await ntru.encryptNTRU(text, h);
			
			console.log(encrypted, encrypted.length);
			
			const decrypted = await ntru.decryptNTRU(encrypted, f);
			
			console.log(decrypted);
			
			
			//file
			const file = new File([text], 'test.text', {
				type : 'text/plain',
			})
			
			const encryptedFile = await ntru.encrypt(file, 'PASSWORD');
			
			console.log(encryptedFile);
			
			const decryptedFile = await ntru.decrypt(encryptedFile, 'PASSWORD');
			
			console.log(decryptedFile)
			
			//complex data any type eg. arrays, arrays of files, maps, sets, objects, BigInt numbers etc.
			const comlexData = {
				text : text,
				file : [file, file, file]
			}
			
			const encryptedComplexData = await ntru.encrypt(comlexData, 'PASSWORD');
			
			console.log(encryptedComplexData);
			
			const decryptedComplexData = await ntru.decrypt(encryptedComplexData, 'PASSWORD');
			
			console.log(decryptedComplexData);

			const [f1, h1] = await ntru.genKeys();
			const [f2, h2] = await ntru.genKeys();
			const [f3, h3] = await ntru.genKeys();

			//multi encrypt - limited to q bitlength
			console.log('multi');
			const encryptedMulti = await ntru.encryptNTRU(text, (h1 * h2 * h3));
			
			console.log(encryptedMulti, encryptedMulti.length);
			
			const decryptedMulti = await ntru.decryptNTRU(encryptedMulti, (f1 * f2 * f3));
			
			console.log(decryptedMulti);			

			//sign
			const sign = await ntru.NTRUSign(encrypted, f)
			
			console.log(sign);
			console.log(await ntru.NTRUVerifySign(encrypted, sign, h));
   
