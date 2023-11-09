import axios from "axios";

export async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export function getSitekey(url: string){
	const sitekey = url.split("/").at(-3);
	console.log("[INFO]: sitekey: ", sitekey);
	return sitekey
}

export default async function turnstileSolver(apiKey: string, sitekey: string) {
  try {
    const postData = {
      key: apiKey,
      method: "turnstile",
      sitekey,
      pageurl: "https://chaturbate.com/auth/login",
      json: 1,
    };
    const captchaIDRequest = await axios.post("https://2captcha.com/in.php", postData);
    if (!(captchaIDRequest.data && captchaIDRequest.data.status)) {
      console.log("[ERROR]: error while getting captcha ID: ", captchaIDRequest);
      process.exit(1);
    }
    const captchaID = captchaIDRequest.data.request;
    console.log("[INFO]: starting 17s of sleep for 2captcha");
    await sleep(17 * 1000);

    const getURL = `https://2captcha.com/res.php?key=${apiKey}&action=get&id=${captchaID}&json=1`;
    const result = await axios.get(getURL);
    if (!(result.data && result.data.status)) {
      console.log("[ERROR]: error while getting captcha ID: ", result);
      process.exit(1);
    }
    const token = result.data.request;
    return token;
  } catch (error) {
    console.log("[ERROR]: unexpected error occured on catch statement: ", error);
    process.exit(1);
  }
}
