import fs from "fs";
import readLine from "readline";

export default class ProxyList {
	proxyArray: string[] = [];
	proxyListPath: string

	constructor(proxyPath: string){
		this.proxyListPath=proxyPath;
		const fileStream = fs.createReadStream(this.proxyListPath);
		const rl = readLine.createInterface({
		  input: fileStream,
		  crlfDelay: Infinity, // To handle both \r\n and \n line endings
		});
		
		rl.on("line", (line) => {
			this.proxyArray.push(line);
		});
		rl.on('close', () => {
			console.log('[INFO]: read proxies succesfully (WARNING: this doesnt mean it parsed the file succesfully)');
		  });		  
	}
	getRandom(): string {
		const item = this.proxyArray[Math.floor(Math.random()*this.proxyArray.length)];
		return item
	}
}

