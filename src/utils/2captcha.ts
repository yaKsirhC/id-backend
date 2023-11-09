import axios from "axios";

export async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export function getSitekey(url: string) {
  const sitekey = url.split("/").at(-3);
  console.log("[INFO]: sitekey: ", sitekey);
  return sitekey;
}

export default async function turnstileSolver(apiKey: string, sitekey: string, randomProxy: string) {
  try {
    const data = {
      clientKey: "fd31b7dc4cfaba8735d0ab7937b65e11",
      task: {
        type: "TurnstileTask",
        websiteURL: "https://chaturbate.com/auth/login",
        websiteKey: "0x4AAAAAAADnPIDROrmt1Wwj",
        proxyType: "http",

        proxyAddress: randomProxy.split(":")[0],
        proxyPort: randomProxy.split(":")[1],
      },
    };

    const postData = {
      key: apiKey,
      method: "turnstile",
      sitekey,
      pageurl: "https://chaturbate.com/auth/login",
      json: 1,
    };
    const captchaIDRequest = await axios.post("https://2captcha.com/in.php", data);
    if (!(captchaIDRequest.data && captchaIDRequest.data.status)) {
      console.log("[ERROR]: error while getting captcha ID: ", captchaIDRequest);
      process.exit(1);
    }
    const captchaID = captchaIDRequest.data.request;
    console.log("[INFO]: captcha ID: ", captchaID);
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
