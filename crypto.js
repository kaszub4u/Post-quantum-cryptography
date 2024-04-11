function NTRU(p, q)
{					
	//Serialize/deserialize
	async function blobToFile(blob)
	{
		return new File([blob], Date.now(), { type: blob.type });
	}

	const fileToBlob = (file) => new Blob([file], {type: file.type });

	const blobToBase64 = blob => {
		const reader = new FileReader();
		reader.readAsDataURL(blob);
		return new Promise(resolve => {
			reader.onloadend = () => {
				resolve(reader.result);
			};
		});
	};

	const dataURLtoBlob = function(dataurl)
	{
		let arr = dataurl.split(',');
		let mime = arr[0].match(/:(.*?);/)[1];
		let bstr = atob(arr[arr.length - 1]);
		let n = bstr.length;
		let u8arr = new Uint8Array(n);
		while(n--)
			u8arr[n] = bstr.charCodeAt(n);
		return new Blob([u8arr], { type: mime })
	}

	this.serialize = async function(data)
	{

		function getVariableType(value) 
		{
			if (value === null) 
			{
				return "null";
			}
			const baseType = typeof value;
			// Primitive types
			if (!["object", "function"].includes(baseType)) 
			{
				return baseType;
			}

			// Symbol.toStringTag often specifies the "display name" of the
			// object's class. It's used in Object.prototype.toString().
			const tag = value[Symbol.toStringTag];
			if (typeof tag === "string") 
			{
				return tag;
			}

			// If it's a function whose source code starts with the "class" keyword
			if (
				baseType === "function" && 
				Function.prototype.toString.call(value).startsWith("class")
				) 
			{
				return "class";
			}

			// The name of the constructor; for example `Array`, `GeneratorFunction`,
			// `Number`, `String`, `Boolean` or `MyCustomClass`
			const className = value.constructor.name;
			if (typeof className === "string" && className !== "") 
			{
				return className;
			}

			// At this point there's no robust way to get the type of value,
			// so we use the base implementation.
			return baseType;
		}	
	
	
		let transforms = new Map();
	
		function JSONReplacer(key, value) 
		{
			let valueType = getVariableType(value).toUpperCase();

			if(valueType ==  'MAP')
			{
				return {
					dataType: 'MAP',
					value: Array.from(value.entries()),
				};
			}
			else if (valueType ==  'SET')
			{
				return {
					dataType: 'SET',
					value: [...value],
				};
			}
			else if (valueType ==  'BLOB')
			{
				const blobName = hash(value.size + value.type)
				const blobData = {
					type : 'BLOB',
					value : value
				}
				transforms.set(randBlobName, blobData);
				return {
					dataType: 'BLOB',
					value: randBlobName,
				};
			}
			else if (valueType ==  'FILE')
			{
				const randFileName = value.name;
				const fileData = {
					type : 'FILE',
					fileName : value.name,
					value : new Blob([value], {type : value.type})
				}
				transforms.set(randFileName, fileData);
				return {
					dataType: 'FILE',
					value: randFileName,
				};
			}
			else if (valueType ==  'BIGINT')
			{
				return {
					dataType: 'BIGINT',
					value: value.toString(16),
				};
			}
			else
			{
				return value;
			}
		}
		let obj = {
			data : JSON.stringify({data : data}, JSONReplacer),
		}
		for(let [key, value] of transforms)
		{
			value.value = await blobToBase64(value.value);
			transforms.set(key, value)
		}
		obj.transforms = JSON.stringify(transforms, JSONReplacer);
		return JSON.stringify(obj);
	}

	this.deserialize = async function(data)
	{
		function isJson(str) 
		{
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		}

		function JSONReviver(key, value)
		{
			if (value.dataType === 'MAP')
			{
				return new Map(value.value);
			}
			else if (value.dataType === 'SET')
			{
				return new Set(value.value);
			}
			else if (value.dataType === 'BIGINT')
			{
				return BigInt('0x' + value.value);
			}
			else if (value.dataType === 'FILE')
			{
				const fileData = transforms.get(value.value);
				const blob = dataURLtoBlob(fileData.value);
				const fileName = fileData.fileName
				const file = new File([blob], fileName, {type : blob.type});
				return file;
			}
			else if (value.dataType === 'BLOB')
			{
				const fileData = transforms.get(value.value);
				const blob = dataURLtoBlob(fileData.value);
				return blob;
			}
			else
				return value;
		}
	
		if(!isJson(data))
			return '';

		data = JSON.parse(data);
		let transforms = JSON.parse(data.transforms, JSONReviver);

		return JSON.parse(data.data, JSONReviver).data;
	}
	//Serialize end

	this.rstr = function(length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') 
	{
		let result = '';
		let characters = charset;
		let charactersLength = characters.length;
		for ( let i = 0; i < length; i++ ) {
			result += characters.charAt(Math.floor(Math.random() *  charactersLength));
		}
		return result;
	}

	function uint8array2n(uint8array)
	{
		let n = 0n;
		
		for (let i = (uint8array.length - 1); i >=0 ; i--)
			n = (n << 8n) | BigInt(uint8array[i]);
    
		return n	
	}

	function str2n(str)
	{
		const encoded = new TextEncoder().encode(str);
		return uint8array2n(encoded);
	}

	function n2uint8array(n)
	{
		let decoded = [];
		let i = 0n;
		
		while((n >> (8n*i)) > 0n)
		{
			decoded.push(Number((n >> (8n*i)) & 255n));
			i = i + 1n;
		}
		return new Uint8Array(decoded)	;
	
	}

	function n2str(n)
	{
		return new TextDecoder().decode(n2uint8array(n))
	}	
	
	function uint8array2base64(uint8array)
	{
		return btoa(String.fromCharCode(...uint8array));
	}

	function base642uint8array(base64)
	{
		return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
	}

	function n2base64(n)
	{
		return uint8array2base64(n2uint8array(n));
	}

	function base642n(base64)
	{
		return uint8array2n(base642uint8array(base64))
	}	
	
	function uint8array2base64(uint8array)
	{
		return btoa(String.fromCharCode(...uint8array));
	}

	function base642uint8array(base64)
	{
		return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
	}

	function n2base64(n)
	{
		return uint8array2base64(n2uint8array(n));
	}	
	
	function mask(n)
	{
		return (1n << n) - 1n;
	}

	function msb(n)
	{
		let i = 0n;
		while(n > 0n)
		{
			n >>= 1n;
			i++;
		}
		return i;
	}	
	
	this.modInv = function(a, b)
	{
		let b0 = b, t, q;
		let x0 = 0n, x1 = 1n;
		if (b == 1n) return 1n;
		while (a > 1n)
		{
			if(b == 0n) return 1n
		
			q = a / b;
			t = b, b = a % b, a = t;
			t = x0, x0 = x1 - q * x0, x1 = t;
		}
		if (x1 < 0n) x1 += b0;
			return x1;
	}
	
	this.powMod = function(base, exponent, modulus) 
	{
		if (modulus === 1n)
			return 0n
		let result = 1n
		base = base % modulus
    
		while (exponent > 0n)
		{
			if (exponent % 2n === 1n)
				result = (result * base) % modulus
			exponent = exponent >> 1n
			base = (base * base) % modulus
		}
		return result
	}	
	
	this.hashn = async function(data, mod = p)
	{
		const uint8 = new TextEncoder().encode(await this.serialize(data));
		
		uint8.sort();
		
		let n = (mod - 1n)
		for(let i = 0; i < uint8.length; i++)
			n = (n * (BigInt(uint8[i]) + 2n) * (BigInt(i) + 1n)) % mod;
		
		return n;
	}
	
	/*
	this.hashn = async function(data, mod = p)
	{
		const n = str2n(await serialize(data)) % q
		const m = (modInv(n, p) * modInv(n, q)) % p;
		return powMod(m, m, mod);
	}	
	*/
	
	this.genRand = function(bits = 256n)
	{
		const bytes = Math.ceil(Number(bits) / 8);
		const uint8arr = crypto.getRandomValues(new Uint8Array(bytes)); 
		return  uint8array2n(uint8arr) & mask(bits);
	}		

	//NTRU
	this.genHKey = async function(f)
	{
		f ||= this.genRand(msb(p));
		f &= mask(msb(p));		
		
		const fh = await this.hashn(f.toString(16), p);
		const fp = this.modInv((f % p), p);
		return (fh * fp) % p;
	}
	this.genKeys = async function(f)
	{
		f ||= this.genRand(msb(p))
		f &= mask(msb(p));
		
		return [f, await this.genHKey(f)];
	}	
	this.NTRUEncrypt = function(m, h, seed)
	{
		seed ||= this.genRand(msb(p));
		seed &= mask(msb(p));
		
		return (seed * q * (h % p) + this.modInv(m, q)) % q;
	}
	this.NTRUDecrypt = async function(e, f)
	{	
		return this.modInv(((((e * f) % q) * this.modInv(f, q)) % q), q)
	}
	
	this.NTRUSign = async function(msg, f, seed = 0n)
	{
		seed ||= this.genRand(msb(p));
		seed &= mask(msb(p));
		
		const h = await this.genHKey(f);
		const m = await this.hashn(msg, p);
    
		const fh = await this.hashn(f.toString(16), p);
		const fhq = this.modInv(fh, q);
		const hrev = this.modInv(h, q)
    
		return  ((seed * this.modInv(seed, p)) * hrev * m) % q;
	}
	this.NTRUVerifySign = async function(msg, sign, h)
	{
		const m = await this.hashn(msg, p);
		const d = ((sign * h) % q % p);
		return (m == d);
	}
	
	this.NTRUEncode = async function(data, seed)
	{
		const uint8 = new TextEncoder().encode(await this.serialize(data));
		for(let i = 0n; i < BigInt(uint8.length); i++)
			uint8[i] ^= Number((await this.hashn((seed + i).toString(16), p)) & 255n);
		return uint8array2base64(uint8);
	}

	this.NTRUDecode = async function(base64, seed)
	{
		const uint8 = base642uint8array(base64);
		for(let i = 0n; i < BigInt(uint8.length); i++)
			uint8[i] ^= Number((await this.hashn((seed + i).toString(16), p)) & 255n);
		return await this.deserialize(new TextDecoder().decode(uint8));
	}
	
	this.encryptNTRU = async function(data, h, seed = 0n)
	{
		seed ||= this.genRand(256n);
		seed &= mask(msb(p));
		
		const ivn = await this.hashn(seed.toString(16), p);
		
		const e = await this.NTRUEncrypt(seed, h, ivn);
	
		return btoa(n2base64(e) + ':' + await this.NTRUEncode(data, ivn));
	}	

	this.decryptNTRU = async function(encrypted, f)
	{
		const [ e, encoded ] = atob(encrypted).split(':');
	
		let seed = await this.NTRUDecrypt(base642n(e), f);
		seed &= mask(msb(p));
		const ivn = await this.hashn(seed.toString(16), p);
		
		return await this.NTRUDecode(encoded, ivn);
	}
	
	this.encrypt = async function(data, password, seed = 0n)
	{
		const passwordn = str2n(await this.serialize(password));
		const [f, h] = await this.genKeys(passwordn);
		return await this.encryptNTRU(data, h, seed)
	}

	this.decrypt = async function(encrypted, password)
	{
		const passwordn = str2n(await this.serialize(password));	
		const [f, h] = await this.genKeys(passwordn);
		return await this.decryptNTRU(encrypted, f);
	}
}
//NTRU END
